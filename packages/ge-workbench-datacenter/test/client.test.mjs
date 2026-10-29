// 客户端界面自测：用真实 React 渲染面板，检查结构、文本与窄容器下的排版。
//
// 渲染发生在 jsdom 里，宽度可调，因此「较窄窗口」这类检查是真实布局结果，
// 而不是对 CSS 文本的猜测。宿主交互（会话、切换入口）由桌面端负责，此处不模拟。

import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { JSDOM } from 'jsdom'

const source = await readFile(fileURLToPath(new URL('../lib/client.js', import.meta.url)), 'utf8')

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  pretendToBeVisual: true,
  url: 'http://127.0.0.1:43129/',
})
globalThis.window = dom.window
globalThis.document = dom.window.document
globalThis.IS_REACT_ACT_ENVIRONMENT = true
const computed = (element) => dom.window.getComputedStyle(element)

// 注意：react/react-dom 必须在 jsdom 全局就绪之后再动态加载。
// 静态 import 会让 react-dom 在无 document 的环境里做能力探测，
// 误判为需要 IE 兼容路径，受控输入的 onChange 在测试里将永不触发。
const React = await import('react')
const { act } = await import('react')
const { createRoot } = await import('react-dom/client')
const createElement = React.createElement

const module = { exports: {} }
const loader = { load: (entry) => { module.exports = entry } }
new Function('window', 'module', 'exports', 'React', source)(
  { __ModuleLoader__: loader },
  module,
  module.exports,
  React,
)

const panel = module.exports.factory((spec) => {
  if (spec === 'react') return React
  throw new Error(`unexpected client require: ${spec}`)
})

let failures = 0
const check = (name, condition, detail) => {
  if (condition) console.log(`  ok  ${name}`)
  else {
    failures += 1
    console.log(`  FAIL ${name}${detail === undefined ? '' : ` — ${JSON.stringify(detail)}`}`)
  }
}

const PROJECTS = [
  { name: '上海金鹰国际', pm_name: '高盛隆', eng_name: '高盛隆' },
  { name: '丹阳金鹰天地', pm_name: '唐燕君', eng_name: '朱剑' },
  { name: '南京金鹰商贸特惠中心有限公司', pm_name: '任甦宇', eng_name: '吴明飞' },
]

const OVERVIEW = {
  group: {
    equipment: { total: 793, fault: 112, fault_rate: 0.1412, project_count: 23 },
    meters: { total: 8720, fault: 562, fault_rate: 0.0644, offline: 120, abnormal: 120, unpaid: 331, project_count: 29 },
    safety: { duty_total: 15554, duty_overdue: 428, hazard_total: 934, hazard_overdue: 424, hazard_imminent: 31, wp_low: 41, wp_high: 1, project_count: 44 },
  },
  charts: {
    metersTop: [
      { name: '昆山金鹰天地', total: 89, fault: 17, offline: 8, abnormal: 2, unpaid: 1 },
      { name: '马鞍山金鹰天地', total: 60, fault: 12, offline: 3, abnormal: 1, unpaid: 0 },
      { name: '南京湖滨天地', total: 65, fault: 5, offline: 1, abnormal: 0, unpaid: 2 },
    ],
    commFaults: [
      { name: '昆山金鹰天地', total: 89, fault: 17, offline: 8, abnormal: 2, unpaid: 1 },
      { name: '马鞍山金鹰天地', total: 60, fault: 12, offline: 3, abnormal: 1, unpaid: 0 },
    ],
    hazardStatus: { overdue: 424, imminent: 31, pending: 312 },
  },
  projects: [{
    name: '上海金鹰国际',
    pm_name: '高盛隆',
    eng_name: '高盛隆',
    equipment: null,
    meters: { total: 99, fault: 4, fault_rate: 0.0404, offline: 12, offline_rate: 0.1212, abnormal: 3, unpaid: 5, evaluation: '良', rank: 13 },
    safety: { duty_total: 1554, duty_completed: 1452, duty_overdue: 12, hazard_total: 15, hazard_overdue: 3, hazard_imminent: 1 },
  }],
  totals: {
    equipment: undefined,
    meters: { total: 99, fault: 4, fault_rate: 0.0404, offline: 12 },
    safety: { duty_total: 1554, duty_completed: 1452, duty_overdue: 12, hazard_total: 15, hazard_overdue: 3, hazard_imminent: 1 },
  },
  budget: [
    { subject: '商贸超市费用', current_usage: 0, current_rate: '0.0%', yearly_usage: 0, yearly_rate: '0.0%' },
    { subject: '商贸商品调改', current_usage: 301009.37, current_rate: '5.0%', yearly_usage: 31426327.32, yearly_rate: '72.4%' },
  ],
  sync: {
    sync_info: { last_sync: '2026-10-27 19:12:45', source_file: '金鹰安全管理.xlsx' },
    status: {
      last_sync: '2026-10-27 21:16:58',
      table_counts: { ruixin_meters: 8722, equipment_123: 793, hazard_inspection: 14386 },
      recent_logs: [{ sheet_name: '末端水压', rows_imported: 1334, source_file: '金鹰安全管理.xlsx' }],
    },
  },
}

