function fail(message, status = 502) {
  const error = new Error(message)
  error.status = status
  return error
}

export class DocumentServer {
  constructor(baseUrl) {
    this.baseUrl = baseUrl.replace(/\/+$/, '')
  }

  origin() {
    return new URL(this.baseUrl).origin
  }

  async probe() {
    try {
      const response = await fetch(`${this.baseUrl}/healthcheck`, {
        signal: AbortSignal.timeout(2500),
        cache: 'no-store',
      })
      if (!response.ok) return false
      const text = (await response.text()).trim().toLowerCase()
      return text.includes('true') || text === 'ok' || text.includes('healthy')
    } catch {
      return false
    }
  }

  async forceSave(key) {
    if (typeof key !== 'string' || !key) throw fail('文档 key 无效', 400)
    let response
    try {
      response = await fetch(`${this.baseUrl}/coauthoring/CommandService.ashx`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ c: 'forcesave', key }),
        signal: AbortSignal.timeout(8000),
      })
    } catch (error) {
      throw fail(`无法连接 OnlyOffice Document Server：${error.message}`)
    }
    if (!response.ok) throw fail(`OnlyOffice 强制保存失败：HTTP ${response.status}`)
    let payload
    try {
      payload = await response.json()
    } catch {
      throw fail('OnlyOffice 强制保存返回了非 JSON 响应')
    }
    const code = Number(payload?.error)
    if (code === 0) return { ok: true, skipped: false }
    if (code === 4) return { ok: true, skipped: true }
    if (code === 3) throw fail('OnlyOffice 找不到该文档的编辑会话，可能已关闭。请重新打开文件。', 409)
    throw fail(`OnlyOffice 强制保存失败（错误码 ${Number.isFinite(code) ? code : '未知'}）`)
  }

  allowedCallbackHost(hostname) {
    const configured = new URL(this.baseUrl).hostname
    return new Set(['127.0.0.1', 'localhost', 'host.docker.internal', configured, '::1']).has(hostname)
  }
}