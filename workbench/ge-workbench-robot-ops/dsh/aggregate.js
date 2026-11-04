// 高仙机器人助手 —— 汇总计算
//
// 这里只做纯函数：把平台返回的原始结构整理成界面需要的快照，
// 不读文件、不发请求，方便直接用真实响应做单元测试。

// 内置常见状态，用于平台状态字典取不到时兜底。
export const WORK_STATUS_TEXT = {
  '0': '状态未定义',
  '-1': '未上报',
  100: '空闲中',
  120: '自动任务中',
  130: '梯控任务中',
  170: '导航中',
  180: '手动充电中',
  190: '自动充电中',
  210: '手动作业',
  220: '任务暂停',
  230: '自动任务中',
  330: '乘梯中',
  340: '去往乘梯点',
  380: '低功耗中',
  990: '无数据',
}

export const UNASSIGNED_PROJECT = '未归属项目'

// 平台把“在干活”拆成多个状态码：120/230 自动任务中、130/280 梯控任务中、210 手动作业。
export const TASKING_STATUS = new Set(['120', '130', '210', '230', '280'])
export const CHARGING_STATUS = new Set(['180', '190'])
export const DEFAULT_THRESHOLD = 0.2

export function statusText(value, labels = null) {
  if (value === null || value === undefined || value === '') return '—'
  const code = String(value)
  return labels?.[code] || WORK_STATUS_TEXT[code] || `状态 ${code}`
}

