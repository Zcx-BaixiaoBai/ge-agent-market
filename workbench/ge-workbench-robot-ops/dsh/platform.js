// 高仙机器人助手 —— 平台只读客户端
//
// 只做一件事：用本机已经保存的登录会话，调用高仙机器人合作伙伴平台的
// 只读查询接口。不包含任务下发、排班修改、设备升级等写操作。
//
// 平台前端在 2026-11 前后把业务接口从站点域名迁到了网关域名
// （bot.gs-robot.com），旧域名只用于页面本身，POST 业务接口会返回 405。
// 这里把两个地址分开，并且允许用环境变量覆盖：
//   ROBOT_PARTNER_API_BASE      业务接口网关，默认 https://bot.gs-robot.com
//   ROBOT_PARTNER_SESSION_FILE  登录会话文件，默认 ~/.robot-partner/session.json

import { chmod, mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { homedir } from 'node:os'

export const DEFAULT_API_BASE = 'https://bot.gs-robot.com'
export const STATUS_DICTIONARY_PATH = '/static/webapp/robot_status_function/v1/robot_status.json'
export const DEFAULT_SESSION_FILE = join(homedir(), '.robot-partner', 'session.json')
export const SESSION_MISSING_MESSAGE = '还没有登录高仙机器人平台。请先在对话里让助手打开登录窗口完成一次登录，登录后点刷新即可。'

export function resolveApiBase() {
  const configured = (process.env.ROBOT_PARTNER_API_BASE || '').trim()
  return (configured || DEFAULT_API_BASE).replace(/\/+$/, '')
}

export function resolveSessionFile() {
  const configured = (process.env.ROBOT_PARTNER_SESSION_FILE || '').trim()
  return configured || DEFAULT_SESSION_FILE
}

export class PlatformError extends Error {
  constructor(message, options = {}) {
    super(message)
    this.name = 'PlatformError'
    this.code = options.code ?? 'PLATFORM_ERROR'
    this.status = options.status ?? 502
  }
}

export class SessionStore {
  constructor(file = resolveSessionFile()) {
    this.file = file
  }

  async exists() {
    try {
      await readFile(this.file, 'utf8')
      return true
    } catch {
      return false
    }
  }

  async read() {
    let raw
    try {
      raw = await readFile(this.file, 'utf8')
    } catch {
      throw new PlatformError(SESSION_MISSING_MESSAGE, { code: 'NO_SESSION', status: 401 })
    }
    let parsed
    try {
      parsed = JSON.parse(raw)
    } catch {
      throw new PlatformError('登录会话文件无法解析，请重新登录高仙平台。', { code: 'BAD_SESSION', status: 401 })
    }
    if (!parsed?.accessToken) {
      throw new PlatformError('登录会话里没有可用令牌，请重新登录高仙平台。', { code: 'BAD_SESSION', status: 401 })
    }
    return { accessToken: String(parsed.accessToken), refreshToken: parsed.refreshToken ? String(parsed.refreshToken) : '' }
  }

  async write(session) {
    await mkdir(dirname(this.file), { recursive: true, mode: 0o700 })
    const temporary = `${this.file}.${process.pid}.tmp`
    await writeFile(temporary, `${JSON.stringify({ ...session, updatedAt: new Date().toISOString() }, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 })
    await chmod(temporary, 0o600).catch(() => undefined)
    await rename(temporary, this.file)
  }
}

async function safeJson(response) {
  const text = await response.text()
  if (!text) return {}
  try {
    return JSON.parse(text)
  } catch {
    throw new PlatformError(`平台返回了无法识别的响应（HTTP ${response.status}）`, { code: 'BAD_RESPONSE', status: 502 })
  }
}

export class PlatformClient {
  #baseUrl
  #store
  #fetch
  #timeoutMs

  constructor(options = {}) {
    this.#baseUrl = (options.baseUrl ?? resolveApiBase()).replace(/\/+$/, '')
    this.#store = options.sessionStore ?? new SessionStore(options.sessionFile)
    this.#fetch = options.fetchImpl ?? globalThis.fetch
    this.#timeoutMs = options.timeoutMs ?? 20000
  }

  get baseUrl() {
    return this.#baseUrl
  }

  async hasSession() {
    return this.#store.exists()
  }

  async request(path, body) {
    let session = await this.#store.read()
    let response = await this.#send(path, body, session.accessToken)
    if (response.status === 401) {
      session = await this.#refresh(session)
      response = await this.#send(path, body, session.accessToken)
    }
    const payload = await safeJson(response)
    if (!response.ok) {
      if (response.status === 401) {
        throw new PlatformError('登录已过期，请重新登录高仙平台后刷新。', { code: 'SESSION_EXPIRED', status: 401 })
      }
      throw new PlatformError(`平台请求失败（HTTP ${response.status}）`, { code: 'HTTP_ERROR', status: 502 })
    }
    const code = payload?.code
    if (code !== undefined && code !== null && code !== 0 && code !== 200) {
      throw new PlatformError(payload?.message || payload?.msg || '平台返回业务错误', { code: 'BIZ_ERROR', status: 502 })
    }
    return payload?.data ?? payload
  }

  async #send(path, body, token) {
    try {
      return await this.#fetch(`${this.#baseUrl}${path}`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body ?? {}),
        signal: AbortSignal.timeout(this.#timeoutMs),
      })
    } catch (error) {
      throw new PlatformError(`无法连接高仙平台：${error instanceof Error ? error.message : String(error)}`, { code: 'NETWORK', status: 502 })
    }
  }

  async #refresh(session) {
    if (!session.refreshToken) {
      throw new PlatformError('登录已过期，请重新登录高仙平台后刷新。', { code: 'SESSION_EXPIRED', status: 401 })
    }
    let response
    try {
      response = await this.#fetch(`${this.#baseUrl}/gas/api/v1alpha1/auth/token`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: session.refreshToken }),
        signal: AbortSignal.timeout(this.#timeoutMs),
      })
    } catch (error) {
      throw new PlatformError(`刷新登录失败：${error instanceof Error ? error.message : String(error)}`, { code: 'NETWORK', status: 502 })
    }
    const payload = await safeJson(response)
    const nextToken = payload?.data?.accessToken
    if (!response.ok || !nextToken) {
      throw new PlatformError('登录刷新失败，请重新登录高仙平台后刷新。', { code: 'SESSION_EXPIRED', status: 401 })
    }
    const next = {
      accessToken: String(nextToken),
      refreshToken: payload?.data?.refreshToken ? String(payload.data.refreshToken) : session.refreshToken,
    }
    await this.#store.write(next).catch(() => undefined)
    return next
  }

  // ---- 只读查询 ----

  // 平台官方的机器状态字典（静态 JSON，不需要登录），用于把 230/380 这类状态码
  // 显示成“自动任务中”“低功耗中”。取不到时由调用方回退到内置常见状态。
  async getStatusDictionary() {
    try {
      const response = await this.#fetch(`${this.#baseUrl}${STATUS_DICTIONARY_PATH}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(this.#timeoutMs),
      })
      if (!response.ok) return null
      const payload = await response.json()
      const labels = {}
      for (const [code, entry] of Object.entries(payload ?? {})) {
        const label = entry?.label?.['zh-CN'] ?? entry?.label?.['en-US']
        if (typeof label === 'string' && label.trim()) labels[code] = label.trim()
      }
      return Object.keys(labels).length ? labels : null
    } catch {
      return null
    }
  }

  async getOverview() {
    return this.request('/webbff/v1/homePage/getRealtimeOverview', { filter: {} })
  }

  async listWorkspaces(pageNumber = 1, pageSize = 100) {
    return this.request('/webbff/v1/workspace/listWorkspaces', { pageNumber, pageSize })
  }

  async listRobots(pageNumber = 1, pageSize = 100) {
    return this.request('/webbff/v1/robot/list', { pageNumber, pageSize, measureType: 1 })
  }

  async getThresholds(measureType = 1) {
    return this.request('/webbff/v1/accountTaskCriteria/get', { measureType })
  }

  async listTaskStatistics(startDate, endDate, pageNumber = 1, pageSize = 100, measureType = 1) {
    return this.request('/webbff/v1/homePage/listRobotTaskStatistics', {
      pageNumber,
      pageSize,
      startDate,
      endDate,
      measureType,
      filter: {},
      currentViewDate: endDate,
      orderBy: 'completeness desc',
    })
  }

  async getTaskPanel(robotSn, startDate, endDate, measureType = 1) {
    return this.request('/webbff/v1/task/viewTaskPanelByRobotSn', { robotSn, startDate, endDate, measureType })
  }

  async listAlerts(robotSn, startTime, endTime, pageSize = 20) {
    return this.request('/incident/v1/incidentLatest/distPlatform/listByRobotSn', {
      robotSn,
      pageNumber: 1,
      pageSize,
      filter: { startTimeSpan: { startTime, endTime } },
      languageCode: 'zh-CN',
    })
  }
}