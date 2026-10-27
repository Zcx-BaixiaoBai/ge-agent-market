# 金鹰 Agent 平台市场索引

公开索引仓库（只放 JSON 元数据，不含代码与凭据）。客户端通过 raw 地址读取：

- 工作台目录（schema v2）：`workbench/index.json`
  - https://raw.githubusercontent.com/Zcx-BaixiaoBai/ge-agent-market/main/workbench/index.json
- 插件市场索引（dsh plugin index，format 1）：`plugins/index.json`
  - https://raw.githubusercontent.com/Zcx-BaixiaoBai/ge-agent-market/main/plugins/index.json

## 已上架 MCP（每个条目与包内均声明开发者）

| 包名 | 系统 | 工具数 | 开发者 | 说明 |
|---|---|---|---|---|
| ge-mcp-jinying | 金鹰物业安全管理系统 | 28 | Zcx-BaixiaoBai | Snowy 1.8，SM2 加密 |
| ge-mcp-ruixin | 瑞信电表系统 | 81 | Zcx-BaixiaoBai | 智慧预付费管控，RSA 加密 |
| ge-mcp-sd123 | 123 物联网平台 | 9 | Zcx-BaixiaoBai | HTTP + MQTT |
| ge-mcp-fuca | eFlex 能碳管理平台 | 67 | Zcx-BaixiaoBai | 温度/运行状态/能耗/报警 |

安装前提：本机有 GE-MCP 检出（默认 `~/GE-MCP`，可用 `GE_MCP_ROOT` 覆盖）、Python 依赖
（`pip install fastmcp httpx playwright`）、各自系统的 `config.json`（账号密码）。每个包同时内置该系统的
SKILL.md 技能（技能描述里也标注开发者）。

上架流程（Phase 1 起走内部审批）：提交 → 自动检查 → 复核 → 合并本仓库。当前为 PoC 空目录，
内容随内部审批结果更新。