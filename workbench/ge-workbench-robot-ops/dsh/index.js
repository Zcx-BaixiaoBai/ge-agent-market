import Schema from '@deepseek-ai/schemastery'
import { closeSync, openSync } from 'node:fs'
import { access, mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'

import { buildDeviceWindow, buildSnapshot, buildTrend, dayRange, DEFAULT_THRESHOLD } from './aggregate.js'
import { PlatformClient, PlatformError, resolveApiBase, resolveSessionFile } from './platform.js'
import { LiveFeed } from './live.js'


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

  registerJson(ctx, `${API}/console`, ['GET'], async (request) => {
    const url = new URL(request.url)
    const sn = (url.searchParams.get('sn') || '').trim()
    if (!sn) throw fail('缺少设备编号 sn', 400, 'BAD_REQUEST')

    const { snapshot: latest } = await snapshot()
    const device = (latest?.devices ?? []).find((entry) => entry.sn === sn)
    if (!device) throw fail('没有找到这台设备，请刷新后再试。', 404, 'NOT_FOUND')

    const now = Date.now()
    const dayStart = now - 24 * 60 * 60 * 1000

    const [view, site, schedule, modes, timeline] = await Promise.all([
      client.viewRobot(sn).catch(() => null),
      client.currentSite(sn).catch(() => null),
      client.scheduleVersion(sn).catch(() => null),
      client.workModes(sn).catch(() => null),
      client.taskTimeline(sn, dayStart, now).catch(() => null),
    ])

    const events = (Array.isArray(timeline?.taskTimelines) ? timeline.taskTimelines : []).map((entry) => {
      const metas = entry?.metas ?? {}
      const system = metas.systemContext ?? {}
      const siteContext = metas.siteContext ?? {}
      return {
        id: entry?.id ?? '',
        time: Number(entry?.timestamp) || null,
        type: typeof entry?.eventTypeName === 'string' ? entry.eventTypeName : '',
        category: typeof entry?.eventCategory === 'string' ? entry.eventCategory : '',
        map: typeof system.currentMapName === 'string' ? system.currentMapName : (siteContext.mapName ?? ''),
        cleanWater: Number(system.cleanWaterPercent) || 0,
        dirtyWater: Number(system.dirtyWaterPercent) || 0,
        station: typeof system.stationState === 'string' ? system.stationState : '',
        navigation: Number(system.naviStatus) || 0,
      }
    })

    const workModes = (Array.isArray(modes?.data) ? modes.data : Array.isArray(modes) ? modes : []).map((mode) => ({
      id: mode?.id ?? '',
      mode: typeof mode?.mode === 'string' ? mode.mode : '',
      subType: typeof mode?.subType === 'string' ? mode.subType : '',
      recommended: mode?.recommended === true,
      strengthOptions: Array.isArray(mode?.strengthOptions) ? mode.strengthOptions : [],
      defaultStrength: typeof mode?.defaultStrength === 'string' ? mode.defaultStrength : '',
    }))

    // 设备当前状态（来自最近一次上报）
    const ordered = (Array.isArray(timeline?.taskTimelines) ? timeline.taskTimelines : [])
      .filter((entry) => entry?.metas?.systemContext)
      .sort((left, right) => Number(right?.timestamp || 0) - Number(left?.timestamp || 0))
    const latestEvent = ordered[0] ?? null
    const liveCtx = latestEvent?.metas?.systemContext ?? {}
    const live = {
      battery: Number(liveCtx.batteryPercent) || null,
      taskStatus: liveCtx.taskStatus ?? null,
      naviStatus: Number(liveCtx.naviStatus) || 0,
      stationState: typeof liveCtx.stationState === 'string' ? liveCtx.stationState : '',
      cleanWater: Number(liveCtx.cleanWaterPercent) || 0,
      dirtyWater: Number(liveCtx.dirtyWaterPercent) || 0,
      autoMode: liveCtx.autoMode ?? null,
      locationStatus: Number(liveCtx.robotLocationStatus) || 0,
      mapName: typeof liveCtx.currentMapName === 'string' ? liveCtx.currentMapName : '',
      pose: liveCtx.worldPose && Number.isFinite(Number(liveCtx.worldPose.x))
        ? { x: Number(liveCtx.worldPose.x), y: Number(liveCtx.worldPose.y), theta: Number(liveCtx.worldPose.theta) || 0 }
        : null,
      reportedAt: latestEvent ? Number(latestEvent.timestamp) || null : null,
    }
    // 只有 10 分钟内的上报才算“当前状态”，否则只是历史快照
    live.fresh = Boolean(live.reportedAt && Date.now() - live.reportedAt <= 10 * 60 * 1000)

    return {
      live,
      device: {
        ...device,
        modelType: typeof view?.modelType === 'string' ? view.modelType : '',
        softwareVersion: typeof view?.softwareVersion === 'string' ? view.appVersion || view.softwareVersion : '',
        scene: typeof view?.scene === 'string' ? view.scene : '',
        warrantyExpireTime: typeof view?.warrantyExpireTime === 'string' ? view.warrantyExpireTime : '',
        customerName: typeof view?.customerName === 'string' ? view.customerName : '',
      },
      site: {
        name: typeof site?.siteName === 'string' ? site.siteName : (typeof site?.name === 'string' ? site.name : ''),
        raw: site ?? null,
      },
      schedule: {
        version: typeof schedule?.robotSchTaskVersion === 'string' ? schedule.robotSchTaskVersion : '',
        semesters: Array.isArray(schedule?.robotSemester) ? schedule.robotSemester : [],
      },
      workModes,
      events,
      fetchedAt: new Date().toISOString(),
    }
  })

  const liveFeed = new LiveFeed()

  // 实时状态：走平台实时页同一条 socket.io 通道（只订阅状态）
  registerJson(ctx, `${API}/live`, ['GET'], async (request) => {
    const url = new URL(request.url)
    const sn = (url.searchParams.get('sn') || '').trim()
    if (!sn) throw fail('缺少设备编号 sn', 400, 'BAD_REQUEST')
    const session = await new PlatformClient().sessionToken().catch(() => null)
    if (!session) throw fail('登录已过期，请重新登录高仙平台。', 401, 'SESSION_EXPIRED')
    await liveFeed.watch(sn, session)
    return { sn, state: liveFeed.state(), fetchedAt: new Date().toISOString() }
  })

  const mapCache = new Map()

  registerJson(ctx, `${API}/map`, ['GET'], async (request) => {
    const url = new URL(request.url)
    const sn = (url.searchParams.get('sn') || '').trim()
    if (!sn) throw fail('缺少设备编号 sn', 400, 'BAD_REQUEST')
    const force = url.searchParams.get('refresh') === '1'
    const hit = mapCache.get(sn)
    if (!force && hit && Date.now() - hit.at < DEVICE_TTL_MS) return hit.payload

    const { snapshot: latest } = await snapshot()
    const device = (latest?.devices ?? []).find((entry) => entry.sn === sn)
    if (!device) throw fail('没有找到这台设备，请刷新后再试。', 404, 'NOT_FOUND')

    // 位姿与地图版本优先取最近事件；没有事件时用设备自带的地图名去查版本
    const now = Date.now()
    const timeline = await client.taskTimeline(sn, now - 6 * 60 * 60 * 1000, now, 10).catch(() => null)
    const events = Array.isArray(timeline?.taskTimelines) ? timeline.taskTimelines : []
    const withMap = events.find((entry) => entry?.metas?.systemContext?.currentMapName)
    const system = withMap?.metas?.systemContext ?? events[0]?.metas?.systemContext ?? {}
    const siteContext = withMap?.metas?.siteContext ?? {}
    const mapName = (typeof system.currentMapName === 'string' && system.currentMapName)
      || device.map
      || ''
    if (!mapName) throw fail('这台设备没有可用的地图记录。', 404, 'NO_MAP')

    const mapVersion = typeof system.currentMapVersion === 'string' ? system.currentMapVersion.replace(/\/$/, '') : ''
    // 优先用“机器人当前绑定的地图”（与官方实时页同源），再退回按名称反查
    const bound = await client.robotMaps(sn).catch(() => null)
    const boundMap = (Array.isArray(bound?.robotMaps) ? bound.robotMaps : [])
      .find((entry) => entry?.mapDisplayName === mapName) ?? (bound?.robotMaps ?? [])[0] ?? null
    const info = boundMap?.localMapUuid && boundMap?.usedVersion?.mapVersionId
      ? await client.mapInfo(sn, {
        name: boundMap.mapDisplayName,
        mapId: boundMap.localMapUuid,
        version: boundMap.usedVersion.mapVersionId,
      }).catch(() => null)
      : await client.mapInfo(sn, {
        name: mapName,
        mapId: siteContext.mapId ?? system.currentMapId ?? '',
        version: mapVersion,
      }).catch(() => null)
    const mapId = info?.mapId
    const mapVersionId = info?.mapVersionId
    if (!mapId || !mapVersionId) throw fail(`没有查到「${mapName}」的版本信息。`, 404, 'NO_MAP_VERSION')

    const meta = await client.mapMeta(mapId, mapVersionId).catch(() => null)
    const files = await client.mapVisualFiles(mapId, mapVersionId).catch(() => null)
    const image = (Array.isArray(files?.files) ? files.files : []).find((entry) => String(entry?.file).endsWith('.png'))
    if (!image?.downloadUri) throw fail(`「${mapName}」的地图图片没有生成。`, 404, 'NO_MAP_IMAGE')

    const response = await fetch(image.downloadUri, { signal: AbortSignal.timeout(20000) })
    if (!response.ok) throw fail(`下载地图图片失败（HTTP ${response.status}）`, 502, 'MAP_DOWNLOAD_FAILED')
    const buffer = Buffer.from(await response.arrayBuffer())
    const imageWidth = buffer.length > 24 && buffer.toString('ascii', 1, 4) === 'PNG' ? buffer.readUInt32BE(16) : null
    const imageHeight = buffer.length > 24 && buffer.toString('ascii', 1, 4) === 'PNG' ? buffer.readUInt32BE(20) : null
    const grid = meta?.mapInfo ?? {}
    const pose = system.worldPose ?? null

    const payload = {
      sn,
      mapId,
      mapVersionId,
      name: meta?.name || mapName,
      image: `data:image/png;base64,${buffer.toString('base64')}`,
      bytes: buffer.length,
      imageWidth,
      imageHeight,
      grid: {
        width: Number(grid.gridWidth) || null,
        height: Number(grid.gridHeight) || null,
        originX: Number(grid.originX) || 0,
        originY: Number(grid.originY) || 0,
        resolution: Number(grid.resolution) || 0.05,
      },
      pose: pose && Number.isFinite(Number(pose.x)) ? { x: Number(pose.x), y: Number(pose.y), theta: Number(pose.theta) || 0 } : null,
      fetchedAt: new Date().toISOString(),
    }
    mapCache.set(sn, { at: Date.now(), payload })
    return payload
  })

  registerJson(ctx, `${API}/tasks`, ['GET'], async (request) => {
    const url = new URL(request.url)
    const sn = (url.searchParams.get('sn') || '').trim()
    if (!sn) throw fail('缺少设备编号 sn', 400, 'BAD_REQUEST')
    const date = (url.searchParams.get('date') || dayRange(1).endDate).slice(0, 10)
    const payload = await client.listDailyTasks(sn, date).catch((error) => {
      throw fail(`读取当日任务失败：${error instanceof Error ? error.message : String(error)}`, 502, 'TASKS_FAILED')
    })
    const tasks = (Array.isArray(payload?.tasks) ? payload.tasks : []).map((task) => ({
      name: typeof task?.taskName === 'string' ? task.taskName : '',
      map: typeof task?.mapName === 'string' ? task.mapName : '',
      mode: typeof task?.cleaningMode === 'string' ? task.cleaningMode : '',
      startTime: typeof task?.startTime === 'string' ? task.startTime : '',
      endTime: typeof task?.endTime === 'string' ? task.endTime : '',
      area: Number(task?.totalArea) || 0,
      coverage: Number(task?.coverageArea) || 0,
      completeness: Number(task?.completeness) || 0,
      compliant: task?.isCompliant === true,
      status: task?.taskEndStatus ?? null,
    }))
    return { date, tasks, fetchedAt: new Date().toISOString() }
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