function num(value) {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function text(value) {
  return typeof value === 'string' ? value.trim() : ''
}

export function normalizeDevice(raw, labels = null) {
  const completeness = num(raw?.recent7DayCompleteness)
  return {
    sn: text(raw?.robotSn),
    alias: text(raw?.alias) || text(raw?.robotSn),
    workspace: text(raw?.workspaceName) || '',
    project: text(raw?.workspaceName) || UNASSIGNED_PROJECT,
    map: text(raw?.currentMapDisplayName),
    online: raw?.isOnline === true,
    status: raw?.workStatus ?? null,
    statusText: statusText(raw?.workStatus, labels),
    area7d: num(raw?.recent7DayTotalArea) ?? 0,
    coverage7d: num(raw?.recent7DayCoverageArea) ?? 0,
    completeness,
    alerts: num(raw?.pendingIncidentCount) ?? 0,
    lastOfflineTime: num(raw?.lastOfflineTime) ?? null,
    family: text(raw?.familyCodeDisplayName) || text(raw?.robotFamilyCode),
  }
}

function mean(values) {
  const usable = values.filter((value) => typeof value === 'number' && Number.isFinite(value))
  if (!usable.length) return null
  return usable.reduce((sum, value) => sum + value, 0) / usable.length
}

export function buildSnapshot(input) {
  const overview = input?.overview ?? {}
  const robots = Array.isArray(input?.robots) ? input.robots : []
  // 平台把阈值包在 taskCriteria 里；直接传阈值对象时也兼容。
  const criteria = input?.thresholds?.taskCriteria ?? input?.thresholds ?? {}
  const thresholdRaw = num(criteria.completionRateThreshold)
  const threshold = thresholdRaw === null ? DEFAULT_THRESHOLD : thresholdRaw
  const thresholdEnabled = criteria.completionRateEnable !== false

  const labels = input?.statusLabels ?? null
  const devices = robots.map((raw) => normalizeDevice(raw, labels))

  const projects = new Map()
  for (const device of devices) {
    const key = device.project
    const entry = projects.get(key) ?? {
      name: key,
      unassigned: key === UNASSIGNED_PROJECT,
      devices: 0,
      online: 0,
      offline: 0,
      tasking: 0,
      charging: 0,
      idle: 0,
      alerts: 0,
      area7d: 0,
      nonCompliant: 0,
      completenessValues: [],
    }
    entry.devices += 1
    entry.area7d += device.area7d
    entry.alerts += device.alerts
    if (device.online) entry.online += 1
    else entry.offline += 1
    if (TASKING_STATUS.has(String(device.status))) entry.tasking += 1
    if (CHARGING_STATUS.has(String(device.status))) entry.charging += 1
    if (String(device.status) === '100') entry.idle += 1
    if (device.completeness !== null) {
      entry.completenessValues.push(device.completeness)
      if (thresholdEnabled && device.completeness < threshold) entry.nonCompliant += 1
    }
    projects.set(key, entry)
  }

  const projectRows = [...projects.values()]
    .map((entry) => ({
      name: entry.name,
      unassigned: entry.unassigned,
      devices: entry.devices,
      online: entry.online,
      offline: entry.offline,
      tasking: entry.tasking,
      charging: entry.charging,
      idle: entry.idle,
      alerts: entry.alerts,
      area7d: Math.round(entry.area7d * 10) / 10,
      nonCompliant: entry.nonCompliant,
      completeness: mean(entry.completenessValues),
    }))
    .sort((left, right) => {
      if (left.unassigned !== right.unassigned) return left.unassigned ? 1 : -1
      const a = left.completeness ?? -1
      const b = right.completeness ?? -1
      if (a !== b) return a - b
      return right.devices - left.devices
    })

  const online = num(overview.onlineRobotCount) ?? devices.filter((device) => device.online).length
  const deviceTasking = devices.filter((device) => TASKING_STATUS.has(String(device.status))).length
  const tasking = num(overview.taskingRobotCount) ?? deviceTasking
  const total = num(overview.robotCount) ?? devices.length
  const offline = num(overview.offlineRobotCount) ?? Math.max(total - online, 0)
  const alerts = devices.reduce((sum, device) => sum + device.alerts, 0)
  const area7d = devices.reduce((sum, device) => sum + device.area7d, 0)
  const nonCompliant = thresholdEnabled
    ? devices.filter((device) => device.completeness !== null && device.completeness < threshold).length
    : 0

  // 状态分布按“在线时的具体状态 + 离线”分组，保证各段之和等于设备总数。
  const statusCounts = new Map()
  for (const device of devices) {
    const key = device.online ? device.statusText : '离线'
    statusCounts.set(key, (statusCounts.get(key) ?? 0) + 1)
  }
  const statusGroups = [...statusCounts.entries()]
    .map(([label, count]) => ({ label, count, pct: devices.length ? count / devices.length : 0 }))
    .sort((left, right) => right.count - left.count)

  return {
    fetchedAt: input?.fetchedAt ?? new Date().toISOString(),
    thresholds: {
      completionRate: threshold,
      completionRateEnabled: thresholdEnabled,
      workEfficiency: num(criteria.workEfficiencyThreshold),
      workEfficiencyEnabled: criteria.workEfficiencyEnable === true,
    },
    totals: {
      projects: num(overview.workspaceCount) ?? projectRows.length,
      robots: total,
      online,
      tasking,
      offline,
      idle: devices.filter((device) => String(device.status) === '100').length,
      charging: devices.filter((device) => CHARGING_STATUS.has(String(device.status))).length,
      alerts,
      nonCompliant,
      unassigned: projectRows.filter((row) => row.unassigned).reduce((sum, row) => sum + row.devices, 0),
      area7d: Math.round(area7d * 10) / 10,
      completeness: mean(devices.map((device) => device.completeness)),
    },
    projects: projectRows,
    devices,
    statusGroups,
    trend: Array.isArray(input?.trend) ? input.trend : [],
  }
}

// 单台设备的 7 天视图：平台把逐日数据拆成等长数组，这里转成逐日对象。
export function buildDeviceWindow(panel, threshold = DEFAULT_THRESHOLD) {
  const dates = Array.isArray(panel?.dates) ? panel.dates : []
  const areas = Array.isArray(panel?.totalAreas) ? panel.totalAreas : []
  const covered = Array.isArray(panel?.coverageAreas) ? panel.coverageAreas : []
  const days = dates.map((date, index) => {
    const area = num(areas[index]) ?? 0
    const coverage = num(covered[index]) ?? 0
    const completeness = area > 0 ? coverage / area : null
    return {
      date,
      area: Math.round(area * 10) / 10,
      coverage: Math.round(coverage * 10) / 10,
      completeness,
      compliant: completeness === null ? null : completeness >= threshold,
    }
  })
  return {
    days,
    overall: {
      area: num(panel?.overallTotalArea),
      coverage: num(panel?.overallCoverageArea),
      completeness: num(panel?.overallCompleteness),
      productivity: num(panel?.overallRealProductivity),
      durationMs: num(panel?.overallDurationMilliseconds),
    },
  }
}

// 集团近 7 天趋势：平台按设备返回逐日指标，这里按日期汇总。
export function buildTrend(rows, threshold = DEFAULT_THRESHOLD) {
  const byDate = new Map()
  for (const row of Array.isArray(rows) ? rows : []) {
    for (const metric of Array.isArray(row?.dailyMetrics) ? row.dailyMetrics : []) {
      const date = typeof metric?.date === 'string' ? metric.date : ''
      if (!date) continue
      const entry = byDate.get(date) ?? { area: 0, coverage: 0 }
      entry.area += num(metric.totalArea) ?? 0
      entry.coverage += num(metric.coverageArea) ?? 0
      byDate.set(date, entry)
    }
  }
  return [...byDate.entries()]
    .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
    .map(([date, entry]) => ({
      date,
      area: Math.round(entry.area * 10) / 10,
      coverage: Math.round(entry.coverage * 10) / 10,
      completeness: entry.area > 0 ? entry.coverage / entry.area : null,
      compliant: entry.area > 0 ? entry.coverage / entry.area >= threshold : null,
    }))
}

export function dayRange(days, now = new Date(), timeZone = 'Asia/Shanghai') {
  const format = (date) => new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
  const end = format(now)
  const startDate = new Date(now.getTime() - (days - 1) * 86400000)
  return { startDate: format(startDate), endDate: end }
}