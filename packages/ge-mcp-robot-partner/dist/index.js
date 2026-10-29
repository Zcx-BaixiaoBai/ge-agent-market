#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import { createRobotPartnerServer } from "./server.js";
async function main() {
    const server = createRobotPartnerServer();
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("robot-partner-readonly MCP connected over stdio");
}
main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
});
//# sourceMappingURL=index.js.map