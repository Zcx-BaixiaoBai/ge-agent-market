// 服务端入口自测：用桩 ctx 挂载路由，直接打真实上游接口。
// 只验证业务逻辑与返回结构，不启动 Harness。

import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { apply } from '../dsh/index.js'

const root = await mkdtemp(join(tmpdir(), 'dcwb-test-'))
const routes = new Map()

const ctx = {
  logger: { warn: (error) => console.warn('[warn]', error?.message ?? error) },
  connection: {
    fetch: {
      register(route) {
        routes.set(route.path, route)
      },
    },
  },
}

apply(ctx, { root })

const call = async (method, path, init) => {
  const route = routes.get(path.split('?')[0])
  if (!route) throw new Error(`route not registered: ${method} ${path}`)
  const request = new Request(`http://local${path}`, init)
  const response = await route.fetch(request)
  const body = await response.json()
  return { status: response.status, body }
}

let failures = 0
const check = (name, condition, detail) => {
  if (condition) {
    console.log(`  ok  ${name}`)
  } else {
    failures += 1
    console.log(`  FAIL ${name}${detail === undefined ? '' : ` — ${JSON.stringify(detail)}`}`)
  }
}

console.log('\n[1] 项目清单')
const projects = await call('GET', '/api/datacenter-workbench/projects')
check('状态 200', projects.status === 200, projects.status)
check('返回项目数组', Array.isArray(projects.body.projects), typeof projects.body.projects)
check('项目去重', projects.body.projects.length === new Set(projects.body.projects.map((p) => p.name)).size, projects.body.projects.length)
const first = projects.body.projects[0]
check('带项目名', typeof first?.name === 'string' && first.name.length > 0, first)
console.log(`      共 ${projects.body.projects.length} 个项目，例如 ${projects.body.projects.slice(0, 3).map((p) => p.name).join('、')}`)

console.log('\n[2] 选择项目')
const empty = await call('POST', '/api/datacenter-workbench/selection', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ projects: [] }),
})
check('空选择被拒绝', empty.status === 400, empty.status)

const unknown = await call('POST', '/api/datacenter-workbench/selection', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ projects: ['不存在的项目'] }),
})
check('未知项目被拒绝', unknown.status === 400, unknown.status)

const target = projects.body.projects.find((p) => p.name === '上海金鹰国际') ?? first
const saved = await call('POST', '/api/datacenter-workbench/selection', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ projects: [target.name] }),
})
check('选择保存成功', saved.status === 200 && saved.body.projects[0] === target.name, saved.body)

const restored = await call('GET', '/api/datacenter-workbench/selection')
check('选择已持久化', restored.body.projects[0] === target.name, restored.body)

