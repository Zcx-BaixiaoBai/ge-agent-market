// 四个任务系统的只读适配器。
//
// 每个适配器只做两件事：把远端数据规范成统一任务条目、把错误说清楚。
// 指标与建议由 insights.js 统一计算，界面不关心数据来自哪个系统。
//
// 需要用户提供的只有两样：各系统的账号密码，以及一个多模态模型
// （用来识别工单系统的算式验证码）。

import { createHash } from 'node:crypto'
import smCrypto from 'sm-crypto'

const { sm2 } = smCrypto

// 金鹰安全（Snowy 1.8）前端登录页使用的 SM2 公钥，密码按 SM2 加密后提交。
const SAFETY_SM2_PUBLIC_KEY = '04298364ec840088475eae92a591e01284d1abefcda348b47eb324bb521bb03b0b2a5bc393f6b71dabb8f15c99a0050818b56b23f31743b93df9cf8948f15ddb54'

export const SYSTEMS = [
  {
    id: 'plan',
    title: '金鹰PLAN',
    source: '筹建专项计划',
    home: 'http://58.213.109.123:8181',
    hint: '账号密码与筹建专项计划系统一致，需要能看到专项计划列表。',
  },
  {
    id: 'ipms',
    title: '巡检维保',
    source: 'IPMS 设备管理系统',
    home: 'https://ipms.jinying.com',
    hint: '账号密码与 IPMS 设备系统一致，只读取巡检与维保任务。',
  },
  {
    id: 'safety',
    title: '金鹰安全',
    source: '金鹰物业安全管理系统',
    home: 'http://safety.jinying.com:18181',
    hint: '账号密码与安全管理系统一致，只读取隐患整改与安全维保任务。',
  },
  {
    id: 'workorder',
    title: '工单任务',
    source: '金鹰智慧物业运营平台',
    home: 'http://ge-propel-web.jinying.com',
    hint: '账号密码与工单系统一致；登录时的算式验证码由多模态模型自动识别。',
  },
]

export const SYSTEM_IDS = SYSTEMS.map((system) => system.id)

export const DUE_SOON_HOURS = 72
export const WORKORDER_SLA_HOURS = 72

export function systemMeta(id) {
  return SYSTEMS.find((system) => system.id === id) ?? null
}

export function fail(message, status = 500) {
  const error = new Error(message)
  error.status = status
  return error
}

function text(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : ''
}

function shortBody(value) {
  const raw = typeof value === 'string' ? value : ''
  const compact = raw.replace(/\s+/g, ' ').trim()
  return compact.length > 120 ? `${compact.slice(0, 120)}…` : compact
}

