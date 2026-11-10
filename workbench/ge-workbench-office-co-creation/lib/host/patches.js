import { randomUUID } from 'node:crypto'
import { defineTool } from '@deepseek-ai/dsh-tools'

const CELL_RANGE = /^[A-Z]{1,3}[1-9][0-9]{0,6}(?::[A-Z]{1,3}[1-9][0-9]{0,6})?$/
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/
const PATCH_TIMEOUT_MS = 45_000
const MAX_OPS = 20

const WORD_EXT = new Set(['.docx', '.doc', '.odt'])
const CELL_EXT = new Set(['.xlsx', '.xls', '.csv', '.ods'])
const SLIDE_EXT = new Set(['.pptx', '.ppt', '.odp'])

const WORD_ALIGN = new Set(['left', 'center', 'right', 'both', 'justify'])
const CELL_ALIGN_H = new Set(['left', 'center', 'right', 'justify'])
const CELL_ALIGN_V = new Set(['top', 'center', 'bottom'])
const HIGHLIGHT = new Set(['yellow', 'green', 'cyan', 'magenta', 'blue', 'red', 'darkBlue', 'darkCyan', 'darkGreen', 'darkMagenta', 'darkRed', 'darkGray', 'lightGray', 'black', 'white', 'none'])
const CELL_BORDER = new Set(['all', 'outline', 'inside', 'top', 'bottom', 'left', 'right', 'none'])
const BORDER_WEIGHT = new Set(['thin', 'medium', 'thick'])

function fail(message) {
  const error = new Error(message)
  error.status = 409
  return error
}

function publicPatch(patch) {
  return {
    id: patch.id,
    fileId: patch.fileId,
    address: patch.address ?? '',
    text: patch.text ?? '',
    hasText: patch.hasText === true,
    ops: patch.ops ?? [],
    expectedText: patch.expectedText ?? '',
    createdAt: patch.createdAt,
  }
}

function publicLast(patch) {
  if (!patch) return null
  return {
    id: patch.id,
    address: patch.address ?? '',
    status: patch.status,
    at: patch.at ?? patch.createdAt,
    error: patch.error ?? null,
    value: patch.value ?? null,
    textPreview: Array.isArray(patch.ops) && patch.ops.length
      ? `[样式] ${patch.ops.map((op) => op.op).join(', ')}`
      : typeof patch.text === 'string' ? patch.text.slice(0, 300) : '',
    downloadSaved: patch.downloadSaved === true,
    saveWarning: patch.saveWarning ?? null,
  }
}

function textValue(value, name, max) {
  if (value === undefined) return undefined
  if (typeof value !== 'string') throw fail(`${name} 必须是字符串`)
  const text = value.trim()
  if (!text) throw fail(`${name} 不能为空`)
  if (text.length > max) throw fail(`${name} 过长（上限 ${max} 字符）`)
  return text
}

function numberValue(value, name, min, max) {
  if (value === undefined) return undefined
  const number = Number(value)
  if (!Number.isFinite(number) || number < min || number > max) {
    throw fail(`${name} 必须是 ${min} 到 ${max} 之间的数字`)
  }
  return number
}

function booleanValue(value, name) {
  if (value === undefined) return undefined
  if (typeof value !== 'boolean') throw fail(`${name} 必须是布尔值`)
  return value
}

function colorValue(value, name) {
  if (value === undefined) return undefined
  if (typeof value !== 'string' || !HEX_COLOR.test(value)) throw fail(`${name} 必须是 #RRGGBB 颜色`)
  return value.toLowerCase()
}

function enumValue(value, name, allowed) {
  if (value === undefined) return undefined
  if (typeof value !== 'string' || !allowed.has(value)) {
    throw fail(`${name} 只能是：${[...allowed].join('、')}`)
  }
  return value
}

