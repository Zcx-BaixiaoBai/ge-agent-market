import Schema from '@deepseek-ai/schemastery'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

export const name = 'ge-workbench-datacenter'
export const inject = ['connection']

export const Config = Schema.object({
  root: Schema.string().required(),
})

const UPSTREAM = process.env.DATACENTER_API_BASE ?? 'http://datacenter.zcx-baixiaobai.cn/api'
const UPSTREAM_TIMEOUT_MS = 20_000
const CACHE_TTL_MS = 30_000
const MAX_ROWS = 500

const cache = new Map()

function fail(message, status = 500) {
  const error = new Error(message)
  error.status = status
  return error
}

async function fetchUpstream(path, params) {
  const url = new URL(UPSTREAM + path)
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value === undefined || value === null || value === '') continue
    url.searchParams.set(key, String(value))
  }
  const key = url.toString()
  const cached = cache.get(key)
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.value
  let response
  try {
    response = await fetch(key, {
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      headers: { accept: 'application/json' },
    })
  } catch (error) {
    throw fail(`无法连接数据管理中心：${error instanceof Error ? error.message : String(error)}`, 502)
  }
  if (!response.ok) throw fail(`数据管理中心返回 HTTP ${response.status}`, 502)
  const value = await response.json()
  cache.set(key, { at: Date.now(), value })
  return value
}

async function readJsonBody(request, limit = 64 * 1024) {
  const reader = request.body?.getReader()
  if (!reader) throw fail('缺少请求内容', 400)
  const chunks = []
  let size = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > limit) throw fail('请求内容过大', 413)
    chunks.push(value)
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    throw fail('请求内容不是合法 JSON', 400)
  }
}

function asProjectNames(value) {
  if (!Array.isArray(value)) return []
  const names = value.filter((item) => typeof item === 'string' && item.trim() !== '')
  return [...new Set(names)]
}

function projectDirectory() {
  const rows = Array.isArray(cache.get('projects:raw')?.value) ? cache.get('projects:raw').value : []
  const seen = new Map()
  for (const row of rows) {
    const name = typeof row?.project_name === 'string' ? row.project_name.trim() : ''
    if (!name) continue
    const current = seen.get(name) ?? { name, pm_name: null, eng_name: null, eng_email: null, erp_code: null }
    if (!current.pm_name && row.pm_name) current.pm_name = row.pm_name
    if (!current.eng_name && row.eng_name) current.eng_name = row.eng_name
    if (!current.eng_email && row.eng_email) current.eng_email = row.eng_email
    if (!current.erp_code && row.erp_code) current.erp_code = row.erp_code
    seen.set(name, current)
  }
  return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'))
}

function pickProject(rows, name) {
  if (!Array.isArray(rows)) return undefined
  return rows.find((row) => row?.project_name === name)
}

