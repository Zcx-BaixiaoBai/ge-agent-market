import Schema from '@deepseek-ai/schemastery'
import { readFile } from 'node:fs/promises'
import { platform } from 'node:os'
import { fileURLToPath } from 'node:url'
import { FileStore } from '../lib/host/file-store.js'
import { DocumentServer } from '../lib/host/document-server.js'
import { OnlyOfficeSetup } from '../lib/host/onlyoffice-setup.js'
import { PatchQueue, officeApplyPatchTool } from '../lib/host/patches.js'
import { createContentServer } from '../lib/host/content-server.js'
import { CloudPatchQueue } from '../lib/host/cloud-queue.js'
import { readSystemClipboard, writeSystemClipboard } from '../lib/host/cloud-clipboard.js'
import { isWpsClipboardHtml, sanitizeCloudHtml } from '../lib/host/cloud-bridge.js'
import { officeCloudApplyTool } from '../lib/host/cloud-tool.js'

export const name = 'office-co-creation'
export const inject = ['connection']

export const Config = Schema.object({
  root: Schema.string().required(),
  documentServerUrl: Schema.string().default('http://127.0.0.1:18080'),
  dockerHost: Schema.string().default('host.docker.internal'),
})

const API = '/api/office-co-creation'
const PLUGIN_GUID = 'asc.{1b0f7f2e-6d2a-4a8a-9f6e-4c0f5f2a7d11}'
const ICON = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

function fail(message, status = 400) {
  const error = new Error(message)
  error.status = status
  return error
}

function corsHeaders(request, allowedOrigins, extra = {}) {
  const headers = { 'cache-control': 'no-store', ...extra }
  const origin = request.headers.get('origin')
  if (origin && allowedOrigins.has(origin)) {
    headers['access-control-allow-origin'] = origin
    headers.vary = 'Origin'
    headers['access-control-allow-methods'] = 'GET, POST'
    headers['access-control-allow-headers'] = 'content-type, x-office-token'
  }
  return headers
}

async function readStream(request, limit) {
  const reader = request.body?.getReader()
  if (!reader) return Buffer.alloc(0)
  const chunks = []
  let size = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > limit) throw fail(`请求内容超过 ${Math.round(limit / 1024 / 1024)}MB 上限`, 413)
    chunks.push(Buffer.from(value))
  }
  return Buffer.concat(chunks)
}

async function bodyJson(request, limit = 256 * 1024) {
  const body = await readStream(request, limit)
  if (!body.length) return {}
  try {
    return JSON.parse(body.toString('utf8'))
  } catch {
    throw fail('请求内容不是合法 JSON')
  }
}

function tokenOf(request, url) {
  return request.headers.get('x-office-token') || url.searchParams.get('token') || ''
}

