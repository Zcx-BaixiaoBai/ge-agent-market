import http from 'node:http'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { access, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'

const MAX_FILE_BYTES = 150 * 1024 * 1024
const MAX_CALLBACK_BYTES = 32 * 1024 * 1024
const API = '/api/office-co-creation'
const PLUGIN_GUID = 'asc.{1b0f7f2e-6d2a-4a8a-9f6e-4c0f5f2a7d11}'
const PLUGIN_FILE = fileURLToPath(new URL('../onlyoffice-plugin/plugin.js', import.meta.url))
const NATIVE_SAVE = new Set(['.docx', '.xlsx', '.pptx', '.csv'])
const OOXML_FOR = { '.doc': 'docx', '.xls': 'xlsx', '.ppt': 'pptx', '.odt': 'docx', '.ods': 'xlsx', '.odp': 'pptx' }
const execFileAsync = promisify(execFile)
let sofficePath
const ICON = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

function saveFileType(ext) {
  return NATIVE_SAVE.has(ext) ? ext.slice(1) : OOXML_FOR[ext] || 'docx'
}

async function findSoffice() {
  if (sofficePath !== undefined) return sofficePath
  const home = process.env.HOME || ''
  const candidates = [
    process.env.OFFICE_SOFFICE_PATH,
    '/Applications/LibreOffice.app/Contents/MacOS/soffice',
    '/usr/local/bin/soffice',
    '/opt/homebrew/bin/soffice',
    home ? join(home, '.local/bin/soffice') : '',
  ].filter(Boolean)
  for (const candidate of candidates) {
    try {
      await access(candidate)
      sofficePath = candidate
      return candidate
    } catch {
      // 继续找下一个
    }
  }
  sofficePath = ''
  return ''
}

async function convertToOriginal(buffer, targetExt) {
  const soffice = await findSoffice()
  if (!soffice) {
    throw fail(`这种格式（${targetExt}）需要 LibreOffice 才能写回原文件；请安装 LibreOffice，或另存为 docx/xlsx/pptx`, 501)
  }
  const sourceExt = `.${OOXML_FOR[targetExt] || 'docx'}`
  const directory = await mkdtemp(join(tmpdir(), 'occ-convert-'))
  try {
    const input = join(directory, `input${sourceExt}`)
    await writeFile(input, buffer)
    await execFileAsync(soffice, [
      '--headless',
      '--norestore',
      `-env:UserInstallation=file://${join(directory, 'profile')}`,
      '--convert-to',
      targetExt.slice(1),
      '--outdir',
      directory,
      input,
    ], { timeout: 60_000, maxBuffer: 1024 * 1024 })
    return await readFile(join(directory, `input${targetExt}`))
  } catch (error) {
    throw fail(`转换回 ${targetExt} 失败：${String(error?.message || error)}`, 502)
  } finally {
    await rm(directory, { recursive: true, force: true }).catch(() => {})
  }
}

function corsOrigin(request, documentServer) {
  const origin = request.headers.origin
  if (!origin) return null
  let parsed
  try {
    parsed = new URL(origin)
  } catch {
    return null
  }
  // 编辑器/宿主都在本机；loopback 来源一律允许，避免插件配置被 CORS 挡住。
  if (parsed.protocol === 'http:' && ['127.0.0.1', 'localhost', '::1', '[::1]'].includes(parsed.hostname)) {
    return parsed.origin
  }
  const ds = new URL(documentServer.baseUrl)
  const ports = new Set([ds.port, ''])
  const allowed = new Set()
  for (const host of [ds.hostname, '127.0.0.1', 'localhost']) {
    for (const port of ports) allowed.add(`${ds.protocol}//${host}${port ? `:${port}` : ''}`)
  }
  return allowed.has(parsed.origin) ? parsed.origin : null
}

function send(res, status, body, headers = {}) {
  const buffer = Buffer.isBuffer(body) ? body : Buffer.from(String(body))
  res.writeHead(status, {
    'content-length': String(buffer.length),
    'cache-control': 'no-store',
    ...headers,
  })
  res.end(buffer)
}

function json(res, status, data, extra = {}) {
  send(res, status, JSON.stringify(data), {
    'content-type': 'application/json; charset=utf-8',
    ...extra,
  })
}

function fail(message, status = 502) {
  const error = new Error(message)
  error.status = status
  return error
}

async function readBody(req, limit) {
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > limit) throw fail(`请求内容超过 ${Math.round(limit / 1024 / 1024)}MB 上限`, 413)
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
}