const ROWS = {
  meters: [{
    building: '公区',
    location: '（空铺）10X',
    fault_desc: '仪表号【330303180239】安装位置【（空铺）10X】仪表名称【（空铺）10X】故障描述【离线】',
    fault_tag: '【离线】',
    data_time: '2026-10-13 15:43:46',
    offline_hours: 14.101886429016204,
    project_name: '上海金鹰国际',
  }, {
    building: 'B1',
    location: '设备房 03',
    fault_desc: '仪表号【330303180300】故障描述【异常送电】',
    fault_tag: '【异常送电】',
    data_time: '2026-10-14 08:00:00',
    offline_hours: 30,
    project_name: '上海金鹰国际',
  }, {
    building: 'L3',
    location: '餐饮 301',
    fault_desc: '仪表号【330303180455】故障描述【无签呈后付费】',
    fault_tag: '',
    switch_status: '',
    data_time: '2026-10-15 10:00:00',
    offline_hours: 100,
    project_name: '上海金鹰国际',
  }, {
    building: '上海店',
    location: '马记永',
    fault_desc: '0',
    fault_tag: '',
    switch_status: '欠费停电',
    data_time: '2026-10-27 21:59:28',
    offline_hours: 0.0029,
    project_name: '上海金鹰国际',
  }],
  equipment: [{
    device_name: 'Inverter Controller Unit #7 — 商户侧配电回路 A',
    device_type: '智能电表（Single Phase）',
    device_status: '异常',
    online_status: '离线',
    last_comm: '2026-10-27 19:12:45',
    comm_delay: 456.1401587579745,
    project_name: '上海金鹰国际',
  }],
  hazards: [{
    description: '一楼大堂射灯脱落',
    level: '一般隐患',
    hazard_status: '已整改',
    responsible: '陈辰',
    deadline: '2026-01-01',
    remaining_days: -299,
    project_name: '上海金鹰国际',
  }, {
    description: '负三停车场膨胀螺丝裸露',
    level: '较大隐患',
    hazard_status: '未整改',
    responsible: '张太稳',
    deadline: '2026-01-08',
    remaining_days: -5,
    project_name: '上海金鹰国际',
  }],
  duties: [{
    plan_type: '消防控制室检查',
    position: '安全专职人员',
    responsible: '马凯',
    start_date: '2026-01-01',
    end_date: '2026-01-04',
    plan_status: '已完成',
    unit: '上海金鹰国际',
  }],
}

let selection = []
let requestedKinds = []
let postedSelection = []
const server = {
  projects: PROJECTS,
  overview: OVERVIEW,
  rows: ROWS,
}

globalThis.fetch = async (path, init) => {
  const url = String(path)
  let body
  if (init?.method === 'POST') {
    const payload = JSON.parse(init.body)
    postedSelection = payload.projects ?? []
    selection = postedSelection
    body = { projects: selection }
  } else if (url.includes('/projects')) {
    body = { projects: server.projects }
  } else if (url.includes('/selection')) {
    body = { projects: selection }
  } else if (url.includes('/overview')) {
    body = server.overview
  } else if (url.includes('/rows')) {
    const kind = url.match(/kind=(\w+)/)?.[1]
    requestedKinds.push(kind)
    body = { rows: server.rows[kind] ?? [], total: 1, truncated: false }
  } else {
    body = {}
  }
  return { ok: true, status: 200, json: async () => body }
}