// 把 '2026-11-03'、'2026-11-03 18:00:00'、ISO 串统一成带时区的 ISO。
// 只给日期的字段按当天 23:59 计，避免「今天到期」在上午就被判成逾期。
export function parseDue(value) {
  const raw = String(value ?? '').trim()
  if (!raw || raw === 'None' || raw === 'null') return null
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(raw)
  const normalized = dateOnly
    ? `${raw}T23:59:59+08:00`
    : /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?$/.test(raw)
      ? `${raw.replace(' ', 'T')}+08:00`
      : raw
  const parsed = new Date(normalized)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

function md5(value) {
  return createHash('md5').update(String(value)).digest('hex')
}

async function readJson(response, label) {
  const body = await response.text()
  if (!response.ok) throw fail(`${label}返回 HTTP ${response.status}：${shortBody(body)}`, 502)
  try {
    return JSON.parse(body)
  } catch {
    throw fail(`${label}返回内容不是 JSON：${shortBody(body)}`, 502)
  }
}

async function request(url, options, label, timeoutMs = 20_000) {
  let response
  try {
    response = await fetch(url, { ...options, signal: AbortSignal.timeout(timeoutMs) })
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    throw fail(`${label}无法连接：${reason}`, 502)
  }
  return response
}

// 极简 Cookie 罐：金鹰PLAN 的会话只依赖服务端下发的 Cookie。
class CookieJar {
  constructor() {
    this.cookies = new Map()
  }

  absorb(response) {
    const raw = typeof response.headers.getSetCookie === 'function'
      ? response.headers.getSetCookie()
      : [response.headers.get('set-cookie')].filter(Boolean)
    for (const line of raw) {
      const pair = String(line).split(';')[0]
      const equal = pair.indexOf('=')
      if (equal <= 0) continue
      this.cookies.set(pair.slice(0, equal).trim(), pair.slice(equal + 1).trim())
    }
  }

  header() {
    return [...this.cookies.entries()].map(([key, value]) => `${key}=${value}`).join('; ')
  }
}

// ---------- 多模态模型识别验证码 ----------

const OCR_PROMPT = '这是一张算术验证码图片，形如 3+5=? 或 2*4=?，由数字和 + - * = ? 组成。先读出算式，再算出结果，最后只输出一行：算式=结果，例如 3+5=8。不要输出其他文字。'

// 推理模型会把猜测过程写进 reasoning_content，取最后一条「算式=结果」更接近结论。
function solveArithmeticFromReasoning(raw) {
  const textValue = String(raw ?? '')
  if (!textValue) return null
  const finals = [...textValue.matchAll(/(\d+)\s*([+\-*×xX])\s*(\d+)\s*=\s*(-?\d+)/g)]
  if (finals.length) {
    const last = finals[finals.length - 1]
    const computed = solveArithmetic(`${last[1]}${last[2]}${last[3]}`)
    if (computed && computed === last[4]) return last[4]
  }
  const marked = [...textValue.matchAll(/(?:答案|结果|所以)\s*[是为：:\s]*\**\s*(-?\d+)/g)]
  if (marked.length) return marked[marked.length - 1][1]
  const all = [...textValue.matchAll(/(\d+)\s*([+\-*×xX])\s*(\d+)/g)]
  if (all.length) return solveArithmetic(`${all[all.length - 1][1]}${all[all.length - 1][2]}${all[all.length - 1][3]}`)
  return null
}

export function solveArithmetic(raw) {
  const match = String(raw ?? '').match(/(\d+)\s*([+\-*×xX])\s*(\d+)/)
  if (!match) return null
  const a = Number(match[1])
  const b = Number(match[3])
  const op = match[2]
  if (op === '+') return String(a + b)
  if (op === '-') return String(a - b)
  return String(a * b)
}

export async function recognizeCaptcha(image, model) {
  const apiBase = text(model?.apiBase)
  const apiKey = text(model?.apiKey)
  const modelName = text(model?.model)
  if (!apiBase || !apiKey || !modelName) {
    throw fail('还没有填多模态模型。工单系统登录需要它识别算式验证码，请先在「连接设置」里填写接口地址、API Key 和模型名。', 400)
  }
  const base = apiBase.replace(/\/+$/, '')
  const url = /\/chat\/completions$/.test(base) ? base : `${base}/chat/completions`
  const body = {
    model: modelName,
    max_tokens: 1200,
    temperature: 0,
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: OCR_PROMPT },
        { type: 'image_url', image_url: { url: image } },
      ],
    }],
  }
  let response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    })
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    throw fail(`多模态模型无法连接：${reason}`, 502)
  }
  const payload = await response.text()
  if (!response.ok) {
    throw fail(`多模态模型返回 HTTP ${response.status}：${shortBody(payload)}`, 502)
  }
  let parsed
  try {
    parsed = JSON.parse(payload)
  } catch {
    throw fail(`多模态模型返回内容不是 JSON：${shortBody(payload)}`, 502)
  }
  const message = parsed?.choices?.[0]?.message ?? {}
  const content = typeof message.content === 'string'
    ? message.content
    : Array.isArray(message.content)
      ? message.content.map((part) => part?.text ?? '').join(' ')
      : ''
  // 推理类模型可能把结论写在 reasoning_content 里、正文为空：优先正文，其次推理结尾。
  const answer = solveArithmetic(content) || solveArithmeticFromReasoning(message.reasoning_content)
  if (!answer) throw fail('没能从验证码图片里读出算式，请稍后重试或换一个视觉模型。', 502)
  return answer
}

// ---------- 金鹰PLAN ----------

function planItem(row, projectName, index) {
  const planEnd = parseDue(row.plan_end_date)
  const finished = Number(row.finish_flag) === 1 || Boolean(text(row.real_end_date))
  const dangerous = Number(row.danger_flag) === 1
  const special = text(row.special_name)
  const content = text(row.plan_content)
  return {
    id: `plan-${text(row.special_detail_id) || text(row.special_id) || index}`,
    system: 'plan',
    title: content || special || `专项计划 ${index + 1}`,
    subtitle: [projectName || text(row.project_name), special || text(row.plan_dept)].filter(Boolean).join(' · '),
    project: projectName || text(row.project_name),
    category: special || text(row.plan_dept) || '专项计划',
    owner: text(row.plan_person) || text(row.person_name),
    status: finished ? 'completed' : 'unfinished',
    statusLabel: finished ? '已完成' : dangerous ? '已逾期' : text(row.plan_state) || '进行中',
    dueAt: planEnd,
    createdAt: parseDue(row.plan_start_date),
    finishedAt: parseDue(row.real_end_date),
    extra: { dept: text(row.plan_dept), state: text(row.plan_state) },
  }
}

