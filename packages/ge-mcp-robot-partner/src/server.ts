import { McpServer } from "@modelcontextprotocol/server";
import { loadConfig } from "./config.js";
import { RobotPlatformClient } from "./platform-client.js";
import { registerReadOnlyTools } from "./tools.js";

export function createRobotPartnerServer(
  options: { client?: RobotPlatformClient } = {},
) {
  const config = loadConfig();
  const client = options.client ?? new RobotPlatformClient(config);
  const server = new McpServer({
    name: "robot-partner-readonly",
    version: "0.1.0",
  });

  registerReadOnlyTools(server, client);
  return server;
}