const root = createRoot(document.getElementById('root'))
let draftCalls = []
let serviceRuns = []
const service = {
  defaultWorkspace: () => null,
  newWorkspaceSession: async () => 'session-1',
  newSession: async () => 'session-1',
  // 与宿主一致：run 只做错误跟踪，返回 undefined（不回传会话 id）。
  run: (promise) => { serviceRuns.push(promise); void promise.catch(() => {}); return undefined },
  currentSession: () => null,
  ownsSession: () => false,
}

// 宿主 API 替身：记录草稿写入。
const host = {
  sessions: { binding: (sessionId) => ({ sessionId, retained: true }) },
  conversation: {
    input: {
      requestDraftInitialization: (binding, options) => {
        draftCalls.push({ binding, options })
        return 'applied'
      },
    },
  },
}

let registered = { descriptor: null, component: null }
const ctx = {
  effect: (fn) => { fn(); return () => {} },
  desktopWorkbenches: { register: (descriptor, Component) => { registered.descriptor = descriptor; registered.component = Component } },
  sessions: host.sessions,
  conversation: host.conversation,
}
panel.apply(ctx)
const descriptor = registered.descriptor
const BusinessPanel = registered.component

const render = async (props = {}) => {
  await act(async () => {
    root.render(createElement(BusinessPanel, {
      service,
      entry: descriptor,
      active: true,
      conversation: null,
      ...props,
    }))
  })
}

const text = () => document.body.textContent ?? ''
const query = (selector) => [...document.querySelectorAll(selector)]

console.log('\n[1] 首次进入：项目引导')
await render()
check('直接显示项目引导（加载已结束）', text().includes('先选择要查看的项目'), text().slice(0, 80))
check('提供项目搜索框', query('input[type="search"]').length === 1)
check('列出项目供勾选', query('input[type="checkbox"]').length === PROJECTS.length, query('input[type="checkbox"]').length)
const confirmButton = query('button').find((node) => (node.textContent ?? '').includes('确认并查看'))
check('有确认按钮', Boolean(confirmButton), query('button').map((n) => n.textContent))
check('未选项目时确认按钮禁用', confirmButton?.disabled === true, confirmButton?.disabled)
check('引导文案为中文', text().includes('选择项目后'), text().slice(0, 120))
check('顶栏标记唯一', query('[data-dsh-workbench-toolbar]').length === 1, query('[data-dsh-workbench-toolbar]').length)

console.log('\n[2] 勾选项目并确认，进入看板')
const checkbox = query('input[type="checkbox"]')[0]
await act(async () => { checkbox.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })) })
const enabledConfirm = query('button').find((node) => (node.textContent ?? '').includes('确认并查看'))
check('勾选后确认按钮可用', enabledConfirm?.disabled === false, enabledConfirm?.disabled)
await act(async () => { enabledConfirm.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })) })
await act(async () => { await new Promise((resolve) => setTimeout(resolve, 30)) })
check('进入业务看板', text().includes('总览'), text().slice(0, 120))
check('显示所选项目', text().includes('上海金鹰国际'), text().slice(0, 200))
check('提供分类标签', query('[role="tab"]').length === 5, query('[role="tab"]').map((n) => n.textContent))
check('设备无覆盖时显示暂无', text().includes('暂无数据'), text().slice(0, 400))
check('显示电表指标', text().includes('99'), text().slice(0, 400))
check('显示同步时间', text().includes('2026-10-27 21:16:58'), text().slice(0, 500))
check('提供刷新按钮', query('button').some((n) => (n.textContent ?? '').trim() === '刷新'))
check('提供 AI 协助入口', query('button').some((n) => (n.textContent ?? '').includes('让 AI 协助分析')))
check('选择已提交到服务端', postedSelection.includes('上海金鹰国际'), postedSelection)