export async function collectPlan(settings, secrets) {
  const base = (text(settings.baseUrl) || 'http://58.213.109.123:8181').replace(/\/+$/, '')
  const username = text(secrets?.username)
  const password = text(secrets?.password)
  if (!username || !password) throw fail('还没有填写金鹰PLAN 的账号密码', 400)

  const jar = new CookieJar()
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36',
    'X-Requested-With': 'XMLHttpRequest',
  }

  const loginPage = await request(`${base}/Login/doLogin`, { headers, redirect: 'manual' }, '金鹰PLAN 登录页')
  jar.absorb(loginPage)

  const loginResponse = await request(`${base}/Login/login`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json', ...(jar.header() ? { cookie: jar.header() } : {}) },
    body: JSON.stringify({ login_name: username, password: md5(password), type: '1' }),
  }, '金鹰PLAN 登录')
  jar.absorb(loginResponse)
  const login = await readJson(loginResponse, '金鹰PLAN 登录')
  if (Number(login.result) !== 0) throw fail(`金鹰PLAN 登录失败：${text(login.msg) || '账号或密码不正确'}`, 401)

  const cookie = jar.header() ? { cookie: jar.header() } : {}

  const projectBody = new URLSearchParams({
    pageNumber: '1',
    pageSize: '200',
    paramList: JSON.stringify({ project_name: '', plan_end_date_b: '', plan_end_date_e: '' }),
  })
  const projectResponse = await request(`${base}/WYProject/getPlanAllList`, {
    method: 'POST',
    headers: { ...headers, ...cookie, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: projectBody,
  }, '金鹰PLAN 项目列表')
  const projects = (await readJson(projectResponse, '金鹰PLAN 项目列表')).rows
  if (!Array.isArray(projects)) throw fail('金鹰PLAN 没有返回项目列表', 502)

  const items = []
  const errors = []
  let planSample = null
  for (const project of projects.slice(0, 60)) {
    const projectId = text(project.project_id)
    if (!projectId) continue
    const params = new URLSearchParams({
      pageNumber: '1',
      pageSize: '500',
      // 不按年份过滤：专项计划里常年未完成的任务也要出现在汇总里。
      param_list: JSON.stringify({
        project_id: projectId,
        plan_dept: '',
        special_name: '',
        plan_start_date_b: '',
        plan_start_date_e: '',
        plan_end_date_b: '',
        plan_end_date_e: '',
        plan_content: '',
        plan_state: '',
      }),
    })
    try {
      const response = await request(`${base}/WYSpecialPlan/getSpecialPlanFinishList?${params.toString()}`, {
        headers: { ...headers, ...cookie, Referer: `${base}/WYSpecialPlan/Finish_WY` },
      }, '金鹰PLAN 专项计划')
      const body = await readJson(response, '金鹰PLAN 专项计划')
      const rows = Array.isArray(body.rows) ? body.rows : []
      if (!planSample && rows.length) planSample = makeSample(rows)
      rows.forEach((row, index) => items.push(planItem(row, text(project.project_name), items.length + index)))
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error))
    }
  }

  if (!items.length && errors.length) throw fail(`金鹰PLAN 拉取失败：${errors[0]}`, 502)
  // 系统里保留了多年的专项计划明细，看板只看本年度（按计划结束日期）与未填结束日期的记录。
  const yearStart = `${new Date().getFullYear()}-01-01`
  const recent = items.filter((item) => !item.dueAt || item.dueAt >= yearStart)
  return {
    items: recent,
    note: errors.length ? `${errors.length} 个项目拉取失败，已跳过` : '',
    sample: planSample,
  }
}

// ---------- 巡检维保（IPMS） ----------

