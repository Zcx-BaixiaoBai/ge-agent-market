// 指标、排序与处理建议。
// 只依赖统一任务条目，不关心数据来自哪个系统。

import { DUE_SOON_HOURS, SYSTEMS, displayCategory } from './sources.js'

const HOUR = 3600 * 1000
const DAY = 24 * HOUR

function isOpen(item) {
  return item.status === 'unfinished'
}

// 旧版本存下的数据可能把「未完成」记成了 completed，这里按状态文本纠正一次。
function normalizedStatus(item) {
  if (item.status === 'completed' && /未完成|待整改|进行中|待处理|待履职|未开始/.test(String(item.statusLabel || ''))) {
    return 'unfinished'
  }
  return item.status
}

export function decorate(item, now = Date.now()) {
  const due = item.dueAt ? Date.parse(item.dueAt) : NaN
  const hasDue = Number.isFinite(due)
  const status = normalizedStatus(item)
  const open = status === 'unfinished'
  return {
    ...item,
    status,
    category: displayCategory(item.category),
    overdue: open && hasDue && due < now,
    dueSoon: open && hasDue && due >= now && due - now <= DUE_SOON_HOURS * HOUR,
    dueInDays: hasDue ? Math.round((due - now) / DAY) : null,
    daysLate: open && hasDue && due < now ? Math.floor((now - due) / DAY) : 0,
  }
}

function dueBuckets(items, now) {
  const counts = { overdue: 0, d0: 0, d1: 0, d2: 0, d3: 0, d4: 0, d5: 0, d6: 0, later: 0, none: 0 }
  for (const raw of items) {
    const item = decorate(raw, now)
    if (item.status !== 'unfinished') continue
    if (!item.dueAt) { counts.none++; continue }
    if (item.overdue) { counts.overdue++; continue }
    const day = Math.floor((Date.parse(item.dueAt) - now) / DAY)
    if (day <= 0) counts.d0++
    else if (day <= 6) counts[`d${day}`]++
    else counts.later++
  }
  return [
    { key: 'overdue', label: '已过期', count: counts.overdue, tone: 'risk' },
    { key: 'd0', label: '今天', count: counts.d0, tone: 'today' },
    { key: 'd1', label: '明天', count: counts.d1, tone: 'warn' },
    { key: 'd2', label: '2 天后', count: counts.d2, tone: 'plain' },
    { key: 'd3', label: '3 天后', count: counts.d3, tone: 'plain' },
    { key: 'd4', label: '4 天后', count: counts.d4, tone: 'plain' },
    { key: 'd5', label: '5 天后', count: counts.d5, tone: 'plain' },
    { key: 'd6', label: '6 天后', count: counts.d6, tone: 'plain' },
    { key: 'later', label: '更晚', count: counts.later, tone: 'plain' },
  ]
}

