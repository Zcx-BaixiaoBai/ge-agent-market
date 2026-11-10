import { defineTool } from '@deepseek-ai/dsh-tools'
import { sanitizeCloudHtml } from './cloud-bridge.js'

const MAX_HTML = 300 * 1024
const MAX_TEXT = 1 * 1024 * 1024

function fail(message) {
  const error = new Error(message)
  error.status = 409
  return error
}

export function officeCloudApplyTool({ cloudQueue }) {
  return defineTool({
    name: 'office_cloud_apply',
    description: `把修改后的内容原地粘贴回用户当前选中的 WPS 云文档选区。只修改选中的内容，不要重写整篇云文档。
用户已经在内嵌 WPS 云文档里选中并复制了要修改的内容；工作台读取到了这份选区的 HTML 和纯文本。
html 必须是完整的替换片段（例如 <table>...</table> 或 <p>...</p> / <span>...</span>），保留原有结构和内联样式；不要返回 Markdown 代码块、解释文字或整篇文档。
粘贴后 WPS 会自动保存到云端，工作台会等待保存状态。`,
    parameters: {
      html: {
        type: 'string',
        required: true,
        description: '替换选区的完整 HTML 片段，保留原有样式。不要用 Markdown 代码块包裹。',
      },
      text: {
        type: 'string',
        description: '替换选区的纯文本，作为不支持 HTML 时的回退。',
      },
      note: {
        type: 'string',
        description: '一句话说明这次修改了什么，用于工作台过程提示。',
      },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          ok: { type: 'boolean', required: true },
          saved: { type: 'boolean' },
          note: { type: 'string' },
          warning: { type: 'string' },
        },
      },
      render: (_args, result) => [{ type: 'text', text: JSON.stringify(result) }],
    },
    timeoutMs: 30_000,
    isConcurrencySafe: () => false,
    presentCall: (args) => ({
      card: 'generic',
      kind: 'execute',
      title: '粘贴到 WPS 云文档选区',
      rawInput: args,
    }),
    async execute(args) {
      if (typeof args?.html !== 'string' || !args.html.trim()) throw fail('html 不能为空')
      if (args.html.length > MAX_HTML) throw fail('html 超过 300KB 上限')
      if (args.text !== undefined && typeof args.text !== 'string') throw fail('text 必须是字符串')
      if (typeof args.text === 'string' && args.text.length > MAX_TEXT) throw fail('text 超过 1MB 上限')
      const note = typeof args.note === 'string' ? args.note.trim().slice(0, 200) : ''
      const raw = args.html.trim()
      const unfenced = raw.startsWith('```')
        ? raw.replace(/^```[^\n]*\n?/, '').replace(/\n?```$/, '').trim()
        : raw
      if (!unfenced) throw fail('html 去掉代码块标记后为空')
      const clean = sanitizeCloudHtml(unfenced)
      const result = await cloudQueue.enqueue({ html: clean, text: args.text ?? '', note })
      if (!result.ok) throw fail(result.error || '云文档粘贴失败')
      return {
        ok: true,
        saved: result.saved === true,
        note,
        ...(result.saved ? {} : { warning: '已粘贴到云文档，但还没有看到云端保存完成；请稍后在 WPS 里确认。' }),
      }
    },
  })
}