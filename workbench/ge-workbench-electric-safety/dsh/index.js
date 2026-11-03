import Schema from '@deepseek-ai/schemastery'
import { chmod, mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

export const name = 'ge-workbench-electric-safety'
export const inject = ['connection']

export const Config = Schema.object({
  root: Schema.string().required(),
})

const DEFAULT_BASE_URL = 'https://energy.example.com'
const REQUEST_TIMEOUT_MS = 25_000
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000
const SYNC_INTERVAL_MS = 30 * 60 * 1000
const STALE_AFTER_MS = 6 * 60 * 60 * 1000
const RETRY_AFTER_MS = 10 * 60 * 1000
const API_PREFIX = '/api/electric-safety'

function fail(message, status = 500) {
  const error = new Error(message)
  error.status = status
  return error
}

function asNumber(value, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function asNullableNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function asText(value, fallback = '') {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : fallback
}

function today() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai' }).format(new Date())
}

function addDays(date, delta) {
  const parsed = new Date(`${date}T00:00:00+08:00`)
  if (Number.isNaN(parsed.getTime())) return date
  parsed.setUTCDate(parsed.getUTCDate() + delta)
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai' }).format(parsed)
}

function normalizeBaseUrl(value) {
  const raw = asText(value, DEFAULT_BASE_URL).replace(/\/+$/, '')
  let parsed
  try {
    parsed = new URL(raw)
  } catch {
    throw fail('能源系统地址不是合法网址', 400)
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw fail('能源系统地址只支持 http 或 https', 400)
  }
  return parsed.origin + parsed.pathname.replace(/\/+$/, '')
}

function shortError(error) {
  const text = error instanceof Error ? error.message : String(error)
  return text.length > 300 ? `${text.slice(0, 300)}…` : text
}

function parseJwtExpiry(token) {
  const parts = String(token).split('.')
  if (parts.length !== 3) return 0
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'))
    return typeof payload.exp === 'number' ? payload.exp * 1000 : 0
  } catch {
    return 0
  }
}

async function readJson(path, fallback) {
  try {
    return JSON.parse(await readFile(path, 'utf8'))
  } catch {
    return fallback
  }
}

async function writeJson(path, value, mode = 0o600) {
  await mkdir(dirname(path), { recursive: true })
  const temporary = `${path}.${process.pid}.${Date.now()}.tmp`
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { encoding: 'utf8', mode })
  await rename(temporary, path)
  try {
    await chmod(path, mode)
  } catch {
    /* Windows and some filesystems do not expose POSIX modes. */
  }
}

function encodeEnvValue(value) {
  return JSON.stringify(String(value ?? ''))
}

function decodeEnvValue(value) {
  try {
    const parsed = JSON.parse(value)
    return typeof parsed === 'string' ? parsed : value
  } catch {
    return value.replace(/^["']|["']$/g, '')
  }
}

async function readJsonBody(request, limit = 64 * 1024) {
  const reader = request.body?.getReader()
  if (!reader) return {}
  const chunks = []
  let size = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > limit) throw fail('请求内容过大', 413)
    chunks.push(value)
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    throw fail('请求内容不是合法 JSON', 400)
  }
}

class Store {
  constructor(root) {
    this.root = root
    this.reportsDir = join(root, 'reports')
    this.curvesDir = join(root, 'curves')
    this.settingsFile = join(root, 'settings.json')
    this.connectionEnvFile = join(root, 'connection.env')
    this.legacyCredentialsFile = join(root, 'credentials.json')
    this.statusFile = join(root, 'status.json')
    this.ready = null
  }

  init() {
    this.ready ??= (async () => {
      await mkdir(this.reportsDir, { recursive: true, mode: 0o700 })
      await mkdir(this.curvesDir, { recursive: true, mode: 0o700 })
    })()
    return this.ready
  }

