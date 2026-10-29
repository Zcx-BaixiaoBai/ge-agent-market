#!/usr/bin/env node
"use strict";
/**
 * 捷顺云停车 MCP 服务（只读，stdio）
 * MCP 2024-11-05：initialize / tools/list / tools/call / ping
 * 不依赖第三方 MCP SDK。
 */

const fs = require("fs");
const os = require("os");
const path = require("path");
const readline = require("readline");
const { Client, EXCEPTION_TYPES, HOST } = require("./jieshun");

const NAME = "ge-mcp-jieshun";
const VERSION = "0.1.0";
const PROTOCOL = "2024-11-05";

// ---------------- 账号配置 ----------------
function accountFile() {
  const cands = [
    process.env.JLITE_ACCOUNT_FILE,
    path.join(os.homedir(), ".jlite", "accounts.csv"),
  ].filter(Boolean);
  for (const p of cands) if (fs.existsSync(p)) return p;
  return null;
}

function loadAccounts(file) {
  if (!file) {
    throw new Error(
      "未找到账号文件。请设置 JLITE_ACCOUNT_FILE 指向 CSV(车场,账号,密码) 或 JSON"
    );
  }
  const text = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
  const map = {};
  if (file.toLowerCase().endsWith(".json")) {
    const j = JSON.parse(text);
    for (const [k, v] of Object.entries(j)) {
      if (Array.isArray(v)) map[k] = { account: v[0], password: v[1] };
      else if (typeof v === "string") {
        const [a, p] = v.split(":");
        map[k] = { account: a, password: p };
      } else map[k] = { account: v.account, password: v.password };
    }
    return map;
  }
  const rows = text.split(/\r?\n/).filter((l) => l.trim());
  const head = (rows[0] || "").toLowerCase();
  const start = /车场|账号|密码|org|account|password/.test(head) ? 1 : 0;
  for (let i = start; i < rows.length; i++) {
    const cols = rows[i].split(",").map((s) => s.trim());
    if (cols.length >= 2 && cols[0] && cols[1]) {
      map[cols[0]] = { account: cols[1], password: cols[2] || "" };
    }
  }
  return map;
}

let POOL = null;
class Pool {
  constructor() {
    this.file = accountFile();
    this.accounts = loadAccounts(this.file);
    this.clients = new Map();
  }
  orgs() {
    return Object.keys(this.accounts).sort();
  }
  resolve(org) {
    if (!org) throw new Error("必须指定车场 org，可用值见 parking_orgs");
    if (this.accounts[org]) return org;
    const hits = this.orgs().filter((k) => k.includes(org) || org.includes(k));
    if (hits.length === 1) return hits[0];
    if (!hits.length) throw new Error(`未找到车场 ${org}；可用：${this.orgs().slice(0, 10).join("、")} ...`);
    throw new Error(`车场 ${org} 匹配到多个：${hits.join("、")}，请写全名`);
  }
  async client(org) {
    const name = this.resolve(org);
    if (this.clients.has(name)) return [name, this.clients.get(name)];
    const { account, password } = this.accounts[name];
    const c = new Client();
    const r = await c.login(account, password);
    if (!r.ok) throw new Error(`登录 ${name} 失败：${r.error}`);
    this.clients.set(name, c);
    return [name, c];
  }
  async orgDetail(org) {
    const [name, c] = await this.client(org);
    const u = c.user || {};
    if (u.orgId !== undefined && u.orgId !== null) {
      return [name, c, { id: u.orgId, orgName: u.orgName || name }];
    }
    const r = await c.sys("organize/queryOrganizeTree", { parentId: u.topOrgId });
    const tree = r.respData || [];
    const flat = [];
    (function walk(nodes) {
      for (const n of nodes || []) {
        flat.push(n);
        walk(n.children);
      }
    })(tree);
    const node = flat.find((n) => n.orgName === name) || flat[0];
    if (!node) throw new Error("未取到组织信息：" + name);
    return [name, c, node];
  }
}
function pool() {
  if (!POOL) POOL = new Pool();
  return POOL;
}

