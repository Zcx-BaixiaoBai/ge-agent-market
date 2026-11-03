// 工程进度追踪工作台 —— 服务端入口
//
// 只做一件事：把上游工程进度系统的只读状态接口转给工作台顶栏，
// 带超时与缓存，避免每次切页都打上游；不改上游、不写会话。

import Schema from '@deepseek-ai/schemastery'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

export const name = 'ge-workbench-engineering-progress'
export const inject = ['connection']

export const Config = Schema.object({
  root: Schema.string().required(),
  baseUrl: Schema.string().default('http://jyplan.zcx-baixiaobai.cn'),
})

const API = '/api/engineering-progress'
const UPSTREAM_TIMEOUT_MS = 8000
const CACHE_TTL_MS = 60_000

const cache = new Map()

function fail(message, status = 502) {
  const error = new Error(message)
  error.status = status
  return error
}

function normalizeBase(baseUrl) {
  const raw = String(baseUrl || '').trim().replace(/\/+$/, '')
  if (!raw) throw fail('未配置上游地址', 500)
  if (!/^https?:\/\//i.test(raw)) throw fail(`上游地址需要以 http(s) 开头：${raw}`, 500)
  return raw
}

async function fetchJson(url) {
  let response
  try {
    response = await fetch(url, {
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      headers: { accept: 'application/json' },
    })
  } catch (error) {
    const reason = error?.name === 'TimeoutError' ? `上游 ${UPSTREAM_TIMEOUT_MS / 1000}s 未响应` : (error?.message ?? String(error))
    throw fail(`无法连接工程进度系统：${reason}`)
  }
  if (!response.ok) throw fail(`工程进度系统返回 HTTP ${response.status}`)
  try {
    return await response.json()
  } catch {
    throw fail('工程进度系统返回的内容不是 JSON')
  }
}

export function apply(ctx, config) {
  const baseUrl = normalizeBase(config.baseUrl)

  // 落一个启动标记：用于确认服务端插件真的加载过（排障用，失败不影响功能）
  void (async () => {
    try {
      await mkdir(config.root, { recursive: true })
      await writeFile(
        join(config.root, 'applied.json'),
        `${JSON.stringify({ startedAt: new Date().toISOString(), baseUrl }, null, 2)}\n`,
        'utf8',
      )
    } catch {
      // 忽略：标记写入失败不阻断接口注册
    }
  })()

  const register = (path, handle) => {
    ctx.connection.fetch.register({
      path: `${API}/${path}`,
      methods: ['GET', 'POST'],
      // 必须显式声明：缺省会按流式处理请求体，GET + body 会被 Node 拒绝（表现为 400）
      requestBody: 'buffered',
      async fetch() {
        try {
          return Response.json(await handle(), { headers: { 'cache-control': 'no-store' } })
        } catch (error) {
          const status = typeof error?.status === 'number' ? error.status : 500
          return Response.json(
            { ok: false, baseUrl, error: error instanceof Error ? error.message : String(error) },
            { status, headers: { 'cache-control': 'no-store' } },
          )
        }
      },
    })
  }

  // 顶栏用的汇总状态：只保留展示需要的字段，不把整包原样透出
  register('status', async () => {
    const key = `${baseUrl}/api/status`
    const cached = cache.get(key)
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
      return { ...cached.value, cached: true }
    }

    const raw = await fetchJson(key)
    const probe = raw?.probe ?? {}
    const report = raw?.report ?? {}
    const pushes = Array.isArray(raw?.recent_pushes) ? raw.recent_pushes : []
    const lastPush = pushes[0] ?? null

    const value = {
      ok: true,
      baseUrl,
      fetchedAt: new Date().toISOString(),
      cached: false,
      probe: {
        ok: probe.ok === 1 || probe.ok === true,
        mode: probe.mode ?? '',
        startedAt: probe.started_at ?? '',
        finishedAt: probe.finished_at ?? '',
        projects: Number(probe.projects ?? 0),
        nodes: Number(probe.nodes ?? 0),
        changed: Number(probe.changed ?? 0),
        error: probe.error ?? '',
      },
      report: { date: report.date ?? '', generatedAt: report.generated_at ?? '', pushed: report.pushed === 1 || report.pushed === true },
      lastPush: lastPush
        ? { at: lastPush.ts ?? '', channel: lastPush.channel ?? '', ok: lastPush.ok === 1 || lastPush.ok === true, detail: String(lastPush.detail ?? '').slice(0, 160) }
        : null,
    }
    cache.set(key, { at: Date.now(), value })
    return value
  })
}