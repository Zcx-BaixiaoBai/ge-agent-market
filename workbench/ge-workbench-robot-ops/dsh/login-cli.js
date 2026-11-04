#!/usr/bin/env node
// 高仙机器人助手 —— 登录窗口
//
// 用系统里的 Chrome / Edge 打开平台登录页，等用户在窗口里完成登录（账号密码 + 短信），
// 从页面 localStorage 里取出 accessToken / refreshToken，写回本机会话文件。
// 不接收、不记录账号密码。
//
// 用法：node login-cli.js
// 环境变量：ROBOT_PARTNER_SESSION_FILE（会话文件，必需）、ROBOT_PARTNER_BROWSER_PATH（可选）

import { access, mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { homedir } from 'node:os'

const SESSION_FILE = (process.env.ROBOT_PARTNER_SESSION_FILE || '').trim()
  || join(homedir(), '.robot-partner', 'session.json')
const BASE_URL = (process.env.ROBOT_PARTNER_LOGIN_URL || 'https://partner.gs-robot.com').replace(/\/+$/, '')
const TIMEOUT_MS = 10 * 60 * 1000

function log(message) {
  process.stderr.write(`${new Date().toISOString()} ${message}\n`)
}

async function findBrowser() {
  const candidates = [
    process.env.ROBOT_PARTNER_BROWSER_PATH,
    process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ].filter(Boolean)
  for (const candidate of candidates) {
    try {
      await access(candidate)
      return candidate
    } catch {
      // 试下一个
    }
  }
  throw new Error('没有找到 Chrome / Edge / Chromium，请安装浏览器，或用 ROBOT_PARTNER_BROWSER_PATH 指定路径')
}

async function main() {
  const { chromium } = await import('playwright-core')
  const executablePath = await findBrowser()
  const profileDir = join(dirname(SESSION_FILE), 'browser-profile')
  await mkdir(profileDir, { recursive: true })
  log(`打开登录窗口：${executablePath}`)

  const context = await chromium.launchPersistentContext(profileDir, {
    executablePath,
    headless: false,
    viewport: null,
    args: ['--start-maximized'],
  })
  try {
    const page = context.pages()[0] ?? await context.newPage()
    await page.goto(`${BASE_URL}/#/dashboard?tab=robots`, { waitUntil: 'domcontentloaded' })
    const deadline = Date.now() + TIMEOUT_MS
    while (Date.now() < deadline) {
      for (const open of context.pages()) {
        try {
          const tokens = await open.evaluate(() => ({
            accessToken: localStorage.getItem('accessToken'),
            refreshToken: localStorage.getItem('refreshToken'),
          }))
          if (tokens.accessToken) {
            await writeFile(
              SESSION_FILE,
              `${JSON.stringify({ ...tokens, updatedAt: new Date().toISOString() }, null, 2)}\n`,
              { encoding: 'utf8', mode: 0o600 },
            )
            log(`登录成功，会话已保存：${SESSION_FILE}`)
            return
          }
        } catch {
          // 页面跳转中读取失败是正常的，继续等
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
    throw new Error('等待登录超时（10 分钟），请重新打开登录窗口')
  } finally {
    await context.close()
  }
}

main().catch((error) => {
  log(`登录失败：${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
})