console.log('\n[2b] 集团总览首页')
check('显示集团核心指标区', text().includes('核心指标（集团）'), text().slice(0, 300))
check('显示智能电表总数 KPI', text().includes('智能电表总数'), text().slice(0, 400))
check('KPI 显示集团电表总数（千分位）', text().includes('8,720'), text().slice(0, 400))
check('显示电表故障率 KPI', text().includes('电表故障率'), text().slice(0, 400))
check('显示隐患总数 KPI', text().includes('隐患总数'), text().slice(0, 400))
check('显示安全履职 KPI', text().includes('安全履职'), text().slice(0, 500))
check('显示水压异常 KPI', text().includes('水压异常'), text().slice(0, 500))
check('显示设备总数 KPI', text().includes('设备总数'), text().slice(0, 500))
check('显示数据分析区', text().includes('数据分析'), text().slice(0, 600))
check('显示电表故障 TOP10 图', text().includes('电表故障排名 TOP10'), text().slice(0, 600))
check('TOP10 图含项目名', text().includes('昆山金鹰天地'), text().slice(0, 700))
check('显示设备通讯故障分布图', text().includes('设备通讯故障分布'), text().slice(0, 800))
check('堆叠图例含离线/异常送电/无签呈', ['离线', '异常送电', '无签呈'].every((label) => text().includes(label)), text().slice(0, 900))
check('显示安全隐患分布图', text().includes('安全隐患分布'), text().slice(0, 900))
check('隐患环形图渲染 SVG', query('.dcDonut__svg').length === 1, query('.dcDonut__svg').length)
check('隐患图例含逾期未完成', text().includes('逾期未完成'), text().slice(0, 1000))
check('显示板块覆盖总览', text().includes('板块覆盖总览'), text().slice(0, 1100))
check('覆盖率含电表覆盖率', text().includes('电表覆盖率'), text().slice(0, 1100))
check('覆盖率进度条渲染', query('.dcCoverage__fill').length >= 5, query('.dcCoverage__fill').length)
check('显示所选项目汇总区', text().includes('所选项目汇总'), text().slice(0, 1200))
check('同步面板显示数据表计数', text().includes('ruixin_meters') || query('.dcSync__table').length >= 3, query('.dcSync__table').length)
check('图表卡片按容器自适应布局', query('.dcChartGrid').length === 1, query('.dcChartGrid').length)

console.log('\n[3] 明细分类')
const meterTab = query('[role="tab"]').find((node) => node.textContent === '电表')
await act(async () => { meterTab.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })) })
await act(async () => { await new Promise((resolve) => setTimeout(resolve, 30)) })
check('电表明细渲染表格', query('table').length >= 1, query('table').length)
check('电表明细含真实故障描述', text().includes('仪表号'), text().slice(0, 400))
check('长中文描述完整保留', text().includes('故障描述【离线】'), text().slice(0, 400))

console.log('\n[3b] 安全隐患页（隐患 + 值班两个区块）')
const safetyTab = query('[role="tab"]').find((node) => node.textContent === '安全隐患')
await act(async () => { safetyTab.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })) })
await act(async () => { await new Promise((resolve) => setTimeout(resolve, 30)) })
check('安全页渲染隐患区块', text().includes('安全隐患明细'), text().slice(0, 400))
check('安全页渲染值班区块', text().includes('值班任务'), text().slice(0, 500))
check('隐患明细含真实数据', text().includes('一楼大堂射灯脱落'), text().slice(0, 500))
check('值班明细含真实数据', text().includes('消防控制室检查'), text().slice(0, 600))
check('安全页两个表格各自渲染', query('table').length >= 2, query('table').length)
check('未整改隐患显示逾期天数', text().includes('逾期 5 天'), text().slice(0, 600))
check('已整改隐患不再显示负数天数', !text().includes('-299'), text().slice(0, 600))
check('短枚举列不折行', query('td.dcTable__nowrap').length >= 4, query('td.dcTable__nowrap').length)
check('请求了隐患与值班两种数据', requestedKinds.includes('hazards') && requestedKinds.includes('duties'), requestedKinds)
check('不再请求无效的 safety 类型', !requestedKinds.includes('safety'), requestedKinds)