function normalizeTextOp(raw, index) {
  if (!raw || typeof raw !== 'object') throw fail(`第 ${index + 1} 个样式操作必须是对象`)
  const op = { op: 'formatText' }
  for (const key of ['bold', 'italic', 'underline', 'strikeout']) op[key] = booleanValue(raw[key], key)
  op.fontFamily = textValue(raw.fontFamily, 'fontFamily', 60)
  op.fontSize = numberValue(raw.fontSize, 'fontSize', 1, 200)
  op.color = colorValue(raw.color, 'color')
  op.highlight = enumValue(raw.highlight, 'highlight', HIGHLIGHT)
  op.align = enumValue(raw.align, 'align', WORD_ALIGN)
  op.lineSpacing = numberValue(raw.lineSpacing, 'lineSpacing', 0.5, 5)
  op.spaceBefore = numberValue(raw.spaceBefore, 'spaceBefore', 0, 200)
  op.spaceAfter = numberValue(raw.spaceAfter, 'spaceAfter', 0, 200)
  op.firstLineIndent = numberValue(raw.firstLineIndent, 'firstLineIndent', 0, 200)
  return op
}

function normalizeTableOp(raw, index) {
  if (!raw || typeof raw !== 'object') throw fail(`第 ${index + 1} 个样式操作必须是对象`)
  const op = { op: 'formatTable' }
  op.headerRow = booleanValue(raw.headerRow, 'headerRow')
  op.headerBold = booleanValue(raw.headerBold, 'headerBold')
  op.headerFill = colorValue(raw.headerFill, 'headerFill')
  op.headerColor = colorValue(raw.headerColor, 'headerColor')
  op.headerFontSize = numberValue(raw.headerFontSize, 'headerFontSize', 1, 200)
  op.headerAlign = enumValue(raw.headerAlign, 'headerAlign', WORD_ALIGN)
  op.fontFamily = textValue(raw.fontFamily, 'fontFamily', 60)
  op.fontSize = numberValue(raw.fontSize, 'fontSize', 1, 200)
  op.color = colorValue(raw.color, 'color')
  op.zebraFill = colorValue(raw.zebraFill, 'zebraFill')
  op.borderColor = colorValue(raw.borderColor, 'borderColor')
  op.borderSize = numberValue(raw.borderSize, 'borderSize', 1, 24)
  op.align = enumValue(raw.align, 'align', WORD_ALIGN)
  op.valign = enumValue(raw.valign, 'valign', CELL_ALIGN_V)
  op.tableAlign = enumValue(raw.tableAlign, 'tableAlign', new Set(['left', 'center', 'right']))
  op.tableIndex = numberValue(raw.tableIndex, 'tableIndex', 0, 50)
  if (op.tableIndex !== undefined && !Number.isInteger(op.tableIndex)) throw fail('tableIndex 必须是整数')
  op.matchText = textValue(raw.matchText, 'matchText', 120)
  return op
}

function normalizeRangeOp(raw, index) {
  if (!raw || typeof raw !== 'object') throw fail(`第 ${index + 1} 个样式操作必须是对象`)
  const op = { op: 'formatRange' }
  if (raw.range !== undefined) {
    const range = textValue(raw.range, 'range', 40).toUpperCase()
    if (!CELL_RANGE.test(range)) throw fail('range 格式无效，例如 A1:G9')
    op.range = range
  }
  for (const key of ['bold', 'italic', 'underline', 'strikeout', 'wrap', 'merge']) op[key] = booleanValue(raw[key], key)
  op.fontName = textValue(raw.fontName, 'fontName', 60)
  op.fontSize = numberValue(raw.fontSize, 'fontSize', 1, 200)
  op.fontColor = colorValue(raw.fontColor, 'fontColor')
  op.fillColor = colorValue(raw.fillColor, 'fillColor')
  op.hAlign = enumValue(raw.hAlign, 'hAlign', CELL_ALIGN_H)
  op.vAlign = enumValue(raw.vAlign, 'vAlign', CELL_ALIGN_V)
  op.numberFormat = textValue(raw.numberFormat, 'numberFormat', 40)
  op.border = enumValue(raw.border, 'border', CELL_BORDER)
  op.borderColor = colorValue(raw.borderColor, 'borderColor')
  op.borderWeight = enumValue(raw.borderWeight, 'borderWeight', BORDER_WEIGHT)
  op.columnWidth = numberValue(raw.columnWidth, 'columnWidth', 1, 255)
  op.rowHeight = numberValue(raw.rowHeight, 'rowHeight', 1, 409)
  return op
}

function normalizeOps(raw) {
  if (raw === undefined) return []
  if (!Array.isArray(raw)) throw fail('ops 必须是数组')
  if (raw.length > MAX_OPS) throw fail(`一次最多 ${MAX_OPS} 个样式操作`)
  return raw.map((item, index) => {
    const op = item?.op
    if (op === 'formatText') return normalizeTextOp(item, index)
    if (op === 'formatTable') return normalizeTableOp(item, index)
    if (op === 'formatRange') return normalizeRangeOp(item, index)
    throw fail(`第 ${index + 1} 个样式操作类型无效：${String(op)}。可用 formatText、formatTable、formatRange`)
  })
}