// ---------------- 通用 ----------------
function normRange(start, end) {
  const today = new Date();
  const d = (x) => {
    const p = (n) => String(n).padStart(2, "0");
    return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}`;
  };
  const defaulted = start === undefined || end === undefined;
  if (start === undefined) start = d(new Date(today.getFullYear(), today.getMonth(), 1));
  if (end === undefined) end = d(today);
  const s = start.length > 10 ? start : start + " 00:00:00";
  const e = end.length > 10 ? end : end + " 23:59:59";
  return [s, e, defaulted];
}

function monthsBetween(start, end) {
  const [sy, sm] = start.slice(0, 10).split("-").map(Number);
  const [ey, em] = end.slice(0, 10).split("-").map(Number);
  const out = [];
  let y = sy,
    m = sm;
  while (y < ey || (y === ey && m <= em)) {
    const last = new Date(y, m, 0).getDate();
    const a = `${y}-${String(m).padStart(2, "0")}-01 00:00:00`;
    const b = `${y}-${String(m).padStart(2, "0")}-${String(last).padStart(2, "0")} 23:59:59`;
    out.push([`${y}-${String(m).padStart(2, "0")}`, a, b]);
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
  return out;
}

// ---------------- 工具实现 ----------------
async function tOrgs(a) {
  const p = pool();
  let orgs = p.orgs();
  if (a.keyword) orgs = orgs.filter((o) => o.includes(a.keyword));
  return { count: orgs.length, orgs, account_file: p.file };
}

async function tParks(a) {
  const [name, c] = await pool().client(a.org);
  return { org: name, projects: c.projects, parks: await c.parks() };
}

async function tPersons(a) {
  const [name, c, node] = await pool().orgDetail(a.org);
  const data = await c.persons(node.id, a.keyword || "");
  const rows = (data.data || []).map((it) => ({
    personId: it.id,
    personNo: it.personNo,
    name: it.personName,
    sex: it.personSexStr,
    accountNo: it.account && it.account.accountNo,
    status: it.account && it.account.accountStatus,
  }));
  return { org: name, orgId: node.id, total: data.totalCount, persons: rows };
}

async function tTraffic(a) {
  const [name, c] = await pool().client(a.org);
  const [s, e, defaulted] = normRange(a.start, a.end);
  if (a.by_month) {
    const monthly = [];
    for (const [m, ms, me] of monthsBetween(s, e)) {
      monthly.push({ month: m, traffic: await c.trafficCount(ms, me) });
    }
    return { org: name, start: s, end: e, defaulted_range: defaulted, monthly };
  }
  const traffic = await c.trafficCount(s, e);
  const ex = await c.exceptionCounts(s, e);
  const abn = Object.entries(ex)
    .filter(([k]) => EXCEPTION_TYPES.find((t) => t.label === k && t.abnormal))
    .reduce((acc, [, v]) => acc + v, 0);
  return {
    org: name,
    start: s,
    end: e,
    defaulted_range: defaulted,
    traffic,
    exception: ex,
    abnormal_total: abn,
    recognition_rate: traffic ? Number(((traffic - abn) / traffic).toFixed(6)) : null,
  };
}

async function tVehicleRecords(a) {
  const [name, c] = await pool().client(a.org);
  const [s, e, defaulted] = normRange(a.start, a.end);
  const page = Number(a.page || 1);
  const size = Math.min(Number(a.page_size || 20), 200);
  const params = {
    projectCode: c.projects[0],
    startTimeStr: s,
    endTimeStr: e,
    pageIndex: page,
    pageSize: size,
  };
  if (a.plate) params.voucherNo = a.plate;
  if (a.park) params.parkId = a.park;
  const cnt = await c.report("getCountParkOutRecord", {
    projectCode: c.projects[0],
    startTimeStr: s,
    endTimeStr: e,
  });
  const r = await c.report("getParkOutRecord", params);
  const rows = ((r.data && r.data.data) || []).map((x) => ({
    plate: x.voucherNo,
    park: x.parkName,
    inTime: x.inTimeStr,
    outTime: x.outTimeStr,
    duration: x.parkingTime,
    payType: x.outMealType,
    should: x.shouldMoneyDecimal,
    actual: x.actualMoneyDecimal,
  }));
  return {
    org: name,
    start: s,
    end: e,
    defaulted_range: defaulted,
    total: (cnt.data && cnt.data.totalCount) || 0,
    page,
    page_size: size,
    rows,
  };
}

async function tInside(a) {
  const [name, c] = await pool().client(a.org);
  const [s, e, defaulted] = normRange(a.start, a.end);
  const page = Number(a.page || 1);
  const size = Math.min(Number(a.page_size || 20), 200);
  const base = { projectCode: c.projects[0], startTimeStr: s, endTimeStr: e };
  const cnt = await c.report("getCountInsideCarRecord", base);
  const r = await c.report("getInsideCarRecord", Object.assign({}, base, { pageIndex: page, pageSize: size }));
  const rows = ((r.data && r.data.data) || []).map((x) => ({
    plate: x.voucherNo,
    park: x.parkName,
    carType: x.carTypeStr,
    inTime: x.inTimeStr || x.createTimeStr,
    person: x.personName,
  }));
  return {
    org: name,
    start: s,
    end: e,
    defaulted_range: defaulted,
    total: (cnt.data && cnt.data.totalCount) || 0,
    page,
    page_size: size,
    rows,
  };
}

async function tDiscount(a) {
  const [name, c] = await pool().client(a.org);
  const [s, e, defaulted] = normRange(a.start, a.end);
  const total = await c.discountCount(s, e);
  const plans = new Set();
  const stores = new Map();
  const types = new Set();
  let scanned = 0;
  const maxPages = Math.max(1, Math.min(Number(a.max_pages || 4), 40));
  for (const code of c.projects) {
    let page = 1;
    while (page <= maxPages) {
      const data = await c.discountPage(s, e, code, page, 5000);
      if (!data.length) break;
      for (const it of data) {
        if (it.discountPlan) plans.add(String(it.discountPlan).trim());
        if (it.discountType) types.add(String(it.discountType).trim());
        const sn = (it.storeName || "").trim() || "(空)";
        stores.set(sn, (stores.get(sn) || 0) + 1);
      }
      scanned += data.length;
      if (data.length < 5000) break;
      page++;
    }
  }
  const top = [...stores.entries()]
    .sort((x, y) => y[1] - x[1])
    .slice(0, 20)
    .map(([store, count]) => ({ store, count }));
  const truncated = scanned < total;
  return {
    org: name,
    start: s,
    end: e,
    defaulted_range: defaulted,
    total_records: total,
    scanned_records: scanned,
    truncated,
    plan_count: plans.size,
    plans: [...plans].sort(),
    store_count: stores.size,
    types: [...types].sort(),
    top_stores: top,
    note: truncated ? "只读汇总；如需全量商户清单请调大 max_pages" : "",
  };
}

async function tCharge(a) {
  const [name, c] = await pool().client(a.org);
  const [s, e, defaulted] = normRange(a.start, a.end);
  const r = await c.report("getChargeCountReport", {
    projectCode: c.projects[0],
    startTimeStr: s,
    endTimeStr: e,
  });
  const rows = (r.data && r.data.monthRevenueList) || [];
  const isRefund = (x) => String(x.payTypeStr || "").includes("退");
  const refund = rows.filter(isRefund).reduce((n, x) => n + Number(x.revenue || 0), 0);
  const gross = rows.filter((x) => !isRefund(x)).reduce((n, x) => n + Number(x.revenue || 0), 0);
  return {
    org: name,
    start: s,
    end: e,
    defaulted_range: defaulted,
    revenue_by_paytype: rows,
    gross_revenue: Number(gross.toFixed(2)),
    refund_total: Number(refund.toFixed(2)),
    net_revenue: Number((gross - refund).toFixed(2)),
    note: "退款行按 payTypeStr 含「退」识别并从净额中扣除",
  };
}

async function tInfo() {
  const p = pool();
  return {
    server: NAME,
    version: VERSION,
    protocol: PROTOCOL,
    account_file: p.file,
    org_count: p.orgs().length,
    host: HOST,
    mode: "read-only",
    node: process.version,
  };
}

const TOOLS = [
  ["parking_orgs", "列出可用的车场（来自账号清单），可按关键词过滤。", { type: "object", properties: { keyword: { type: "string" } } }],
  ["parking_parks", "列出某车场下的停车场（名称与 parkId）。", { type: "object", properties: { org: { type: "string" } }, required: ["org"] }],
  ["parking_persons", "查询某组织的服务人员（编号/姓名/账号/状态），只读。", { type: "object", properties: { org: { type: "string" }, keyword: { type: "string" } }, required: ["org"] }],
  ["parking_traffic", "车辆通行记录数 + 6 类异常放行条数 + 识别率；可选按月拆开。", { type: "object", properties: { org: { type: "string" }, start: { type: "string" }, end: { type: "string" }, by_month: { type: "boolean" } }, required: ["org"] }],
  ["parking_vehicle_records", "分页查询车辆通行（出场）明细。", { type: "object", properties: { org: { type: "string" }, start: { type: "string" }, end: { type: "string" }, page: { type: "integer" }, page_size: { type: "integer" }, plate: { type: "string" }, park: { type: "string" } }, required: ["org"] }],
  ["parking_inside_vehicles", "分页查询场内（未出场）车辆。", { type: "object", properties: { org: { type: "string" }, start: { type: "string" }, end: { type: "string" }, page: { type: "integer" }, page_size: { type: "integer" } }, required: ["org"] }],
  ["parking_discount_summary", "统计区间内车场打折记录：总数、全部优惠方案、商户用量 Top。", { type: "object", properties: { org: { type: "string" }, start: { type: "string" }, end: { type: "string" }, max_pages: { type: "integer" } }, required: ["org"] }],
  ["parking_charge_summary", "区间收费统计：按支付方式的收入合计。", { type: "object", properties: { org: { type: "string" }, start: { type: "string" }, end: { type: "string" } }, required: ["org"] }],
  ["parking_server_info", "查看 MCP 服务状态、账号文件位置、只读模式说明。", { type: "object", properties: {} }],
];

const HANDLERS = {
  parking_orgs: tOrgs,
  parking_parks: tParks,
  parking_persons: tPersons,
  parking_traffic: tTraffic,
  parking_vehicle_records: tVehicleRecords,
  parking_inside_vehicles: tInside,
  parking_discount_summary: tDiscount,
  parking_charge_summary: tCharge,
  parking_server_info: tInfo,
};

// ---------------- MCP 协议 ----------------
function send(obj) {
  process.stdout.write(JSON.stringify(obj) + "\n");
}
function reply(id, result) {
  send({ jsonrpc: "2.0", id, result });
}
function fail(id, code, message, data) {
  const error = { code, message };
  if (data !== undefined) error.data = data;
  send({ jsonrpc: "2.0", id, error });
}

async function handle(msg) {
  const method = msg.method;
  const id = msg.id;
  const params = msg.params || {};
  const isNotification = !Object.prototype.hasOwnProperty.call(msg, "id");

  if (method === "initialize") {
    const want = params.protocolVersion || PROTOCOL;
    reply(id, {
      protocolVersion: ["2024-11-05", "2025-06-18"].includes(want) ? want : PROTOCOL,
      capabilities: { tools: { listChanged: false } },
      serverInfo: { name: NAME, version: VERSION },
      instructions:
        "捷顺云停车只读数据服务：车场/人员/通行/异常放行/场内车辆/打折/收费统计。不会修改任何业务数据。",
    });
    return;
  }
  if (["notifications/initialized", "notifications/cancelled", "initialized"].includes(method)) return;
  if (method === "ping") return reply(id, {});
  if (method === "tools/list") {
    return reply(id, {
      tools: TOOLS.map(([name, description, inputSchema]) => ({ name, description, inputSchema })),
    });
  }
  if (method === "resources/list") return reply(id, { resources: [] });
  if (method === "prompts/list") return reply(id, { prompts: [] });
  if (method === "tools/call") {
    const name = params.name;
    const args = params.arguments || {};
    const fn = HANDLERS[name];
    if (!fn) return fail(id, -32602, "未知工具：" + name);
    try {
      const result = await fn(args);
      reply(id, {
        content: [{ type: "text", text: JSON.stringify(result, null, 1) }],
        structuredContent: result,
        isError: false,
      });
    } catch (e) {
      const text = (e && e.message) || String(e);
      reply(id, {
        content: [{ type: "text", text: process.env.PARKING_MCP_DEBUG ? e.stack : text }],
        isError: true,
      });
    }
    return;
  }
  if (isNotification) return;
  fail(id, -32601, "未实现的方法：" + method);
}

function serve() {
  const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
  rl.on("line", (line) => {
    const s = line.trim();
    if (!s) return;
    let msg;
    try {
      msg = JSON.parse(s);
    } catch (e) {
      return fail(null, -32700, "JSON 解析失败");
    }
    Promise.resolve()
      .then(() => handle(msg))
      .catch((e) => fail(msg.id, -32603, "内部错误", String(e && e.stack)));
  });
}

async function selftest() {
  await handle({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: PROTOCOL } });
  await handle({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} });
  await handle({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "parking_server_info", arguments: {} } });
}

if (require.main === module) {
  if (process.argv.includes("--selftest")) selftest();
  else serve();
}

module.exports = { handle, HANDLERS, TOOLS };