  async readConnectionEnv() {
    await this.init()
    try {
      const text = await readFile(this.connectionEnvFile, 'utf8')
      const values = {}
      for (const line of text.split(/\r?\n/)) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue
        const equal = trimmed.indexOf('=')
        if (equal <= 0) continue
        values[trimmed.slice(0, equal).trim()] = decodeEnvValue(trimmed.slice(equal + 1).trim())
      }
      return {
        baseUrl: asText(values.ENERGY_BASE_URL),
        username: asText(values.ENERGY_USERNAME),
        password: typeof values.ENERGY_PASSWORD === 'string' ? values.ENERGY_PASSWORD : '',
      }
    } catch {
      return { baseUrl: '', username: '', password: '' }
    }
  }

  async readSettings() {
    await this.init()
    const value = await readJson(this.settingsFile, {})
    const env = await this.readConnectionEnv()
    return {
      baseUrl: env.baseUrl || (typeof value?.baseUrl === 'string' ? value.baseUrl : DEFAULT_BASE_URL),
      username: env.username || (typeof value?.username === 'string' ? value.username : null),
      displayName: typeof value?.displayName === 'string' ? value.displayName : null,
      connectedAt: typeof value?.connectedAt === 'string' ? value.connectedAt : null,
    }
  }

  async writeSettings(settings) {
    await this.init()
    await writeJson(this.settingsFile, settings)
  }

  async readCredentials() {
    await this.init()
    const env = await this.readConnectionEnv()
    if (env.username && env.password) return { username: env.username, password: env.password }
    const legacy = await readJson(this.legacyCredentialsFile, null)
    if (legacy && typeof legacy.username === 'string' && typeof legacy.password === 'string') {
      await this.writeCredentials(legacy.username, legacy.password, env.baseUrl || DEFAULT_BASE_URL)
      await rm(this.legacyCredentialsFile, { force: true })
      return { username: legacy.username, password: legacy.password }
    }
    return null
  }

  async writeCredentials(username, password, baseUrl = DEFAULT_BASE_URL) {
    await this.init()
    const text = [
      '# 用电安全助手本机连接配置；仅本人可读，请勿提交到代码仓库或粘贴到对话里。',
      `ENERGY_BASE_URL=${encodeEnvValue(baseUrl)}`,
      `ENERGY_USERNAME=${encodeEnvValue(username)}`,
      `ENERGY_PASSWORD=${encodeEnvValue(password)}`,
      '',
    ].join('\n')
    await writeFile(this.connectionEnvFile, text, { encoding: 'utf8', mode: 0o600 })
    try {
      await chmod(this.connectionEnvFile, 0o600)
    } catch {
      /* POSIX modes are unavailable on some filesystems. */
    }
  }

  async deleteCredentials() {
    await this.init()
    await rm(this.connectionEnvFile, { force: true })
    await rm(this.legacyCredentialsFile, { force: true })
  }

  reportPath(date) {
    return join(this.reportsDir, `${date}.json`)
  }

  async readReport(date) {
    await this.init()
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date))) return null
    const value = await readJson(this.reportPath(date), null)
    if (!value || value.date !== date || !Array.isArray(value.tenants)) return null
    return value
  }

  async writeReport(report) {
    await this.init()
    await writeJson(this.reportPath(report.date), report)
  }

  async listReportDates() {
    await this.init()
    try {
      const entries = await readdir(this.reportsDir)
      return entries
        .map((entry) => entry.replace(/\.json$/, ''))
        .filter((entry) => /^\d{4}-\d{2}-\d{2}$/.test(entry))
        .sort((a, b) => b.localeCompare(a))
    } catch {
      return []
    }
  }

  curvePath(date, meterId) {
    return join(this.curvesDir, date, `${meterId}.json`)
  }

  async readCurve(date, meterId) {
    await this.init()
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date)) || !/^\d+$/.test(String(meterId))) return null
    return readJson(this.curvePath(date, meterId), null)
  }

  async writeCurve(date, meterId, curve) {
    await this.init()
    await writeJson(this.curvePath(date, meterId), curve)
  }

  async readStatus() {
    await this.init()
    const value = await readJson(this.statusFile, {})
    return {
      lastSync: typeof value?.lastSync === 'string' ? value.lastSync : null,
      lastSuccess: typeof value?.lastSuccess === 'string' ? value.lastSuccess : null,
      reportDate: typeof value?.reportDate === 'string' ? value.reportDate : null,
      error: typeof value?.error === 'string' ? value.error : null,
    }
  }

  async writeStatus(status) {
    await this.init()
    await writeJson(this.statusFile, status)
  }
}