async function downloadCallback(url, documentServer) {
  let parsed
  try {
    parsed = new URL(url)
  } catch {
    throw fail('保存回调的下载地址无效', 422)
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw fail('保存回调只允许 http/https', 422)
  if (!documentServer.allowedCallbackHost(parsed.hostname)) {
    throw fail(`保存回调的主机不受信任：${parsed.hostname}`, 403)
  }
  const response = await fetch(parsed, { signal: AbortSignal.timeout(30_000), cache: 'no-store', redirect: 'error' })
  if (!response.ok) throw fail(`下载保存结果失败：HTTP ${response.status}`, 502)
  const declared = Number(response.headers.get('content-length') || 0)
  if (declared > 150 * 1024 * 1024) throw fail('保存结果超过 150MB', 413)
  const buffer = Buffer.from(await response.arrayBuffer())
  if (buffer.length > 150 * 1024 * 1024) throw fail('保存结果超过 150MB', 413)
  return buffer
}

export async function apply(ctx, config) {
  const store = new FileStore(config.root)
  await store.init()
  const documentServer = new DocumentServer(config.documentServerUrl)
  const queue = new PatchQueue({ store, documentServer })
  const cloudQueue = new CloudPatchQueue()
  // Windows/Linux 的 Docker 容器通过 host.docker.internal 访问宿主机，回环地址不可达，
// 文件内容服务必须监听所有网卡；访问仍由每个文件独立的随机令牌保护。
  const contentHost = platform() === 'darwin' ? '127.0.0.1' : '0.0.0.0'
  const content = await createContentServer({ store, documentServer, queue, host: contentHost })
  ctx.effect(() => () => content.close())
  const setup = new OnlyOfficeSetup({ documentServer, baseUrl: config.documentServerUrl })
  const docsUrl = new URL(config.documentServerUrl)
  const docsPort = docsUrl.port ? `:${docsUrl.port}` : ''
  const allowedOrigins = new Set([
    docsUrl.origin,
    `${docsUrl.protocol}//127.0.0.1${docsPort}`,
    `${docsUrl.protocol}//localhost${docsPort}`,
  ])

  const json = (request, data, status = 200) => new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders(request, allowedOrigins, { 'content-type': 'application/json; charset=utf-8' }),
  })
  const text = (request, body, status = 200, type = 'text/plain; charset=utf-8') => new Response(body, {
    status,
    headers: corsHeaders(request, allowedOrigins, { 'content-type': type }),
  })

  ctx.inject(['connection'], (scoped) => {
    const register = (path, methods, handler, options = {}) => {
      scoped.connection.fetch.register({
        path: `${API}/${path}`,
        methods,
        requestBody: options.streaming ? 'streaming' : 'buffered',
        async fetch(request) {
          try {
            return await handler(request, new URL(request.url))
          } catch (error) {
            const status = typeof error?.status === 'number' ? error.status : 500
            return json(request, { error: error instanceof Error ? error.message : String(error) }, status)
          }
        },
      })
    }

    register('debug', ['POST'], async (request) => {
      const body = await bodyJson(request, 8 * 1024)
      console.log('[office-co-creation][debug]', JSON.stringify(body))
      return json(request, { ok: true })
    })

    register('config', ['GET'], async (request) => json(request, {
      documentServerUrl: config.documentServerUrl,
      dockerHost: config.dockerHost,
      contentPort: content.port,
      documentServer: await documentServer.probe(),
    }))

    register('health', ['GET'], async (request) => json(request, {
      ok: await documentServer.probe(),
      documentServerUrl: config.documentServerUrl,
    }))

    register('setup/status', ['GET'], async (request) => json(request, await setup.status()))

    register('setup/install', ['POST'], async (request) => {
      const body = await bodyJson(request, 8 * 1024)
      return json(request, await setup.start(body))
    })

    register('setup/start-docker', ['POST'], async (request) => json(request, await setup.openDockerDesktop()))

    register('recent', ['GET'], async (request) => json(request, { files: await store.recent() }))

    register('open-folder', ['POST'], async (request) => {
      const body = await bodyJson(request)
      const started = Date.now()
      console.log('[office-co-creation] open-folder start', body.path)
      const opened = await store.openFolder(body.path)
      console.log('[office-co-creation] open-folder done', opened.files.length, `${Date.now() - started}ms`, opened.truncated ? 'truncated' : '')
      return json(request, opened)
    })

    register('open-file', ['POST'], async (request) => {
      const body = await bodyJson(request)
      if (typeof body.folderId !== 'string' || typeof body.relativePath !== 'string') {
        throw fail('缺少 folderId 或 relativePath')
      }
      return json(request, await store.registerInFolder(body.folderId, body.relativePath))
    })

    register('open-file-path', ['POST'], async (request) => {
      const body = await bodyJson(request)
      if (typeof body.path !== 'string') throw fail('缺少文件路径')
      return json(request, await store.registerFilePath(body.path))
    })

    register('open-recent', ['POST'], async (request) => {
      const body = await bodyJson(request)
      if (typeof body.folderPath !== 'string' || typeof body.relativePath !== 'string') {
        throw fail('缺少 folderPath 或 relativePath')
      }
      return json(request, await store.openRecent(body.folderPath, body.relativePath))
    })

    register('content', ['GET'], async (request, url) => {
      const fileId = url.searchParams.get('fileId') || ''
      const token = url.searchParams.get('token') || ''
      const { meta, buffer } = await store.readContent(fileId, token)
      return new Response(buffer, {
        headers: corsHeaders(request, allowedOrigins, {
          'content-type': store.contentType(fileId, token),
          'content-length': String(buffer.length),
          'content-disposition': `inline; filename*=UTF-8''${encodeURIComponent(meta.name)}`,
        }),
      })
    })

    register('callback', ['POST'], async (request, url) => {
      const fileId = url.searchParams.get('fileId') || ''
      const token = url.searchParams.get('token') || ''
      const meta = store.get(fileId, token)
      const payload = await bodyJson(request, 32 * 1024 * 1024)
      const status = Number(payload?.status)
      if (status !== 2 && status !== 6) return json(request, { error: 0 })
      if (!payload?.url) throw fail('保存回调缺少下载地址', 422)
      const buffer = await downloadCallback(payload.url, documentServer)
      const updated = await store.writeBack(fileId, token, buffer)
      meta.lastError = null
      return json(request, { error: 0, version: updated.version, sha256: updated.sha256 })
    }, { streaming: true })

    register('state', ['GET'], async (request, url) => {
      const fileId = url.searchParams.get('fileId') || ''
      const token = tokenOf(request, url)
      const meta = store.get(fileId, token)
      return json(request, {
        ...store.publicMeta(meta),
        lastPatch: queue.lastFor(fileId),
        lastError: meta.lastError ?? null,
        pluginReadyAt: meta.pluginReadyAt ?? null,
        backups: meta.backups.map((item) => ({ ...item })),
      })
    })

    register('backup', ['POST'], async (request, url) => {
      const body = await bodyJson(request)
      const meta = store.get(body.fileId, tokenOf(request, url))
      return json(request, await store.backup(meta.fileId, meta.token, 'agent'))
    })

    register('undo', ['POST'], async (request, url) => {
      const body = await bodyJson(request)
      return json(request, await store.undo(body.fileId, tokenOf(request, url)))
    })

    register('cloud/clipboard', ['GET', 'POST'], async (request) => {
      if (request.method === 'POST') {
        const body = await bodyJson(request, 512 * 1024)
        if (typeof body.html !== 'string') throw fail('缺少 html')
        const clean = sanitizeCloudHtml(body.html)
        await writeSystemClipboard(clean, typeof body.text === 'string' ? body.text.slice(0, 1024 * 1024) : '')
        return json(request, { ok: true })
      }
      const { html, text } = await readSystemClipboard()
      if (!isWpsClipboardHtml(html)) return json(request, { ok: false, reason: 'not-wps' })
      return json(request, { ok: true, html, text, htmlLength: html.length, textLength: text.length })
    })

    register('cloud/patch', ['GET'], async (request) => {
      const patch = cloudQueue.next()
      return patch
        ? json(request, patch)
        : new Response(null, { status: 204, headers: corsHeaders(request, allowedOrigins) })
    })

    register('cloud/patch-ack', ['POST'], async (request) => {
      const body = await bodyJson(request, 64 * 1024)
      if (typeof body.id !== 'string') throw fail('缺少补丁标识')
      return json(request, { ok: cloudQueue.ack(body.id, body) })
    })

    register('force-save', ['POST'], async (request, url) => {
      const body = await bodyJson(request)
      const meta = store.get(body.fileId, tokenOf(request, url))
      const key = typeof body.key === 'string' ? body.key : ''
      if (!key.startsWith(`${meta.fileId}-v`) || key.length > 200) throw fail('文档 key 无效')
      return json(request, await documentServer.forceSave(key))
    })

    register('selection', ['GET', 'POST'], async (request, url) => {
      if (request.method === 'POST') {
        const body = await bodyJson(request)
        store.getByPluginToken(body.fileId, body.pluginToken)
        store.setSelection(body.fileId, body)
        return json(request, { ok: true })
      }
      const fileId = url.searchParams.get('fileId') || ''
      const pluginToken = url.searchParams.get('pluginToken') || ''
      store.getByPluginToken(fileId, pluginToken)
      return json(request, store.selection(fileId) ?? {})
    })

    register('patch', ['GET'], async (request, url) => {
      const fileId = url.searchParams.get('fileId') || ''
      const pluginToken = url.searchParams.get('pluginToken') || ''
      const patch = queue.next(fileId, pluginToken)
      return patch
        ? json(request, patch)
        : new Response(null, { status: 204, headers: corsHeaders(request, allowedOrigins) })
    })

    register('patch-ack', ['POST'], async (request) => {
      const body = await bodyJson(request)
      if (typeof body.patchId !== 'string' || typeof body.fileId !== 'string') throw fail('缺少补丁标识')
      queue.ack(body.patchId, body.pluginToken, body)
      return json(request, { ok: true })
    })

    register('plugin-config', ['GET'], async (request, url) => {
      const fileId = url.searchParams.get('fileId') || ''
      const pluginToken = url.searchParams.get('pluginToken') || ''
      store.getByPluginToken(fileId, pluginToken)
      const origin = new URL(request.url).origin
      const query = `fileId=${encodeURIComponent(fileId)}&pluginToken=${encodeURIComponent(pluginToken)}`
      return json(request, {
        name: 'OfficeCoCreation',
        guid: PLUGIN_GUID,
        version: '1.0.0',
        variations: [{
          description: '办公套件选区桥接',
          url: `${origin}${API}/plugin-index?${query}`,
          icons: [`${origin}${API}/plugin-icon.png`],
          isViewer: false,
          EditorsSupport: ['word', 'cell', 'slide'],
          isVisual: false,
          isModal: false,
          isInsideMode: false,
          initDataType: 'none',
          initOnSelectionChanged: true,
          buttons: [],
        }],
      })
    })

    register('plugin-index', ['GET'], async (request, url) => {
      const fileId = url.searchParams.get('fileId') || ''
      const pluginToken = url.searchParams.get('pluginToken') || ''
      store.getByPluginToken(fileId, pluginToken)
      const dsOrigin = documentServer.origin()
      const query = `fileId=${encodeURIComponent(fileId)}&pluginToken=${encodeURIComponent(pluginToken)}`
      return text(request, `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<title>办公套件选区桥接</title>
<script src="${dsOrigin}/sdkjs-plugins/v1/plugins.js"></script>
<script src="${dsOrigin}/sdkjs-plugins/v1/plugins-ui.js"></script>
<script src="${API}/plugin.js?${query}"></script>
</head>
<body></body>
</html>`, 200, 'text/html; charset=utf-8')
    })

    register('plugin.js', ['GET'], async (request) => {
      const file = fileURLToPath(new URL('../lib/onlyoffice-plugin/plugin.js', import.meta.url))
      return text(request, await readFile(file, 'utf8'), 200, 'text/javascript; charset=utf-8')
    })

    register('plugin-icon.png', ['GET'], async (request) => new Response(ICON, {
      headers: corsHeaders(request, allowedOrigins, {
        'content-type': 'image/png',
        'cache-control': 'public, max-age=86400',
      }),
    }))
  })

  ctx.inject(['tools'], (scoped) => {
    scoped.tools.register(officeApplyPatchTool({ queue, store }))
    scoped.tools.register(officeCloudApplyTool({ cloudQueue }))
  })
}