function numberOr(value, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function rate(total, fault) {
  if (!total) return 0
  return fault / total
}

function summarizeMeters(row) {
  if (!row) return null
  const total = numberOr(row.total)
  const fault = numberOr(row.fault)
  return {
    total,
    fault,
    fault_rate: numberOr(row.fault_rate, rate(total, fault)),
    offline: numberOr(row.offline),
    offline_rate: numberOr(row.offline_rate),
    abnormal: numberOr(row.abnormal),
    unpaid: numberOr(row.unpaid),
    evaluation: typeof row.evaluation === 'string' ? row.evaluation : '-',
    rank: numberOr(row.rank),
    eng_name: row.eng_name ?? null,
    pm_name: row.pm_name ?? null,
  }
}

function summarizeEquipment(row) {
  if (!row) return null
  const total = numberOr(row.total)
  const fault = numberOr(row.fault)
  return { total, fault, fault_rate: numberOr(row.fault_rate, rate(total, fault)) }
}

function summarizeSafety(row) {
  if (!row) return null
  const general = numberOr(row.hazard_general)
  const major = numberOr(row.hazard_major)
  const serious = numberOr(row.hazard_serious)
  return {
    duty_total: numberOr(row.duty_completed) + numberOr(row.duty_overdue) + numberOr(row.duty_overdue_done) + numberOr(row.duty_reporting) + numberOr(row.duty_started),
    duty_completed: numberOr(row.duty_completed),
    duty_overdue: numberOr(row.duty_overdue),
    duty_overdue_done: numberOr(row.duty_overdue_done),
    duty_started: numberOr(row.duty_started),
    hazard_total: general + major + serious,
    hazard_general: general,
    hazard_major: major,
    hazard_serious: serious,
    hazard_overdue: numberOr(row.overdue),
    hazard_imminent: numberOr(row.imminent),
    hazard_pending: numberOr(row.pending),
    wp_high: numberOr(row.wp_high),
    wp_low: numberOr(row.wp_low),
    wp_offline: numberOr(row.wp_offline),
  }
}

function budgetTable(budget) {
  const rows = Array.isArray(budget?.projects) ? budget.projects : []
  const group = rows.find((row) => row?.project_name === '集团汇总')
  const categories = group?.categories ?? {}
  return Object.entries(categories).map(([subject, value]) => ({
    subject,
    current_usage: numberOr(value?.current_usage),
    current_rate: value?.current_rate ?? '—',
    yearly_usage: numberOr(value?.yearly_usage),
    yearly_rate: value?.yearly_rate ?? '—',
  }))
}

export function apply(ctx, config) {
  const root = config.root
  const selectionFile = join(root, 'selection.json')

  const readSelection = async () => {
    try {
      const parsed = JSON.parse(await readFile(selectionFile, 'utf8'))
      return asProjectNames(parsed?.projects)
    } catch {
      return []
    }
  }

  const writeSelection = async (projects) => {
    await mkdir(dirname(selectionFile), { recursive: true })
    const temporary = `${selectionFile}.tmp`
    await writeFile(temporary, `${JSON.stringify({ projects, updatedAt: new Date().toISOString() }, null, 2)}\n`, 'utf8')
    await rename(temporary, selectionFile)
  }

  // 路由按路径注册（同一路径只注册一次），方法在处理函数内分流。
  const register = (path, handle) => {
    ctx.connection.fetch.register({
      path,
      methods: ['GET', 'POST'],
      requestBody: 'buffered',
      async fetch(request) {
        try {
          const result = await handle(request)
          return Response.json(result, { headers: { 'cache-control': 'no-store' } })
        } catch (error) {
          const status = typeof error?.status === 'number' ? error.status : 500
          return Response.json({ error: error instanceof Error ? error.message : String(error) }, {
            status,
            headers: { 'cache-control': 'no-store' },
          })
        }
      },
    })
  }

  register('/api/datacenter-workbench/projects', async () => {
    const rows = await fetchUpstream('/projects')
    cache.set('projects:raw', { at: Date.now(), value: rows })
    return { projects: projectDirectory() }
  })

  register('/api/datacenter-workbench/selection', async (request) => {
    if (request.method === 'POST') {
      const payload = await readJsonBody(request)
      const projects = asProjectNames(payload?.projects)
      if (!projects.length) throw fail('请至少选择一个项目', 400)
      const known = new Set(projectDirectory().map((item) => item.name))
      const unknown = projects.filter((name) => !known.has(name))
      if (unknown.length) throw fail(`未知项目：${unknown.join('、')}`, 400)
      await writeSelection(projects)
      return { projects }
    }
    return { projects: await readSelection() }
  })

  // 总览：集团级指标 + 图表数据始终返回（不依赖所选项目），
  // 所选项目的汇总只在选择了项目时返回。
  register('/api/datacenter-workbench/overview', async (request) => {
      const url = new URL(request.url)
      const selected = asProjectNames(url.searchParams.getAll('project'))
      const [equipment, meters, safety, budget, summary, syncStatus] = await Promise.all([
        fetchUpstream('/equipment'),
        fetchUpstream('/meters'),
        fetchUpstream('/safety'),
        fetchUpstream('/budget'),
        fetchUpstream('/summary'),
        fetchUpstream('/sync/status').catch(() => null),
      ])
      // 集团核心指标：与数据管理中心「集团总览」同口径。
      const group = {
        equipment: summary?.equipment ?? null,
        meters: summary?.meters ?? null,
        safety: summary?.safety ?? null,
      }
      // 图表数据：按故障数取前若干项目。
      const metersRows = Array.isArray(meters?.projects) ? meters.projects : []
      const byFaultDesc = (a, b) => numberOr(b?.fault) - numberOr(a?.fault)
      const topMeters = [...metersRows].sort(byFaultDesc).slice(0, 10)
        .map((row) => ({
          name: row?.project_name ?? '',
          total: numberOr(row?.total),
          fault: numberOr(row?.fault),
          offline: numberOr(row?.offline),
          abnormal: numberOr(row?.abnormal),
          unpaid: numberOr(row?.unpaid),
        }))
      const charts = {
        metersTop: topMeters,
        commFaults: topMeters,
        hazardStatus: safety?.summary ? {
          overdue: numberOr(safety.summary.overdue),
          imminent: numberOr(safety.summary.imminent),
          pending: numberOr(safety.summary.pending),
        } : null,
      }
      const sync = {
        sync_info: summary?.sync_info ?? null,
        status: syncStatus ? {
          last_sync: syncStatus.last_sync ?? null,
          table_counts: syncStatus.table_counts ?? null,
          recent_logs: (Array.isArray(syncStatus.recent_logs) ? syncStatus.recent_logs : []).slice(0, 5),
        } : null,
      }
      const directory = projectDirectory()
      const projects = selected.map((name) => {
        const meta = directory.find((item) => item.name === name)
        return {
          name,
          pm_name: meta?.pm_name ?? null,
          eng_name: meta?.eng_name ?? null,
          eng_email: meta?.eng_email ?? null,
          erp_code: meta?.erp_code ?? null,
          equipment: summarizeEquipment(pickProject(equipment?.projects, name)),
          meters: summarizeMeters(pickProject(meters?.projects, name)),
          safety: summarizeSafety(pickProject(safety?.projects, name)),
        }
      })
      const totals = projects.reduce((accumulator, project) => {
        for (const key of ['equipment', 'meters', 'safety']) {
          const source = project[key]
          if (!source) continue
          accumulator[key] ??= {}
          for (const [field, value] of Object.entries(source)) {
            if (typeof value === 'number') accumulator[key][field] = (accumulator[key][field] ?? 0) + value
          }
        }
        return accumulator
      }, {})
      if (totals.equipment) totals.equipment.fault_rate = rate(totals.equipment.total, totals.equipment.fault)
      if (totals.meters) totals.meters.fault_rate = rate(totals.meters.total, totals.meters.fault)
    return {
      group,
      charts,
      projects,
      totals,
      budget: budgetTable(budget),
      sync,
    }
  })

  register('/api/datacenter-workbench/rows', async (request) => {
      const url = new URL(request.url)
      const project = url.searchParams.get('project') ?? ''
      const kind = url.searchParams.get('kind') ?? ''
      if (!project) throw fail('缺少项目名称', 400)
      const routes = {
        equipment: ['/equipment/detail', 'project_name'],
        meters: ['/meters/detail', 'project_name'],
        hazards: ['/safety/hazards', 'project_name'],
        duties: ['/safety/duties', 'unit'],
      }
      const route = routes[kind]
      if (!route) throw fail('未知的数据类型', 400)
      const rows = await fetchUpstream(route[0], { project })
      const filtered = (Array.isArray(rows) ? rows : []).filter((row) => row?.[route[1]] === project)
    return { kind, project, rows: filtered.slice(0, MAX_ROWS), total: filtered.length, truncated: filtered.length > MAX_ROWS }
  })
}