class EnergyClient {
  constructor({ baseUrl, username, password }) {
    this.baseUrl = normalizeBaseUrl(baseUrl)
    this.username = username
    this.password = password
    this.token = null
    this.tokenExpiresAt = 0
  }

  async ensureToken(force = false) {
    if (!force && this.token && Date.now() < this.tokenExpiresAt) return this.token
    const data = await this.login()
    this.token = data.token
    this.tokenExpiresAt = data.expiresAt
    return this.token
  }

  async login() {
    let response
    try {
      response = await fetch(`${this.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { accept: 'application/json', 'content-type': 'application/json' },
        body: JSON.stringify({ username: this.username, password: this.password }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      })
    } catch (error) {
      throw fail(`无法连接能源系统：${shortError(error)}`, 502)
    }
    if (!response.ok) {
      let detail = `HTTP ${response.status}`
      try {
        const body = await response.json()
        if (typeof body?.detail === 'string') detail = body.detail
      } catch {
        /* keep the status text */
      }
      throw fail(`能源系统登录失败：${detail}`, 400)
    }
    const body = await response.json()
    const candidates = [body, body?.data, body?.result]
    let token = null
    let user = null
    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate !== '') {
        token = candidate
        break
      }
      if (!candidate || typeof candidate !== 'object') continue
      const value = candidate.access_token ?? candidate.accessToken ?? candidate.token
      if (typeof value === 'string' && value !== '') {
        token = value
        user = candidate.user ?? null
        break
      }
      if (!user && candidate.user) user = candidate.user
    }
    if (!token && body && typeof body === 'object') {
      for (const value of Object.values(body)) {
        if (typeof value === 'string' && /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(value)) {
          token = value
          break
        }
      }
    }
    if (typeof token !== 'string' || token === '') {
      throw fail('能源系统登录成功，但没有返回访问令牌', 502)
    }
    const displayName =
      asText(user?.display_name) ||
      asText(user?.name) ||
      asText(user?.username) ||
      this.username
    const expiresAt = parseJwtExpiry(token) || Date.now() + TOKEN_TTL_MS
    return { token, expiresAt, user, displayName }
  }

  async request(path, { method = 'GET', body, retry = true } = {}) {
    const token = await this.ensureToken()
    let response
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: {
          accept: 'application/json',
          authorization: `Bearer ${token}`,
          ...(body === undefined ? {} : { 'content-type': 'application/json' }),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      })
    } catch (error) {
      throw fail(`无法连接能源系统：${shortError(error)}`, 502)
    }
    if (response.status === 401 && retry) {
      this.token = null
      this.tokenExpiresAt = 0
      return this.request(path, { method, body, retry: false })
    }
    if (!response.ok) {
      let detail = `HTTP ${response.status}`
      try {
        const payload = await response.json()
        if (typeof payload?.detail === 'string') detail = payload.detail
        else if (typeof payload?.error === 'string') detail = payload.error
      } catch {
        /* keep the status text */
      }
      throw fail(`能源系统返回 ${detail}`, response.status === 401 ? 401 : 502)
    }
    if (response.status === 204) return null
    return response.json()
  }
}

function flattenCodeAnomalies(detail) {
  const groups = Array.isArray(detail?.code_anomalies) ? detail.code_anomalies : []
  const output = []
  for (const group of groups) {
    const anomalies = Array.isArray(group?.anomalies)
      ? group.anomalies
      : group && typeof group.meter_id === 'number'
        ? [group]
        : []
    for (const anomaly of anomalies) {
      const category = asText(anomaly?.category, 'other')
      output.push({
        id: `${asNumber(group?.project_id)}-${asNumber(anomaly?.meter_id)}-${category}-${output.length}`,
        meterId: asNumber(anomaly?.meter_id),
        name: asText(anomaly?.meter_name) || asText(anomaly?.room) || '未命名仪表',
        project: asText(group?.project_name) || asText(anomaly?.building),
        building: asText(anomaly?.building) || asText(group?.project_name),
        floor: asText(anomaly?.floor),
        room: asText(anomaly?.room),
        category,
        categoryLabel:
          category === 'meter_fault'
            ? '计量 / 通讯故障'
            : category === 'abnormal_usage'
              ? '夜间用电异常'
              : '其他异常',
        severity: asText(anomaly?.severity, 'medium'),
        description: asText(anomaly?.description) || asText(anomaly?.message),
        metrics: {
          nightDelta: asNullableNumber(anomaly?.metrics?.night_delta),
          nightRatio: asNullableNumber(anomaly?.metrics?.night_ratio),
          totalDelta: asNullableNumber(anomaly?.metrics?.total_delta),
          delta: asNullableNumber(anomaly?.metrics?.delta),
          readingsCount: asNullableNumber(anomaly?.metrics?.readings_count),
        },
      })
    }
  }
  return output
}

function mergeTenants(top, negative) {
  const byMeter = new Map()

  const ensure = (row) => {
    const id = asNumber(row?.meter_id)
    if (!id) return null
    let current = byMeter.get(id)
    if (!current) {
      current = {
        meterId: id,
        name: asText(row?.meter_name) || '未命名仪表',
        project: asText(row?.project_name),
        building: asText(row?.project_name),
        floor: '',
        isTenant: row?.is_tenant !== false,
        nightActual: null,
        nightPred: null,
        nightExcess: null,
        nightScore: null,
        q10: null,
        q90: null,
        scoreQ: null,
        cleanedNights: null,
        predCapped: false,
        regimeChange: false,
        heuristicHit: false,
        prevAbnormal: false,
        model: false,
        negative: false,
        focus: false,
        tags: [],
      }
      byMeter.set(id, current)
    }
    return current
  }

  const applyMetrics = (target, row) => {
    target.nightActual = asNullableNumber(row?.night_actual)
    target.nightPred = asNullableNumber(row?.night_pred)
    target.nightExcess = asNullableNumber(row?.night_excess)
    target.nightScore = asNullableNumber(row?.night_score)
    target.q10 = asNullableNumber(row?.night_q10)
    target.q90 = asNullableNumber(row?.night_q90)
    target.scoreQ = asNullableNumber(row?.night_score_q)
    target.cleanedNights = asNullableNumber(row?.cleaned_nights)
    target.predCapped = row?.pred_capped === true
    target.regimeChange = row?.regime_change === true
  }

  for (const row of Array.isArray(top) ? top : []) {
    const current = ensure(row)
    if (!current) continue
    current.model = true
    current.tags.push('model')
    applyMetrics(current, row)
    current.heuristicHit = row?.heuristic_hit === true
    current.prevAbnormal = row?.prev_abnormal === true
  }

  for (const row of Array.isArray(negative) ? negative : []) {
    const current = ensure(row)
    if (!current) continue
    current.negative = true
    current.tags.push('negative')
    if (!current.model) applyMetrics(current, row)
    current.heuristicHit = current.heuristicHit || row?.heuristic_hit === true
    current.prevAbnormal = current.prevAbnormal || row?.prev_abnormal === true
  }

  const tenants = [...byMeter.values()]
  for (const tenant of tenants) {
    tenant.focus = tenant.negative || tenant.heuristicHit || tenant.prevAbnormal
    if (tenant.focus) tenant.tags.push('focus')
    if (tenant.heuristicHit) tenant.tags.push('heuristic')
    if (tenant.prevAbnormal) tenant.tags.push('prev')
    tenant.tags = [...new Set(tenant.tags)]
  }
  tenants.sort((a, b) => {
    if (a.focus !== b.focus) return a.focus ? -1 : 1
    const score = (b.nightScore ?? -Infinity) - (a.nightScore ?? -Infinity)
    if (Number.isFinite(score) && score !== 0) return score
    return a.name.localeCompare(b.name, 'zh-Hans-CN')
  })
  return tenants
}

function buildReport({ target, detail, timesnet, results, syncedAt }) {
  const top = Array.isArray(timesnet?.top) ? timesnet.top : []
  const negative = Array.isArray(timesnet?.negative) ? timesnet.negative : []
  const tenants = mergeTenants(top, negative)
  const code = flattenCodeAnomalies(detail)
  const availableDates = [...new Set(
    (Array.isArray(results) ? results : [])
      .filter((row) => row?.status === 'completed' && /^\d{4}-\d{2}-\d{2}$/.test(String(row?.run_date)))
      .map((row) => row.run_date),
  )].sort((a, b) => b.localeCompare(a)).slice(0, 30)
  const warnings = []
  if (!timesnet) warnings.push('该日期的模型偏离数据暂不可用，仅展示代码侧异常。')
  if (!detail) warnings.push('代码侧异常数据暂不可用，仅展示模型偏离。')
  return {
    version: 1,
    date: target.run_date,
    period: { from: target.period_from, to: target.period_to },
    status: target.status,
    durationSec: asNullableNumber(target.duration_sec),
    syncedAt,
    summary: {
      tenantTotal: asNumber(timesnet?.tenant_total),
      modelTotal: top.length,
      dual: asNumber(timesnet?.dual),
      negative: negative.length,
      codeAnomalies: code.length,
      focus: tenants.filter((tenant) => tenant.focus).length,
      projects: new Set(tenants.map((tenant) => tenant.project).filter(Boolean)).size,
    },
    tenants,
    code,
    availableDates,
    warnings,
  }
}

function normalizeCurve(payload, meterId, reportDate) {
  const days = Array.isArray(payload?.days) ? payload.days : []
  return {
    meterId: asNumber(meterId),
    date: reportDate,
    from: asText(payload?.from),
    to: asText(payload?.to),
    days: days.map((day) => ({
      date: asText(day?.date),
      hours: (Array.isArray(day?.hours) ? day.hours : []).map((point) => ({
        h: asNumber(point?.h),
        actual: asNullableNumber(point?.actual),
      })),
      pred: (Array.isArray(day?.pred) ? day.pred : []).map((point) => ({
        h: asNumber(point?.h),
        pred: asNullableNumber(point?.pred),
        q10: asNullableNumber(point?.q10),
        q90: asNullableNumber(point?.q90),
      })),
      night: day?.night && typeof day.night === 'object'
        ? {
            actual: asNullableNumber(day.night.actual),
            pred: asNullableNumber(day.night.pred),
            excess: asNullableNumber(day.night.excess),
            score: asNullableNumber(day.night.score),
            dual: day.night.dual === true,
          }
        : null,
    })),
  }
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
          { error: error instanceof Error ? error.message : String(error) },
          { status, headers: { 'cache-control': 'no-store' } },
        )
      }
    },
  })
}

export function apply(ctx, config) {
  const store = new Store(config.root)
  const runtime = { syncing: false, client: null, lastAttempt: 0 }
  let syncPromise = null
  let ready = null

  const ensureReady = () => {
    ready ??= store.init()
    return ready
  }

  const getClient = async () => {
    await ensureReady()
    const settings = await store.readSettings()
    const credentials = await store.readCredentials()
    if (!settings.username || !credentials) return null
    if (!runtime.client || runtime.client.username !== credentials.username || runtime.client.baseUrl !== settings.baseUrl) {
      runtime.client = new EnergyClient({
        baseUrl: settings.baseUrl,
        username: credentials.username,
        password: credentials.password,
      })
    }
    return runtime.client
  }

  const statusSnapshot = async () => {
    await ensureReady()
    const settings = await store.readSettings()
    const status = await store.readStatus()
    const availableDates = await store.listReportDates()
    const lastSuccessAt = status.lastSuccess ? Date.parse(status.lastSuccess) : NaN
    return {
      configured: Boolean(settings.username),
      baseUrl: settings.baseUrl,
      username: settings.username,
      displayName: settings.displayName,
      connectedAt: settings.connectedAt,
      lastSync: status.lastSync,
      lastSuccess: status.lastSuccess,
      reportDate: status.reportDate,
      stale:
        !Number.isFinite(lastSuccessAt) ||
        Date.now() - lastSuccessAt > STALE_AFTER_MS ||
        status.reportDate !== today(),
      syncing: runtime.syncing,
      error: status.error,
      availableDates,
    }
  }

  const runSync = async ({ date } = {}) => {
    if (syncPromise) return syncPromise
    syncPromise = (async () => {
      await ensureReady()
      const client = await getClient()
      if (!client) throw fail('还没有连接能源系统，请先填写账号。', 400)
      const startedAt = new Date().toISOString()
      const previous = await store.readStatus()
      runtime.syncing = true
      await store.writeStatus({ ...previous, lastSync: startedAt, error: null })
      try {
        const resultPayload = await client.request('/api/ai-check/results?limit=100')
        const results = Array.isArray(resultPayload)
          ? resultPayload
          : Array.isArray(resultPayload?.results)
            ? resultPayload.results
            : []
        const completed = results
          .filter((row) => row?.status === 'completed' && /^\d{4}-\d{2}-\d{2}$/.test(String(row?.run_date)))
          .sort((a, b) => {
            const byDate = String(b.run_date).localeCompare(String(a.run_date))
            return byDate !== 0 ? byDate : asNumber(b.id) - asNumber(a.id)
          })
        const target = date
          ? completed.find((row) => row.run_date === date)
          : completed[0]
        if (!target) {
          throw fail(date ? `没有找到 ${date} 的已完成 AI 自检报告。` : '能源系统还没有已完成的 AI 自检报告。', 404)
        }
        let detail = null
        try {
          detail = await client.request(`/api/ai-check/results/${encodeURIComponent(target.id)}`)
        } catch {
          detail = null
        }
        let timesnet = null
        try {
          timesnet = await client.request(`/api/ai-check/timesnet?d=${encodeURIComponent(target.run_date)}`)
        } catch {
          timesnet = null
        }
        const report = buildReport({
          target,
          detail,
          timesnet,
          results,
          syncedAt: new Date().toISOString(),
        })
        await store.writeReport(report)
        await store.writeStatus({
          lastSync: startedAt,
          lastSuccess: new Date().toISOString(),
          reportDate: date ? previous.reportDate : report.date,
          error: null,
        })
        return report
      } catch (error) {
        await store.writeStatus({
          lastSync: startedAt,
          lastSuccess: previous.lastSuccess,
          reportDate: previous.reportDate,
          error: shortError(error),
        })
        throw error
      } finally {
        runtime.syncing = false
      }
    })().finally(() => {
      syncPromise = null
    })
    return syncPromise
  }

  const maybeSync = async () => {
    if (runtime.syncing) return
    const settings = await store.readSettings()
    if (!settings.username) return
    const now = Date.now()
    if (now - runtime.lastAttempt < RETRY_AFTER_MS) return
    const status = await store.readStatus()
    const lastSuccessAt = status.lastSuccess ? Date.parse(status.lastSuccess) : NaN
    const stale =
      !Number.isFinite(lastSuccessAt) ||
      now - lastSuccessAt > STALE_AFTER_MS ||
      status.reportDate !== today()
    if (!stale) return
    runtime.lastAttempt = now
    try {
      await runSync()
    } catch {
      /* The status endpoint carries the error; the next interval retries. */
    }
  }

  const startScheduler = () => {
    let stopped = false
    const tick = () => {
      if (stopped) return
      void ensureReady().then(maybeSync).catch(() => {})
    }
    const initial = setTimeout(tick, 8_000)
    const interval = setInterval(tick, SYNC_INTERVAL_MS)
    return () => {
      stopped = true
      clearTimeout(initial)
      clearInterval(interval)
    }
  }

  registerJson(ctx, `${API_PREFIX}/status`, ['GET'], async () => statusSnapshot())

  registerJson(ctx, `${API_PREFIX}/connect`, ['POST'], async (request) => {
    await ensureReady()
    const body = await readJsonBody(request)
    const baseUrl = normalizeBaseUrl(body?.baseUrl)
    const username = asText(body?.username)
    const password = typeof body?.password === 'string' ? body.password : ''
    if (!username) throw fail('请填写能源系统用户名', 400)
    if (!password) throw fail('请填写能源系统密码', 400)
    const pilot = new EnergyClient({ baseUrl, username, password })
    const session = await pilot.login()
    await store.writeSettings({
      baseUrl,
      username,
      displayName: session.displayName,
      connectedAt: new Date().toISOString(),
    })
    await store.writeCredentials(username, password, baseUrl)
    runtime.client = pilot
    try {
      const report = await runSync()
      return { ok: true, status: await statusSnapshot(), report }
    } catch (error) {
      return {
        ok: false,
        configured: true,
        error: shortError(error),
        status: await statusSnapshot(),
      }
    }
  })

  registerJson(ctx, `${API_PREFIX}/sync`, ['POST'], async (request) => {
    await ensureReady()
    const body = await readJsonBody(request)
    const date = body?.date ? asText(body.date) : undefined
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw fail('报告日期格式不正确', 400)
    try {
      const report = await runSync({ date })
      return { ok: true, status: await statusSnapshot(), report }
    } catch (error) {
      throw fail(shortError(error), typeof error?.status === 'number' ? error.status : 502)
    }
  })

  registerJson(ctx, `${API_PREFIX}/disconnect`, ['POST'], async () => {
    await ensureReady()
    const settings = await store.readSettings()
    if (settings.username) await store.deleteCredentials()
    runtime.client = null
    await store.writeSettings({
      ...settings,
      username: null,
      displayName: null,
      connectedAt: null,
    })
    return { ok: true, status: await statusSnapshot() }
  })

  registerJson(ctx, `${API_PREFIX}/report`, ['GET'], async (request) => {
    await ensureReady()
    const url = new URL(request.url)
    const requested = asText(url.searchParams.get('date'))
    if (requested && !/^\d{4}-\d{2}-\d{2}$/.test(requested)) throw fail('报告日期格式不正确', 400)
    const status = await store.readStatus()
    const date = requested || status.reportDate || (await store.listReportDates())[0]
    if (!date) throw fail('还没有同步过 AI 自检报告。', 404)
    const report = await store.readReport(date)
    if (!report) throw fail(`没有找到 ${date} 的本地报告。`, 404)
    return { ok: true, report, status: await statusSnapshot() }
  })

  registerJson(ctx, `${API_PREFIX}/curve`, ['GET'], async (request) => {
    await ensureReady()
    const url = new URL(request.url)
    const meterId = asText(url.searchParams.get('meter_id'))
    const date = asText(url.searchParams.get('date'))
    if (!/^\d+$/.test(meterId)) throw fail('仪表编号不正确', 400)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw fail('报告日期格式不正确', 400)
    const cached = await store.readCurve(date, meterId)
    if (cached) return { ok: true, curve: cached, cached: true }
    const report = await store.readReport(date)
    if (!report) throw fail(`没有找到 ${date} 的本地报告。`, 404)
    const client = await getClient()
    if (!client) throw fail('还没有连接能源系统，请先填写账号。', 400)
    const to = report.period?.to || report.date
    const from = addDays(to, -2)
    let payload
    try {
      payload = await client.request(
        `/api/forecast/meter-curve?meter_id=${encodeURIComponent(meterId)}&from_d=${encodeURIComponent(from)}&to_d=${encodeURIComponent(to)}`,
      )
    } catch (error) {
      throw fail(`读取用电曲线失败：${shortError(error)}`, 502)
    }
    const curve = normalizeCurve(payload, Number(meterId), date)
    await store.writeCurve(date, meterId, curve)
    return { ok: true, curve, cached: false }
  })

  if (typeof ctx.effect === 'function') {
    ctx.effect(() => startScheduler(), 'electric safety sync scheduler')
  } else {
    startScheduler()
  }
}

export {
  DEFAULT_BASE_URL,
  EnergyClient,
  Store,
  buildReport,
  flattenCodeAnomalies,
  mergeTenants,
  normalizeBaseUrl,
  normalizeCurve,
}