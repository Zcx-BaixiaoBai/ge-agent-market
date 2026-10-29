"use strict";
/**
 * 捷顺云停车只读客户端（Node 版）
 * - 登录：4 位图片验证码（模板法识别）+ TripleDES 密码加密
 * - 接口：报表中心 / 系统中心 的查询类接口
 * 不包含任何写操作。
 */

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const jpeg = require("../vendor/jpeg-js");

const HOST = process.env.JIESHUN_HOST || "http://jygw.jslife.net:8081";
const LOGIN_URL = HOST + "/jportal/login";
const RANDOM_CODE_URL = HOST + "/jportal/randomCode";
const REPORT_API = HOST + "/jportal-jsicp/";
const SYS_API = HOST + "/jportal/";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const KEY = Buffer.from("9012PinganVitality075522");
const IV = Buffer.from("01234567");

const TEMPLATES = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "assets", "templates.json"), "utf8")
);
const CANVAS = TEMPLATES.canvas;
const SHIFT = TEMPLATES.shift;
const DIGITS = TEMPLATES.digits;
const REPS = TEMPLATES.reps.map((b64) => {
  const buf = Buffer.from(b64, "base64");
  const out = new Uint8Array(CANVAS * CANVAS);
  for (let i = 0; i < out.length; i++) {
    out[i] = (buf[i >> 3] >> (7 - (i & 7))) & 1;
  }
  return out;
});

const EXCEPTION_TYPES = [
  { code: "CANCELBRAK", label: "车辆返场", abnormal: false },
  { code: "FREERELASE", label: "免费放行", abnormal: true },
  { code: "HANDWORK", label: "手动开闸", abnormal: true },
  { code: "CHECKCARNO", label: "车牌纠正", abnormal: true },
  { code: "SETOUT", label: "置为出场", abnormal: false },
  { code: "NOMOTOR", label: "非机动车放行", abnormal: true },
];

// ---------------- 验证码识别 ----------------
function maskOf(img) {
  const { width, height, data } = img;
  const m = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const r = data[i],
        g = data[i + 1],
        b = data[i + 2];
      const sat = Math.max(r, g, b) - Math.min(r, g, b);
      const lum = (r + g + b) / 3;
      let v = sat > 40 || lum < 120 ? 1 : 0;
      if (y < 3 || y >= height - 3 || x < 3 || x >= width - 3) v = 0;
      m[y * width + x] = v;
    }
  }
  return m;
}

function boxesOf(m, width, height) {
  const cols = new Int32Array(width);
  for (let x = 0; x < width; x++) {
    let c = 0;
    for (let y = 0; y < height; y++) c += m[y * width + x];
    cols[x] = c;
  }
  const groups = [];
  let start = null;
  for (let x = 0; x < width; x++) {
    if (cols[x] > 0 && start === null) start = x;
    else if (cols[x] === 0 && start !== null) {
      if (x - start >= 2) groups.push([start, x]);
      start = null;
    }
  }
  if (start !== null) groups.push([start, width]);
  const merged = [];
  for (const g of groups) {
    if (merged.length && g[0] - merged[merged.length - 1][1] <= 2) {
      merged[merged.length - 1][1] = g[1];
    } else merged.push([g[0], g[1]]);
  }
  return merged;
}

function toCanvas(m, width, height, [x0, x1]) {
  let y0 = -1,
    y1 = -1;
  for (let y = 0; y < height; y++) {
    let any = 0;
    for (let x = x0; x < x1; x++) any |= m[y * width + x];
    if (any) {
      if (y0 < 0) y0 = y;
      y1 = y;
    }
  }
  if (y0 < 0) return null;
  const h = y1 - y0 + 1;
  const w = x1 - x0;
  if (h > CANVAS || w > CANVAS) return null;
  const c = new Uint8Array(CANVAS * CANVAS);
  const oy = (CANVAS - h) >> 1;
  const ox = (CANVAS - w) >> 1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      c[(oy + y) * CANVAS + ox + x] = m[(y0 + y) * width + x0 + x];
    }
  }
  return c;
}

function distAt(a, b, dy, dx) {
  let inter = 0,
    union = 0;
  for (let y = 0; y < CANVAS; y++) {
    const by = y - dy;
    const rowA = y * CANVAS;
    for (let x = 0; x < CANVAS; x++) {
      const av = a[rowA + x];
      const bx = x - dx;
      let bv = 0;
      if (by >= 0 && by < CANVAS && bx >= 0 && bx < CANVAS) bv = b[by * CANVAS + bx];
      if (av && bv) inter++;
      if (av || bv) union++;
    }
  }
  return union === 0 ? 1 : 1 - inter / union;
}

function dist(a, b) {
  let best = 1;
  for (let dy = -SHIFT; dy <= SHIFT; dy++) {
    for (let dx = -SHIFT; dx <= SHIFT; dx++) {
      const d = distAt(a, b, dy, dx);
      if (d < best) best = d;
    }
  }
  return best;
}

function readCaptcha(buf) {
  const img = jpeg.decode(buf, { useTArray: true });
  const m = maskOf(img);
  const boxes = boxesOf(m, img.width, img.height);
  if (boxes.length !== DIGITS) return null;
  let code = "";
  let worst = 0;
  for (const box of boxes) {
    const c = toCanvas(m, img.width, img.height, box);
    if (!c) return null;
    let bi = -1,
      bd = 9;
    for (let i = 0; i < REPS.length; i++) {
      const d = dist(c, REPS[i]);
      if (d < bd) {
        bd = d;
        bi = i;
      }
    }
    code += TEMPLATES.labels[bi];
    worst = Math.max(worst, bd);
  }
  return { code, worst };
}

