// 任务助手 —— 服务端入口
//
// 负责：保存四个任务系统的连接信息、按需拉取任务、生成汇总与子页查询。
// 只提供本机只读接口（/api/task-assistant/...），不写回任何业务系统。
//
// 用户只需要填：各系统的账号密码，以及一个多模态模型的接口地址、Key 和模型名
// （用于识别工单系统的算式验证码）。其余参数由工作台按系统默认值处理。

import Schema from '@deepseek-ai/schemastery'
import { chmod, mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { SYSTEMS, SYSTEM_IDS, collectSystem, fail, systemMeta, verifyCredentials } from './sources.js'
import { buildOverview, querySystem } from './insights.js'
import { demoSnapshot } from './demo.js'

export const name = 'ge-workbench-task-assistant'
export const inject = ['connection']

export const Config = Schema.object({
  root: Schema.string().required(),
})

const API = '/api/task-assistant'
const AUTO_REFRESH_AFTER_MS = 10 * 60 * 1000

function asText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function shortError(error) {
  const message = error instanceof Error ? error.message : String(error)
  return message.length > 300 ? `${message.slice(0, 300)}…` : message
}

function normalizeModel(input) {
  return {
    apiBase: asText(input?.apiBase).replace(/\/+$/, ''),
    apiKey: asText(input?.apiKey),
    model: asText(input?.model),
  }
}

class Store {
  constructor(root) {
    this.root = root
    this.settingsFile = join(root, 'settings.json')
    this.secretsFile = join(root, 'secrets.json')
    this.snapshotFile = join(root, 'snapshot.json')
    this.ready = null
  }

  init() {
    this.ready ??= (async () => {
      await mkdir(this.root, { recursive: true, mode: 0o700 })
    })()
    return this.ready
  }

  async readJson(file, fallback) {
    await this.init()
    try {
      return JSON.parse(await readFile(file, 'utf8'))
    } catch {
      return fallback
    }
  }

  async writeJson(file, value, mode = 0o600) {
    await this.init()
    const temporary = `${file}.tmp-${process.pid}`
    await writeFile(temporary, JSON.stringify(value, null, 2), { mode })
    await chmod(temporary, mode)
    await rename(temporary, file)
  }

  async readSettings() {
    const raw = await this.readJson(this.settingsFile, null)
    const systems = {}
    for (const id of SYSTEM_IDS) {
      const entry = raw?.systems?.[id] ?? {}
      systems[id] = {
        username: asText(entry.username),
        configured: Boolean(entry.configured),
        connectedAt: entry.connectedAt ?? null,
      }
    }
    return {
      demo: Boolean(raw?.demo),
      projects: Array.isArray(raw?.projects) ? raw.projects.filter((name) => typeof name === 'string' && name.trim() !== '') : [],
      systems,
    }
  }

  async writeSettings(settings) {
    await this.writeJson(this.settingsFile, settings, 0o600)
  }

  async readSecrets() {
    return this.readJson(this.secretsFile, {})
  }

  async writeSecrets(secrets) {
    await this.writeJson(this.secretsFile, secrets, 0o600)
  }

  async readSnapshot() {
    return this.readJson(this.snapshotFile, null)
  }

  async writeSnapshot(snapshot) {
    await this.writeJson(this.snapshotFile, snapshot, 0o600)
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

async function readJsonBody(request) {
  const text = await request.text()
  if (!text) return {}
  try {
    return JSON.parse(text)
  } catch {
    throw fail('请求内容不是合法 JSON', 400)
  }
}

export function apply(ctx, config) {
  const store = new Store(config.root)
  const runtime = { refreshing: false, lastAttempt: 0 }
  let activeRefresh = null

  const ensureReady = () => store.init()

  const connectionState = async () => {
    await ensureReady()
    const settings = await store.readSettings()
    const secrets = await store.readSecrets()
    const snapshot = await store.readSnapshot()
    return { settings, secrets, snapshot }
  }

  let cachedVersion = null
  const pluginVersion = async () => {
    if (cachedVersion) return cachedVersion
    try {
      const raw = await readFile(new URL('../package.json', import.meta.url), 'utf8')
      cachedVersion = JSON.parse(raw).version ?? ''
    } catch {
      cachedVersion = ''
    }
    return cachedVersion
  }

  const modelState = (secrets) => {
    const model = normalizeModel(secrets?.model)
    return {
      apiBase: model.apiBase,
      model: model.model,
      configured: Boolean(model.apiBase && model.apiKey && model.model),
      hasKey: Boolean(model.apiKey),
    }
  }

  const statusSnapshot = async () => {
    const { settings, secrets, snapshot } = await connectionState()
    return {
      version: await pluginVersion(),
      updatedAt: snapshot?.fetchedAt ?? null,
      demo: settings.demo,
      refreshing: runtime.refreshing,
      model: modelState(secrets),
      systems: SYSTEMS.map((meta) => {
        const saved = settings.systems[meta.id]
        const collected = snapshot?.systems?.[meta.id]
        return {
          id: meta.id,
          title: meta.title,
          source: meta.source,
          home: meta.home,
          hint: meta.hint,
          username: saved.username,
          hasPassword: Boolean(asText(secrets?.[meta.id]?.password)),
          configured: saved.configured,
          fetchedAt: collected?.fetchedAt ?? null,
          error: collected?.error ?? null,
          note: collected?.note ?? '',
        }
      }),
    }
  }

  const refreshSystems = async (ids) => {
    if (activeRefresh) return activeRefresh
    activeRefresh = (async () => {
      await ensureReady()
      const settings = await store.readSettings()
      const secrets = await store.readSecrets()
      const previous = (await store.readSnapshot()) ?? { systems: {} }
      const targets = (ids?.length ? ids : SYSTEM_IDS.filter((id) => settings.systems[id].configured))
        .filter((id) => SYSTEM_IDS.includes(id))
      runtime.refreshing = true
      const systems = { ...(previous.systems ?? {}) }
      const errors = []
      const refreshedTokens = {}
      const samples = {}
      await Promise.all(targets.map(async (id) => {
        try {
          const result = await collectSystem(id, settings.systems[id], secrets?.[id])
          if (result.token) refreshedTokens[id] = result.token
          if (result.sample) samples[id] = result.sample
          systems[id] = {
            items: result.items,
            fetchedAt: new Date().toISOString(),
            note: result.note ?? '',
            error: null,
          }
        } catch (error) {
          const message = shortError(error)
          errors.push({ system: id, message })
          systems[id] = {
            items: systems[id]?.items ?? [],
            fetchedAt: systems[id]?.fetchedAt ?? null,
            note: systems[id]?.note ?? '',
            error: message,
          }
        }
      }))
      const snapshot = { fetchedAt: new Date().toISOString(), demo: false, systems }
      await store.writeSnapshot(snapshot)
      if (Object.keys(samples).length) {
        // 字段样本只写本机，用来核对各系统真实字段名；不含账号密码。
        await mkdir(join(store.root, 'debug'), { recursive: true, mode: 0o700 }).catch(() => {})
        for (const [id, sample] of Object.entries(samples)) {
          try {
            await store.writeJson(join(store.root, 'debug', `${id}.json`), { at: new Date().toISOString(), ...sample })
          } catch {
            /* 诊断文件写不进去不影响取数 */
          }
        }
      }
      if (Object.keys(refreshedTokens).length) {
        const nextSecrets = await store.readSecrets()
        for (const [id, token] of Object.entries(refreshedTokens)) {
          nextSecrets[id] = { ...(nextSecrets[id] ?? {}), token, savedAt: new Date().toISOString() }
        }
        await store.writeSecrets(nextSecrets)
      }
      runtime.refreshing = false
      runtime.lastAttempt = Date.now()
      return { snapshot, errors }
    })().finally(() => {
      activeRefresh = null
      runtime.refreshing = false
    })
    return activeRefresh
  }

  const maybeAutoRefresh = async () => {
    await ensureReady()
    const settings = await store.readSettings()
    if (settings.demo) return
    const connected = SYSTEM_IDS.filter((id) => settings.systems[id].configured)
    if (!connected.length) return
    if (runtime.refreshing) return
    if (Date.now() - runtime.lastAttempt < 60_000) return
    const snapshot = await store.readSnapshot()
    const last = snapshot?.fetchedAt ? Date.parse(snapshot.fetchedAt) : NaN
    if (Number.isFinite(last) && Date.now() - last < AUTO_REFRESH_AFTER_MS) return
    runtime.lastAttempt = Date.now()
    refreshSystems(connected).catch(() => {})
  }

  const currentSnapshot = async () => {
    const { settings, snapshot } = await connectionState()
    if (settings.demo) return demoSnapshot()
    return snapshot ?? { systems: {} }
  }

  registerJson(ctx, `${API}/status`, ['GET'], async () => statusSnapshot())

  registerJson(ctx, `${API}/overview`, ['GET'], async () => {
    const { settings } = await connectionState()
    void maybeAutoRefresh()
    const snapshot = await currentSnapshot()
    return buildOverview({ snapshot, settings, now: Date.now() })
  })

  registerJson(ctx, `${API}/system`, ['GET'], async (request) => {
    const url = new URL(request.url)
    const systemId = asText(url.searchParams.get('system'))
    if (!systemMeta(systemId)) throw fail('未知的系统', 400)
    const { settings } = await connectionState()
    void maybeAutoRefresh()
    const snapshot = await currentSnapshot()
    const result = querySystem({
      snapshot,
      systemId,
      now: Date.now(),
      filters: {
        status: url.searchParams.get('status') ?? 'all',
        category: url.searchParams.get('category') ?? '',
        q: url.searchParams.get('q') ?? '',
        from: url.searchParams.get('from') ?? '',
        to: url.searchParams.get('to') ?? '',
        dateField: url.searchParams.get('dateField') ?? 'due',
        page: url.searchParams.get('page') ?? '1',
        pageSize: url.searchParams.get('pageSize') ?? '20',
        projects: settings.projects,
      },
    })
    return { ...result, settingsDemo: settings.demo }
  })

  // 保存多模态模型：用于识别工单系统的算式验证码。
  registerJson(ctx, `${API}/model`, ['POST'], async (request) => {
    const body = await readJsonBody(request)
    const model = normalizeModel(body)
    const secrets = await store.readSecrets()
    const existing = normalizeModel(secrets.model)
    // Key 留空表示沿用已保存的 Key，方便只改模型名或地址。
    if (!model.apiKey) model.apiKey = existing.apiKey
    if (!model.apiBase || !model.apiKey || !model.model) {
      throw fail('接口地址、API Key 和模型名都要填写', 400)
    }
    if (!/^https?:\/\//i.test(model.apiBase)) throw fail('接口地址需要以 http:// 或 https:// 开头', 400)
    secrets.model = model
    await store.writeSecrets(secrets)
    return { ok: true, status: await statusSnapshot() }
  })

  registerJson(ctx, `${API}/connect`, ['POST'], async (request) => {
    const body = await readJsonBody(request)
    const systemId = asText(body?.system)
    const meta = systemMeta(systemId)
    if (!meta) throw fail('未知的系统', 400)
    await ensureReady()

    const settings = await store.readSettings()
    const secrets = await store.readSecrets()
    // 账号密码已经存过时，留空即可复用，不必每次重填。
    const stored = secrets?.[systemId] ?? {}
    const input = {
      username: asText(body?.username) || asText(stored.username) || settings.systems[systemId].username,
      password: typeof body?.password === 'string' && body.password !== ''
        ? body.password
        : (typeof stored.password === 'string' ? stored.password : ''),
      model: normalizeModel(secrets.model),
    }

    let verified
    try {
      verified = await verifyCredentials(systemId, input)
    } catch (error) {
      const message = shortError(error)
      // 连接失败的原始原因留档，便于排查是账号、网络还是接口问题；不记录密码。
      await mkdir(join(store.root, 'debug'), { recursive: true, mode: 0o700 }).catch(() => {})
      await store.writeJson(join(store.root, 'debug', `connect-${systemId}.json`), {
        at: new Date().toISOString(),
        system: systemId,
        username: input.username,
        error: message,
      }).catch(() => {})
      return {
        ok: false,
        error: message,
        status: await statusSnapshot(),
      }
    }

    settings.systems[systemId] = {
      username: input.username,
      configured: true,
      connectedAt: new Date().toISOString(),
    }
    secrets[systemId] = {
      username: input.username,
      password: input.password,
      token: verified.token || secrets?.[systemId]?.token || '',
      savedAt: new Date().toISOString(),
    }
    if (settings.demo) settings.demo = false
    await store.writeSettings(settings)
    await store.writeSecrets(secrets)

    // 首次拉取放到后台：大系统（巡检维保）可能要几十秒，不阻塞连接返回。
    void refreshSystems([systemId]).catch(() => {})
    return { ok: true, total: verified.total ?? null, status: await statusSnapshot() }
  })

  registerJson(ctx, `${API}/disconnect`, ['POST'], async (request) => {
    const body = await readJsonBody(request)
    const systemId = asText(body?.system)
    if (!systemMeta(systemId)) throw fail('未知的系统', 400)
    const settings = await store.readSettings()
    const secrets = await store.readSecrets()
    settings.systems[systemId] = { username: '', configured: false, connectedAt: null }
    delete secrets[systemId]
    await store.writeSettings(settings)
    await store.writeSecrets(secrets)
    const snapshot = (await store.readSnapshot()) ?? { systems: {} }
    if (snapshot.systems?.[systemId]) {
      delete snapshot.systems[systemId]
      await store.writeSnapshot(snapshot)
    }
    return { ok: true, status: await statusSnapshot() }
  })

  registerJson(ctx, `${API}/refresh`, ['POST'], async (request) => {
    const body = await readJsonBody(request)
    const { settings } = await connectionState()
    if (settings.demo) return { ok: true, demo: true, overview: buildOverview({ snapshot: demoSnapshot(), settings }) }
    const ids = Array.isArray(body?.systems) && body.systems.length ? body.systems.map(asText).filter(Boolean) : undefined
    const { errors } = await refreshSystems(ids)
    const snapshot = await currentSnapshot()
    return { ok: true, errors, overview: buildOverview({ snapshot, settings }) }
  })

  registerJson(ctx, `${API}/projects`, ['POST'], async (request) => {
    const body = await readJsonBody(request)
    const list = Array.isArray(body?.projects) ? body.projects : []
    const projects = [...new Set(list.map((name) => asText(name)).filter(Boolean))]
    const settings = await store.readSettings()
    settings.projects = projects
    await store.writeSettings(settings)
    return { ok: true, projects, status: await statusSnapshot() }
  })

  registerJson(ctx, `${API}/demo`, ['POST'], async (request) => {
    const body = await readJsonBody(request)
    const settings = await store.readSettings()
    settings.demo = Boolean(body?.enabled)
    await store.writeSettings(settings)
    return { ok: true, status: await statusSnapshot() }
  })
}