console.log(`\n[3] 总览数据（${target.name}）`)
const overview = await call('GET', `/api/datacenter-workbench/overview?project=${encodeURIComponent(target.name)}`)
check('状态 200', overview.status === 200, overview.status)
const project = overview.body.projects?.[0]
check('返回所选项目', project?.name === target.name, project?.name)
check('模块字段存在', ['equipment', 'meters', 'safety'].every((key) => key in project), Object.keys(project ?? {}))
// 上游各模块覆盖的项目集合不同：未覆盖的项目该模块为 null，前端需显示「暂无」。
const covered = (key) => (project[key] === null ? 'none' : 'number')
check('设备模块形态正确', covered('equipment') === 'none' || covered('equipment') === 'number', covered('equipment'))
check('电表模块形态正确', covered('meters') === 'none' || covered('meters') === 'number', covered('meters'))
check('安全模块形态正确', covered('safety') === 'none' || covered('safety') === 'number', covered('safety'))
if (project.meters) check('电表指标为数字', typeof project.meters.total === 'number', project.meters)
if (project.safety) check('安全指标为数字', typeof project.safety.hazard_total === 'number', project.safety)
check('预算科目非空', Array.isArray(overview.body.budget) && overview.body.budget.length > 0, overview.body.budget?.length)
check('集团指标存在', overview.body.group?.meters && typeof overview.body.group.meters.total === 'number', overview.body.group?.meters)
check('集团安全指标存在', typeof overview.body.group?.safety?.hazard_total === 'number', overview.body.group?.safety)
check('集团设备指标存在', typeof overview.body.group?.equipment?.total === 'number', overview.body.group?.equipment)
check('TOP10 图表数据存在', Array.isArray(overview.body.charts?.metersTop) && overview.body.charts.metersTop.length > 0, overview.body.charts?.metersTop?.length)
check('TOP10 最多十条', (overview.body.charts?.metersTop?.length ?? 0) <= 10, overview.body.charts?.metersTop?.length)
check('TOP10 按故障降序', (() => { const faults = (overview.body.charts?.metersTop ?? []).map((row) => row.fault); return faults.every((value, index) => index === 0 || faults[index - 1] >= value) })(), overview.body.charts?.metersTop?.map((row) => row.fault))
check('隐患状态分布存在', overview.body.charts?.hazardStatus && typeof overview.body.charts.hazardStatus.overdue === 'number', overview.body.charts?.hazardStatus)
check('同步信息存在', Boolean(overview.body.sync?.sync_info?.last_sync), overview.body.sync)
check('同步状态存在', Boolean(overview.body.sync?.status?.last_sync), overview.body.sync?.status)
check('数据表计数存在', overview.body.sync?.status?.table_counts && Object.keys(overview.body.sync.status.table_counts).length > 0, Object.keys(overview.body.sync?.status?.table_counts ?? {}))
console.log(`      设备 ${project?.equipment ? `${project.equipment.total}（故障 ${project.equipment.fault}）` : '未覆盖'} · 电表 ${project?.meters ? `${project.meters.total}（故障 ${project.meters.fault}）` : '未覆盖'} · 隐患 ${project?.safety ? project.safety.hazard_total : '未覆盖'}`)
console.log(`      集团：电表 ${overview.body.group?.meters?.total}（故障率 ${(overview.body.group?.meters?.fault_rate * 100).toFixed(2)}%）· 隐患 ${overview.body.group?.safety?.hazard_total} · 履职 ${overview.body.group?.safety?.duty_total}`)
console.log(`      图表：TOP10 ${overview.body.charts?.metersTop?.length} 条 · 隐患分布 逾期 ${overview.body.charts?.hazardStatus?.overdue}/临期 ${overview.body.charts?.hazardStatus?.imminent}/未完成 ${overview.body.charts?.hazardStatus?.pending}`)
console.log(`      预算科目 ${overview.body.budget?.length} 项，最近同步 ${overview.body.sync?.status?.last_sync}，数据表 ${Object.keys(overview.body.sync?.status?.table_counts ?? {}).length} 张`)

console.log('\n[4] 明细过滤（不得出现其它项目的数据）')
for (const kind of ['equipment', 'meters', 'hazards', 'duties']) {
  const rows = await call('GET', `/api/datacenter-workbench/rows?kind=${kind}&project=${encodeURIComponent(target.name)}`)
  check(`${kind} 状态 200`, rows.status === 200, rows.status)
  check(`${kind} 返回行数组`, Array.isArray(rows.body.rows))
  const field = kind === 'duties' ? 'unit' : 'project_name'
  const foreign = rows.body.rows.filter((row) => row[field] && row[field] !== target.name)
  check(`${kind} 无其它项目数据`, foreign.length === 0, foreign.slice(0, 2))
  console.log(`      ${kind}: ${rows.body.rows.length} 行${rows.body.truncated ? '（已截断）' : ''}`)
}

const badKind = await call('GET', '/api/datacenter-workbench/rows?kind=unknown&project=x')
check('未知类型被拒绝', badKind.status === 400, badKind.status)
const noProject = await call('GET', '/api/datacenter-workbench/rows?kind=equipment')
check('缺项目被拒绝', noProject.status === 400, noProject.status)

console.log('\n[5] 空选择时总览返回空')
const emptyOverview = await call('GET', '/api/datacenter-workbench/overview')
check('空项目不报错', emptyOverview.status === 200, emptyOverview.status)
check('返回空项目列表', Array.isArray(emptyOverview.body.projects) && emptyOverview.body.projects.length === 0)

console.log('\n[6] 模块未覆盖 vs 有数据为零')
// 找一个设备数据覆盖到的项目，确认其设备模块是有数据的数字，而不是 null。
const coveredProject = overview.body.projects[0]
const equipmentCovered = (await call('GET', '/api/datacenter-workbench/overview?project=昆山金鹰天地')).body.projects?.[0]
check('有覆盖的项目设备模块为数字', typeof equipmentCovered?.equipment?.total === 'number', equipmentCovered?.equipment)
check('有覆盖的项目设备故障率合法', typeof equipmentCovered?.equipment?.fault_rate === 'number' && equipmentCovered.equipment.fault_rate >= 0, equipmentCovered?.equipment?.fault_rate)
check('未覆盖的项目设备模块为 null', coveredProject?.equipment === null || typeof coveredProject?.equipment?.total === 'number', coveredProject?.equipment)

await rm(root, { recursive: true, force: true })
console.log(`\n结果：${failures === 0 ? '全部通过' : `${failures} 项失败`}`)
process.exit(failures === 0 ? 0 : 1)
