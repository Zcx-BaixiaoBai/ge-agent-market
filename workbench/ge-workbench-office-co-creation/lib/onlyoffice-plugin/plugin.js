/* 办公套件 · OnlyOffice 选区桥接插件
 *
 * 运行在 OnlyOffice 插件 iframe 中（与工作台同源）。职责：
 * 1. 把当前选区报告给工作台；
 * 2. 轮询工作台下发的补丁；
 * 3. 通过 PasteText 写回文本，或通过 callCommand 应用样式操作（字体、颜色、边框、对齐、表格美化）。
 */
/* global Asc */
(function () {
  // OnlyOffice 编辑器会把自己追加的 ?lang=... 直接拼在插件入口 URL 后面，
  // 因此 file 参数必须放在路径段里：/api/office-co-creation/plugin-index/<fileId>/<pluginToken>
  function pluginParams() {
    if (globalThis.__OCC__ && globalThis.__OCC__.fileId) {
      return { fileId: globalThis.__OCC__.fileId, pluginToken: globalThis.__OCC__.pluginToken || '' }
    }
    const search = new URLSearchParams(location.search)
    const fromSearch = search.get('fileId')
    if (fromSearch) return { fileId: fromSearch, pluginToken: search.get('pluginToken') || '' }
    const parts = location.pathname.split('/')
    if (parts[3] === 'plugin-index' && parts[4]) {
      return { fileId: decodeURIComponent(parts[4]), pluginToken: decodeURIComponent(parts[5] || '') }
    }
    return { fileId: '', pluginToken: '' }
  }
  const { fileId, pluginToken } = pluginParams()
  const API = '/api/office-co-creation'
  let busy = false
  let lastSelectionSignature = ''

  const request = async (path, options = {}) => {
    const response = await fetch(API + path, {
      cache: 'no-store',
      ...options,
      headers: { 'content-type': 'application/json', ...(options.headers || {}) },
    })
    if (response.status === 204) return null
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data.error || `请求失败（${response.status}）`)
    return data
  }

  const reportSelection = async (selection) => {
    const signature = JSON.stringify(selection)
    if (signature === lastSelectionSignature) return
    lastSelectionSignature = signature
    try {
      await request('/selection', {
        method: 'POST',
        body: JSON.stringify({ fileId, pluginToken, ...selection }),
      })
    } catch (error) {
      console.error('[办公套件] 选区上报失败', error)
    }
  }

  const readCellSelection = () => {
    Asc.plugin.callCommand(function () {
      const sheet = Api.GetActiveSheet()
      const selection = sheet.GetSelection()
      const address = String(selection.GetAddress() || '')
      let value = selection.GetValue()
      if (Array.isArray(value) || (value && typeof value === 'object')) value = null
      let text = String(selection.GetText() || '')
      if (text.length > 2000) text = text.slice(0, 2000)
      let formula = ''
      try {
        if (typeof selection.GetFormula === 'function') formula = String(selection.GetFormula() || '')
      } catch {
        formula = ''
      }
      if (formula.length > 2000) formula = formula.slice(0, 2000)
      return { kind: 'cell', sheet: sheet.GetName(), address, value, text, formula }
    }, false, false, (result) => {
      if (result) reportSelection(result)
    })
  }

  const readTextSelection = (kind) => {
    try {
      Asc.plugin.executeMethod('GetSelectedText', [], (text) => {
        const value = String(text || '')
        reportSelection({ kind, text: value.slice(0, 2000), value: value.slice(0, 2000) })
      })
    } catch (error) {
      console.error('[办公套件] 读取选区失败', error)
    }
  }

  const readSelection = () => {
    const type = Asc.plugin.info.editorType
    if (type === 'cell') readCellSelection()
    else if (type === 'word') readTextSelection('word')
    else if (type === 'slide') readTextSelection('slide')
  }

  const ack = async (patch, payload) => {
    busy = false
    try {
      await request('/patch-ack', {
        method: 'POST',
        body: JSON.stringify({ fileId, pluginToken, patchId: patch.id, ...payload }),
      })
    } catch (error) {
      console.error('[办公套件] 补丁回执失败', error)
    }
    readSelection()
  }

  const selectRange = (address) => new Promise((resolve) => {
    Asc.scope.officePatch = { address }
    Asc.plugin.callCommand(function () {
      const sheet = Api.GetActiveSheet()
      sheet.GetRange(Asc.scope.officePatch.address).Select()
      return String(sheet.GetSelection().GetAddress() || '')
    }, false, false, (result) => resolve(result || ''))
  })

  const currentText = () => new Promise((resolve) => {
    if (Asc.plugin.info.editorType === 'cell') {
      Asc.plugin.callCommand(function () {
        const selection = Api.GetActiveSheet().GetSelection()
        let value = selection.GetValue()
        if (Array.isArray(value) || (value && typeof value === 'object')) value = null
        let formula = ''
        try {
          if (typeof selection.GetFormula === 'function') formula = String(selection.GetFormula() || '')
        } catch {
          formula = ''
        }
        return { text: String(selection.GetText() || ''), value: value == null ? null : String(value), formula, address: String(selection.GetAddress() || '') }
      }, false, false, (result) => resolve(result || { text: '', value: null, formula: '', address: '' }))
      return
    }
    try {
      Asc.plugin.executeMethod('GetSelectedText', [], (text) => {
        const value = String(text || '')
        resolve({ text: value, value, address: '' })
      })
    } catch {
      resolve({ text: '', value: null, address: '' })
    }
  })

  const matchesExpected = (current, expected) => {
    if (!expected) return true
    const candidates = [current.text, current.value, current.formula].filter((item) => typeof item === 'string')
    return candidates.some((item) => item.trim() === expected.trim())
  }

  const applyOps = (patch) => new Promise((resolve) => {
    Asc.scope.occOps = patch.ops
    Asc.scope.occExpected = patch.expectedText || ''
    Asc.scope.occEditor = Asc.plugin.info.editorType
    Asc.plugin.callCommand(function () {
      const ops = Asc.scope.occOps || []
      const expected = Asc.scope.occExpected || ''
      const editor = Asc.scope.occEditor
      const result = { applied: 0, warnings: [] }

      const rgb = (hex) => [
        parseInt(hex.slice(1, 3), 16),
        parseInt(hex.slice(3, 5), 16),
        parseInt(hex.slice(5, 7), 16),
      ]

      const wordRange = (doc) => {
        let range = doc.GetRangeBySelect()
        let text = range && typeof range.GetText === 'function' ? String(range.GetText()) : ''
        if (!text && expected) {
          const found = doc.Search(expected, false, false)
          if (found && found.length === 1) {
            range = found[0]
            range.Select()
            text = expected
          } else if (found && found.length > 1) {
            throw new Error('选区已丢失，且原文在文档中出现多次，无法唯一定位')
          }
        }
        if (!range || !text) throw new Error('当前没有选中内容，请先在文档中重新选中')
        return range
      }

      const findTable = (doc, op) => {
        const tables = doc.GetAllTables()
        if (op.matchText) {
          const needle = String(op.matchText).replace(/\s+/g, '')
          for (let i = 0; i < tables.length; i += 1) {
            const cells = tables[i].GetAllCells()
            for (let j = 0; j < cells.length; j += 1) {
              if (needle && String(cells[j].GetText()).replace(/\s+/g, '').indexOf(needle) >= 0) return tables[i]
            }
          }
          throw new Error('没有找到包含“' + String(op.matchText).slice(0, 30) + '”的表格')
        }
        if (typeof op.tableIndex === 'number') {
          const picked = tables[op.tableIndex]
          if (!picked) throw new Error('文档里没有第 ' + (op.tableIndex + 1) + ' 张表格')
          return picked
        }
        const active = doc.GetActiveTable()
        if (active) return active
        if (expected) {
          const needle = expected.replace(/\s+/g, '').slice(0, 24)
          for (let i = 0; i < tables.length; i += 1) {
            const cells = tables[i].GetAllCells()
            for (let j = 0; j < cells.length; j += 1) {
              const cellText = String(cells[j].GetText()).replace(/\s+/g, '')
              if (needle && cellText.indexOf(needle) >= 0) return tables[i]
            }
          }
        }
        throw new Error('选区不在表格中，请指定 tableIndex 或 matchText')
      }

      const applyText = (doc, op) => {
        const range = wordRange(doc)
        if (op.bold !== undefined) range.SetBold(op.bold)
        if (op.italic !== undefined) range.SetItalic(op.italic)
        if (op.underline !== undefined) range.SetUnderline(op.underline)
        if (op.strikeout !== undefined) range.SetStrikeout(op.strikeout)
        if (op.fontFamily) range.SetFontFamily(op.fontFamily)
        if (op.fontSize) range.SetFontSize(Math.round(op.fontSize * 2))
        if (op.color) range.SetColor.apply(range, rgb(op.color))
        if (op.highlight && op.highlight !== 'none') range.SetHighlight(op.highlight)

        const paragraphOps = op.align || op.lineSpacing || op.spaceBefore !== undefined || op.spaceAfter !== undefined || op.firstLineIndent !== undefined
        if (paragraphOps) {
          const paragraphs = range.GetAllParagraphs ? range.GetAllParagraphs() : []
          for (let i = 0; i < paragraphs.length; i += 1) {
            const pr = paragraphs[i].GetParaPr()
            if (op.align) pr.SetJc(op.align === 'justify' ? 'both' : op.align)
            if (op.lineSpacing) pr.SetSpacingLine(Math.round(op.lineSpacing * 240), 'auto')
            if (op.spaceBefore !== undefined) pr.SetSpacingBefore(Math.round(op.spaceBefore * 20))
            if (op.spaceAfter !== undefined) pr.SetSpacingAfter(Math.round(op.spaceAfter * 20))
            if (op.firstLineIndent !== undefined) pr.SetIndFirstLine(Math.round(op.firstLineIndent * 20))
          }
        }
      }

      const applyTable = (doc, op) => {
        const table = findTable(doc, op)
        if (op.tableAlign) table.SetJc(op.tableAlign)

        if (op.fontFamily || op.fontSize || op.color) {
          const textPr = Api.CreateTextPr()
          if (op.fontFamily) textPr.SetFontFamily(op.fontFamily)
          if (op.fontSize) textPr.SetFontSize(Math.round(op.fontSize * 2))
          if (op.color) textPr.SetColor.apply(textPr, rgb(op.color))
          table.SetTextPr(textPr)
        }

        const headerRow = op.headerRow !== false
        const rows = table.GetRowsCount()
        const cells = table.GetAllCells()

        if (op.borderColor || op.valign) {
          for (let i = 0; i < cells.length; i += 1) {
            const cellPr = Api.CreateTableCellPr()
            if (op.borderColor) {
              const size = op.borderSize || 4
              const color = Api.CreateRGBColor.apply(Api, rgb(op.borderColor))
              cellPr.SetCellBorderTop(size, color)
              cellPr.SetCellBorderBottom(size, color)
              cellPr.SetCellBorderLeft(size, color)
              cellPr.SetCellBorderRight(size, color)
            }
            if (op.valign) cellPr.SetVerticalAlign(op.valign)
            cells[i].SetCellPr(cellPr)
          }
        }

        if (op.zebraFill) {
          const color = rgb(op.zebraFill)
          for (let r = headerRow ? 1 : 0; r < rows; r += 1) {
            if (r % 2 === 0) table.GetRow(r).SetBackgroundColor(color[0], color[1], color[2])
          }
        }

        if (headerRow && (op.headerFill || op.headerColor || op.headerBold !== undefined || op.headerFontSize)) {
          const row = table.GetRow(0)
          if (op.headerFill) {
            const color = rgb(op.headerFill)
            row.SetBackgroundColor(color[0], color[1], color[2])
          }
          if (op.headerColor || op.headerBold !== undefined || op.headerFontSize) {
            const pr = Api.CreateTextPr()
            if (op.headerBold !== undefined) pr.SetBold(op.headerBold)
            if (op.headerFontSize) pr.SetFontSize(Math.round(op.headerFontSize * 2))
            if (op.headerColor) pr.SetColor.apply(pr, rgb(op.headerColor))
            row.SetTextPr(pr)
          }
        }

        const alignOf = (rowIndex) => (rowIndex === 0 && op.headerAlign ? op.headerAlign : op.align)
        if (op.align || op.headerAlign) {
          for (let r = 0; r < rows; r += 1) {
            const align = alignOf(r)
            if (!align) continue
            const row = table.GetRow(r)
            const cellCount = typeof row.GetCellsCount === 'function' ? row.GetCellsCount() : table.GetColumnsCount()
            for (let c = 0; c < cellCount; c += 1) {
              const paragraphs = row.GetCell(c).GetContent().GetAllParagraphs()
              for (let p = 0; p < paragraphs.length; p += 1) {
                paragraphs[p].GetParaPr().SetJc(align === 'justify' ? 'both' : align)
              }
            }
          }
        }
      }

      const columnIndex = (letters) => {
        let index = 0
        for (let i = 0; i < letters.length; i += 1) index = index * 26 + (letters.charCodeAt(i) - 64)
        return index - 1
      }

      const applyRange = (op) => {
        const sheet = Api.GetActiveSheet()
        const range = op.range ? sheet.GetRange(op.range) : sheet.GetSelection()
        const address = String(range.GetAddress() || op.range || '')
        if (!address) throw new Error('Excel 没有选中区域')
        if (op.bold !== undefined) range.SetBold(op.bold)
        if (op.italic !== undefined) range.SetItalic(op.italic)
        if (op.underline !== undefined) range.SetUnderline(op.underline)
        if (op.strikeout !== undefined) range.SetStrikeout(op.strikeout)
        if (op.fontName) range.SetFontName(op.fontName)
        if (op.fontSize) range.SetFontSize(op.fontSize)
        if (op.fontColor) range.SetFontColor(Api.CreateColorFromRGB.apply(Api, rgb(op.fontColor)))
        if (op.fillColor) range.SetFillColor(Api.CreateColorFromRGB.apply(Api, rgb(op.fillColor)))
        if (op.hAlign) range.SetAlignHorizontal(op.hAlign === 'justify' ? 'justify' : op.hAlign)
        if (op.vAlign) range.SetAlignVertical(op.vAlign)
        if (op.wrap !== undefined) range.SetWrap(op.wrap)
        if (op.numberFormat) range.SetNumberFormat(op.numberFormat)
        if (op.border && op.border !== 'none') {
          const styleMap = { all: 'All', outline: 'Outside', inside: 'Inside', top: 'Top', bottom: 'Bottom', left: 'Left', right: 'Right' }
          const weightMap = { thin: 'Thin', medium: 'Medium', thick: 'Thick' }
          const color = rgb(op.borderColor || '#c8c8c8')
          range.SetBorders(styleMap[op.border] || 'All', weightMap[op.borderWeight] || 'Thin', Api.CreateColorFromRGB(color[0], color[1], color[2]))
        }
        if (op.merge) range.Merge(true)

        const match = address.replace(/\$/g, '').match(/^([A-Z]+)([0-9]+)(?::([A-Z]+)([0-9]+))?$/)
        if (match) {
          const startCol = columnIndex(match[1])
          const endCol = match[3] ? columnIndex(match[3]) : startCol
          const startRow = Number(match[2]) - 1
          const endRow = match[4] ? Number(match[4]) - 1 : startRow
          if (op.columnWidth) {
            for (let c = startCol; c <= endCol; c += 1) sheet.SetColumnWidth(c, op.columnWidth)
          }
          if (op.rowHeight) {
            for (let r = startRow; r <= endRow; r += 1) sheet.SetRowHeight(r, op.rowHeight)
          }
        }
      }

      try {
        if (editor === 'cell') {
          for (let i = 0; i < ops.length; i += 1) {
            applyRange(ops[i])
            result.applied += 1
          }
        } else if (editor === 'word') {
          const doc = Api.GetDocument()
          for (let i = 0; i < ops.length; i += 1) {
            if (ops[i].op === 'formatText') applyText(doc, ops[i])
            else if (ops[i].op === 'formatTable') applyTable(doc, ops[i])
            else throw new Error('当前编辑器不支持样式操作：' + ops[i].op)
            result.applied += 1
          }
        } else {
          throw new Error('当前版本只支持 Word 和 Excel 的样式修改')
        }
        return result
      } catch (error) {
        return { applied: result.applied, error: String(error && error.message ? error.message : error) }
      }
    }, false, false, (result) => resolve(result || {}))
  })

  const saveCurrentDocument = () => new Promise((resolve, reject) => {
    const type = Asc.plugin.info.editorType
    const fileType = globalThis.__OCC__?.saveFileType
      || (type === 'cell' ? 'xlsx' : type === 'slide' ? 'pptx' : 'docx')
    let settled = false
    const timer = setTimeout(() => {
      if (settled) return
      settled = true
      reject(new Error('获取当前文档内容超时，请稍后重试'))
    }, 20_000)
    try {
      Asc.plugin.executeMethod('GetFileToDownload', [fileType], (result) => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        if (typeof result !== 'string' || !result) {
          reject(new Error('无法获取当前文档内容（下载权限可能被关闭）'))
          return
        }
        request('/save-download', {
          method: 'POST',
          body: JSON.stringify({ fileId, pluginToken, url: result }),
        }).then(resolve, reject)
      })
    } catch (error) {
      settled = true
      clearTimeout(timer)
      reject(error)
    }
  })

  const applyPatch = async (patch) => {
    if (busy) return
    busy = true
    try {
      if (patch.address) {
        await selectRange(patch.address)
      }
      const before = await currentText()
      // 纯样式补丁直接作用于当前选区/当前表格，不强制比对原文，避免长表格文本导致误判。
      if (patch.hasText && !matchesExpected(before, patch.expectedText)) {
        await ack(patch, {
          ok: false,
          error: `选区已变化，未应用修改。当前内容：${String(before.text || before.value || '').slice(0, 120)}`,
        })
        return
      }
      if (patch.hasText) {
        await new Promise((resolve) => {
          Asc.plugin.executeMethod('PasteText', [patch.text], () => resolve())
        })
        await new Promise((resolve) => setTimeout(resolve, 300))
      }
      if (Array.isArray(patch.ops) && patch.ops.length) {
        const styleResult = await applyOps(patch)
        if (styleResult.error) {
          await ack(patch, { ok: false, error: styleResult.error })
          return
        }
      }
      // 样式修改不会把 OnlyOffice 标记为已修改，forcesave 会返回 error:4；
      // 因此统一用 GetFileToDownload 取当前编辑状态，由宿主写回。
      let saved = false
      let warning = ''
      await new Promise((resolve) => setTimeout(resolve, 500))
      try {
        await saveCurrentDocument()
        saved = true
      } catch (error) {
        warning = String(error?.message || error)
      }
      const after = await currentText()
      await ack(patch, {
        ok: true,
        saved,
        ...(warning ? { warning } : {}),
        address: patch.address || after.address,
        value: after.value == null ? String(after.text || '') : String(after.value),
      })
    } catch (error) {
      await ack(patch, { ok: false, error: String(error?.message || error) })
    }
  }

  const poll = async () => {
    if (!busy) {
      try {
        const patch = await request(`/patch?fileId=${encodeURIComponent(fileId)}&pluginToken=${encodeURIComponent(pluginToken)}`)
        if (patch) await applyPatch(patch)
      } catch (error) {
        console.error('[办公套件] 拉取补丁失败', error)
      }
    }
    setTimeout(poll, 600)
  }

  window.Asc.plugin.init = function () {
    request('/plugin-ready', {
      method: 'POST',
      body: JSON.stringify({ fileId, pluginToken, editorType: Asc.plugin.info.editorType }),
    }).catch((error) => console.error('[办公套件] 插件心跳失败', error))
    readSelection()
    poll()
  }

  window.Asc.plugin.onSelectionChanged = function () {
    readSelection()
  }

  window.Asc.plugin.onExternalMouseUp = function () {
    readSelection()
  }

  window.Asc.plugin.button = function () {}
})()