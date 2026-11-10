const DEFAULT_TIMEOUT_MS = 25_000

export class CloudPatchQueue {
  constructor({ timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
    this.timeoutMs = timeoutMs
    this.pending = null
    this.waiters = new Map()
    this.seq = 0
  }

  enqueue({ html, text = '', note = '' }) {
    const id = `cloud-${Date.now()}-${++this.seq}`
    const patch = { id, html, text, note, at: Date.now(), delivered: false }
    this.pending = patch
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        this.waiters.delete(id)
        if (this.pending?.id === id) this.pending = null
        resolve({ ok: false, error: '等待工作台粘贴云文档超时' })
      }, this.timeoutMs)
      this.waiters.set(id, { resolve, timer })
    })
  }

  next() {
    if (!this.pending || this.pending.delivered) return null
    this.pending.delivered = true
    return this.pending
  }

  ack(id, result) {
    const waiter = this.waiters.get(id)
    if (!waiter) return false
    clearTimeout(waiter.timer)
    this.waiters.delete(id)
    if (this.pending?.id === id) this.pending = null
    waiter.resolve({
      ok: result?.ok === true,
      saved: result?.saved === true,
      error: typeof result?.error === 'string' ? result.error : '',
    })
    return true
  }

  cancel(error = '云文档修改已取消') {
    if (!this.pending) return
    this.ack(this.pending.id, { ok: false, error })
  }
}