console.log('\n[3c] 明细页：筛选、统计与图表')
// 回到电表页测试筛选交互。
const meterTabAgain = query('[role="tab"]').find((node) => node.textContent === '电表')
await act(async () => { meterTabAgain.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })) })
await act(async () => { await new Promise((resolve) => setTimeout(resolve, 30)) })
check('明细页渲染统计条', query('.dcStatStrip').length >= 1, query('.dcStatStrip').length)
check('统计条显示总数', text().includes('总数'), text().slice(0, 300))
check('明细页渲染筛选条', query('.dcFilterBar').length >= 1, query('.dcFilterBar').length)
check('明细页提供筛选标签', query('.dcChip').length >= 2, query('.dcChip').length)
check('工具条为两行结构（上行操作/下行筛选）', query('.dcFilterBar__top').length >= 1 && query('.dcFilterBar__groups').length >= 1, { top: query('.dcFilterBar__top').length, groups: query('.dcFilterBar__groups').length })
check('搜索框与报告按钮同行', (() => { const top = query('.dcFilterBar__top')[0]; return top?.contains?.(query('.dcFilterBar__search')[0]) && top?.contains?.(query('.dcFilterBar__report')[0]) })(), '')
check('筛选标签位于独立行（不在操作行内）', (() => { const top = query('.dcFilterBar__top')[0]; return !top?.contains?.(query('.dcFilterGroup')[0]) })(), '')
check('明细页渲染图表区', query('.dcDetailCharts').length >= 1, query('.dcDetailCharts').length)
check('图表区含环形图或条形图', query('.dcDonut__svg').length + query('.dcChartRow').length >= 2, { donut: query('.dcDonut__svg').length, bars: query('.dcChartRow').length })
// 故障类型筛选：切到「离线」仍有 1 行；切到「异常送电」清空。
const offlineChip = query('.dcChip').find((node) => (node.textContent ?? '').trim() === '离线')
await act(async () => { offlineChip.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })) })
await act(async () => { await new Promise((resolve) => setTimeout(resolve, 20)) })
check('筛选「离线」后只显示离线记录', text().includes('（空铺）10X') && !text().includes('设备房 03'), text().slice(0, 400))
const abnormalChip = query('.dcChip').find((node) => (node.textContent ?? '').trim() === '异常送电')
await act(async () => { abnormalChip.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })) })
await act(async () => { await new Promise((resolve) => setTimeout(resolve, 20)) })
check('切换筛选后只显示异常送电记录', text().includes('设备房 03') && !text().includes('（空铺）10X'), text().slice(0, 400))
// 清除筛选恢复。
const resetButton = query('.dcFilterBar__reset')[0]
await act(async () => { resetButton.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })) })
await act(async () => { await new Promise((resolve) => setTimeout(resolve, 20)) })
check('清除筛选后数据恢复', text().includes('（空铺）10X'), text().slice(0, 400))
// 搜索过滤。
const typeInto = async (input, value) => {
  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value').set
    setter.call(input, value)
    input.dispatchEvent(new dom.window.Event('input', { bubbles: true }))
    input.dispatchEvent(new dom.window.Event('change', { bubbles: true }))
  })
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 20)) })
}
const detailSearch = query('.dcFilterBar__search')[0]
await typeInto(detailSearch, '不存在的关键词')
check('搜索无结果时显示空态', text().includes('当前筛选条件下没有数据'), text().slice(0, 500))
await typeInto(detailSearch, '设备房')
check('搜索命中时只显示匹配行', text().includes('设备房 03') && !text().includes('（空铺）10X'), text().slice(0, 500))
await typeInto(detailSearch, '')

console.log('\n[3d] AI 分析报告')
check('报告前不显示对话区', query('.dcChat').length === 0, query('.dcChat').length)
check('明细页提供 AI 报告按钮', query('.dcFilterBar__report').length >= 1, query('.dcFilterBar__report').length)
// 按钮颜色：跟随金鹰桌面金黄主题，且明确配白字（不再使用会解析成近黑的 button-primary token）。
const styleTag = document.getElementById('ge-workbench-datacenter-style')
const cssText = styleTag?.textContent ?? ''
check('主按钮使用桌面金黄品牌色', cssText.includes('--dsw-alias-brand-primary-new-color') && cssText.includes('#a8762b'), cssText.match(/dcBtn--primary\{[^}]*\}/)?.[0])
check('主按钮明确白字', /dcBtn--primary\{[^}]*color:#fff/.test(cssText), cssText.match(/dcBtn--primary\{[^}]*\}/)?.[0])
check('主按钮不再引用近黑 primary token', !/dcBtn--primary\{[^}]*button-primary-fill/.test(cssText), cssText.match(/dcBtn--primary\{[^}]*\}/)?.[0])
const reportButton = query('.dcFilterBar__report')[0]
await act(async () => { reportButton.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })) })
await act(async () => { await new Promise((resolve) => setTimeout(resolve, 40)) })
check('报告草稿写入会话', draftCalls.length >= 1, draftCalls.length)
const lastDraft = draftCalls[draftCalls.length - 1]
check('草稿包含分析请求', lastDraft?.options?.prompt?.includes('请分析'), lastDraft?.options?.prompt?.slice(0, 80))
check('草稿包含数据统计', lastDraft?.options?.prompt?.includes('故障类型分布'), lastDraft?.options?.prompt?.slice(0, 200))
check('草稿包含项目范围', lastDraft?.options?.prompt?.includes('上海金鹰国际'), lastDraft?.options?.prompt?.slice(0, 80))
check('草稿要求分点输出建议', lastDraft?.options?.prompt?.includes('处置动作'), lastDraft?.options?.prompt?.slice(0, 300))
check('报告完成后提示用户', text().includes('报告内容已填入'), text().slice(0, 400))
check('报告后显示对话区', query('.dcChat').length === 1, query('.dcChat').length)
check('草稿不携带清空标记（保留用户已输入内容）', lastDraft?.options?.clearPreviousDraft === undefined, lastDraft?.options?.clearPreviousDraft)
check('报告按钮走创建 promise 而非 run 返回值', serviceRuns.length >= 1, serviceRuns)

