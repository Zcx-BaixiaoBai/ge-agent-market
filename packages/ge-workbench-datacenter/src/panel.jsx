// 数据管理中心工作台 —— 业务面板
//
// 业务形态：整页展示所选项目的全景数据看板。
// 首次进入没有会话时，先引导选择项目；选定后只呈现该项目的数据。
// 需要 AI 协助时，由用户主动点击，宿主才创建/恢复会话并显示对话区。

export function createPanel(React) {
  const h = React.createElement
  const { useCallback, useEffect, useMemo, useState } = React

  const API = '/api/datacenter-workbench'

  const COPY = {
    title: '数据管理中心',
    subtitle: '金鹰集团设备、电表、安全与预算全景看板',
    loading: '正在读取数据…',
    loadFailed: '读取数据失败',
    retry: '重试',
    chooseProject: '先选择要查看的项目',
    chooseProjectHint: '选择项目后，这里只显示该项目的设备、电表、安全隐患与预算执行情况。',
    project: '项目',
    projects: '项目',
    search: '搜索项目名称',
    noProject: '没有匹配的项目',
    confirm: '确认并查看',
    confirmHint: '可多选，看板会汇总所选项目。',
    back: '重新选择项目',
    refresh: '刷新',
    aiHelp: '让 AI 协助分析',
    aiHelpHint: '点击后会为本工作台开启一个会话，把当前项目数据交给 AI 分析。',
    aiWorking: '正在准备会话…',
    overview: '总览',
    equipment: '设备',
    meters: '电表',
    safety: '安全隐患',
    safetyHazardSection: '安全隐患明细',
    safetyDutySection: '值班任务',
    budget: '预算执行',
    empty: '该项目在该分类下暂无数据。',
    noData: '暂无数据',
    noDataHint: '该模块未覆盖此项目',
    truncated: '数据量较大，仅显示前 500 条。',
    chart: {
      groupKpi: '核心指标（集团）',
      dataAnalysis: '数据分析',
      selectedProjects: '所选项目汇总',
      kpiMeters: '智能电表总数',
      kpiMeterRate: '电表故障率',
      kpiHazard: '隐患总数',
      kpiDuty: '安全履职',
      kpiWater: '水压异常',
      kpiEquipment: '设备总数',
      metersTopTitle: '电表故障排名 TOP10',
      commFaultTitle: '设备通讯故障分布',
      hazardTitle: '安全隐患分布',
      hazardTotal: '合计',
      hazardOverdue: '逾期未完成',
      hazardImminent: '即将逾期',
      hazardPending: '未完成',
      coverageTitle: '板块覆盖总览',
      meterCoverage: '电表覆盖率',
      safetyCoverage: '安全覆盖率',
      equipmentCoverage: '设备覆盖率',
      meterHealth: '电表健康率',
      equipmentHealth: '设备健康率',
      offline: '离线',
      abnormal: '异常送电',
      unpaid: '无签呈',
      total: '合计',
      lastSync: '最近同步',
      source: '数据源',
    },
    units: {
      total: '总数',
      fault: '故障',
      faultRate: '故障率',
      offline: '离线',
      unpaid: '欠费',
      abnormal: '异常',
      duty: '值班任务',
      dutyOverdue: '值班逾期',
      hazard: '隐患',
      hazardOverdue: '隐患逾期',
      imminent: '临期隐患',
    },
    budgetColumns: ['科目', '本期使用', '本期占比', '年度使用', '年度占比'],
    equipmentColumns: ['设备名称', '设备类型', '设备状态', '在线状态', '最后通信', '通信延迟(秒)'],
    metersColumns: ['安装位置', '位置', '故障描述', '故障标签', '数据时间', '离线小时'],
    hazardsColumns: ['隐患描述', '等级', '状态', '责任人', '整改截止', '剩余天数'],
    dutiesColumns: ['值班类型', '岗位', '责任人', '开始日期', '结束日期', '状态'],
    filter: {
      all: '全部',
      search: '搜索当前内容',
      reset: '清除筛选',
      online: '在线状态',
      deviceStatus: '设备状态',
      faultCategory: '故障类型',
      level: '隐患等级',
      hazardStatus: '隐患状态',
      dutyStatus: '值班状态',
      overdue: '逾期情况',
      isOverdue: '逾期',
      notOverdue: '未逾期',
      filteredOf: '条 / 共',
      emptyFiltered: '当前筛选条件下没有数据，可调整或清除筛选。',
    },
    stat: {
      total: '总数',
      online: '在线',
      offline: '离线',
      fault: '故障',
      faultRate: '故障率',
      abnormal: '数据报警',
      longestOffline: '最长离线',
      hours: '小时',
      within24h: '0-24 小时',
      oneTo3d: '1-3 天',
      over3d: '超过 3 天',
      offlineDuration: '离线时长分布',
      rectified: '已整改',
      pendingRectify: '未整改',
      overdueUnfixed: '逾期未整改',
      imminentDays: '7 天内到期',
      completed: '已完成',
      uncompleted: '未完成',
      overdueUnfinished: '逾期未完成',
    },
    report: {
      button: '生成 AI 分析报告',
      busy: '正在准备报告…',
      done: '报告内容已填入对话输入框，请查看后发送。',
      preserved: '对话输入框已有内容未清空，报告已复制到剪贴板，可手动粘贴。',
      clipboard: '未能写入对话草稿，报告已复制到剪贴板，可手动粘贴。',
      failed: '未能写入对话草稿',
      noSession: '未能创建工作台会话，请重试。',
      view: '查看对话',
    },
  }

  const pct = (value) => (value === undefined || value === null ? '—' : `${(Number(value) * 100).toFixed(1)}%`)

  const cell = (value) => (value === undefined || value === null || value === '' ? '—' : String(value))

  function MetricCard({ label, value, hint, tone }) {
    return h('div', { className: `dcMetric${tone ? ` dcMetric--${tone}` : ''}` },
      h('div', { className: 'dcMetric__label' }, label),
      h('div', { className: 'dcMetric__value' }, value),
      hint ? h('div', { className: 'dcMetric__hint' }, hint) : null
    )
  }

  function DataTable({ columns, rows, emptyText }) {
    if (!rows || rows.length === 0) {
      return h('div', { className: 'dcEmpty' }, emptyText || COPY.empty)
    }
    // nowrap 列用于短枚举值（等级、状态、日期、天数），避免「一般隐患」被挤成两行。
    const cellClass = (column) => (column.nowrap ? 'dcTable__nowrap' : undefined)
    return h('div', { className: 'dcTableWrap' },
      h('table', { className: 'dcTable' },
        h('thead', null, h('tr', null, columns.map((column) => h('th', { key: column.key, scope: 'col', className: cellClass(column) }, column.title)))),
        h('tbody', null, rows.map((row, index) => h('tr', { key: index },
          columns.map((column) => h('td', { key: column.key, className: cellClass(column) }, column.render ? column.render(row) : cell(row[column.key])))
        )))
      )
    )
  }

  // ---- 明细页通用：统计条 / 筛选条 / 迷你图 ----

  function StatStrip({ stats }) {
    return h('div', { className: 'dcStatStrip' }, stats.map((item) => h('div', { className: `dcStatChip${item.tone ? ` dcStatChip--${item.tone}` : ''}`, key: item.label },
      h('span', { className: 'dcStatChip__label' }, item.label),
      h('span', { className: 'dcStatChip__value' }, String(item.value))
    )))
  }

  // groups: [{ key, label, options: [{value, label}], value, onChange }]
  // 工具条固定两行：上行 = 搜索 + 清除 + AI 报告；下行 = 各组筛选标签。
  // 结构固定，避免控件随窗口宽度随意换行错位。
  function FilterBar({ keyword, onKeyword, groups, onReset, onReport, reportBusy }) {
    const dirty = keyword !== '' || groups.some((group) => group.value !== 'all')
    return h('div', { className: 'dcFilterBar' },
      h('div', { className: 'dcFilterBar__top' },
        h('input', {
          className: 'dcInput dcFilterBar__search',
          type: 'search',
          value: keyword,
          placeholder: COPY.filter.search,
          'aria-label': COPY.filter.search,
          onChange: (event) => onKeyword(event.target.value),
        }),
        dirty ? h('button', { type: 'button', className: 'dcBtn dcFilterBar__reset', onClick: onReset }, COPY.filter.reset) : null,
        onReport ? h('button', {
          type: 'button',
          className: 'dcBtn dcBtn--primary dcFilterBar__report',
          disabled: reportBusy,
          onClick: onReport,
        }, reportBusy ? COPY.report.busy : COPY.report.button) : null
      ),
      groups.length > 0 ? h('div', { className: 'dcFilterBar__groups' },
        groups.map((group) => h('div', { className: 'dcFilterGroup', key: group.key },
          h('span', { className: 'dcFilterGroup__label' }, group.label),
          h('div', { className: 'dcFilterGroup__chips', role: 'group', 'aria-label': group.label },
            [{ value: 'all', label: COPY.filter.all }, ...group.options].map((option) => h('button', {
              key: option.value,
              type: 'button',
              className: 'dcChip',
              'aria-pressed': group.value === option.value,
              onClick: () => group.onChange(option.value),
            }, option.label))))
        )
      ) : null
    )
  }

  // 横向迷你条形图：data = [{ label, value, color? }]
  function MiniBars({ title, data }) {
    if (!data || data.length === 0) return null
    const max = Math.max(...data.map((item) => item.value), 1)
    return h('div', { className: 'dcPanel dcPanel--chart dcMiniChart' },
      title ? h('h4', { className: 'dcChartTitle' }, title) : null,
      h('div', { className: 'dcChartRows' }, data.map((item) => h('div', { className: 'dcChartRow', key: item.label },
        h('div', { className: 'dcChartRow__label', title: item.label }, item.label),
        h('div', { className: 'dcChartRow__bars' },
          h('div', { className: 'dcBarTrack' },
            h('span', { className: 'dcBarFill', style: { width: `${(item.value / max) * 100}%`, background: item.color || '#0969da' } }))),
        h('div', { className: 'dcChartRow__value' }, String(item.value))
      )))
    )
  }

  function DistDonut({ title, data }) {
    const total = data.reduce((sum, item) => sum + item.value, 0)
    if (!total) return null
    const RADIUS = 46
    const CIRCUM = 2 * Math.PI * RADIUS
    let offset = 0
    const arcs = data.map((item) => {
      const fraction = item.value / total
      const arc = { ...item, dash: fraction * CIRCUM, offset }
      offset += fraction * CIRCUM
      return arc
    })
    return h('div', { className: 'dcPanel dcPanel--chart dcMiniChart' },
      title ? h('h4', { className: 'dcChartTitle' }, title) : null,
      h('div', { className: 'dcDonut' },
        h('svg', { viewBox: '0 0 130 130', className: 'dcDonut__svg', role: 'img', 'aria-label': title },
          h('circle', { cx: 65, cy: 65, r: RADIUS, fill: 'none', stroke: '#d0d7de', strokeWidth: 16 }),
          arcs.map((arc) => h('circle', {
            key: arc.label,
            cx: 65, cy: 65, r: RADIUS, fill: 'none',
            stroke: arc.color, strokeWidth: 16,
            strokeDasharray: `${arc.dash} ${CIRCUM - arc.dash}`,
            strokeDashoffset: -arc.offset,
            transform: 'rotate(-90 65 65)',
            title: `${arc.label} ${arc.value}`,
          })),
          h('text', { x: 65, y: 62, textAnchor: 'middle', className: 'dcDonut__value' }, String(total)),
          h('text', { x: 65, y: 82, textAnchor: 'middle', className: 'dcDonut__label' }, COPY.chart.hazardTotal)),
        h('div', { className: 'dcDonut__legend' }, data.map((item) => h('div', { className: 'dcDonutLegend__item', key: item.label },
          h('span', { className: 'dcLegendDot', style: { background: item.color } }),
          h('span', { className: 'dcDonutLegend__label' }, item.label),
          h('span', { className: 'dcDonutLegend__value' }, String(item.value))))))
    )
  }

  const countBy = (rows, field) => {
    const counter = new Map()
    for (const row of rows) {
      const key = String(row[field] ?? '—') || '—'
      counter.set(key, (counter.get(key) ?? 0) + 1)
    }
    return [...counter.entries()].sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value }))
  }

  const topN = (entries, limit) => entries.slice(0, limit)

  // 电表故障归类：优先 fault_tag，其次故障描述，再次开关状态（欠费停电等）。
  const faultCategoryOf = (row) => {
    const tag = String(row.fault_tag ?? '').replace(/[【】]/g, '').trim()
    if (tag) return tag
    const match = /故障描述【([^】]+)】/.exec(String(row.fault_desc ?? ''))
    if (match) return match[1]
    const status = String(row.switch_status ?? '').trim()
    if (status) return status
    return '其他'
  }

  const offlineBucketOf = (row) => {
    const hours = Number(row.offline_hours ?? 0)
    if (!Number.isFinite(hours) || hours <= 0) return '未记录'
    if (hours <= 24) return COPY.stat.within24h
    if (hours <= 72) return COPY.stat.oneTo3d
    return COPY.stat.over3d
  }

  // ---- AI 分析报告 ----

  // 把分析请求写进会话草稿；返回 applied / preserved / blocked / unavailable。
  // 不带 clearPreviousDraft：用户已输入的草稿优先，符合规范「保留用户已输入内容」。
  const writeDraft = (host, sessionId, prompt) => {
    try {
      const conversation = host?.conversation
      const sessions = host?.sessions
      if (!conversation?.input?.requestDraftInitialization || typeof sessions?.binding !== 'function') return 'unavailable'
      const binding = sessions.binding(sessionId)
      if (!binding) return 'unavailable'
      return conversation.input.requestDraftInitialization(binding, { prompt })
    } catch (draftError) {
      return 'unavailable'
    }
  }

  // 用当前页数据组装分析请求：统计 + 分布 + 典型记录，交给会话里的 Agent。
  const buildReportPrompt = (kind, selected, rows, lastSync, fallbackSync) => {
    const safeRows = Array.isArray(rows) ? rows : []
    const scope = selected.length ? selected.join('、') : '（未选择项目）'
    const sync = lastSync ?? fallbackSync ?? '未知'
    const lines = []
    const sections = {
      equipment: '设备运行',
      meters: '瑞信电表故障',
      hazards: '安全隐患',
      duties: '安全值班履职',
      budget: '预算执行',
    }
    lines.push(`请分析「${scope}」的${sections[kind] ?? '业务'}数据，给出运维分析报告与处置建议。数据来自金鹰集团数据管理中心，最近同步时间 ${sync}。`)
    lines.push('')
    if (kind === 'equipment') {
      const offline = safeRows.filter((row) => row.online_status === '离线').length
      const abnormal = safeRows.filter((row) => row.device_status && row.device_status !== '正常').length
      lines.push(`数据概况：共 ${safeRows.length} 台设备，离线 ${offline} 台，数据报警 ${abnormal} 台。`)
      lines.push('设备状态分布：' + countBy(safeRows, 'device_status').map((item) => `${item.label} ${item.value}`).join('、'))
      lines.push('设备类型分布：' + topN(countBy(safeRows, 'device_type'), 5).map((item) => `${item.label} ${item.value}`).join('、'))
      lines.push('')
      lines.push('离线设备清单（最多 10 条）：')
      safeRows.filter((row) => row.online_status === '离线').slice(0, 10).forEach((row, index) => {
        lines.push(`${index + 1}. ${row.device_name}（${row.device_type ?? '—'}）最后通信 ${row.last_comm ?? '—'}，通信延迟 ${typeof row.comm_delay === 'number' ? row.comm_delay.toFixed(0) + ' 秒' : '—'}`)
      })
    } else if (kind === 'meters') {
      const withCategory = safeRows.map((row) => ({ ...row, __category: faultCategoryOf(row) }))
      lines.push(`数据概况：共 ${withCategory.length} 条电表异常记录。`)
      lines.push('故障类型分布：' + countBy(withCategory, '__category').map((item) => `${item.label} ${item.value}`).join('、'))
      const buckets = countBy(withCategory.map((row) => ({ ...row, __bucket: offlineBucketOf(row) })), '__bucket')
      lines.push('离线时长分布：' + buckets.map((item) => `${item.label} ${item.value}`).join('、'))
      const longest = safeRows.reduce((max, row) => Math.max(max, Number(row.offline_hours ?? 0) || 0), 0)
      lines.push(`最长离线 ${longest.toFixed(1)} 小时。`)
      lines.push('')
      lines.push('典型异常记录（最多 10 条，按离线时长降序）：')
      ;[...safeRows].sort((a, b) => (Number(b.offline_hours) || 0) - (Number(a.offline_hours) || 0)).slice(0, 10).forEach((row, index) => {
        lines.push(`${index + 1}. ${row.building ?? '—'} / ${row.location ?? '—'}：${faultCategoryOf(row)} ${typeof row.offline_hours === 'number' ? row.offline_hours.toFixed(1) + ' 小时' : ''}（数据时间 ${row.data_time ?? '—'}）`)
      })
    } else if (kind === 'hazards') {
      const isOverdueRow = (row) => (row.hazard_status !== '已整改') && (Number(row.remaining_days ?? 0) < 0)
      const overdue = safeRows.filter(isOverdueRow).length
      lines.push(`数据概况：共 ${safeRows.length} 条隐患，逾期未整改 ${overdue} 条。`)
      lines.push('等级分布：' + countBy(safeRows, 'level').map((item) => `${item.label} ${item.value}`).join('、'))
      lines.push('状态分布：' + countBy(safeRows, 'hazard_status').map((item) => `${item.label} ${item.value}`).join('、'))
      lines.push('')
      lines.push('逾期未整改隐患（最多 10 条，最紧急在前）：')
      safeRows.filter(isOverdueRow).sort((a, b) => (Number(a.remaining_days) || 0) - (Number(b.remaining_days) || 0)).slice(0, 10).forEach((row, index) => {
        lines.push(`${index + 1}. ${row.description ?? '—'}（${row.level ?? '—'}，责任人 ${row.responsible ?? '—'}，截止 ${row.deadline ?? '—'}，超期 ${Math.abs(Number(row.remaining_days) || 0).toFixed(0)} 天）`)
      })
    } else if (kind === 'duties') {
      const isOverdueRow = (row) => (row.plan_status !== '已完成') && (Number(row.countdown ?? 0) < 0)
      const completed = safeRows.filter((row) => row.plan_status === '已完成').length
      lines.push(`数据概况：共 ${safeRows.length} 项值班任务，已完成 ${completed}，未完成 ${safeRows.length - completed}，其中逾期未完成 ${safeRows.filter(isOverdueRow).length}。`)
      lines.push('状态分布：' + countBy(safeRows, 'plan_status').map((item) => `${item.label} ${item.value}`).join('、'))
      lines.push('')
      lines.push('逾期未完成任务（最多 10 条）：')
      safeRows.filter(isOverdueRow).slice(0, 10).forEach((row, index) => {
        lines.push(`${index + 1}. ${row.plan_type ?? '—'} / ${row.position ?? '—'}（责任人 ${row.responsible ?? '—'}，${row.start_date ?? '—'} 至 ${row.end_date ?? '—'}，状态 ${row.plan_status ?? '—'}）`)
      })
    } else if (kind === 'budget') {
      lines.push(`数据概况：共 ${safeRows.length} 个预算科目。`)
      const top = [...safeRows].sort((a, b) => (Number(b.yearly_usage) || 0) - (Number(a.yearly_usage) || 0)).slice(0, 10)
      lines.push('年度使用金额 TOP10：')
      top.forEach((row, index) => {
        lines.push(`${index + 1}. ${row.subject ?? '—'}：年度使用 ${(Number(row.yearly_usage) || 0).toLocaleString('zh-CN')}，年度占比 ${row.yearly_rate ?? '—'}，本期占比 ${row.current_rate ?? '—'}`)
      })
    }
    lines.push('')
    lines.push('请输出：1) 按优先级排序的问题清单（附数据依据）；2) 每个问题的可能原因分析；3) 建议的处置动作与责任分工；4) 需要持续监控的指标。用中文，分点，简洁。')
    return lines.join('\n')
  }

  function ProjectPicker({ projects, selected, onToggle, onConfirm, loading }) {
    const [keyword, setKeyword] = useState('')
    const filtered = useMemo(() => {
      const needle = keyword.trim().toLowerCase()
      if (!needle) return projects
      return projects.filter((project) => project.name.toLowerCase().includes(needle))
    }, [projects, keyword])
    return h('div', { className: 'dcPicker' },
      h('h2', { className: 'dcPicker__title' }, COPY.chooseProject),
      h('p', { className: 'dcPicker__hint' }, COPY.chooseProjectHint),
      h('input', {
        className: 'dcInput',
        type: 'search',
        value: keyword,
        placeholder: COPY.search,
        'aria-label': COPY.search,
        onChange: (event) => setKeyword(event.target.value),
      }),
      filtered.length === 0
        ? h('div', { className: 'dcEmpty' }, COPY.noProject)
        : h('ul', { className: 'dcPicker__list' }, filtered.map((project) => {
          const active = selected.includes(project.name)
          return h('li', { key: project.name },
            h('label', { className: 'dcPicker__item' },
              h('input', {
                type: 'checkbox',
                checked: active,
                onChange: () => onToggle(project.name),
              }),
              h('span', { className: 'dcPicker__name' }, project.name),
              project.pm_name || project.eng_name
                ? h('span', { className: 'dcPicker__owner' }, [project.pm_name, project.eng_name].filter(Boolean).join(' / '))
                : null
            )
          )
        })),
      h('div', { className: 'dcPicker__actions' },
        h('button', {
          className: 'dcBtn dcBtn--primary',
          type: 'button',
          disabled: loading || selected.length === 0,
          onClick: onConfirm,
        }, loading ? COPY.loading : COPY.confirm),
        h('span', { className: 'dcPicker__hint' }, COPY.confirmHint)
      )
    )
  }

  // ---- 总览图表（纯 SVG / CSS，不引入图表库） ----

  // 横向双条：总数为底、故障为红。与站点「电表故障排名 TOP10」同口径。
  function TopFaultChart({ rows }) {
    if (!rows || rows.length === 0) return h('div', { className: 'dcEmpty' }, COPY.empty)
    const maxTotal = Math.max(...rows.map((row) => row.total), 1)
    const maxFault = Math.max(...rows.map((row) => row.fault), 1)
    return h('div', { className: 'dcChartRows' }, rows.map((row) => h('div', { className: 'dcChartRow', key: row.name },
      h('div', { className: 'dcChartRow__label', title: row.name }, row.name),
      h('div', { className: 'dcChartRow__bars' },
        h('div', { className: 'dcBarTrack', title: `总数 ${row.total}` },
          h('span', { className: 'dcBarFill dcBarFill--track', style: { width: `${(row.total / maxTotal) * 100}%` } })),
        h('div', { className: 'dcBarTrack', title: `故障 ${row.fault}` },
          h('span', { className: 'dcBarFill dcBarFill--fault', style: { width: `${(row.fault / Math.max(maxFault, maxTotal)) * 100}%` } }))
      ),
      h('div', { className: 'dcChartRow__value' }, `${row.fault}/${row.total}`)
    )))
  }

  // 横向堆叠条：离线 / 异常送电 / 无签呈。与站点「设备通讯故障分布」同口径。
  function CommFaultChart({ rows }) {
    if (!rows || rows.length === 0) return h('div', { className: 'dcEmpty' }, COPY.empty)
    const SEGMENTS = [
      { key: 'offline', label: COPY.chart.offline, color: '#cf222e' },
      { key: 'abnormal', label: COPY.chart.abnormal, color: '#9a6700' },
      { key: 'unpaid', label: COPY.chart.unpaid, color: '#8250df' },
    ]
    const totals = rows.map((row) => SEGMENTS.reduce((sum, seg) => sum + (row[seg.key] || 0), 0))
    const max = Math.max(...totals, 1)
    return h('div', { className: 'dcChartBlock' },
      h('div', { className: 'dcChartLegend' }, SEGMENTS.map((seg) => h('span', { className: 'dcLegendItem', key: seg.key },
        h('span', { className: 'dcLegendDot', style: { background: seg.color } }), seg.label))),
      h('div', { className: 'dcChartRows' }, rows.map((row, index) => {
        const total = totals[index]
        return h('div', { className: 'dcChartRow', key: row.name },
          h('div', { className: 'dcChartRow__label', title: row.name }, row.name),
          h('div', { className: 'dcChartRow__bars' },
            h('div', { className: 'dcBarTrack dcBarTrack--stack', title: `${COPY.chart.total} ${total}` },
              SEGMENTS.map((seg) => h('span', {
                key: seg.key,
                className: 'dcBarFill',
                style: { width: total ? `${((row[seg.key] || 0) / max) * 100}%` : '0%', background: seg.color },
                title: `${seg.label} ${row[seg.key] || 0}`,
              })))),
          h('div', { className: 'dcChartRow__value' }, total)
        )
      }))
    )
  }

  // 环形图：逾期未完成 / 即将逾期 / 未完成。与站点「安全隐患分布」同口径。
  function HazardDonut({ status }) {
    if (!status) return h('div', { className: 'dcEmpty' }, COPY.empty)
    const ITEMS = [
      { key: 'overdue', label: COPY.chart.hazardOverdue, color: '#cf222e', value: status.overdue },
      { key: 'imminent', label: COPY.chart.hazardImminent, color: '#9a6700', value: status.imminent },
      { key: 'pending', label: COPY.chart.hazardPending, color: '#0969da', value: status.pending },
    ]
    const total = ITEMS.reduce((sum, item) => sum + item.value, 0)
    const RADIUS = 52
    const CIRCUM = 2 * Math.PI * RADIUS
    let offset = 0
    const arcs = ITEMS.map((item) => {
      const fraction = total ? item.value / total : 0
      const arc = { ...item, dash: fraction * CIRCUM, offset }
      offset += fraction * CIRCUM
      return arc
    })
    return h('div', { className: 'dcDonut' },
      h('svg', { viewBox: '0 0 140 140', className: 'dcDonut__svg', role: 'img', 'aria-label': COPY.chart.hazardTitle },
        h('circle', { cx: 70, cy: 70, r: RADIUS, fill: 'none', stroke: '#d0d7de', strokeWidth: 18 }),
        arcs.map((arc) => h('circle', {
          key: arc.key,
          cx: 70, cy: 70, r: RADIUS, fill: 'none',
          stroke: arc.color, strokeWidth: 18,
          strokeDasharray: `${arc.dash} ${CIRCUM - arc.dash}`,
          strokeDashoffset: -arc.offset,
          transform: 'rotate(-90 70 70)',
          title: `${arc.label} ${arc.value}`,
        })),
        h('text', { x: 70, y: 66, textAnchor: 'middle', className: 'dcDonut__value' }, String(total)),
        h('text', { x: 70, y: 88, textAnchor: 'middle', className: 'dcDonut__label' }, COPY.chart.hazardTotal)),
      h('div', { className: 'dcDonut__legend' }, ITEMS.map((item) => h('div', { className: 'dcDonutLegend__item', key: item.key },
        h('span', { className: 'dcLegendDot', style: { background: item.color } }),
        h('span', { className: 'dcDonutLegend__label' }, item.label),
        h('span', { className: 'dcDonutLegend__value' }, item.value))))
    )
  }

  // 板块覆盖与健康率：进度条形式，与站点雷达图同口径。
  function CoveragePanel({ group }) {
    const rows = []
    if (group?.meters) {
      rows.push({ label: COPY.chart.meterCoverage, value: Math.round((group.meters.project_count / 30) * 100) })
      rows.push({ label: COPY.chart.meterHealth, value: Math.round((1 - (group.meters.fault_rate || 0)) * 100) })
    }
    if (group?.safety) {
      rows.push({ label: COPY.chart.safetyCoverage, value: Math.round((group.safety.project_count / 45) * 100) })
    }
    if (group?.equipment) {
      rows.push({ label: COPY.chart.equipmentCoverage, value: Math.round((group.equipment.project_count / 25) * 100) })
      rows.push({ label: COPY.chart.equipmentHealth, value: Math.round((1 - (group.equipment.fault_rate || 0)) * 100) })
    }
    if (!rows.length) return h('div', { className: 'dcEmpty' }, COPY.empty)
    return h('div', { className: 'dcCoverage' }, rows.map((row) => {
      const tone = row.value >= 80 ? 'good' : row.value >= 50 ? 'mid' : 'low'
      return h('div', { className: 'dcCoverage__row', key: row.label },
        h('span', { className: 'dcCoverage__label' }, row.label),
        h('div', { className: 'dcCoverage__track', role: 'progressbar', 'aria-valuenow': row.value, 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-label': row.label },
          h('span', { className: `dcCoverage__fill dcCoverage__fill--${tone}`, style: { width: `${Math.min(row.value, 100)}%` } })),
        h('span', { className: `dcCoverage__value dcCoverage__value--${tone}` }, `${row.value}%`))
    }))
  }

  function SyncPanel({ sync }) {
    const info = sync?.sync_info
    const status = sync?.status
    const counts = status?.table_counts
    const entries = counts ? Object.entries(counts) : []
    return h('div', { className: 'dcSync' },
      h('div', { className: 'dcSync__meta' },
        h('span', null, `${COPY.chart.lastSync}：${status?.last_sync ?? info?.last_sync ?? '—'}`),
        info?.source_file ? h('span', { className: 'dcSync__source' }, `${COPY.chart.source}：${info.source_file}`) : null),
      entries.length
        ? h('div', { className: 'dcSync__tables' }, entries.map(([name, count]) => h('span', { className: 'dcSync__table', key: name, title: name },
            h('b', null, (count ?? 0).toLocaleString('zh-CN')), ' ', name)))
        : null
    )
  }

  function Overview({ data, projects }) {
    const group = data?.group ?? {}
    const charts = data?.charts ?? {}
    const totals = data?.totals ?? {}
    const equipment = totals.equipment
    const meters = totals.meters
    const safety = totals.safety
    // 各模块的指标字段名不同，逐卡声明取值字段或计算式，避免读错字段显示为 0。
    const card = ({ label, module, field, compute, hint, tone }) => h(MetricCard, {
      label,
      value: module ? (compute ? compute(module) : cell(module[field])) : COPY.noData,
      hint: module ? hint(module) : COPY.noDataHint,
      tone,
    })
    return h('div', { className: 'dcOverview' },
      h('h3', { className: 'dcSection__title' }, COPY.chart.groupKpi),
      h('div', { className: 'dcGrid dcGrid--six' },
        card({ label: COPY.chart.kpiMeters, module: group.meters, field: 'total', hint: (value) => `故障 ${cell(value.fault)} / 离线 ${cell(value.offline)}` }),
        card({ label: COPY.chart.kpiMeterRate, module: group.meters, compute: (value) => `${((value.fault_rate || 0) * 100).toFixed(2)}%`, hint: (value) => `${cell(value.project_count)} 个项目`, tone: 'warn' }),
        card({ label: COPY.chart.kpiHazard, module: group.safety, field: 'hazard_total', hint: (value) => `逾期 ${cell(value.hazard_overdue)}`, tone: group.safety?.hazard_overdue > 0 ? 'alert' : undefined }),
        card({ label: COPY.chart.kpiDuty, module: group.safety, field: 'duty_total', hint: (value) => `已逾期 ${cell(value.duty_overdue)}`, tone: group.safety?.duty_overdue > 0 ? 'alert' : undefined }),
        card({ label: COPY.chart.kpiWater, module: group.safety, compute: (value) => cell((value.wp_low || 0) + (value.wp_high || 0)), hint: (value) => `失压 ${cell(value.wp_low)}`, tone: 'warn' }),
        card({ label: COPY.chart.kpiEquipment, module: group.equipment, field: 'total', hint: (value) => `故障 ${cell(value.fault)} / ${((value.fault_rate || 0) * 100).toFixed(1)}%` })
      ),
      h('h3', { className: 'dcSection__title' }, COPY.chart.dataAnalysis),
      h('div', { className: 'dcChartGrid' },
        h('div', { className: 'dcPanel dcPanel--chart' },
          h('h4', { className: 'dcChartTitle' }, COPY.chart.metersTopTitle),
          h(TopFaultChart, { rows: charts.metersTop })),
        h('div', { className: 'dcPanel dcPanel--chart' },
          h('h4', { className: 'dcChartTitle' }, COPY.chart.commFaultTitle),
          h(CommFaultChart, { rows: charts.commFaults })),
        h('div', { className: 'dcPanel dcPanel--chart' },
          h('h4', { className: 'dcChartTitle' }, COPY.chart.hazardTitle),
          h(HazardDonut, { status: charts.hazardStatus })),
        h('div', { className: 'dcPanel dcPanel--chart' },
          h('h4', { className: 'dcChartTitle' }, COPY.chart.coverageTitle),
          h(CoveragePanel, { group }))
      ),
      projects.length > 0
        ? h('div', { className: 'dcPanel' },
          h('h3', { className: 'dcPanel__title' }, COPY.chart.selectedProjects),
          h('div', { className: 'dcGrid' },
            card({ label: `${COPY.units.total}设备`, module: equipment, field: 'total', hint: (value) => `故障 ${cell(value.fault)} · ${pct(value.fault_rate)}` }),
            card({ label: `${COPY.units.total}电表`, module: meters, field: 'total', hint: (value) => `故障 ${cell(value.fault)} · 离线 ${cell(value.offline)}`, tone: 'warn' }),
            card({ label: `${COPY.units.total}值班任务`, module: safety, field: 'duty_total', hint: (value) => `逾期 ${cell(value.duty_overdue)}`, tone: safety?.duty_overdue > 0 ? 'alert' : undefined }),
            card({ label: `${COPY.units.total}隐患`, module: safety, field: 'hazard_total', hint: (value) => `逾期 ${cell(value.hazard_overdue)} · 临期 ${cell(value.hazard_imminent)}`, tone: safety?.hazard_overdue > 0 ? 'alert' : undefined })),
          projects.length > 1
            ? h('div', { className: 'dcTableWrap' },
                h('table', { className: 'dcTable' },
                  h('thead', null, h('tr', null,
                    h('th', { scope: 'col' }, COPY.project),
                    h('th', { scope: 'col' }, '设备故障率'),
                    h('th', { scope: 'col' }, '电表故障率'),
                    h('th', { scope: 'col' }, '电表欠费'),
                    h('th', { scope: 'col' }, '值班逾期'),
                    h('th', { scope: 'col' }, '隐患逾期')
                  )),
                  h('tbody', null, projects.map((project) => h('tr', { key: project.name },
                    h('td', null, project.name),
                    h('td', null, pct(project.equipment?.fault_rate)),
                    h('td', null, pct(project.meters?.fault_rate)),
                    h('td', null, cell(project.meters?.unpaid)),
                    h('td', null, cell(project.safety?.duty_overdue)),
                    h('td', null, cell(project.safety?.hazard_overdue))
                  )))))
            : null)
        : null,
      data?.sync ? h(SyncPanel, { sync: data.sync }) : null
    )
  }

  function EquipmentDetail({ rows }) {
    return h(DataTable, {
      columns: [
        { key: 'device_name', title: COPY.equipmentColumns[0] },
        { key: 'device_type', title: COPY.equipmentColumns[1] },
        { key: 'device_status', title: COPY.equipmentColumns[2] },
        { key: 'online_status', title: COPY.equipmentColumns[3] },
        { key: 'last_comm', title: COPY.equipmentColumns[4] },
        { key: 'comm_delay', title: COPY.equipmentColumns[5], render: (row) => (typeof row.comm_delay === 'number' ? row.comm_delay.toFixed(1) : '—') },
      ],
      rows,
    })
  }

  function MetersDetail({ rows }) {
    return h(DataTable, {
      columns: [
        { key: 'building', title: COPY.metersColumns[0] },
        { key: 'location', title: COPY.metersColumns[1] },
        { key: 'fault_desc', title: COPY.metersColumns[2] },
        { key: 'fault_tag', title: COPY.metersColumns[3] },
        { key: 'data_time', title: COPY.metersColumns[4] },
        { key: 'offline_hours', title: COPY.metersColumns[5], render: (row) => (typeof row.offline_hours === 'number' ? row.offline_hours.toFixed(1) : '—') },
      ],
      rows,
    })
  }

  function HazardsDetail({ rows }) {
    return h(DataTable, {
      columns: [
        { key: 'description', title: COPY.hazardsColumns[0] },
        { key: 'level', title: COPY.hazardsColumns[1] },
        { key: 'hazard_status', title: COPY.hazardsColumns[2] },
        { key: 'responsible', title: COPY.hazardsColumns[3] },
        { key: 'deadline', title: COPY.hazardsColumns[4] },
        { key: 'remaining_days', title: COPY.hazardsColumns[5], render: (row) => (typeof row.remaining_days === 'number' ? row.remaining_days.toFixed(0) : '—') },
      ],
      rows,
    })
  }

  function DutiesDetail({ rows }) {
    return h(DataTable, {
      columns: [
        { key: 'plan_type', title: COPY.dutiesColumns[0] },
        { key: 'position', title: COPY.dutiesColumns[1] },
        { key: 'responsible', title: COPY.dutiesColumns[2] },
        { key: 'start_date', title: COPY.dutiesColumns[3] },
        { key: 'end_date', title: COPY.dutiesColumns[4] },
        { key: 'plan_status', title: COPY.dutiesColumns[5] },
      ],
      rows,
    })
  }

  function BudgetTable({ rows }) {
    return h(DataTable, {
      columns: [
        { key: 'subject', title: COPY.budgetColumns[0] },
        { key: 'current_usage', title: COPY.budgetColumns[1], render: (row) => (typeof row.current_usage === 'number' ? row.current_usage.toLocaleString('zh-CN') : '—') },
        { key: 'current_rate', title: COPY.budgetColumns[2] },
        { key: 'yearly_usage', title: COPY.budgetColumns[3], render: (row) => (typeof row.yearly_usage === 'number' ? row.yearly_usage.toLocaleString('zh-CN') : '—') },
        { key: 'yearly_rate', title: COPY.budgetColumns[4] },
      ],
      rows,
    })
  }

  // ---- 明细页：筛选 + 统计 + 图 + 表 + AI 报告 ----
  // 每页自管筛选状态；统计与图表跟随当前筛选结果重算。

  function EquipmentPage({ rows, truncated, onReport, reportBusy }) {
    const [keyword, setKeyword] = useState('')
    const [online, setOnline] = useState('all')
    const [deviceStatus, setDeviceStatus] = useState('all')
    const filtered = useMemo(() => {
      const needle = keyword.trim().toLowerCase()
      return (rows ?? []).filter((row) => {
        if (online !== 'all' && row.online_status !== online) return false
        if (deviceStatus !== 'all' && row.device_status !== deviceStatus) return false
        if (needle && !`${row.device_name ?? ''}${row.device_type ?? ''}`.toLowerCase().includes(needle)) return false
        return true
      })
    }, [rows, keyword, online, deviceStatus])
    const onlineDist = countBy(filtered, 'online_status')
    const statusDist = countBy(filtered, 'device_status')
    const typeTop = topN(countBy(filtered, 'device_type'), 5)
    const offlineCount = filtered.filter((row) => row.online_status === '离线').length
    const abnormalCount = filtered.filter((row) => row.device_status && row.device_status !== '正常').length
    return h('div', { className: 'dcDetailPage' },
      h(StatStrip, { stats: [
        { label: COPY.stat.total, value: filtered.length },
        { label: COPY.stat.online, value: filtered.length - offlineCount },
        { label: COPY.stat.offline, value: offlineCount, tone: offlineCount > 0 ? 'warn' : undefined },
        { label: COPY.stat.abnormal, value: abnormalCount, tone: abnormalCount > 0 ? 'alert' : undefined },
        { label: COPY.stat.faultRate, value: filtered.length ? pct(offlineCount / filtered.length) : '—' },
      ] }),
      h(FilterBar, {
        keyword, onKeyword: setKeyword,
        groups: [
          { key: 'online', label: COPY.filter.online, value: online, onChange: setOnline, options: [{ value: '在线', label: '在线' }, { value: '离线', label: '离线' }] },
          { key: 'status', label: COPY.filter.deviceStatus, value: deviceStatus, onChange: setDeviceStatus, options: [...new Set((rows ?? []).map((row) => row.device_status).filter(Boolean))].map((value) => ({ value, label: value })) },
        ],
        onReset: () => { setKeyword(''); setOnline('all'); setDeviceStatus('all') },
        onReport, reportBusy,
      }),
      h('div', { className: 'dcDetailCharts' },
        h(DistDonut, { title: '在线状态分布', data: onlineDist.map((item) => ({ ...item, color: item.label === '离线' ? '#cf222e' : '#1a7f37' })) }),
        h(MiniBars, { title: '设备状态分布', data: statusDist.map((item) => ({ ...item, color: item.label === '正常' ? '#1a7f37' : '#9a6700' })) }),
        h(MiniBars, { title: '设备类型 TOP5', data: typeTop })),
      h(DataTable, { rows: filtered, columns: [
        { key: 'device_name', title: COPY.equipmentColumns[0] },
        { key: 'device_type', title: COPY.equipmentColumns[1] },
        { key: 'device_status', title: COPY.equipmentColumns[2] },
        { key: 'online_status', title: COPY.equipmentColumns[3] },
        { key: 'last_comm', title: COPY.equipmentColumns[4] },
        { key: 'comm_delay', title: COPY.equipmentColumns[5], render: (row) => (typeof row.comm_delay === 'number' ? row.comm_delay.toFixed(1) : '—') },
      ], emptyText: COPY.filter.emptyFiltered }),
      truncated ? h('p', { className: 'dcFootnote' }, COPY.truncated) : null
    )
  }

  function MetersPage({ rows, truncated, onReport, reportBusy }) {
    const [keyword, setKeyword] = useState('')
    const [category, setCategory] = useState('all')
    const categorized = useMemo(() => (rows ?? []).map((row) => ({ ...row, __category: faultCategoryOf(row) })), [rows])
    const categories = useMemo(() => [...new Set(categorized.map((row) => row.__category))], [categorized])
    const filtered = useMemo(() => {
      const needle = keyword.trim().toLowerCase()
      return categorized.filter((row) => {
        if (category !== 'all' && row.__category !== category) return false
        if (needle && !`${row.location ?? ''}${row.building ?? ''}${row.fault_desc ?? ''}`.toLowerCase().includes(needle)) return false
        return true
      })
    }, [categorized, keyword, category])
    const categoryDist = countBy(filtered, '__category')
    const bucketDist = countBy(filtered.map((row) => ({ ...row, __bucket: offlineBucketOf(row) })), '__bucket')
    const bucketOrder = [COPY.stat.within24h, COPY.stat.oneTo3d, COPY.stat.over3d, '未记录']
    const bucketSorted = bucketOrder.map((label) => bucketDist.find((item) => item.label === label)).filter(Boolean)
    const longest = filtered.reduce((max, row) => Math.max(max, Number(row.offline_hours ?? 0) || 0), 0)
    return h('div', { className: 'dcDetailPage' },
      h(StatStrip, { stats: [
        { label: COPY.stat.total, value: filtered.length },
        { label: COPY.stat.longestOffline, value: `${longest.toFixed(1)} ${COPY.stat.hours}`, tone: longest > 72 ? 'alert' : longest > 24 ? 'warn' : undefined },
        { label: COPY.stat.over3d, value: bucketDist.find((item) => item.label === COPY.stat.over3d)?.value ?? 0, tone: (bucketDist.find((item) => item.label === COPY.stat.over3d)?.value ?? 0) > 0 ? 'alert' : undefined },
        { label: COPY.stat.oneTo3d, value: bucketDist.find((item) => item.label === COPY.stat.oneTo3d)?.value ?? 0 },
        { label: COPY.stat.within24h, value: bucketDist.find((item) => item.label === COPY.stat.within24h)?.value ?? 0 },
      ] }),
      h(FilterBar, {
        keyword, onKeyword: setKeyword,
        groups: [
          { key: 'category', label: COPY.filter.faultCategory, value: category, onChange: setCategory, options: categories.map((value) => ({ value, label: value })) },
        ],
        onReset: () => { setKeyword(''); setCategory('all') },
        onReport, reportBusy,
      }),
      h('div', { className: 'dcDetailCharts' },
        h(DistDonut, { title: '故障类型分布', data: categoryDist.slice(0, 5).map((item, index) => ({ ...item, color: ['#cf222e', '#9a6700', '#8250df', '#0969da', '#656d76'][index] })) }),
        h(MiniBars, { title: COPY.stat.offlineDuration, data: bucketSorted })),
      h(DataTable, { rows: filtered, columns: [
        { key: 'building', title: COPY.metersColumns[0] },
        { key: 'location', title: COPY.metersColumns[1] },
        { key: 'fault_desc', title: COPY.metersColumns[2] },
        { key: '__category', title: COPY.metersColumns[3] },
        { key: 'data_time', title: COPY.metersColumns[4] },
        { key: 'offline_hours', title: COPY.metersColumns[5], render: (row) => (typeof row.offline_hours === 'number' ? row.offline_hours.toFixed(1) : '—') },
      ], emptyText: COPY.filter.emptyFiltered }),
      truncated ? h('p', { className: 'dcFootnote' }, COPY.truncated) : null
    )
  }

  function HazardsPage({ rows, truncated, onReport, reportBusy }) {
    const [keyword, setKeyword] = useState('')
    const [level, setLevel] = useState('all')
    const [status, setStatus] = useState('all')
    const [overdue, setOverdue] = useState('all')
    const isOverdueRow = (row) => (row.hazard_status !== '已整改') && (Number(row.remaining_days ?? 0) < 0)
    const filtered = useMemo(() => {
      const needle = keyword.trim().toLowerCase()
      return (rows ?? []).filter((row) => {
        if (level !== 'all' && row.level !== level) return false
        if (status !== 'all' && row.hazard_status !== status) return false
        if (overdue === 'yes' && !isOverdueRow(row)) return false
        if (overdue === 'no' && isOverdueRow(row)) return false
        if (needle && !`${row.description ?? ''}${row.responsible ?? ''}${row.category ?? ''}`.toLowerCase().includes(needle)) return false
        return true
      })
    }, [rows, keyword, level, status, overdue])
    const levelDist = countBy(filtered, 'level')
    const statusDist = countBy(filtered, 'hazard_status')
    const overdueCount = filtered.filter(isOverdueRow).length
    const rectified = filtered.filter((row) => row.hazard_status === '已整改').length
    const imminent = filtered.filter((row) => {
      const days = Number(row.remaining_days ?? Number.NaN)
      return row.hazard_status !== '已整改' && Number.isFinite(days) && days >= 0 && days <= 7
    }).length
    return h('div', { className: 'dcDetailPage' },
      h(StatStrip, { stats: [
        { label: COPY.stat.total, value: filtered.length },
        { label: COPY.stat.rectified, value: rectified },
        { label: COPY.stat.overdueUnfixed, value: overdueCount, tone: overdueCount > 0 ? 'alert' : undefined },
        { label: COPY.stat.imminentDays, value: imminent, tone: imminent > 0 ? 'warn' : undefined },
      ] }),
      h(FilterBar, {
        keyword, onKeyword: setKeyword,
        groups: [
          { key: 'level', label: COPY.filter.level, value: level, onChange: setLevel, options: [...new Set((rows ?? []).map((row) => row.level).filter(Boolean))].map((value) => ({ value, label: value })) },
          { key: 'status', label: COPY.filter.hazardStatus, value: status, onChange: setStatus, options: [...new Set((rows ?? []).map((row) => row.hazard_status).filter(Boolean))].map((value) => ({ value, label: value })) },
          { key: 'overdue', label: COPY.filter.overdue, value: overdue, onChange: setOverdue, options: [{ value: 'yes', label: COPY.filter.isOverdue }, { value: 'no', label: COPY.filter.notOverdue }] },
        ],
        onReset: () => { setKeyword(''); setLevel('all'); setStatus('all'); setOverdue('all') },
        onReport, reportBusy,
      }),
      h('div', { className: 'dcDetailCharts' },
        h(MiniBars, { title: '隐患等级分布', data: levelDist.map((item) => ({ ...item, color: item.label.includes('重大') ? '#cf222e' : item.label.includes('较大') ? '#9a6700' : '#0969da' })) }),
        h(MiniBars, { title: '整改状态分布', data: statusDist.map((item) => ({ ...item, color: item.label === '已整改' ? '#1a7f37' : '#cf222e' })) })),
      h(DataTable, { rows: filtered, columns: [
        { key: 'description', title: COPY.hazardsColumns[0] },
        { key: 'level', title: COPY.hazardsColumns[1], nowrap: true },
        { key: 'hazard_status', title: COPY.hazardsColumns[2], nowrap: true },
        { key: 'responsible', title: COPY.hazardsColumns[3], nowrap: true },
        { key: 'deadline', title: COPY.hazardsColumns[4], nowrap: true },
        // 已整改的隐患不再显示「剩余天数」：整改完成后该数字没有意义（会显示 -300 这类噪声）。
        { key: 'remaining_days', title: COPY.hazardsColumns[5], nowrap: true, render: (row) => {
          if (row.hazard_status === '已整改') return '—'
          if (typeof row.remaining_days !== 'number') return '—'
          const days = Math.round(row.remaining_days)
          return days < 0 ? `逾期 ${Math.abs(days)} 天` : `${days} 天`
        } },
      ], emptyText: COPY.filter.emptyFiltered }),
      truncated ? h('p', { className: 'dcFootnote' }, COPY.truncated) : null
    )
  }

  function DutiesPage({ rows, truncated, onReport, reportBusy }) {
    const [keyword, setKeyword] = useState('')
    const [status, setStatus] = useState('all')
    const [overdue, setOverdue] = useState('all')
    const isOverdueRow = (row) => (row.plan_status !== '已完成') && (Number(row.countdown ?? 0) < 0)
    const filtered = useMemo(() => {
      const needle = keyword.trim().toLowerCase()
      return (rows ?? []).filter((row) => {
        if (status !== 'all' && row.plan_status !== status) return false
        if (overdue === 'yes' && !isOverdueRow(row)) return false
        if (overdue === 'no' && isOverdueRow(row)) return false
        if (needle && !`${row.plan_type ?? ''}${row.position ?? ''}${row.responsible ?? ''}`.toLowerCase().includes(needle)) return false
        return true
      })
    }, [rows, keyword, status, overdue])
    const statusDist = countBy(filtered, 'plan_status')
    const completed = filtered.filter((row) => row.plan_status === '已完成').length
    const overdueCount = filtered.filter(isOverdueRow).length
    return h('div', { className: 'dcDetailPage' },
      h(StatStrip, { stats: [
        { label: COPY.stat.total, value: filtered.length },
        { label: COPY.stat.completed, value: completed },
        { label: COPY.stat.overdueUnfinished, value: overdueCount, tone: overdueCount > 0 ? 'alert' : undefined },
        { label: COPY.stat.uncompleted, value: filtered.length - completed, tone: filtered.length - completed > 0 ? 'warn' : undefined },
      ] }),
      h(FilterBar, {
        keyword, onKeyword: setKeyword,
        groups: [
          { key: 'status', label: COPY.filter.dutyStatus, value: status, onChange: setStatus, options: [...new Set((rows ?? []).map((row) => row.plan_status).filter(Boolean))].map((value) => ({ value, label: value })) },
          { key: 'overdue', label: COPY.filter.overdue, value: overdue, onChange: setOverdue, options: [{ value: 'yes', label: COPY.filter.isOverdue }, { value: 'no', label: COPY.filter.notOverdue }] },
        ],
        onReset: () => { setKeyword(''); setStatus('all'); setOverdue('all') },
        onReport, reportBusy,
      }),
      h('div', { className: 'dcDetailCharts' },
        h(MiniBars, { title: '值班状态分布', data: statusDist.map((item) => ({ ...item, color: item.label === '已完成' ? '#1a7f37' : item.label.includes('逾期') ? '#cf222e' : '#0969da' })) })),
      h(DataTable, { rows: filtered, columns: [
        { key: 'plan_type', title: COPY.dutiesColumns[0] },
        { key: 'position', title: COPY.dutiesColumns[1] },
        { key: 'responsible', title: COPY.dutiesColumns[2] },
        { key: 'start_date', title: COPY.dutiesColumns[3] },
        { key: 'end_date', title: COPY.dutiesColumns[4] },
        { key: 'plan_status', title: COPY.dutiesColumns[5] },
      ], emptyText: COPY.filter.emptyFiltered }),
      truncated ? h('p', { className: 'dcFootnote' }, COPY.truncated) : null
    )
  }

  function BudgetPage({ rows, onReport, reportBusy }) {
    const [keyword, setKeyword] = useState('')
    const filtered = useMemo(() => {
      const needle = keyword.trim().toLowerCase()
      if (!needle) return rows ?? []
      return (rows ?? []).filter((row) => String(row.subject ?? '').toLowerCase().includes(needle))
    }, [rows, keyword])
    const topUsage = topN([...(filtered ?? [])].sort((a, b) => (Number(b.yearly_usage) || 0) - (Number(a.yearly_usage) || 0)), 10)
      .map((row) => ({ label: row.subject, value: Math.round(Number(row.yearly_usage) || 0) }))
    return h('div', { className: 'dcDetailPage' },
      h(FilterBar, {
        keyword, onKeyword: setKeyword,
        groups: [],
        onReset: () => setKeyword(''),
        onReport, reportBusy,
      }),
      h('div', { className: 'dcDetailCharts' },
        h(MiniBars, { title: '年度使用金额 TOP10', data: topUsage })),
      h(BudgetTable, { rows: filtered })
    )
  }

  const TABS = [
    { id: 'overview', title: COPY.overview },
    { id: 'equipment', title: COPY.equipment },
    { id: 'meters', title: COPY.meters },
    { id: 'safety', title: COPY.safety },
    { id: 'budget', title: COPY.budget },
  ]

  function BusinessPanel({ service, entry, active, conversation, host }) {
    const [projects, setProjects] = useState([])
    const [selected, setSelected] = useState([])
    const [overview, setOverview] = useState(null)
    const [tab, setTab] = useState('overview')
    const [detail, setDetail] = useState({})
    const [loading, setLoading] = useState(true)
    const [detailLoading, setDetailLoading] = useState(false)
    const [error, setError] = useState('')
    const [picking, setPicking] = useState(false)
    const [aiBusy, setAiBusy] = useState(false)
    const [aiError, setAiError] = useState('')
    const [reportNotice, setReportNotice] = useState('')
    const [chatOpen, setChatOpen] = useState(false)

    const request = useCallback(async (path, options) => {
      const response = await fetch(path, { credentials: 'same-origin', cache: 'no-store', ...options })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.error || `HTTP ${response.status}`)
      return data
    }, [])

    const loadProjects = useCallback(async () => {
      const data = await request(`${API}/projects`)
      setProjects(Array.isArray(data.projects) ? data.projects : [])
    }, [request])

    const loadOverview = useCallback(async (names) => {
      if (!names.length) {
        setOverview(null)
        return
      }
      const query = names.map((name) => `project=${encodeURIComponent(name)}`).join('&')
      const data = await request(`${API}/overview?${query}`)
      setOverview(data)
    }, [request])

    // 界面标签 id 与服务端明细类型的映射：
    // 「安全隐患」页同时取隐患明细（hazards）与值班任务（duties）。
    const detailKindsFor = (tabId) => (tabId === 'safety' ? ['hazards', 'duties'] : [tabId])

    const loadDetail = useCallback(async (tabId, names) => {
      if (tabId === 'overview' || tabId === 'budget' || !names.length) return
      const kinds = detailKindsFor(tabId)
      setDetailLoading(true)
      try {
        const results = await Promise.all(names.flatMap((name) => kinds.map(async (kind) => {
          const data = await request(`${API}/rows?kind=${encodeURIComponent(kind)}&project=${encodeURIComponent(name)}`)
          return { kind, rows: data.rows ?? [], truncated: data.truncated }
        })))
        const next = {}
        for (const kind of kinds) {
          const matched = results.filter((item) => item.kind === kind)
          next[kind] = {
            rows: matched.flatMap((item) => item.rows),
            truncated: matched.some((item) => item.truncated),
          }
        }
        setDetail((previous) => ({ ...previous, ...next }))
      } catch (detailError) {
        setError(detailError instanceof Error ? detailError.message : String(detailError))
      } finally {
        setDetailLoading(false)
      }
    }, [request])

    useEffect(() => {
      let cancelled = false
      ;(async () => {
        setLoading(true)
        setError('')
        try {
          await loadProjects()
          const stored = await request(`${API}/selection`)
          const names = Array.isArray(stored.projects) ? stored.projects : []
          if (cancelled) return
          setSelected(names)
          setPicking(names.length === 0)
          await loadOverview(names)
        } catch (loadError) {
          if (!cancelled) setError(loadError instanceof Error ? loadError.message : String(loadError))
        } finally {
          if (!cancelled) setLoading(false)
        }
      })()
      return () => { cancelled = true }
    }, [loadOverview, loadProjects, request])

    useEffect(() => {
      void loadDetail(tab, selected)
    }, [loadDetail, selected, tab])

    const toggleProject = useCallback((name) => {
      setSelected((previous) => (previous.includes(name) ? previous.filter((item) => item !== name) : [...previous, name]))
    }, [])

    const confirmProjects = useCallback(async () => {
      setLoading(true)
      setError('')
      try {
        await request(`${API}/selection`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projects: selected }),
        })
        setPicking(false)
        await loadOverview(selected)
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : String(saveError))
      } finally {
        setLoading(false)
      }
    }, [loadOverview, request, selected])

    const refresh = useCallback(async () => {
      setLoading(true)
      setError('')
      try {
        await loadProjects()
        await loadOverview(selected)
      } catch (refreshError) {
        setError(refreshError instanceof Error ? refreshError.message : String(refreshError))
      } finally {
        setLoading(false)
      }
    }, [loadOverview, loadProjects, selected])

    const startAssistant = useCallback(async () => {
      setAiBusy(true)
      setAiError('')
      try {
        // service.run 是错误上报通道（不返回会话 id），创建 promise 交给它跟踪、结果由自己 await。
        const workspace = service?.defaultWorkspace?.()
        const creation = workspace ? service.newSession(workspace.workspaceId) : service.newWorkspaceSession()
        service?.run?.(creation)
        await creation
        setChatOpen(true)
      } catch (sessionError) {
        setAiError(sessionError instanceof Error ? sessionError.message : String(sessionError))
      } finally {
        setAiBusy(false)
      }
    }, [service])

    // 生成 AI 分析报告：创建/复用本工作台会话，把报告草稿写入对话输入框，由用户发送。
    const runReport = useCallback(async (prompt) => {
      setAiBusy(true)
      setAiError('')
      setReportNotice('')
      try {
        let sessionId = null
        const current = service?.currentSession?.()
        if (current && service?.ownsSession?.(current)) sessionId = current
        if (!sessionId) {
          const workspace = service?.defaultWorkspace?.()
          const creation = workspace ? service.newSession(workspace.workspaceId) : service.newWorkspaceSession()
          service?.run?.(creation)
          sessionId = await creation
        }
        if (!sessionId) {
          setAiError(COPY.report.noSession)
          return
        }
        // 写入草稿；用户已输入内容时不清空（保留其草稿），改用剪贴板兜底。
        const applied = writeDraft(host, sessionId, prompt)
        if (applied === 'applied') {
          setReportNotice(COPY.report.done)
        } else {
          void navigator?.clipboard?.writeText?.(prompt).catch(() => {})
          setReportNotice(applied === 'preserved' ? COPY.report.preserved : COPY.report.clipboard)
        }
        setChatOpen(true)
      } catch (sessionError) {
        setAiError(sessionError instanceof Error ? sessionError.message : String(sessionError))
      } finally {
        setAiBusy(false)
      }
    }, [service, host])

    const picker = useMemo(() => {
      if (loading && !overview) return h('div', { className: 'dcStatus' }, COPY.loading)
      if (error && !overview) {
        return h('div', { className: 'dcStatus dcStatus--error', role: 'alert' },
          h('p', null, `${COPY.loadFailed}：${error}`),
          h('button', { className: 'dcBtn', type: 'button', onClick: refresh }, COPY.retry)
        )
      }
      if (picking || selected.length === 0) {
        return h(ProjectPicker, {
          projects,
          selected,
          onToggle: toggleProject,
          onConfirm: confirmProjects,
          loading,
        })
      }
      return null
    }, [confirmProjects, error, loading, overview, picking, projects, refresh, selected, toggleProject])

    const reportFor = (kind, rows, truncated) => {
      const prompt = buildReportPrompt(kind, selected, rows, overview?.sync?.status?.last_sync, overview?.sync?.sync_info?.last_sync)
      return runReport(prompt)
    }

    const detailBody = useMemo(() => {
      if (tab === 'overview') return h(Overview, { data: overview, projects: overview?.projects ?? [] })
      if (tab === 'budget') return h(BudgetPage, { rows: overview?.budget ?? [], onReport: () => reportFor('budget', overview?.budget ?? []), reportBusy: aiBusy })
      // 「安全隐患」页 = 隐患明细 + 值班任务两个区块。
      if (tab === 'safety') {
        const hazards = detail.hazards
        const duties = detail.duties
        const loading = detailLoading && !hazards && !duties
        if (loading) return h('div', { className: 'dcStatus' }, COPY.loading)
        return h('div', { className: 'dcSafetyPage' },
          h('div', { className: 'dcSafetySection' },
            h('h3', { className: 'dcPanel__title' }, COPY.safetyHazardSection),
            h(HazardsPage, { rows: hazards?.rows ?? [], truncated: hazards?.truncated, onReport: () => reportFor('hazards', hazards?.rows ?? []), reportBusy: aiBusy })),
          h('div', { className: 'dcSafetySection' },
            h('h3', { className: 'dcPanel__title' }, COPY.safetyDutySection),
            h(DutiesPage, { rows: duties?.rows ?? [], truncated: duties?.truncated, onReport: () => reportFor('duties', duties?.rows ?? []), reportBusy: aiBusy }))
        )
      }
      const state = detail[tab]
      if (detailLoading && !state) return h('div', { className: 'dcStatus' }, COPY.loading)
      const rows = state?.rows ?? []
      const page = tab === 'equipment'
        ? h(EquipmentPage, { rows, truncated: state?.truncated, onReport: () => reportFor('equipment', rows), reportBusy: aiBusy })
        : h(MetersPage, { rows, truncated: state?.truncated, onReport: () => reportFor('meters', rows), reportBusy: aiBusy })
      return page
    }, [detail, detailLoading, overview, tab, aiBusy, selected])

    const header = h('header', { className: 'dcHeader', 'data-dsh-workbench-toolbar': '' },
      h('div', { className: 'dcHeader__titles' },
        h('h1', { className: 'dcHeader__title' }, COPY.title),
        h('p', { className: 'dcHeader__subtitle' }, COPY.subtitle)
      ),
      h('div', { className: 'dcHeader__actions' },
        selected.length > 0
          ? h('span', { className: 'dcHeader__projects', title: selected.join('、') },
            h('span', { className: 'dcHeader__projectsLabel' }, `${COPY.projects}：`),
            h('span', { className: 'dcHeader__projectsValue' }, selected.join('、'))
          )
          : null,
        selected.length > 0
          ? h('button', { className: 'dcBtn', type: 'button', onClick: () => setPicking(true) }, COPY.back)
          : null,
        selected.length > 0
          ? h('button', { className: 'dcBtn', type: 'button', onClick: refresh, disabled: loading }, COPY.refresh)
          : null,
        selected.length > 0
          ? h('button', {
            className: 'dcBtn dcBtn--primary',
            type: 'button',
            onClick: startAssistant,
            disabled: aiBusy,
            title: COPY.aiHelpHint,
          }, aiBusy ? COPY.aiWorking : COPY.aiHelp)
          : null
      )
    )

    const content = h('div', { className: 'dcContent' },
      picker ?? h('div', { className: 'dcWorkspace' },
        h('nav', { className: 'dcTabs', role: 'tablist', 'aria-label': '数据分类' },
          TABS.map((item) => h('button', {
            key: item.id,
            type: 'button',
            role: 'tab',
            className: 'dcTab',
            'aria-selected': item.id === tab,
            onClick: () => setTab(item.id),
          }, item.title))
        ),
        error ? h('div', { className: 'dcNotice', role: 'alert' }, `${COPY.loadFailed}：${error}`) : null,
        aiError ? h('div', { className: 'dcNotice', role: 'alert' }, aiError) : null,
        reportNotice ? h('div', { className: 'dcNotice', role: 'status' }, reportNotice) : null,
        h('section', { className: 'dcPanel', role: 'tabpanel' }, detailBody)
      )
    )

    if (!chatOpen) return h('div', { className: 'dcRoot' }, header, content)

    return h('div', { className: 'dcRoot dcRoot--chat' },
      header,
      h('div', { className: 'dcSplit' },
        content,
        h('aside', { className: 'dcChat', 'aria-label': 'AI 协助' }, conversation)
      )
    )
  }

  function apply(ctx) {
    // AI 分析报告需要宿主的会话与对话草稿能力。
    const host = {
      sessions: ctx.sessions,
      conversation: ctx.conversation,
    }
    const Panel = (props) => h(BusinessPanel, { ...props, host })
    ctx.effect(() => ctx.desktopWorkbenches.register({
      title: '数据管理中心',
      description: '按项目查看金鹰集团数据管理中心的设备、电表、安全隐患与预算执行情况，支持筛选、可视化与 AI 分析报告。',
      repository: 'https://github.com/Zcx-BaixiaoBai/ge-agent-market',
      customFrame: true,
      headerLayout: 'compact',
    }, Panel), 'datacenter workbench registration')
  }

  return { apply, inject: ['desktopWorkbenches', 'sessions', 'conversation'] }
}
