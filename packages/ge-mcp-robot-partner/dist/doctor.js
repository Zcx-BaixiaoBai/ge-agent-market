#!/usr/bin/env node
import { loadConfig } from "./config.js";
import { RobotPlatformClient } from "./platform-client.js";
async function main() {
    const config = loadConfig();
    const client = new RobotPlatformClient(config);
    const overview = await client.getRealtimeOverview({});
    console.log(JSON.stringify({
        ok: true,
        baseUrl: config.baseUrl,
        sessionFile: config.sessionFile,
        overview,
    }, null, 2));
}
main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
});
//# sourceMappingURL=doctor.js.map