async function readJsonBody(req, limit = 256 * 1024) {
  const body = await readBody(req, limit)
  if (!body.length) return {}
  try {
    return JSON.parse(body.toString('utf8'))
  } catch {
    throw fail('请求内容不是合法 JSON', 422)
  }
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
  const response = await fetch(parsed, {
    signal: AbortSignal.timeout(30_000),
    cache: 'no-store',
    redirect: 'error',
  })
  if (!response.ok) throw fail(`下载保存结果失败：HTTP ${response.status}`, 502)
  const declared = Number(response.headers.get('content-length') || 0)
  if (declared > MAX_FILE_BYTES) throw fail('保存结果超过 150MB', 413)
  const buffer = Buffer.from(await response.arrayBuffer())
  if (buffer.length > MAX_FILE_BYTES) throw fail('保存结果超过 150MB', 413)
  return buffer
}

/**
 * 插件通过 GetFileToDownload 拿到“当前编辑状态”的下载地址（包含尚未 forcesave 的样式修改），
 * 由宿主代下载并原子写回。样式改动不会把 OnlyOffice 标记为已修改，forcesave 会返回 error:4，
 * 因此这条通道是样式修改落盘的唯一可靠方式。
 */
async function saveFromDownload(meta, urlText, documentServer, store) {
  let parsed
  try {
    parsed = new URL(urlText)
  } catch {
    throw fail('文档下载地址无效', 422)
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw fail('文档下载只允许 http/https', 422)
  if (!documentServer.allowedCallbackHost(parsed.hostname)) {
    throw fail(`文档下载的主机不受信任：${parsed.hostname}`, 403)
  }
  if (!parsed.pathname.startsWith('/cache/files/')) throw fail('文档下载地址不是文档服务缓存路径', 403)
  if (!parsed.pathname.includes(`/${meta.fileId}-v`)) throw fail('文档下载地址与当前文件不匹配', 403)
  const response = await fetch(parsed, {
    signal: AbortSignal.timeout(30_000),
    cache: 'no-store',
    redirect: 'error',
  })
  if (!response.ok) throw fail(`下载当前文档失败：HTTP ${response.status}`, 502)
  const declared = Number(response.headers.get('content-length') || 0)
  if (declared > MAX_FILE_BYTES) throw fail('文档超过 150MB', 413)
  const raw = Buffer.from(await response.arrayBuffer())
  if (raw.length > MAX_FILE_BYTES) throw fail('文档超过 150MB', 413)
  const buffer = NATIVE_SAVE.has(meta.ext) ? raw : await convertToOriginal(raw, meta.ext)
  if (buffer.length > MAX_FILE_BYTES) throw fail('文档超过 150MB', 413)
  const updated = await store.writeBack(meta.fileId, meta.token, buffer)
  meta.lastError = null
  return { ok: true, version: updated.version, sha256: updated.sha256 }
}

/**
 * OnlyOffice 的专用小服务：内容、保存回调，以及编辑器插件的选区/补丁通道。
 * 它挂在 Harness 鉴权之外，只监听环回地址，并要求每文件随机令牌；不暴露其他接口。
 */
export async function createContentServer({ store, documentServer, queue, host = '127.0.0.1' }) {
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://127.0.0.1')
      const origin = corsOrigin(req, documentServer)
      const cors = origin
        ? {
          'access-control-allow-origin': origin,
          'access-control-allow-methods': 'GET, POST, OPTIONS',
          'access-control-allow-headers': 'content-type',
          vary: 'Origin',
        }
        : {}

      if (req.method === 'OPTIONS') {
        send(res, 204, '', cors)
        return
      }

      if ((url.pathname === '/content' || url.pathname === `${API}/content`) && req.method === 'GET') {
        const fileId = url.searchParams.get('fileId') || ''
        const token = url.searchParams.get('token') || ''
        const { meta, buffer } = await store.readContent(fileId, token)
        if (buffer.length > MAX_FILE_BYTES) throw fail('文件超过 150MB，暂不支持', 413)
        send(res, 200, buffer, {
          'content-type': store.contentType(fileId, token),
          'content-disposition': `inline; filename*=UTF-8''${encodeURIComponent(meta.name)}`,
        })
        return
      }

      if ((url.pathname === '/callback' || url.pathname === `${API}/callback`) && req.method === 'POST') {
        const fileId = url.searchParams.get('fileId') || ''
        const token = url.searchParams.get('token') || ''
        const meta = store.get(fileId, token)
        const payload = await readJsonBody(req, MAX_CALLBACK_BYTES)
        const status = Number(payload?.status)
        if (status !== 2 && status !== 6) {
          json(res, 200, { error: 0 })
          return
        }
        if (!payload?.url) throw fail('保存回调缺少下载地址', 422)
        const buffer = await downloadCallback(payload.url, documentServer)
        const updated = await store.writeBack(fileId, token, buffer)
        meta.lastError = null
        json(res, 200, { error: 0, version: updated.version, sha256: updated.sha256 })
        return
      }

      if (url.pathname === `${API}/plugin-ready` && req.method === 'POST') {
        const body = await readJsonBody(req)
        store.getByPluginToken(body.fileId, body.pluginToken)
        store.markPluginReady(body.fileId)
        console.log('[office-co-creation] plugin-ready', String(body.fileId).slice(0, 8), body.editorType || '')
        json(res, 200, { ok: true }, cors)
        return
      }

      // OnlyOffice 插件加载规则（PoC 验证）：config 路径以 config.json 结尾，
      // 入口必须是单段相对名 index.html，才会解析到 config 所在目录；
      // 编辑器还会往入口 URL 追加 ?lang=...，因此参数内嵌在 index.html 里。
      const pluginParts = url.pathname.split('/')
      if (req.method === 'GET' && pluginParts.length === 5 && pluginParts[3] && /^[0-9a-f-]{36}$/i.test(pluginParts[3])) {
        const fileId = pluginParts[3]
        const asset = pluginParts[4]
        if (asset === 'config.json') {
          store.get(fileId)
          console.log('[office-co-creation] plugin-config request', fileId.slice(0, 8))
          json(res, 200, {
            name: 'OfficeCoCreation',
            guid: PLUGIN_GUID,
            version: '1.0.0',
            variations: [{
              description: '办公套件选区桥接',
              url: 'index.html',
              icons: ['icon.png'],
              isViewer: false,
              EditorsSupport: ['word', 'cell', 'slide'],
              isVisual: false,
              isModal: false,
              isInsideMode: false,
              initDataType: 'none',
              initOnSelectionChanged: true,
              buttons: [],
            }],
          }, cors)
          return
        }

        if (asset === 'index.html') {
          const meta = store.get(fileId)
          console.log('[office-co-creation] plugin-index request', fileId.slice(0, 8))
          const dsOrigin = documentServer.origin()
          const injected = JSON.stringify({
            fileId: meta.fileId,
            pluginToken: meta.pluginToken,
            fileType: meta.ext.slice(1),
            saveFileType: saveFileType(meta.ext),
          })
          send(res, 200, `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<title>办公套件选区桥接</title>
<script>window.__OCC__ = ${injected};</script>
<script src="${dsOrigin}/sdkjs-plugins/v1/plugins.js"></script>
<script src="${dsOrigin}/sdkjs-plugins/v1/plugins-ui.js"></script>
<script src="${API}/plugin.js"></script>
</head>
<body></body>
</html>`, { 'content-type': 'text/html; charset=utf-8', ...cors })
          return
        }

        if (asset === 'icon.png') {
          send(res, 200, ICON, { 'content-type': 'image/png', ...cors })
          return
        }
      }

      if (url.pathname === `${API}/plugin.js` && req.method === 'GET') {
        console.log('[office-co-creation] plugin.js request', (url.searchParams.get('fileId') || '').slice(0, 8))
        send(res, 200, await readFile(PLUGIN_FILE, 'utf8'), {
          'content-type': 'text/javascript; charset=utf-8',
          ...cors,
        })
        return
      }

      if (url.pathname === `${API}/selection`) {
        if (req.method === 'POST') {
          const body = await readJsonBody(req)
          store.getByPluginToken(body.fileId, body.pluginToken)
          store.setSelection(body.fileId, body)
          console.log('[office-co-creation] selection', String(body.fileId).slice(0, 8), body.kind || '', body.address || '', String(body.formula || body.text || '').slice(0, 80))
          json(res, 200, { ok: true }, cors)
          return
        }
        if (req.method === 'GET') {
          const fileId = url.searchParams.get('fileId') || ''
          const pluginToken = url.searchParams.get('pluginToken') || ''
          store.getByPluginToken(fileId, pluginToken)
          json(res, 200, store.selection(fileId) ?? {}, cors)
          return
        }
      }

      if (url.pathname === `${API}/patch` && req.method === 'GET') {
        if (!queue) throw fail('补丁队列不可用', 503)
        const fileId = url.searchParams.get('fileId') || ''
        const pluginToken = url.searchParams.get('pluginToken') || ''
        const patch = queue.next(fileId, pluginToken)
        if (!patch) {
          send(res, 204, '', cors)
          return
        }
        console.log('[office-co-creation] patch delivered', String(fileId).slice(0, 8), patch.id)
        json(res, 200, patch, cors)
        return
      }

      if (url.pathname === `${API}/save-download` && req.method === 'POST') {
        const body = await readJsonBody(req)
        const meta = store.getByPluginToken(body.fileId, body.pluginToken)
        if (typeof body.url !== 'string') throw fail('缺少文档下载地址', 400)
        const saved = await saveFromDownload(meta, body.url, documentServer, store)
        console.log('[office-co-creation] save-download', String(body.fileId).slice(0, 8), 'v' + saved.version)
        json(res, 200, saved, cors)
        return
      }

      if (url.pathname === `${API}/patch-ack` && req.method === 'POST') {
        if (!queue) throw fail('补丁队列不可用', 503)
        const body = await readJsonBody(req)
        if (typeof body.patchId !== 'string' || typeof body.fileId !== 'string') throw fail('缺少补丁标识', 400)
        queue.ack(body.patchId, body.pluginToken, body)
        console.log('[office-co-creation] patch ack', String(body.fileId).slice(0, 8), body.ok === true ? 'ok' : 'failed')
        json(res, 200, { ok: true }, cors)
        return
      }

      json(res, 404, { error: 'not found' })
    } catch (error) {
      const status = typeof error?.status === 'number' ? error.status : 500
      if (error?.status === undefined) console.error('[office-co-creation] content server error', error)
      try {
        json(res, status, { error: 1, message: error instanceof Error ? error.message : String(error) })
      } catch {
        res.destroy()
      }
    }
  })

  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, host, resolve)
  })
  const address = server.address()
  const port = typeof address === 'object' && address ? address.port : 0
  return {
    port,
    close: () => new Promise((resolve) => server.close(resolve)),
  }
}