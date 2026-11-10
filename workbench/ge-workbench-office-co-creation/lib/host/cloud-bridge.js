import { execFile } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { connect } from 'node:net'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

const RPC_TIMEOUT_MS = 20_000
const SAVE_WAIT_MS = 6_000
const CHUNK_CHARS = 4_000
const MAX_HTML_BYTES = 300 * 1024
const MAX_TEXT_BYTES = 1 * 1024 * 1024

const CLIPBOARD_SCRIPT = `ObjC.import('AppKit');
const pb = $.NSPasteboard.generalPasteboard;
const html = pb.stringForType($.NSPasteboardTypeHTML);
const text = pb.stringForType($.NSPasteboardTypeString);
JSON.stringify({
  html: html ? ObjC.unwrap(html) : '',
  text: text ? ObjC.unwrap(text) : ''
});`

const SAVE_STATE_EXPRESSION = `(() => {
  const saved = document.querySelector('[class*="icon-save_success"]');
  const pending = document.querySelector('[class*="icon-saving"], [class*="icon-save_loading"], [class*="icon-save_fail"]');
  return {
    saved: Boolean(saved),
    pending: Boolean(pending),
    cls: pending ? pending.className : (saved ? saved.className : '')
  };
})()`

function fail(message, status = 400) {
  const error = new Error(message)
  error.status = status
  return error
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function isWpsCloudUrl(raw) {
  let url
  try {
    url = new URL(String(raw))
  } catch {
    return false
  }
  if (url.protocol !== 'https:') return false
  const host = url.hostname.toLowerCase()
  return host === 'kdocs.cn' || host.endsWith('.kdocs.cn')
    || host === 'wps.cn' || host.endsWith('.wps.cn')
    || host === 'wps.com' || host.endsWith('.wps.com')
}

function wpsDocKey(raw) {
  try {
    const url = new URL(String(raw))
    const match = url.pathname.match(/\/l\/([A-Za-z0-9_-]+)/)
    return match ? match[1] : `${url.hostname}${url.pathname}`
  } catch {
    return ''
  }
}

export function sanitizeCloudHtml(input) {
  if (typeof input !== 'string') throw fail('html 必须是字符串')
  if (input.length > MAX_HTML_BYTES) throw fail('修改内容超过 300KB 上限', 413)
  let html = input
  html = html.replace(/<!DOCTYPE[^>]*>/gi, '')
  html = html.replace(/<!ENTITY[\s\S]*?>/gi, '')
  const fragmentStart = html.indexOf('<!--StartFragment-->')
  const fragmentEnd = html.indexOf('<!--EndFragment-->')
  if (fragmentStart >= 0 && fragmentEnd > fragmentStart) {
    html = html.slice(fragmentStart + '<!--StartFragment-->'.length, fragmentEnd)
  }
  html = html.replace(/<!--[\s\S]*?-->/g, '')
  html = html.replace(/<xml\b[\s\S]*?<\/xml>/gi, '')
  html = html.replace(/<o:p\b[^>]*>[\s\S]*?<\/o:p>/gi, '')
  html = html.replace(/<o:p\b[^>]*\/?>/gi, '')
  html = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
  html = html.replace(/<script\b[^>]*\/?>/gi, '')
  html = html.replace(/<(iframe|object|embed|form|input|button|textarea|select|link|base)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
  html = html.replace(/<\/?(iframe|object|embed|form|input|button|textarea|select|link|base)\b[^>]*>/gi, '')
  html = html.replace(/<meta\b[^>]*http-equiv\s*=\s*["']?refresh["']?[^>]*>/gi, '')
  html = html.replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
  html = html.replace(/(href|src)\s*=\s*("|')\s*javascript:[^"']*\2/gi, '$1=$2#$2')
  html = html.replace(/(href|src)\s*=\s*javascript:[^\s>]*/gi, '$1="#"')
  return html.trim()
}

export function buildChunkExpression(chunk) {
  return `window.__occCloudPaste.push(${JSON.stringify(String(chunk ?? ''))}); window.__occCloudPaste.length`
}

export function buildPasteExpression(fallbackText = '') {
  return `(() => {
  const html = window.__occCloudPaste.join('');
  window.__occCloudPaste = null;
  const holder = document.createElement('div');
  holder.innerHTML = html;
  const text = holder.textContent || ${JSON.stringify(String(fallbackText ?? '').slice(0, 1000))};
  const data = new DataTransfer();
  data.setData('text/html', html);
  data.setData('text/plain', text);
  const event = new ClipboardEvent('paste', {
    clipboardData: data,
    bubbles: true,
    cancelable: true,
    composed: true
  });
  const candidates = [
    document.querySelector('#et_select_grid'),
    document.querySelector('[contenteditable="true"]'),
    document.activeElement,
    document.body
  ];
  const target = candidates.find((item) => item && typeof item.dispatchEvent === 'function');
  if (!target) return { ok: false, error: 'no_target' };
  target.dispatchEvent(event);
  return { ok: event.defaultPrevented, target: target.id || target.className || target.tagName };
})()`
}

export function parseClipboardPayload(stdout) {
  const parsed = JSON.parse(String(stdout || '{}'))
  const html = typeof parsed.html === 'string' ? parsed.html : ''
  const text = typeof parsed.text === 'string' ? parsed.text : ''
  return { html, text }
}

export function isWpsClipboardHtml(html) {
  return typeof html === 'string' && html.length > 0
    && (html.includes('ksdocclipboard') || html.includes('srcRange'))
}

function discoveryPath() {
  const home = process.env.DSH_HOME
    || join(homedir(), 'Library/Application Support/dsh-desktop/harness')
  return join(home, 'browser-control.json')
}

function selectionSummary(selection) {
  if (!selection) return null
  return {
    at: selection.at,
    text: selection.text.slice(0, 800),
    textLength: selection.text.length,
    htmlLength: selection.html.length,
  }
}

function lastPasteSummary(lastPaste) {
  if (!lastPaste) return null
  return { at: lastPaste.at, saved: lastPaste.saved === true, target: lastPaste.target ?? '' }
}

export class CloudBridge {
  constructor() {
    this.session = null
  }

  async rpc(operation) {
    let discovery
    try {
      discovery = JSON.parse(await readFile(discoveryPath(), 'utf8'))
    } catch {
      throw fail('当前宿主没有启用侧边浏览器控制接口', 501)
    }
    if (discovery?.protocolVersion !== 1 || typeof discovery.socketPath !== 'string' || typeof discovery.token !== 'string') {
      throw fail('侧边浏览器控制接口不可用', 501)
    }
    return await new Promise((resolve, reject) => {
      const socket = connect(discovery.socketPath)
      let buffer = ''
      let settled = false
      const finish = (error, value) => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        socket.destroy()
        if (error) reject(error)
        else resolve(value)
      }
      const timer = setTimeout(() => finish(new Error('浏览器控制请求超时')), RPC_TIMEOUT_MS)
      socket.setEncoding('utf8')
      socket.setNoDelay(true)
      socket.on('data', (chunk) => {
        buffer += chunk
        let index
        while ((index = buffer.indexOf('\n')) !== -1) {
          const line = buffer.slice(0, index)
          buffer = buffer.slice(index + 1)
          if (!line.trim()) continue
          let frame
          try { frame = JSON.parse(line) } catch { continue }
          if (frame.id !== 1) continue
          if (frame.ok === false) {
            finish(fail(frame.error?.message || '浏览器控制调用失败', 502))
          } else {
            finish(null, frame)
          }
        }
      })
      socket.on('error', (error) => finish(error))
      socket.on('close', () => {
        if (!settled) finish(new Error('浏览器控制连接已关闭'))
      })
      socket.on('connect', () => {
        socket.write(`${JSON.stringify({ op: 'auth', token: discovery.token })}\n`)
        socket.write(`${JSON.stringify({ ...operation, id: 1 })}\n`)
      })
    })
  }

  async open(url) {
    if (!isWpsCloudUrl(url)) {
      throw fail('只支持 WPS 云文档链接（kdocs.cn / wps.cn）', 422)
    }
    const targetKey = wpsDocKey(url)
    let response = null
    try {
      response = await this.rpc({ op: 'open', url: String(url) })
    } catch (error) {
      // 未登录时 WPS 会跳到 account.wps.cn，导航可能以 ERR_ABORTED 结束；
      // 标签页通常已经创建，继续用 list 找回它，让用户在侧边栏完成登录。
      const list = await this.rpc({ op: 'list' }).catch(() => null)
      const tabs = Array.isArray(list?.tabs) ? list.tabs : []
      const tab = tabs.find((item) => wpsDocKey(item.url) === targetKey)
        || tabs.find((item) => /account\.wps\.cn/i.test(item.url || ''))
        || tabs[tabs.length - 1]
      if (!tab?.id) throw error
      response = { tabId: tab.id, url: tab.url || String(url) }
    }
    let tabId = typeof response.tabId === 'string' ? response.tabId : (typeof response.tabId === 'number' ? String(response.tabId) : '')
    if (!tabId) {
      for (let attempt = 0; attempt < 10 && !tabId; attempt += 1) {
        await delay(300)
        const list = await this.rpc({ op: 'list' })
        const tabs = Array.isArray(list.tabs) ? list.tabs : []
        const tab = tabs.find((item) => wpsDocKey(item.url) === targetKey)
        if (tab?.id) tabId = String(tab.id)
      }
    }
    if (!tabId) throw fail('云文档标签页没有创建成功', 502)
    this.session = {
      tabId,
      targetUrl: String(url),
      targetKey,
      url: response.url || String(url),
      title: '',
      connected: false,
      selection: null,
      lastPaste: null,
    }
    return this.state()
  }

  async state() {
    if (!this.session) {
      return { open: false, connected: false, selection: null, lastPaste: null }
    }
    let tabs
    try {
      const response = await this.rpc({ op: 'list' })
      tabs = Array.isArray(response.tabs) ? response.tabs : []
    } catch (error) {
      return {
        open: true,
        connected: false,
        tabId: this.session.tabId,
        url: this.session.url,
        targetUrl: this.session.targetUrl,
        title: this.session.title,
        error: error.message,
        selection: selectionSummary(this.session.selection),
        lastPaste: lastPasteSummary(this.session.lastPaste),
      }
    }
    const targetKey = this.session.targetKey || wpsDocKey(this.session.targetUrl || this.session.url)
    const byKey = tabs.find((item) => wpsDocKey(item.url) === targetKey)
    const byId = tabs.find((item) => String(item.id) === String(this.session.tabId))
    const tab = byKey || byId
    if (!tab) {
      this.session.connected = false
      return {
        open: true,
        connected: false,
        tabId: this.session.tabId,
        url: this.session.url,
        targetUrl: this.session.targetUrl,
        title: this.session.title,
        selection: selectionSummary(this.session.selection),
        lastPaste: lastPasteSummary(this.session.lastPaste),
      }
    }
    const currentUrl = tab.url || ''
    const onTarget = wpsDocKey(currentUrl) === targetKey
    this.session.tabId = tab.id
    this.session.url = currentUrl
    this.session.title = tab.title || ''
    this.session.connected = onTarget
    return {
      open: true,
      connected: onTarget,
      loginRequired: !onTarget && /account\.wps\.cn|passport|login/i.test(currentUrl),
      wrongDocument: !onTarget && !/account\.wps\.cn|passport|login/i.test(currentUrl),
      tabId: tab.id,
      url: currentUrl,
      targetUrl: this.session.targetUrl,
      title: this.session.title,
      selection: selectionSummary(this.session.selection),
      lastPaste: lastPasteSummary(this.session.lastPaste),
    }
  }

  async readClipboard() {
    if (!this.session) throw fail('请先打开 WPS 云文档', 409)
    if (process.platform !== 'darwin') throw fail('云文档剪贴板读取暂只支持 macOS', 501)
    let stdout
    try {
      const result = await execFileAsync(
        'osascript',
        ['-l', 'JavaScript', '-e', CLIPBOARD_SCRIPT],
        { timeout: 6_000, maxBuffer: 4 * 1024 * 1024 },
      )
      stdout = result.stdout
    } catch (error) {
      throw fail(`读取系统剪贴板失败：${error.message}`, 502)
    }
    const { html, text } = parseClipboardPayload(stdout)
    if (!html) return { ok: false, reason: 'no-html' }
    if (!isWpsClipboardHtml(html)) return { ok: false, reason: 'not-wps' }
    const at = Date.now()
    const styles = (html.match(/<style\b[^>]*>[\s\S]*?<\/style>/gi) || []).join('\n')
    this.session.selection = {
      html: html.slice(0, MAX_HTML_BYTES),
      text: text.slice(0, MAX_TEXT_BYTES),
      styles,
      at,
    }
    return {
      ok: true,
      at,
      html: this.session.selection.html,
      text: this.session.selection.text,
      htmlLength: this.session.selection.html.length,
      textLength: this.session.selection.text.length,
    }
  }

  async dispatch(html, text) {
    if (!this.session) throw fail('请先打开 WPS 云文档', 409)
    const clean = sanitizeCloudHtml(html)
    if (!clean) throw fail('修改内容为空', 422)
    const styles = this.session?.selection?.styles || ''
    const styled = styles && !/<style\b/i.test(clean) ? `${styles}\n${clean}` : clean
    const plain = String(text || '').slice(0, MAX_TEXT_BYTES)
    const state = await this.state()
    if (!state.connected) throw fail('WPS 云文档标签页已关闭，请重新打开', 409)
    await this.rpc({
      op: 'execute',
      tabId: this.session.tabId,
      command: { method: 'evaluate', expression: 'window.__occCloudPaste = []; 0' },
    })
    for (let offset = 0; offset < styled.length; offset += CHUNK_CHARS) {
      await this.rpc({
        op: 'execute',
        tabId: this.session.tabId,
        command: {
          method: 'evaluate',
          expression: buildChunkExpression(styled.slice(offset, offset + CHUNK_CHARS)),
        },
      })
    }
    const response = await this.rpc({
      op: 'execute',
      tabId: this.session.tabId,
      command: {
        method: 'evaluate',
        expression: buildPasteExpression(plain),
      },
    })
    const value = response.value && typeof response.value === 'object' ? response.value : {}
    if (!value.ok) {
      throw fail('WPS 没有接受这次粘贴（选区可能已失效，请在云文档中重新选中）', 502)
    }
    const saved = await this.waitForSave()
    return { ok: true, saved, at: Date.now(), target: String(value.target || '') }
  }

  async paste(html, text) {
    const previous = this.session?.selection ?? null
    const result = await this.dispatch(html, text)
    if (this.session) {
      this.session.lastPaste = {
        at: result.at,
        saved: result.saved,
        target: result.target,
        previous,
      }
    }
    return result
  }

  async restore() {
    const previous = this.session?.lastPaste?.previous
    if (!previous) throw fail('没有可撤销的云文档修改', 404)
    const result = await this.dispatch(previous.html, previous.text)
    if (this.session) {
      this.session.lastPaste = null
      this.session.selection = previous
    }
    return result
  }

  async waitForSave() {
    await delay(600)
    const deadline = Date.now() + SAVE_WAIT_MS
    let last = null
    while (Date.now() < deadline) {
      try {
        const response = await this.rpc({
          op: 'execute',
          tabId: this.session.tabId,
          command: { method: 'evaluate', expression: SAVE_STATE_EXPRESSION },
        })
        last = response.value && typeof response.value === 'object' ? response.value : null
        if (last?.saved) return true
      } catch {
        return false
      }
      await delay(350)
    }
    return last?.saved === true
  }
}

export const cloudInternals = {
  CLIPBOARD_SCRIPT,
  SAVE_STATE_EXPRESSION,
  discoveryPath,
  wpsDocKey,
}