export function ipmsItem(row, kind, index) {
  const stateName = text(row.taskStateName)
  // 注意「未完成」里也包含「完成」两个字，先排除否定说法。
  const done = Boolean(stateName) && !stateName.includes('未') && /完成|已提交/.test(stateName)
  const dueAt = parseDue(row.fullEndDate || row.endTime)
  return {
    id: `ipms-${kind}-${text(row.taskId) || index}`,
    system: 'ipms',
    title: text(row.patrolRuleName) || text(row.taskName) || (kind === 'patrol' ? '巡检任务' : '维保任务'),
    subtitle: [text(row.projectName), text(row.addressName)].filter(Boolean).join(' · '),
    project: text(row.projectName),
    category: `${kind === 'patrol' ? '巡检' : '维保'} · ${text(row.sysName) || '综合'}`,
    owner: text(row.xUserName) || text(row.userName),
    status: done ? 'completed' : 'unfinished',
    statusLabel: stateName || (done ? '已完成' : '进行中'),
    dueAt,
    createdAt: parseDue(row.fullStartDate),
    finishedAt: parseDue(row.submitDate),
    extra: { state: stateName },
  }
}

const BROWSER_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36'

async function ipmsLogin(base, username, password, jar) {
  // 真实前端先访问首页拿到会话 Cookie，再提交登录表单；这里照做。
  const page = await request(`${base}/deviceFront/`, { headers: { 'User-Agent': BROWSER_UA } }, '巡检维保登录页')
  jar?.absorb(page)
  const cookie = jar?.header()
  const response = await request(`${base}/landcrm/rest/userInfo/qpiUserLogin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'User-Agent': BROWSER_UA,
      'X-Requested-With': 'XMLHttpRequest',
      Origin: base,
      Referer: `${base}/deviceFront/`,
      ...(cookie ? { cookie } : {}),
    },
    body: new URLSearchParams({ userAccount: username, password, isSecurity: '0' }).toString(),
  }, '巡检维保登录')
  jar?.absorb(response)
  const body = await readJson(response, '巡检维保登录')
  const token = text(body?.users?.[0]?.token) || text(body?.token) || text(body?.access_token)
  if (!token) {
    const reason = text(body.message) || text(body.msg) || (body.result !== undefined ? `返回 result=${body.result}` : '账号或密码不正确')
    throw fail(`巡检维保登录失败：${reason}`, 401)
  }
  return { token, user: body.users[0] }
}

const IPMS_PAGE_SIZE = 500
const IPMS_MAX_PAGES = 3
const IPMS_TIMEOUT_MS = 120_000
const IPMS_WINDOW_DAYS = 30

// 这个系统的任务表一年有二十多万条，整年查询单次要几十秒且拉不全。
// 看板只关心在办的事：取最近 30 天、状态为「未完成」的任务，逾期由到期时间判断。
async function ipmsTasks(base, token, kind, cookieHeader) {
  const lpCategory = kind === 'patrol' ? 1 : 2
  const today = new Date()
  const start = new Date(today.getTime() - IPMS_WINDOW_DAYS * 24 * 3600 * 1000)
  const fmt = (date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai' }).format(date)
  const payload = {
    areaId: '',
    devicePartrolId: '',
    endTime: `${fmt(today)} 23:59:59`,
    handleState: '',
    lpCategory,
    pageIndex: 1,
    pageSize: IPMS_PAGE_SIZE,
    patrolRuleId: '',
    patrolRuleName: '',
    projectId: '',
    ruleState: 0,
    startTime: `${fmt(start)} 00:00:00`,
    sysId: '',
    taskState: '0',
    timeType: 1,
    userId: '',
  }
  const send = async (page) => {
    const response = await request(`${base}/device/ruleTask/pageList/${IPMS_PAGE_SIZE}/${page}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': BROWSER_UA,
        Authorization: `Bearer ${token}`,
        token,
        ...(cookieHeader ? { cookie: cookieHeader } : {}),
      },
      body: JSON.stringify({ ...payload, pageIndex: page }),
    }, `巡检维保${kind === 'patrol' ? '巡检' : '维保'}任务`, IPMS_TIMEOUT_MS)
    return readJson(response, `巡检维保${kind === 'patrol' ? '巡检' : '维保'}任务`)
  }

  const first = await send(1)
  const total = Number(first?.data?.total ?? 0)
  const rows = Array.isArray(first?.data?.records) ? [...first.data.records] : []
  const pages = Math.min(IPMS_MAX_PAGES, Math.ceil(total / IPMS_PAGE_SIZE))
  for (let page = 2; page <= pages; page++) {
    const body = await send(page)
    const pageRows = Array.isArray(body?.data?.records) ? body.data.records : []
    rows.push(...pageRows)
    if (!pageRows.length) break
  }
  return { rows, total, truncated: rows.length < total }
}

