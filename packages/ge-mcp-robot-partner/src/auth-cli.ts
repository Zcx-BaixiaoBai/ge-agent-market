#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { chromium, type BrowserContext } from "playwright-core";
import { loadConfig } from "./config.js";
import { SessionStore } from "./session-store.js";

async function findBrowserExecutable(): Promise<string> {
  const candidates = [
    process.env.ROBOT_PARTNER_BROWSER_PATH,
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter((value): value is string => Boolean(value));

  for (const candidate of candidates) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // Try the next known browser location.
    }
  }
  throw new Error(
    "未找到可用的 Edge/Chrome/Chromium，请安装浏览器或用 ROBOT_PARTNER_BROWSER_PATH 指定可执行文件",
  );
}

async function waitForTokens(
  context: BrowserContext,
  timeoutMs = 10 * 60 * 1000,
) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    for (const page of context.pages()) {
      try {
        const tokens = await page.evaluate(() => ({
          accessToken: localStorage.getItem("accessToken"),
          refreshToken: localStorage.getItem("refreshToken"),
        }));
        if (tokens.accessToken) return tokens;
      } catch {
        // Navigation and cross-origin pages can temporarily reject evaluate.
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  throw new Error("等待登录超时，请重新运行 npm run auth");
}

async function main() {
  const config = loadConfig();
  const profileDir = path.join(path.dirname(config.sessionFile), "browser-profile");
  await fs.mkdir(profileDir, { recursive: true });

  console.error("正在打开独立浏览器会话，请在窗口中完成平台登录。");
  const context = await chromium.launchPersistentContext(profileDir, {
    executablePath: await findBrowserExecutable(),
    headless: false,
    viewport: null,
    args: ["--start-maximized"],
  });

  const page = context.pages()[0] ?? (await context.newPage());
  await page.goto(`${config.baseUrl}/#/dashboard?tab=robots`, {
    waitUntil: "domcontentloaded",
  });
  console.error("登录成功后会自动保存会话；不需要把密码输入本工具。");

  try {
    const tokens = await waitForTokens(context);
    if (!tokens.accessToken) {
      throw new Error("登录成功，但未找到 accessToken");
    }
    const store = new SessionStore(config);
    await store.save({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken ?? undefined,
      updatedAt: new Date().toISOString(),
    });
    console.error(`会话已保存：${config.sessionFile}`);
  } finally {
    await context.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
