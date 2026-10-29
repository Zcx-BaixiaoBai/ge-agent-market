import path from "node:path";
import { fileURLToPath } from "node:url";
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
function nonEmpty(value) {
    const trimmed = value?.trim();
    return trimmed ? trimmed : undefined;
}
export function loadConfig() {
    const sessionFileValue = nonEmpty(process.env.ROBOT_PARTNER_SESSION_FILE) ??
        path.join(".secrets", "session.json");
    return {
        baseUrl: nonEmpty(process.env.ROBOT_PARTNER_BASE_URL) ??
            "https://partner.gs-robot.com",
        sessionFile: path.isAbsolute(sessionFileValue)
            ? sessionFileValue
            : path.resolve(projectRoot, sessionFileValue),
        accessToken: nonEmpty(process.env.ROBOT_PARTNER_ACCESS_TOKEN),
        refreshToken: nonEmpty(process.env.ROBOT_PARTNER_REFRESH_TOKEN),
        requestTimeoutMs: 20_000,
    };
}
export { projectRoot };
//# sourceMappingURL=config.js.map