export async function collectIpms(settings, secrets) {
  const base = (text(settings.baseUrl) || 'https://ipms.jinying.com').replace(/\/+$/, '')
  const username = text(secrets?.username)
  const password = text(secrets?.password)
  if (!username || !password) throw fail('还没有填写巡检维保的账号密码', 400)

  const jar = new CookieJar()
  let token = text(secrets?.token)
  let user = null
  if (!token) {
    const session = await ipmsLogin(base, username, password, jar)
    token = session.token
    user = session.user
  }
  const cookieHeader = jar.header()
  const [patrol, maintain] = await Promise.all([
    ipmsTasks(base, token, 'patrol', cookieHeader),
    ipmsTasks(base, token, 'maintain', cookieHeader),
  ])
  const items = [
    ...patrol.rows.map((row, index) => ipmsItem(row, 'patrol', index)),
    ...maintain.rows.map((row, index) => ipmsItem(row, 'maintain', index)),
  ]
  const truncated = patrol.truncated || maintain.truncated
  return {
    items,
    note: [
      `只取最近 ${IPMS_WINDOW_DAYS} 天、状态为未完成的任务`,
      truncated ? `未完成任务共 ${patrol.total + maintain.total} 条，本次先取 ${items.length} 条` : '',
    ].filter(Boolean).join('；'),
    user: text(user?.userName),
    token,
    sample: makeSample(patrol.rows) || makeSample(maintain.rows),
  }
}

// ---------- 金鹰安全 ----------

// 用户要的是两块业务：安全履职（履职计划）与隐患治理（隐患台账）。
// 两者都在安全系统里：隐患走 /api/allRisk/page（按状态过滤，已整改的历史池不拉），
// 履职走 /api/planConfig/page（计划与下次履职时间），"我的计划"有数据时一并合并。

const SAFETY_OPEN_RISK_STATUS = [1, 3, 4, 5, 6, 7]

