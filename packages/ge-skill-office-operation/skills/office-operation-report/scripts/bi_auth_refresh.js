#!/usr/bin/env node
/**
 * BI 认证自动刷新（平台集成版）
 * ============================
 * 链路：OA 无头登录 → SSO 中转(GoToOtherSys.jsp?syscode=001) → BI 建立会话 → 提取 uIdToken → 写入 guancli 配置
 *
 * 凭证与地址来源（环境变量，按 README「配置」设置）：
 *   1. OA_URL / OA_SSO_URL / BI_ORIGIN            必填，OA 登录页、SSO 中转、BI 站点地址
 *   2. OA_LOGIN_ID / OA_PASSWORD                  必填（或同目录 .oa_credentials.json）
 *   3. GUANCLI_CONFIG                             可选，guancli config.json 路径（默认按平台）
 *
 * 依赖：playwright + 系统 Chrome（channel: 'chrome'），无头运行，无需人工干预。
 * 成功退出码 0；失败退出码非 0 并输出原因到 stderr。
 *
 * 用法：
 *   node scripts/bi_auth_refresh.js            # 刷新并写入 guancli config
 *   node scripts/bi_auth_refresh.js --check    # 只校验当前 token 是否有效，不刷新
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

function requireEnv(name) {
  const value = (process.env[name] || '').trim();
  if (!value) {
    throw new Error(`缺少环境变量 ${name}：请按 README「配置」设置后重试`);
  }
  return value.replace(/\/+$/, '');
}

const OA_URL = process.env.OA_URL || '';
const OA_SSO_URL = process.env.OA_SSO_URL || '';
const BI_ORIGIN = requireEnv('BI_ORIGIN');
const GUANCLI_CFG = process.env.GUANCLI_CONFIG || (
  process.platform === 'darwin'
    ? path.join(os.homedir(), 'Library/Application Support/guancli/config.json')
    : process.platform === 'win32'
      ? path.join(process.env.APPDATA || os.homedir(), 'guancli', 'config.json')
      : path.join(os.homedir(), '.config/guancli/config.json')
);
const LOCAL_CRED = path.join(__dirname, '.oa_credentials.json');

function loadCredentials() {
  const id = process.env.OA_LOGIN_ID;
  const pw = process.env.OA_PASSWORD;
  if (id && pw) return { loginId: id, password: pw, source: 'env' };
  if (fs.existsSync(LOCAL_CRED)) {
    const c = JSON.parse(fs.readFileSync(LOCAL_CRED, 'utf8'));
    if (c.loginId && c.password) return { ...c, source: 'file' };
  }
  throw new Error('缺少 OA 凭证：请设置环境变量 OA_LOGIN_ID/OA_PASSWORD（见 README「配置」），或创建 scripts/.oa_credentials.json');
}

/** 校验 guancli 配置中的 token 是否在线有效（HEAD 一张卡片元信息） */
async function checkTokenAlive() {
  if (!fs.existsSync(GUANCLI_CFG)) return false;
  const cfg = JSON.parse(fs.readFileSync(GUANCLI_CFG, 'utf8'));
  const token = cfg.profiles && cfg.profiles.jinying && cfg.profiles.jinying.token;
  if (!token) return false;
  try {
    const res = await fetch(`${BI_ORIGIN}/api/card/k5425cb5956c9495ea1d85d7`, {
      headers: { Cookie: `uIdToken=${token}` },
    });
    return res.status === 200;
  } catch (e) {
    return false;
  }
}

function writeToken(newToken) {
  const cfg = JSON.parse(fs.readFileSync(GUANCLI_CFG, 'utf8'));
  const prof = cfg.profiles.jinying;
  prof.token = newToken;
  const now = Math.floor(Date.now() / 1000);
  prof.issued_at = now;
  prof.updated_at = now;
  // 从 JWT payload 解 exp
  try {
    const payload = JSON.parse(Buffer.from(newToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString());
    if (payload.exp) prof.expires_at = payload.exp;
  } catch (e) { /* 忽略，guancli 不强制依赖 */ }
  fs.writeFileSync(GUANCLI_CFG, JSON.stringify(cfg, null, 2));
  try { fs.chmodSync(GUANCLI_CFG, 0o600); } catch (e) {}
}

async function refresh() {
  const cred = loadCredentials();
  const oaUrl = requireEnv('OA_URL');
  const oaSsoUrl = requireEnv('OA_SSO_URL');
  const masked = cred.loginId.length <= 2 ? '**' : cred.loginId[0] + '***' + cred.loginId.slice(-1);
  console.error(`[bi_auth_refresh] 凭证来源: ${cred.source === 'env' ? '环境变量' : '本地凭证文件'}（账号 ${masked}）`);
  const { chromium } = require('playwright');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true });
  try {
    const page = await ctx.newPage();
    // ① OA 登录
    await page.goto(oaUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('#loginid', { timeout: 20000 });
    await page.waitForTimeout(3000);
    await page.fill('#loginid', cred.loginId);
    await page.fill('#userpassword', cred.password);
    const btn = await page.$('.e9login-form-btn, button[type=submit]');
    if (btn) await btn.click(); else await page.press('#userpassword', 'Enter');
    // 登录成功标志：URL 进入 portal 或出现用户菜单
    await page.waitForURL(/portal|main/, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(5000);
    if ((await page.title()).includes('登录')) {
      throw new Error('OA 登录失败：账号/密码错误，或出现验证码策略，请人工检查');
    }

    // ② SSO 中转到 BI
    const biPage = await ctx.newPage();
    await biPage.goto(oaSsoUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await biPage.waitForTimeout(8000);
    if (!biPage.url().startsWith(BI_ORIGIN)) {
      throw new Error(`SSO 跳转异常，落地页为 ${biPage.url()}`);
    }

    // ③ 提取 uIdToken
    const cookies = await ctx.cookies(BI_ORIGIN);
    const uid = cookies.find(c => c.name === 'uIdToken' && c.value);
    if (!uid) throw new Error('未在 BI 会话中找到 uIdToken cookie');

    writeToken(uid.value);
    console.log(`[bi_auth_refresh] ✅ token 已刷新（${uid.value.length} 字符）`);
    return true;
  } finally {
    await browser.close();
  }
}

(async () => {
  const checkOnly = process.argv.includes('--check');
  if (checkOnly) {
    const alive = await checkTokenAlive();
    console.log(alive ? 'alive' : 'dead');
    process.exit(alive ? 0 : 3);
  }
  try {
    // 先检查现有 token，活着就不刷（幂等）
    if (await checkTokenAlive()) {
      console.log('[bi_auth_refresh] 现有 token 仍有效，跳过刷新');
      process.exit(0);
    }
    await refresh();
    process.exit(0);
  } catch (e) {
    console.error(`[bi_auth_refresh] ❌ ${e.message}`);
    process.exit(1);
  }
})();
