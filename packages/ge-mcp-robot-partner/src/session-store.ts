import fs from "node:fs/promises";
import path from "node:path";
import type { AppConfig } from "./config.js";

export interface Session {
  accessToken: string;
  refreshToken?: string;
  updatedAt: string;
}

export class SessionStore {
  readonly #sessionFile: string;
  readonly #envAccessToken?: string;
  readonly #envRefreshToken?: string;
  #session: Session | null = null;

  constructor(config: AppConfig) {
    this.#sessionFile = config.sessionFile;
    this.#envAccessToken = config.accessToken;
    this.#envRefreshToken = config.refreshToken;
  }

  async load(): Promise<Session> {
    if (this.#session) return this.#session;

    if (this.#envAccessToken) {
      this.#session = {
        accessToken: this.#envAccessToken,
        refreshToken: this.#envRefreshToken,
        updatedAt: new Date().toISOString(),
      };
      return this.#session;
    }

    try {
      const parsed = JSON.parse(
        await fs.readFile(this.#sessionFile, "utf8"),
      ) as Partial<Session>;
      if (!parsed.accessToken) {
        throw new Error("session file does not contain accessToken");
      }
      this.#session = {
        accessToken: parsed.accessToken,
        refreshToken: parsed.refreshToken,
        updatedAt: parsed.updatedAt ?? new Date().toISOString(),
      };
      return this.#session;
    } catch (error) {
      const detail =
        error instanceof Error ? error.message : "unknown session error";
      throw new Error(
        `未找到可用的机器人平台登录会话。请先运行 npm run auth。详情：${detail}`,
      );
    }
  }

  async save(session: Session): Promise<void> {
    this.#session = session;
    if (this.#envAccessToken) return;

    await fs.mkdir(path.dirname(this.#sessionFile), { recursive: true });
    const temporaryPath = `${this.#sessionFile}.${process.pid}.tmp`;
    await fs.writeFile(
      temporaryPath,
      `${JSON.stringify(session, null, 2)}\n`,
      { encoding: "utf8", mode: 0o600 },
    );
    await fs.rename(temporaryPath, this.#sessionFile);
    await fs.chmod(this.#sessionFile, 0o600).catch(() => undefined);
  }
}