export async function safetyLogin(base, username, password) {
  if (!text(username) || !text(password)) throw fail('请填写金鹰安全的账号和密码', 400)
  const encrypted = sm2.doEncrypt(password, SAFETY_SM2_PUBLIC_KEY, 1)
  const response = await request(`${base}/api/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ account: username, password: encrypted }),
  }, '金鹰安全登录')
  const body = await readJson(response, '金鹰安全登录')
  // 这个系统把 token 直接放在 data 里（字符串），不是 data.token。
  const token = text(body?.data) || text(body?.data?.token) || text(body?.token) || text(body?.data?.access_token)
  if (!token) {
    throw fail(`金鹰安全登录失败：${text(body.message) || text(body.msg) || '账号或密码不正确'}`, 401)
  }
  return { token }
}

export function safetyRiskItem(row, index) {
  const completed = Boolean(text(row.completionTime)) || Number(row.riskStatus) === 2
  const statusCode = Number(row.riskStatus)
  const dueAt = parseDue(row.rectificationTime)
  return {
    id: `safety-risk-${text(row.id) || index}`,
    system: 'safety',
    title: text(row.riskDescript) || text(row.riskName) || `隐患 ${index + 1}`,
    subtitle: [text(row.orgName), text(row.riskName) !== text(row.riskDescript) ? text(row.riskName) : ''].filter(Boolean).join(' · '),
    project: text(row.orgName),
    category: '隐患治理',
    owner: text(row.responsibleUserName) || text(row.createUserName),
    status: completed ? 'completed' : 'unfinished',
    statusLabel: completed ? '已整改' : statusCode === 1 ? '待整改' : '处理中',
    dueAt,
    createdAt: parseDue(row.createTime),
    finishedAt: parseDue(row.completionTime),
    extra: { riskLevel: row.riskLevel ?? null, riskStatus: statusCode || null },
  }
}

export function safetyPlanItem(row, index) {
  const dueAt = parseDue(row.nextTime) || parseDue(row.endTime)
  const title = text(row.typeDescription) || text(row.planName) || `履职计划 ${index + 1}`
  return {
    id: `safety-plan-${text(row.id) || index}`,
    system: 'safety',
    title,
    subtitle: [text(row.usedScopeName), text(row.planTypeName)].filter(Boolean).join(' · '),
    project: text(row.usedScopeName) || '集团',
    category: '安全履职',
    owner: '',
    status: dueAt ? 'unfinished' : 'completed',
    statusLabel: dueAt ? '待履职' : '已完成',
    dueAt,
    createdAt: parseDue(row.startTime || row.createTime),
    finishedAt: null,
    extra: { configStatus: row.configStatus ?? null, frequency: row.usedFrequency ?? null },
  }
}

async function safetyGet(base, token, path, pageNo = 1, pageSize = 500) {
  const sep = path.includes('?') ? '&' : '?'
  const response = await request(`${base}${path}${sep}pageNo=${pageNo}&pageSize=${pageSize}`, {
    headers: { Authorization: `Bearer ${token}`, 'User-Agent': BROWSER_UA, accept: 'application/json' },
  }, '金鹰安全数据', 30_000)
  const body = await readJson(response, '金鹰安全数据')
  if (body?.success === false || Number(body?.code) === 401) {
    throw fail(`金鹰安全返回失败：${text(body.message) || text(body.msg) || '登录状态失效'}`, 401)
  }
  const rows = body?.data?.rows ?? body?.data?.records ?? []
  return Array.isArray(rows) ? rows : []
}

async function safetyRisks(base, token) {
  // 不带状态过滤时后端默认返回 0 条，所以按状态逐个取；
  // 状态 2 是历史已整改的大池（上万条），不拉。
  const rows = []
  for (const status of SAFETY_OPEN_RISK_STATUS) {
    const path = `/api/allRisk/page?riskStatus=${status}`
    const first = await safetyGet(base, token, path, 1, 500).catch(() => [])
    rows.push(...first)
    if (first.length >= 500) {
      const second = await safetyGet(base, token, path, 2, 500).catch(() => [])
      rows.push(...second)
    }
  }
  return rows
}

export function makeSample(rows) {
  const first = Array.isArray(rows) && rows.length ? rows[0] : null
  if (!first || typeof first !== 'object') return null
  const row = {}
  for (const key of Object.keys(first).slice(0, 20)) {
    const value = first[key]
    if (value === null || typeof value === 'object') continue
    row[key] = String(value).slice(0, 60)
  }
  return { keys: Object.keys(first), row }
}

export async function collectSafety(settings, secrets) {
  const base = (text(settings.baseUrl) || 'http://safety.jinying.com:18181').replace(/\/+$/, '')
  let token = text(secrets?.token)
  const relogin = async () => {
    if (!text(secrets?.username) || !text(secrets?.password)) throw fail('还没有填写金鹰安全的账号密码', 400)
    return (await safetyLogin(base, text(secrets.username), text(secrets.password))).token
  }
  if (!token) token = await relogin()

  const run = async (fn) => {
    try {
      return await fn()
    } catch (error) {
      if (error?.status !== 401) throw error
      token = await relogin()
      return fn()
    }
  }

  const [risks, plans, own] = await Promise.all([
    run(() => safetyRisks(base, token)),
    run(() => safetyGet(base, token, '/api/planConfig/page', 1, 500)),
    run(() => safetyGet(base, token, '/api/planOwn/page', 1, 500)).catch(() => []),
  ])

  const items = [
    ...risks.map((row, index) => safetyRiskItem(row, index)),
    ...plans.map((row, index) => safetyPlanItem(row, index)),
    ...own.map((row, index) => safetyPlanItem(row, index)),
  ]
  const note = risks.length === 0 ? '隐患台账按当前账号的数据范围返回 0 条' : ''
  return { items, note, token, sample: makeSample(risks) || makeSample(plans) }
}

// ---------- 工单任务 ----------

// 字段名来自工单服务的 OpenAPI（TaskRequestSearchModel / TaskRequestFormStart）：
// 标题是 taskTitle，状态是 taskStatus，业务子类是 busSubcategory，时限是天数 deadlineDays。
const WORKORDER_TITLE_KEYS = ['taskTitle', 'taskName', 'title', 'requestName', 'taskContent', 'requestContent', 'content', 'taskDescribe', 'description', 'summary']
const WORKORDER_DUE_KEYS = [
  'planFinishTime',
  'requireFinishTime',
  'requiredFinishTime',
  'expectFinishTime',
  'limitFinishTime',
  'finishDeadline',
  'deadline',
  'planEndTime',
  'endTime',
]

function pick(row, keys) {
  for (const key of keys) {
    const value = text(row?.[key])
    if (value) return value
  }
  return ''
}

async function workorderDicts(base, token) {
  try {
    const response = await request(`${base}/prod-api/system/dict/data/type/business_subcategory`, {
      headers: { Authorization: `Bearer ${token}`, accept: 'application/json' },
    }, '工单系统业务分类')
    const body = await readJson(response, '工单系统业务分类')
    const list = Array.isArray(body?.data) ? body.data : []
    return new Map(list.map((item) => [text(item.dictValue), text(item.dictLabel)]).filter(([value]) => value))
  } catch {
    return new Map()
  }
}

// 工单业务子类的字典编码前缀 → 中文名；字典接口取不到时用它兜底。
export const WORKORDER_CATEGORY_FALLBACK = {
  aispbj: 'AI视频巡更',
  wxbs: '维修报事',
  wxbsnb: '维修报事',
  sbbj: '设备报警',
  zhgl: '综合管理',
  ks: '客服',
}

// 没有业务字典时，用编码前缀给出可读分类（旧缓存也能纠正）。
export function displayCategory(value) {
  const text = String(value ?? '')
  if (!/^[a-z]+(_\d+)?$/i.test(text)) return text
  return WORKORDER_CATEGORY_FALLBACK[text.split('_')[0]] || text
}

export function workorderItem(row, index, dictMap = new Map()) {
  const statusCode = String(row.taskStatus ?? '')
  const done = statusCode === '2'
  const voided = statusCode === '4'
  const createdAt = parseDue(row.createTime)
  const dueFromField = parseDue(pick(row, WORKORDER_DUE_KEYS))
  const deadlineDays = Number(row.deadlineDays)
  const dueFromDeadline = !dueFromField && createdAt && Number.isFinite(deadlineDays) && deadlineDays > 0
    ? new Date(Date.parse(createdAt) + deadlineDays * 24 * 3600 * 1000).toISOString()
    : null
  const dueFromSla = !dueFromField && !dueFromDeadline && createdAt
    ? new Date(Date.parse(createdAt) + WORKORDER_SLA_HOURS * 3600 * 1000).toISOString()
    : null
  const subcategory = text(row.busSubcategory)
  const category = dictMap.get(subcategory)
    || text(row.busSubcategoryName)
    || WORKORDER_CATEGORY_FALLBACK[subcategory.split('_')[0]]
    || subcategory
    || '未分类'
  const title = pick(row, WORKORDER_TITLE_KEYS) || text(row.taskCode) || text(row.taskRequestid) || `工单 ${index + 1}`
  return {
    id: `workorder-${text(row.taskRequestid) || text(row.id) || index}`,
    system: 'workorder',
    title,
    subtitle: [text(row.projectName), text(row.taskCompanyName)].filter(Boolean).join(' · '),
    project: text(row.projectName) || text(row.taskCompanyName),
    category,
    owner: pick(row, ['handleUserName', 'assigneeName', 'taskUserName', 'currentUserName', 'nodeUserName', 'operator']),
    status: voided ? 'voided' : done ? 'completed' : 'unfinished',
    statusLabel: voided ? '已作废' : done ? '已完成' : '进行中',
    dueAt: dueFromField || dueFromDeadline || dueFromSla,
    dueSource: dueFromField ? 'field' : dueFromDeadline ? 'deadline' : dueFromSla ? 'sla' : null,
    createdAt,
    finishedAt: done ? parseDue(row.finishTime) : null,
    extra: { statusCode, deadlineDays: Number.isFinite(deadlineDays) ? deadlineDays : null },
  }
}

export async function fetchWorkorderCaptcha(baseUrl) {
  const base = (text(baseUrl) || 'http://ge-propel-web.jinying.com').replace(/\/+$/, '')
  const response = await request(`${base}/prod-api/code`, {}, '工单系统验证码')
  const body = await readJson(response, '工单系统验证码')
  if (body?.captchaEnabled === false) return { captchaEnabled: false }
  const img = text(body.img)
  const uuid = text(body.uuid)
  if (!img || !uuid) throw fail('工单系统没有返回验证码', 502)
  return { captchaEnabled: true, image: img.startsWith('data:') ? img : `data:image/jpeg;base64,${img}`, uuid }
}

async function workorderToken(base, username, password, model) {
  let lastMessage = ''
  for (let attempt = 1; attempt <= 3; attempt++) {
    const captcha = await fetchWorkorderCaptcha(base)
    const payload = { username, password }
    if (captcha.captchaEnabled) {
      payload.code = await recognizeCaptcha(captcha.image, model)
      payload.uuid = captcha.uuid
    }
    const response = await request(`${base}/prod-api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    }, '工单系统登录')
    const body = await readJson(response, '工单系统登录')
    const token = text(body.token) || text(body.access_token) || text(body?.data?.access_token) || text(body?.data?.token)
    if (token) return token
    lastMessage = text(body.msg) || text(body.message) || '验证码或账号密码不正确'
  }
  throw fail(`工单系统登录失败：${lastMessage}`, 401)
}