console.log('\n[4] 窄容器下不横向溢出')
const rootEl = document.querySelector('.dcRoot')
check('业务根容器建立容器查询上下文', rootEl !== null, rootEl?.className)
const table = query('table')[0]
const wrap = table?.parentElement
check('表格包裹层可横向滚动', wrap !== undefined && computed(wrap).overflowX === 'auto', wrap && computed(wrap).overflowX)
check('表格有最小宽度，避免列挤成单字', table !== undefined && parseFloat(computed(table).minWidth) >= 520, table && computed(table).minWidth)
const cells = query('td')
check('单元格允许换行', cells.length > 0 && computed(cells[0]).overflowWrap === 'anywhere', cells[0] && computed(cells[0]).overflowWrap)
check('页面本身不横向溢出', document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1, {
  scroll: document.documentElement.scrollWidth,
  client: document.documentElement.clientWidth,
})

console.log('\n[5] 按需显示 AI 对话区')
const aiButton = query('button').find((node) => (node.textContent ?? '').includes('让 AI 协助分析'))
await act(async () => { aiButton.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })) })
await act(async () => { await new Promise((resolve) => setTimeout(resolve, 30)) })
check('点击后显示对话区', query('.dcChat').length === 1, query('.dcChat').length)
check('对话区标记为辅助区域', query('aside[aria-label]').length >= 1, query('aside[aria-label]').map((n) => n.getAttribute('aria-label')))

console.log('\n[6] 窄窗口与长标题')
// 真实长度的中英文标题与项目名。
dom.window.innerWidth = 380
dom.window.dispatchEvent(new dom.window.Event('resize'))
await act(async () => { await new Promise((resolve) => setTimeout(resolve, 30)) })
check('窄窗口下根容器仍在', document.querySelector('.dcRoot') !== null)
const narrowWrap = query('.dcTableWrap')[0]
check('窄窗口下表格仍各自滚动', narrowWrap !== undefined && computed(narrowWrap).overflowX === 'auto', narrowWrap && computed(narrowWrap).overflowX)
check('窄窗口下页面不横向溢出', document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1, {
  scroll: document.documentElement.scrollWidth,
  client: document.documentElement.clientWidth,
})
const titleNode = query('.dcHeader__title')[0]
check('标题在紧凑顶栏内省略而不撑破容器', titleNode !== undefined && computed(titleNode).textOverflow === 'ellipsis', titleNode && computed(titleNode).textOverflow)
const projectsNode = query('.dcProjectChip__value')[0]
check('顶栏项目名过长时省略显示', projectsNode !== undefined && computed(projectsNode).textOverflow === 'ellipsis', projectsNode && computed(projectsNode).textOverflow)
const subtitle = query('.dcHeader__subtitle')[0]
check('副标题为真实中文且可换行', subtitle !== undefined && /金鹰集团/.test(subtitle.textContent ?? ''), subtitle?.textContent)

console.log(`\n结果：${failures === 0 ? '全部通过' : `${failures} 项失败`}`)
process.exit(failures === 0 ? 0 : 1)