function categoryTop(items, now, limit = 6) {
  const counts = new Map()
  for (const raw of items) {
    const item = decorate(raw, now)
    if (item.status !== 'unfinished') continue
    const key = item.category || '未分类'
    counts.set(key, (counts.get(key) || 0) + 1)
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

function completionOf(items, now) {
  const metrics = metricsOf(items, now)
  const closed = metrics.completed + metrics.unfinished
  return {
    completed: metrics.completed,
    unfinished: metrics.unfinished,
    rate: closed ? metrics.completed / closed : 0,
  }
}

export function metricsOf(items, now = Date.now()) {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai' }).format(new Date(now))
  const metrics = {
    total: 0,
    unfinished: 0,
    completed: 0,
    voided: 0,
    dueSoon: 0,
    overdue: 0,
    dueToday: 0,
    completedToday: 0,
    noDue: 0,
  }
  for (const raw of items) {
    const item = decorate(raw, now)
    metrics.total++
    if (item.status === 'completed') metrics.completed++
    if (item.status === 'voided') metrics.voided++
    if (item.overdue) metrics.overdue++
    if (item.dueSoon) metrics.dueSoon++
    if (item.status === 'unfinished') {
      metrics.unfinished++
      if (!item.dueAt) metrics.noDue++
      if (item.dueAt && String(item.dueAt).slice(0, 10) === today) metrics.dueToday++
    }
    if (item.status === 'completed' && item.finishedAt && String(item.finishedAt).slice(0, 10) === today) {
      metrics.completedToday++
    }
  }
  return metrics
}

function priorityRank(item) {
  if (item.overdue) return 0
  if (item.dueSoon) return 1
  if (item.dueAt) return 2
  return 3
}

function byUrgency(a, b) {
  const rank = priorityRank(a) - priorityRank(b)
  if (rank !== 0) return rank
  const aDue = a.dueAt ? Date.parse(a.dueAt) : Number.POSITIVE_INFINITY
  const bDue = b.dueAt ? Date.parse(b.dueAt) : Number.POSITIVE_INFINITY
  return aDue - bDue
}

export function pickPriority(items, now = Date.now(), limit = 12) {
  return items
    .map((item) => decorate(item, now))
    .filter((item) => item.status === 'unfinished')
    .sort(byUrgency)
    .slice(0, limit)
}

export function buildAdvice({ systems, now = Date.now() }) {
  const advice = []
  const all = systems.flatMap((system) => system.decorated.map((item) => ({ ...item, systemTitle: system.title })))
  const overdue = all.filter((item) => item.overdue).sort((a, b) => b.daysLate - a.daysLate)
  const dueSoon = all.filter((item) => item.dueSoon).sort(byUrgency)
  const noDue = all.filter((item) => isOpen(item) && !item.dueAt)
  const disconnected = systems.filter((system) => !system.configured && !system.demo)
  const failed = systems.filter((system) => system.error)

  if (overdue.length) {
    const sample = overdue.slice(0, 3).map((item) => `${item.systemTitle}「${item.title}」`).join('、')
    advice.push({
      tone: 'risk',
      title: `${overdue.length} 条任务已经过期`,
      detail: `最久的一条已过期 ${overdue[0].daysLate} 天。建议今天先把 ${sample} 派到责任人，并在系统里更新处理进度。`,
    })
  }

  if (dueSoon.length) {
    const bySystem = new Map()
    for (const item of dueSoon) bySystem.set(item.systemTitle, (bySystem.get(item.systemTitle) || 0) + 1)
    const spread = [...bySystem.entries()].map(([title, count]) => `${title} ${count} 条`).join('、')
    advice.push({
      tone: 'warn',
      title: `未来 72 小时内有 ${dueSoon.length} 条任务到期`,
      detail: `分布在 ${spread}。建议按到期顺序提前安排人手，避免集中到期后再补救。`,
    })
  }

  if (noDue.length) {
    const systemsWithoutDue = [...new Set(noDue.map((item) => item.systemTitle))].join('、')
    advice.push({
      tone: 'info',
      title: `${noDue.length} 条未完成任务没有到期时间`,
      detail: `来自 ${systemsWithoutDue}，系统里没有可用的时限字段，暂时无法判断是否逾期；工单任务会按创建时间加处理时限估算，其余系统等原系统补上时限后会准确。`,
    })
  }

  if (failed.length) {
    advice.push({
      tone: 'warn',
      title: `${failed.length} 个系统这次没有取到数据`,
      detail: `${failed.map((system) => system.title).join('、')}：${failed[0].error || '请重新连接'}。首页其余数字来自已经取到的系统。`,
    })
  }

  if (disconnected.length) {
    advice.push({
      tone: 'info',
      title: `还有 ${disconnected.length} 个系统没有连接`,
      detail: `${disconnected.map((system) => system.title).join('、')} 还没有连接，暂时不计入汇总。在「连接设置」里填一次账号即可。`,
    })
  }

  if (!advice.length) {
    advice.push({
      tone: 'ok',
      title: '当前没有需要立刻处理的任务',
      detail: '四个系统都没有过期或 72 小时内到期的未完成任务，可以按计划推进。',
    })
  }

  return advice
}

// 只关心最近半年的任务：到期、创建、完成三个时间里只要有一个在半年内就保留。
const RECENT_DAYS = 180

export function isRecent(item, now = Date.now()) {
  const times = [item.dueAt, item.createdAt, item.finishedAt]
    .filter(Boolean)
    .map((value) => Date.parse(value))
    .filter((value) => Number.isFinite(value))
  if (!times.length) return true
  return Math.max(...times) >= now - RECENT_DAYS * DAY
}

export function projectOf(item) {
  if (item.project) return item.project
  // 旧快照里没有 project 字段时，从「项目 · 部门」或「机构 · 位置」的副标题里取第一段。
  const fromSubtitle = String(item.subtitle || '').split(' · ')[0].trim()
  if (fromSubtitle) return fromSubtitle
  if (item.category === '安全履职') return '集团'
  return '未标注项目'
}

function inScope(items, selected) {
  const list = Array.isArray(selected) ? selected.filter(Boolean) : []
  if (!list.length) return items
  // 项目名在不同系统里粒度不同（如「南京金鹰世界」与「南京金鹰世界-商业」），
  // 选中上级项目时把它下面的子项目一并算进来；「集团」级履职计划始终保留。
  return items.filter((item) => {
    const name = projectOf(item)
    if (name === '集团') return true
    return list.some((selected) => name === selected || name.startsWith(`${selected}-`))
  })
}

export function buildOverview({ snapshot, settings, now = Date.now() }) {
  const demo = Boolean(snapshot?.demo)
  const scopedItems = []
  const systems = SYSTEMS.map((meta) => {
    const collected = snapshot?.systems?.[meta.id]
    const items = inScope(
      (Array.isArray(collected?.items) ? collected.items : []).filter((item) => isRecent(item, now)),
      settings?.projects,
    )
    const configured = Boolean(settings?.systems?.[meta.id]?.configured)
    const connected = Boolean(collected) && !collected?.error && (configured || demo)
    scopedItems.push(...items)
    const decorated = items.map((item) => decorate(item, now))
    return {
      id: meta.id,
      title: meta.title,
      source: meta.source,
      connected,
      configured,
      demo,
      error: collected?.error ? String(collected.error).slice(0, 200) : null,
      fetchedAt: collected?.fetchedAt ?? null,
      note: collected?.note ?? '',
      metrics: metricsOf(items, now),
      decorated,
      priority: pickPriority(items, now, 4),
    }
  })

  const totals = systems.reduce((acc, system) => {
    for (const key of ['total', 'unfinished', 'completed', 'overdue', 'dueSoon', 'dueToday', 'completedToday', 'noDue']) {
      acc[key] += system.metrics[key] ?? 0
    }
    return acc
  }, { total: 0, unfinished: 0, completed: 0, overdue: 0, dueSoon: 0, dueToday: 0, completedToday: 0, noDue: 0 })

  const projectMap = new Map()
  for (const meta of SYSTEMS) {
    const collected = snapshot?.systems?.[meta.id]
    if (!collected || collected.error) continue
    for (const item of (Array.isArray(collected.items) ? collected.items : []).filter((entry) => isRecent(entry, now))) {
      const name = projectOf(item)
      const entry = projectMap.get(name) ?? { name, count: 0 }
      entry.count++
      projectMap.set(name, entry)
    }
  }
  const projects = [...projectMap.values()].sort((a, b) => b.count - a.count)

  const allDecorated = systems.flatMap((system) => system.decorated)

  return {
    updatedAt: snapshot?.fetchedAt ?? null,
    demo,
    projects,
    selectedProjects: Array.isArray(settings?.projects) ? settings.projects.filter(Boolean) : [],
    totals,
    completion: completionOf(scopedItems, now),
    dueDistribution: dueBuckets(scopedItems, now),
    categoryTop: categoryTop(scopedItems, now),
    systems: systems.map(({ decorated, ...rest }) => rest),
    priority: pickPriority(allDecorated, now, 14),
    advice: buildAdvice({ systems, now }),
  }
}

export function querySystem({ snapshot, systemId, filters = {}, now = Date.now() }) {
  const meta = SYSTEMS.find((system) => system.id === systemId)
  if (!meta) return null
  const collected = snapshot?.systems?.[systemId]
  const allRaw = (Array.isArray(collected?.items) ? collected.items : []).filter((item) => isRecent(item, now))
  const raw = inScope(allRaw, filters.projects)
  let rows = raw.map((item) => decorate(item, now))

  const status = String(filters.status ?? 'all')
  if (status === 'unfinished') rows = rows.filter((item) => item.status === 'unfinished')
  else if (status === 'overdue') rows = rows.filter((item) => item.overdue)
  else if (status === 'dueSoon') rows = rows.filter((item) => item.dueSoon)
  else if (status === 'completed') rows = rows.filter((item) => item.status === 'completed')
  else if (status === 'noDue') rows = rows.filter((item) => item.status === 'unfinished' && !item.dueAt)

  const category = String(filters.category ?? '')
  if (category) rows = rows.filter((item) => item.category === category)

  const keyword = String(filters.q ?? '').trim().toLowerCase()
  if (keyword) {
    rows = rows.filter((item) => [item.title, item.subtitle, item.category, item.owner, item.statusLabel]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(keyword)))
  }

  const field = filters.dateField === 'created' ? 'createdAt' : 'dueAt'
  const from = filters.from ? Date.parse(`${filters.from}T00:00:00+08:00`) : NaN
  const to = filters.to ? Date.parse(`${filters.to}T23:59:59+08:00`) : NaN
  if (Number.isFinite(from) || Number.isFinite(to)) {
    rows = rows.filter((item) => {
      if (!item[field]) return false
      const at = Date.parse(item[field])
      if (!Number.isFinite(at)) return false
      if (Number.isFinite(from) && at < from) return false
      if (Number.isFinite(to) && at > to) return false
      return true
    })
  }

  const categoryCounts = new Map()
  for (const item of raw.map((entry) => decorate(entry, now))) {
    categoryCounts.set(item.category, (categoryCounts.get(item.category) || 0) + 1)
  }

  rows.sort(byUrgency)
  const pageSize = Math.min(200, Math.max(1, Number(filters.pageSize) || 20))
  const page = Math.max(1, Number(filters.page) || 1)
  const total = rows.length

  return {
    system: { id: meta.id, title: meta.title, source: meta.source },
    connected: Boolean(collected) && !collected?.error,
    error: collected?.error ?? null,
    demo: Boolean(snapshot?.demo),
    fetchedAt: collected?.fetchedAt ?? null,
    metrics: metricsOf(raw, now),
    categories: [...categoryCounts.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count),
    total,
    page,
    pageSize,
    rows: rows.slice((page - 1) * pageSize, page * pageSize),
  }
}