export async function connectWorkorder({ baseUrl, username, password, model }) {
  const base = (text(baseUrl) || 'http://ge-propel-web.jinying.com').replace(/\/+$/, '')
  if (!text(username) || !text(password)) throw fail('请填写工单系统的账号和密码', 400)
  const token = await workorderToken(base, text(username), text(password), model)
  const probe = await request(`${base}/prod-api/task/request/list?pageNum=1&pageSize=1&searchType=10`, {
    headers: { Authorization: `Bearer ${token}` },
  }, '工单系统工单列表')
  const body = await readJson(probe, '工单系统工单列表')
  if (body.code !== undefined && Number(body.code) !== 200) {
    throw fail(`工单系统返回异常：${text(body.msg) || '请检查账号权限'}`, 502)
  }
  return { token, total: Number(body.total ?? 0), baseUrl: base }
}

const WORKORDER_MAX_PAGES = 40

export async function collectWorkorder(settings, secrets) {
  const base = (text(settings.baseUrl) || 'http://ge-propel-web.jinying.com').replace(/\/+$/, '')
  let token = text(secrets?.token)
  if (!token) {
    if (!text(secrets?.username) || !text(secrets?.password)) throw fail('还没有填写工单系统的账号密码', 400)
    token = await workorderToken(base, text(secrets.username), text(secrets.password), secrets?.model)
  }

  const dictMap = await workorderDicts(base, token)
  const rows = []
  let note = ''
  for (let page = 1; page <= WORKORDER_MAX_PAGES; page++) {
    let body
    try {
      const response = await request(`${base}/prod-api/task/request/list?pageNum=${page}&pageSize=500&searchType=10`, {
        headers: { Authorization: `Bearer ${token}` },
      }, '工单系统工单列表', 30_000)
      body = await readJson(response, '工单系统工单列表')
    } catch (error) {
      if (!rows.length) throw error
      note = `第 ${page} 页未取到（${error instanceof Error ? error.message : String(error)}），先展示已取到的 ${rows.length} 条`
      break
    }
    if (Number(body.code) === 401) throw fail('工单系统登录已过期，请重新连接', 401)
    if (body.code !== undefined && Number(body.code) !== 200) {
      if (rows.length) {
        note = `系统在第 ${page} 页返回异常，先展示已取到的 ${rows.length} 条`
        break
      }
      throw fail(`工单系统返回异常：${text(body.msg) || '未知错误'}`, 502)
    }
    const pageRows = Array.isArray(body.rows) ? body.rows : []
    rows.push(...pageRows)
    if (!pageRows.length || rows.length >= Number(body.total ?? 0)) break
  }

  return {
    items: rows.map((row, index) => workorderItem(row, index, dictMap)),
    note,
    sample: makeSample(rows),
  }
}