export class PatchQueue {
  constructor({ store, documentServer }) {
    this.store = store
    this.documentServer = documentServer
    this.queues = new Map()
    this.pending = new Map()
    this.last = new Map()
  }

  enqueue({ fileId, address, text, expectedText, ops }) {
    const patch = {
      id: randomUUID(),
      fileId,
      address: address || '',
      text: typeof text === 'string' ? text : '',
      hasText: typeof text === 'string',
      expectedText: expectedText || '',
      ops: Array.isArray(ops) ? ops : [],
      createdAt: Date.now(),
      status: 'queued',
    }
    const queue = this.queues.get(fileId) ?? []
    queue.push(patch)
    this.queues.set(fileId, queue)
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(patch.id)
        patch.status = 'timeout'
        patch.at = Date.now()
        this.last.set(fileId, patch)
        reject(fail('等待编辑器应用修改超时。请确认 Office 编辑器仍处于打开状态后重试。'))
      }, PATCH_TIMEOUT_MS)
      this.pending.set(patch.id, { patch, resolve, reject, timer })
    })
  }

  next(fileId, pluginToken) {
    this.store.getByPluginToken(fileId, pluginToken)
    const queue = this.queues.get(fileId) ?? []
    const patch = queue.shift()
    if (!patch) return null
    patch.status = 'delivered'
    patch.deliveredAt = Date.now()
    return publicPatch(patch)
  }

  ack(patchId, pluginToken, payload) {
    const pending = this.pending.get(patchId)
    if (!pending) throw fail('补丁不存在或已处理')
    const meta = this.store.getByPluginToken(pending.patch.fileId, pluginToken)
    clearTimeout(pending.timer)
    this.pending.delete(patchId)
    const patch = pending.patch
    patch.status = payload?.ok === true ? 'applied' : 'failed'
    patch.at = Date.now()
    patch.error = payload?.ok === true ? null : String(payload?.error || '编辑器未能应用修改')
    patch.value = payload?.value ?? null
    patch.downloadSaved = payload?.saved === true
    patch.saveWarning = payload?.warning ? String(payload.warning).slice(0, 300) : null
    if (payload?.address) patch.address = String(payload.address).slice(0, 80)
    this.last.set(patch.fileId, patch)
    if (payload?.ok === true) {
      pending.resolve({
        ok: true,
        file_id: patch.fileId,
        patch_id: patch.id,
        address: patch.address,
        value: patch.value,
        file_name: meta.name,
        version: meta.version,
        saved: patch.downloadSaved,
        ...(patch.saveWarning ? { warning: patch.saveWarning } : {}),
      })
    } else {
      pending.reject(fail(patch.error))
    }
  }

  lastFor(fileId) {
    return publicLast(this.last.get(fileId))
  }
}

const OPS_REFERENCE = `ops 样式操作（要求美化、排版、字体、颜色、边框、对齐、字号、列宽、填充、隔行变色时使用；未提供的字段保持不变）：
- {"op":"formatText","bold":true,"italic":false,"underline":false,"strikeout":false,"fontFamily":"微软雅黑","fontSize":12,"color":"#333333","highlight":"yellow","align":"center","lineSpacing":1.5,"spaceBefore":6,"spaceAfter":6} 作用于 Word 当前选区；align 可用 left/center/right/both。
- {"op":"formatTable","headerRow":true,"headerFill":"#c6a15b","headerColor":"#ffffff","headerBold":true,"headerFontSize":10.5,"fontFamily":"微软雅黑","fontSize":10.5,"color":"#333333","zebraFill":"#fbf6e9","borderColor":"#d8d8d8","borderSize":4,"align":"center","headerAlign":"center","valign":"center","tableAlign":"center","tableIndex":0} 美化 Word 表格。默认作用于当前光标所在表格；如果选区不在表格里，用 tableIndex（第一张表为 0）或 matchText（表格内任意单元格文字）定位。
- {"op":"formatRange","range":"A1:G9","bold":true,"fontName":"微软雅黑","fontSize":11,"fontColor":"#333333","fillColor":"#fff2cc","hAlign":"center","vAlign":"center","wrap":true,"numberFormat":"0.00","border":"all","borderColor":"#c8c8c8","borderWeight":"thin","columnWidth":18,"rowHeight":24} 设置 Excel 区域样式，range 省略时用当前选区。
多个 ops 按顺序执行；可以与 text 同时传（先替换文本再套样式）。`

