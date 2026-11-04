import Schema from '@deepseek-ai/schemastery'
import { closeSync, openSync } from 'node:fs'
import { access, mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'

import { buildDeviceWindow, buildSnapshot, buildTrend, dayRange, DEFAULT_THRESHOLD } from './aggregate.js'
import { PlatformClient, PlatformError, resolveApiBase, resolveSessionFile } from './platform.js'


export const name = 'ge-workbench-robot-ops'
export const inject = ['connection']

export const Config = Schema.object({
  root: Schema.string().required(),
})

const API = '/api/robot-ops'
const SNAPSHOT_TTL_MS = 5 * 60 * 1000
const DEVICE_TTL_MS = 60 * 1000
const WINDOW_DAYS = 7

function fail(message, status = 500, code = 'ERROR') {
  const error = new Error(message)
  error.status = status
  error.code = code
  return error
}

function registerJson(ctx, path, methods, handler) {
  ctx.connection.fetch.register({
    path,
    methods,
    requestBody: 'buffered',
    async fetch(request) {
      try {
        const result = await handler(request)
        return Response.json(result, { headers: { 'cache-control': 'no-store' } })
      } catch (error) {
        const status = typeof error?.status === 'number' ? error.status : 500
        return Response.json(
          { error: error instanceof Error ? error.message : String(error), code: error?.code ?? 'ERROR' },
          { status, headers: { 'cache-control': 'no-store' } },
        )
      }
    },
  })
}

async function readSnapshotFile(file) {
  try {
    return JSON.parse(await readFile(file, 'utf8'))
  } catch {
    return null
  }
}

async function writeSnapshotFile(file, value) {
  const temporary = `${file}.${process.pid}.tmp`
  await writeFile(temporary, `${JSON.stringify(value)}\n`, { encoding: 'utf8', mode: 0o600 })
  await rename(temporary, file)
}

async function collectRobots(client, expected) {
  const robots = []
  const limit = 20
  for (let page = 1; page <= limit; page += 1) {
    const payload = await client.listRobots(page, 100)
    const rows = Array.isArray(payload?.robots) ? payload.robots : []
    robots.push(...rows)
    if (rows.length < 100) break
    if (typeof expected === 'number' && robots.length >= expected) break
  }
  return robots
}

async function collectTrend(client, startDate, endDate) {
  const rows = []
  for (let page = 1; page <= 3; page += 1) {
    const payload = await client.listTaskStatistics(startDate, endDate, page, 100)
    const batch = Array.isArray(payload?.robotDailyStatisticRows) ? payload.robotDailyStatisticRows : []
    rows.push(...batch)
    if (batch.length < 100) break
  }
  return buildTrend(rows)
}

// 登录窗口：优先用本包自带的 login-cli.js（不依赖是否装了高仙 MCP），
// 找不到浏览器或缺依赖时再回退到 MCP 自带的那份。
const OWN_LOGIN_CLI = fileURLToPath(new URL('./login-cli.js', import.meta.url))

async function exists(file) {
  try {
    await access(file)
    return true
  } catch {
    return false
  }
}

export async function resolveLoginCli() {
  const override = (process.env.ROBOT_PARTNER_AUTH_CLI || '').trim()
  if (override && await exists(override)) return override
  if (await exists(OWN_LOGIN_CLI)) return OWN_LOGIN_CLI
  const entry = (process.env.GE_MCP_ROBOT_PARTNER_ENTRY || '').trim()
  if (entry) {
    const sibling = join(dirname(entry), 'auth-cli.js')
    if (await exists(sibling)) return sibling
  }
  const home = process.env.DSH_HOME || join(homedir(), '.dsh')
  for (const profile of ['web', 'tui']) {
    const candidate = join(home, 'profiles', profile, 'node_modules', 'ge-mcp-robot-partner', 'dist', 'auth-cli.js')
    if (await exists(candidate)) return candidate
  }
  return null
}

async function pluginVersion() {
  try {
    const raw = await readFile(new URL('../package.json', import.meta.url), 'utf8')
    return JSON.parse(raw).version ?? ''
  } catch {
    return ''
  }
}

export function apply(ctx, config) {
  const root = config.root
  const snapshotFile = join(root, 'snapshot.json')
  const client = new PlatformClient()

  let ready = null
  const ensureReady = () => {
    ready ??= mkdir(root, { recursive: true, mode: 0o700 }).catch(() => undefined)
    return ready
  }

  let cached = null
  let refreshing = null
  let lastError = null
  const deviceCache = new Map()
  let statusLabels = null
  let statusLabelsAt = 0

  // 状态字典是平台静态文件，一小时取一次即可；取不到就用内置常见状态兜底。
  const statusDictionary = async () => {
    if (statusLabels && Date.now() - statusLabelsAt < 60 * 60 * 1000) return statusLabels
    statusLabels = await client.getStatusDictionary()
    statusLabelsAt = Date.now()
    return statusLabels
  }

  async function loadCached() {
    if (cached) return cached
    await ensureReady()
    cached = await readSnapshotFile(snapshotFile)
    return cached
  }

  async function refreshSnapshot() {
    if (refreshing) return refreshing
    refreshing = (async () => {
      const [overview, thresholds] = await Promise.all([
        client.getOverview(),
        client.getThresholds(1).catch(() => null),
      ])
      const robots = await collectRobots(client, overview?.robotCount)
      const range = dayRange(WINDOW_DAYS)
      const [trend, labels] = await Promise.all([
        collectTrend(client, range.startDate, range.endDate).catch(() => []),
        statusDictionary().catch(() => null),
      ])
      const snapshot = buildSnapshot({ overview, thresholds, robots, trend, statusLabels: labels, fetchedAt: new Date().toISOString() })
      cached = snapshot
      await ensureReady()
      await writeSnapshotFile(snapshotFile, snapshot).catch(() => undefined)
      lastError = null
      return snapshot
    })().finally(() => {
      refreshing = null
    })
    return refreshing
  }

  async function snapshot({ force = false } = {}) {
    const current = await loadCached()
    const age = current?.fetchedAt ? Date.now() - Date.parse(current.fetchedAt) : Number.POSITIVE_INFINITY
    if (!force && current && age >= 0 && age < SNAPSHOT_TTL_MS) {
      return { snapshot: current, stale: false, error: null }
    }
    try {
      const next = await refreshSnapshot()
      return { snapshot: next, stale: false, error: null }
    } catch (error) {
      lastError = error
      if (current) {
        return { snapshot: current, stale: true, error: error instanceof Error ? error.message : String(error) }
      }
      throw error
    }
  }

  const loginLog = join(root, 'login.log')
  let loginRun = { child: null, startedAt: 0, exitCode: null, logFile: loginLog }

  async function loginLogTail(limit = 800) {
    try {
      const raw = await readFile(loginLog, 'utf8')
      return raw.slice(-limit).trim()
    } catch {
      return ''
    }
  }

  registerJson(ctx, `${API}/login`, ['GET', 'POST'], async () => {
    if (loginRun.child) return { started: true, already: true, logFile: loginRun.logFile }
    const cli = await resolveLoginCli()
    if (!cli) throw fail('没有找到登录器，请重新安装工作台后再试。', 501, 'NO_AUTH_CLI')

    // 子进程的 stdout/stderr 全部写进日志，失败时界面能直接显示原因。
    await ensureReady()
    const fd = openSync(loginLog, 'a')
    let child
    try {
      child = spawn(process.execPath, [cli], {
        env: {
          ...process.env,
          ELECTRON_RUN_AS_NODE: '1',
          ROBOT_PARTNER_SESSION_FILE: resolveSessionFile(),
        },
        detached: true,
        stdio: ['ignore', fd, fd],
      })
    } catch (error) {
      closeSync(fd)
      throw fail(`无法启动登录窗口：${error instanceof Error ? error.message : String(error)}`, 500, 'LOGIN_SPAWN_FAILED')
    }
    closeSync(fd)
    child.unref()
    loginRun = { child, startedAt: Date.now(), exitCode: null, logFile: loginLog, cli }
    child.on('exit', (code) => {
      loginRun = { ...loginRun, child: null, exitCode: typeof code === 'number' ? code : 0 }
    })
    child.on('error', (error) => {
      loginRun = { ...loginRun, child: null, exitCode: -1, spawnError: error instanceof Error ? error.message : String(error) }
    })
    return { started: true, already: false, logFile: loginLog }
  })

  registerJson(ctx, `${API}/status`, ['GET'], async () => {
    const current = await loadCached()
    return {
      apiBase: resolveApiBase(),
      sessionFile: resolveSessionFile(),
      hasSession: await client.hasSession(),
      updatedAt: current?.fetchedAt ?? null,
      thresholds: current?.thresholds ?? { completionRate: DEFAULT_THRESHOLD },
      version: await pluginVersion(),
      routes: ['/login', '/status', '/snapshot', '/device', '/alerts'].map((suffix) => `${API}${suffix}`),
      error: lastError ? (lastError instanceof Error ? lastError.message : String(lastError)) : null,
      refreshing: Boolean(refreshing),
      login: {
        running: Boolean(loginRun.child),
        startedAt: loginRun.startedAt || null,
        exitCode: loginRun.exitCode,
        spawnError: loginRun.spawnError ?? null,
        logTail: await loginLogTail(),
      },
    }
  })

  registerJson(ctx, `${API}/snapshot`, ['GET'], async (request) => {
    const url = new URL(request.url)
    const force = url.searchParams.get('refresh') === '1'
    const result = await snapshot({ force })
    return { ...result, version: await pluginVersion() }
  })

  const alertsCache = { at: 0, payload: null }

  registerJson(ctx, `${API}/alerts`, ['GET'], async (request) => {
    const url = new URL(request.url)
    const force = url.searchParams.get('refresh') === '1'
    if (!force && alertsCache.payload && Date.now() - alertsCache.at < DEVICE_TTL_MS) return alertsCache.payload

    const { snapshot: latest } = await snapshot()
    const targets = (latest?.devices ?? []).filter((entry) => entry.alerts > 0).slice(0, 12)
    const endTime = Date.now()
    const startTime = endTime - WINDOW_DAYS * 86400000
    const devices = await Promise.all(targets.map(async (entry) => {
      const payload = await client.listAlerts(entry.sn, startTime, endTime, 10).catch(() => null)
      return {
        ...entry,
        items: (Array.isArray(payload?.incidentLatests) ? payload.incidentLatests : []).map((alert) => ({
          title: typeof alert?.incidentTitle === 'string' ? alert.incidentTitle : '',
          level: typeof alert?.incidentLevel === 'string' ? alert.incidentLevel : '',
          startTime: Number(alert?.startTime) || null,
          endTime: Number(alert?.endTime) || null,
        })),
      }
    }))
    const result = { fetchedAt: new Date().toISOString(), devices }
    alertsCache.at = Date.now()
    alertsCache.payload = result
    return result
  })

  registerJson(ctx, `${API}/device`, ['GET'], async (request) => {
    const url = new URL(request.url)
    const sn = (url.searchParams.get('sn') || '').trim()
    if (!sn) throw fail('缺少设备编号 sn', 400, 'BAD_REQUEST')

    const hit = deviceCache.get(sn)
    if (hit && Date.now() - hit.at < DEVICE_TTL_MS) return hit.payload

    const { snapshot: latest } = await snapshot()
    const threshold = latest?.thresholds?.completionRate ?? DEFAULT_THRESHOLD
    const device = (latest?.devices ?? []).find((entry) => entry.sn === sn)
    if (!device) throw fail('没有找到这台设备，可能已从平台移除，请刷新后再试。', 404, 'NOT_FOUND')

    const range = dayRange(WINDOW_DAYS)
    const endTime = Date.now()
    const startTime = endTime - WINDOW_DAYS * 86400000
    const [panel, alerts] = await Promise.all([
      client.getTaskPanel(sn, range.startDate, range.endDate, 1).catch(() => null),
      client.listAlerts(sn, startTime, endTime, 20).catch(() => null),
    ])

    const window = buildDeviceWindow(panel, threshold)
    const payload = {
      device,
      range,
      window,
      alerts: (Array.isArray(alerts?.incidentLatests) ? alerts.incidentLatests : []).map((entry) => ({
        title: typeof entry?.incidentTitle === 'string' ? entry.incidentTitle : '',
        level: typeof entry?.incidentLevel === 'string' ? entry.incidentLevel : '',
        startTime: Number(entry?.startTime) || null,
        endTime: Number(entry?.endTime) || null,
        code: entry?.incidentCode ?? null,
      })),
      fetchedAt: new Date().toISOString(),
    }
    deviceCache.set(sn, { at: Date.now(), payload })
    return payload
  })
}

export { PlatformError }