export async function collectSystem(id, settings, secrets) {
  switch (id) {
    case 'plan':
      return collectPlan(settings, secrets)
    case 'ipms':
      return collectIpms(settings, secrets)
    case 'safety':
      return collectSafety(settings, secrets)
    case 'workorder':
      return collectWorkorder(settings, secrets)
    default:
      throw fail(`未知的系统：${id}`, 400)
  }
}

// 连接时的凭据校验：只验证能否登录并读到数据，不落盘。
export async function verifyCredentials(id, input) {
  const meta = systemMeta(id)
  if (!meta) throw fail(`未知的系统：${id}`, 400)
  if (!text(input?.username) || !text(input?.password)) {
    throw fail(`${meta.title} 的账号和密码都要填写`, 400)
  }
  if (id === 'plan') {
    const result = await collectPlan({}, { username: input.username, password: input.password })
    return { ok: true, total: result.items.length }
  }
  if (id === 'ipms') {
    const meta = systemMeta('ipms')
    const session = await ipmsLogin(meta.home, input.username, input.password, new CookieJar())
    return { ok: true, total: null, user: text(session.user?.userName), token: session.token }
  }
  if (id === 'safety') {
    const meta = systemMeta('safety')
    const { token } = await safetyLogin(meta.home, input.username, input.password)
    const rows = await safetyGet(meta.home, token, '/api/allRisk/page?riskStatus=1', 1, 1).catch(() => [])
    return { ok: true, total: rows.length, token }
  }
  if (id === 'workorder') {
    const result = await connectWorkorder({ username: input.username, password: input.password, model: input.model })
    return { ok: true, total: result.total, token: result.token, baseUrl: result.baseUrl }
  }
  throw fail(`未知的系统：${id}`, 400)
}