export function officeApplyPatchTool({ queue, store }) {
  return defineTool({
    name: 'office_apply_patch',
    description: `把内容或样式写回用户在「办公套件」工作台选中的区域。只修改选中区域，不要重写整篇文档。用户要求改格式（美化表格、加粗、换字体、配色、边框、对齐、字号、列宽、填充）时必须使用 ops，不要说无法修改样式。Excel 选区用 address 指定单元格或区域；Word/PPT 省略 address。必须先由用户在编辑器中选中内容，并保持编辑器打开。

${OPS_REFERENCE}`,
    parameters: {
      file_id: {
        type: 'string',
        required: true,
        description: '办公套件工作台提供的文件 ID，来自用户消息中的 file_id。',
      },
      text: {
        type: 'string',
        description: '替换后的完整内容。修改 Excel 公式时以 = 开头；清空选区时传空字符串。只改样式时省略。',
      },
      ops: {
        type: 'array',
        description: '样式操作数组，见工具说明中的 ops 参考。只改样式时必须提供。',
      },
      address: {
        type: 'string',
        description: 'Excel 单元格或区域地址，例如 D3 或 A1:B2。Word/PPT 不要传。',
      },
      expected_text: {
        type: 'string',
        description: '用户选中时的原文或原值。提供后，编辑器会先校验选区是否变化，避免改错位置。',
      },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          ok: { type: 'boolean', required: true },
          file_id: { type: 'string', required: true },
          patch_id: { type: 'string', required: true },
          address: { type: 'string' },
          value: { type: 'string' },
          file_name: { type: 'string', required: true },
          version: { type: 'number', required: true },
          saved: { type: 'boolean' },
          warning: { type: 'string' },
        },
      },
      render: (_args, result) => [{ type: 'text', text: JSON.stringify(result) }],
    },
    timeoutMs: 60_000,
    isConcurrencySafe: () => false,
    presentCall: (args) => ({
      card: 'generic',
      kind: 'execute',
      title: Array.isArray(args.ops) && args.ops.length ? '修改 Office 选区样式' : '修改 Office 选区',
      rawInput: args,
    }),
    async execute(args, exec) {
      const meta = store.get(args.file_id)
      // 文件已由工作台授权登记，不再要求会话工作区与文件目录一致。
      const hasText = args.text !== undefined
      if (hasText && typeof args.text !== 'string') throw fail('text 必须是字符串')
      if (hasText && args.text.length > 100_000) throw fail('替换内容过长（上限 100000 字符）')
      const ops = normalizeOps(args.ops)
      if (!hasText && !ops.length) throw fail('text 和 ops 至少提供一个')
      const address = typeof args.address === 'string' ? args.address.trim().toUpperCase() : ''
      if (address && !CELL_RANGE.test(address)) throw fail('单元格地址格式无效，例如 D3 或 A1:B2')
      if (address && !CELL_EXT.has(meta.ext)) throw fail('只有 Excel 类文件需要 address；Word/PPT 请省略')

      if (CELL_EXT.has(meta.ext)) {
        if (!address && !ops.some((op) => op.op === 'formatRange' && op.range)) {
          throw fail('修改 Excel 时必须提供单元格或区域地址')
        }
      } else if (WORD_EXT.has(meta.ext)) {
        for (const op of ops) {
          if (op.op === 'formatRange') throw fail('formatRange 只用于 Excel；Word 请用 formatText 或 formatTable')
        }
      } else if (SLIDE_EXT.has(meta.ext)) {
        if (ops.length) throw fail('当前版本只支持 Word 和 Excel 的样式修改；PPT 请先用 text 替换内容')
      } else {
        throw fail('不支持的文件格式')
      }

      await store.backup(meta.fileId, meta.token, 'agent')
      return queue.enqueue({
        fileId: meta.fileId,
        address,
        text: hasText ? args.text : '',
        expectedText: typeof args.expected_text === 'string' ? args.expected_text.slice(0, 4000) : '',
        ops,
      })
    },
  })
}