// ---------------- HTTP ----------------
function encPassword(pwd) {
  const cipher = crypto.createCipheriv("des-ede3-cbc", KEY, IV);
  const out = Buffer.concat([cipher.update(pwd, "utf8"), cipher.final()]);
  return out.toString("base64");
}

function form(obj) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== null) p.append(k, String(v));
  }
  return p;
}

class Client {
  constructor(timeoutMs = 180000) {
    this.user = null;
    this.account = null;
    this.cookies = [];
    this.timeout = timeoutMs;
  }

  async _fetch(url, opts = {}) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), this.timeout);
    const headers = Object.assign({ "User-Agent": UA }, opts.headers || {});
    if (this.cookies.length) headers.Cookie = this.cookies.join("; ");
    try {
      const res = await fetch(url, Object.assign({}, opts, { headers, signal: ctrl.signal }));
      if (typeof res.headers.getSetCookie === "function") {
        for (const c of res.headers.getSetCookie()) this.cookies.push(c.split(";")[0]);
      }
      return res;
    } finally {
      clearTimeout(timer);
    }
  }

  async login(account, password, maxTry = 4) {
    let last = null;
    for (let attempt = 1; attempt <= maxTry; attempt++) {
      const rand = String(Math.random());
      const imgRes = await this._fetch(RANDOM_CODE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
        body: form({ rand }).toString(),
      });
      const buf = Buffer.from(await imgRes.arrayBuffer());
      const cap = readCaptcha(buf);
      if (!cap) {
        last = "验证码识别失败";
        continue;
      }
      const res = await this._fetch(LOGIN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          Referer: HOST + "/jportal-jsicp-login/index.html",
        },
        body: form({
          accountNo: account,
          password: encPassword(password),
          rand,
          randomCode: cap.code,
        }).toString(),
      });
      const j = await res.json();
      if (j.success) {
        this.user = j.respData || {};
        this.account = account;
        return { ok: true, attempts: attempt };
      }
      last = `${j.respCode} ${j.respMsg}`;
      if (j.respCode !== "JIESHUN1004") break;
    }
    return { ok: false, error: last };
  }

  get projects() {
    return String((this.user && this.user.projects) || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  headers() {
    const u = this.user || {};
    const h = {};
    if (u.jsToken) {
      h.jsToken = u.jsToken;
      h.jsCurAccNo = u.accountNo || this.account;
    }
    if (u.version) {
      h.projectCode = u.projects || "";
      h.version = u.version;
      h.user = u.accountNo || this.account;
    }
    return h;
  }

  async _req(base, p, params, method = "GET") {
    const url = base + p + (method === "GET" ? "?" + new URLSearchParams(params).toString() : "");
    const opts = { method, headers: Object.assign({ Accept: "application/json" }, this.headers()) };
    if (method !== "GET") {
      opts.headers["Content-Type"] = "application/x-www-form-urlencoded; charset=UTF-8";
      opts.body = new URLSearchParams(params).toString();
    }
    let lastErr;
    for (let i = 0; i < 3; i++) {
      try {
        const res = await this._fetch(url, opts);
        const text = await res.text();
        try {
          return JSON.parse(text);
        } catch (e) {
          return { success: false, respMsg: "非 JSON 响应", _raw: text.slice(0, 300) };
        }
      } catch (e) {
        lastErr = e;
        await new Promise((r) => setTimeout(r, 1500));
      }
    }
    throw lastErr;
  }

  report(p, params, method = "GET") {
    return this._req(REPORT_API, p, params, method);
  }

  sys(p, params) {
    return this._req(SYS_API, p, params, "POST");
  }

  async parks() {
    const out = [];
    const seen = new Set();
    for (const code of this.projects) {
      const r = await this.report("parks", { projectCode: code });
      for (const p of r.data || []) {
        if (!seen.has(p.id)) {
          seen.add(p.id);
          out.push({ id: p.id, name: p.name });
        }
      }
    }
    return out;
  }

  async persons(orgId, keyword = "") {
    const r = await this.sys("person/queryPersonByPage", {
      pageIndex: 1,
      pageSize: 500,
      orgId,
      noOrName: keyword || "",
      "account.accountStatus": "",
    });
    return r.respData || {};
  }

  async trafficCount(start, end) {
    let n = 0;
    for (const c of this.projects) {
      const r = await this.report("getCountParkOutRecord", {
        projectCode: c,
        startTimeStr: start,
        endTimeStr: end,
      });
      n += (r.data && r.data.totalCount) || 0;
    }
    return n;
  }

  async exceptionCounts(start, end) {
    const out = {};
    for (const t of EXCEPTION_TYPES) {
      let n = 0;
      for (const c of this.projects) {
        const r = await this.report(
          "parkExceptRecord/getCountParkExceptRecordList",
          { projectCode: c, startTime: start, endTime: end, eventType: t.code },
          "POST"
        );
        n += typeof r.data === "number" ? r.data : 0;
      }
      out[t.label] = n;
    }
    return out;
  }

  async discountCount(start, end) {
    let n = 0;
    for (const c of this.projects) {
      const r = await this.report("getDiscountReportCount", {
        projectCode: c,
        startTimeStr: start,
        endTimeStr: end,
      });
      n += (r.data && r.data.totalCount) || 0;
    }
    return n;
  }

  async discountPage(start, end, projectCode, page = 1, size = 5000) {
    const r = await this.report("getDiscountReport", {
      projectCode,
      startTimeStr: start,
      endTimeStr: end,
      pageIndex: page,
      pageSize: size,
    });
    return (r.data && r.data.data) || [];
  }
}

module.exports = { Client, EXCEPTION_TYPES, HOST, readCaptcha };
