# 金鹰 Agent 平台市场索引

公开索引仓库（只放 JSON 元数据，不含代码与凭据）。客户端通过 raw 地址读取：

- 工作台目录（schema v2）：`workbench/index.json`
  - https://raw.githubusercontent.com/Zcx-BaixiaoBai/ge-agent-market/main/workbench/index.json
- 插件市场索引（dsh plugin index，format 1）：`plugins/index.json`
  - https://raw.githubusercontent.com/Zcx-BaixiaoBai/ge-agent-market/main/plugins/index.json

## 已上架 MCP（每个条目与包内均声明开发者）

| 包名 | 系统 | 工具数 | 开发者 | 说明 |
|---|---|---|---|---|
| ge-mcp-jinying | 金鹰物业安全管理系统 | 28 | 张宸熙 | Snowy 1.8，SM2 加密 |
| ge-mcp-ruixin | 瑞信电表系统 | 81 | 张宸熙 | 智慧预付费管控，RSA 加密 |
| ge-mcp-sd123 | 123 物联网平台 | 9 | 张宸熙 | HTTP + MQTT |
| ge-mcp-fuca | eFlex 能碳管理平台 | 67 | 张宸熙 | 温度/运行状态/能耗/报警 |
| ge-mcp-shuibiao | 智慧能源管理平台（水表/电表） | 64 | 张宸熙 | 南京金鹰智慧能源管理平台 |
| ge-mcp-jieshun | 捷顺云停车 | 9 | 颜政 | 车场/通行/异常放行/场内车辆/优惠/收费统计，只读 |
| ge-mcp-robot-partner | 高仙机器人合作伙伴平台 | 10 | 颜政 | 项目/设备/任务统计/日历/阈值/告警，只读 |

安装前提：GE-MCP 系列需要本机有 GE-MCP 检出（默认 `~/GE-MCP`，可用 `GE_MCP_ROOT` 覆盖）、Python 依赖
（`pip install fastmcp httpx playwright`）、各自系统的 `config.json`（账号密码）。`ge-mcp-jieshun` 与
`ge-mcp-robot-partner` 为自包含 Node 包，不需要检出：前者读 `~/.jlite/accounts.csv`（或
`JLITE_ACCOUNT_FILE`），后者读 `~/.robot-partner/session.json`（或 `ROBOT_PARTNER_ACCESS_TOKEN`）。
每个包同时内置该系统的 SKILL.md 技能（技能描述里也标注开发者）。

## 已上架插件

| 包名 | 能力 | 开发者 | 说明 |
|---|---|---|---|
| ge-skill-lark-cli | 飞书 CLI 办公助手 | Z.ai | 封装官方 lark-cli（MIT）；文档/表格/多维表格/日历/消息，含 setup 与 OAuth 引导 |

## 已上架办公技能

| 包名 | 能力 | 开发者 | 说明 |
|---|---|---|---|
| ge-skill-officecli-docx | Word 文档 | OfficeCLI | 创建/读取/编辑 .docx；officecli 单二进制，无需装 Office（Apache-2.0） |
| ge-skill-officecli-xlsx | Excel 表格 | OfficeCLI | 创建/读取/编辑 .xlsx/.csv、公式/图表/透视表（Apache-2.0） |
| ge-skill-officecli-pptx | PowerPoint 演示 | OfficeCLI | 创建/读取/编辑 .pptx、模板/版式/备注（Apache-2.0） |
| ge-skill-internal-comms | 内部沟通写作 | Anthropic | 状态报告/领导更新/3P/公司通讯/FAQ/事故报告（Apache-2.0） |

上架流程（Phase 1 起走内部审批）：提交 → 自动检查 → 复核 → 合并本仓库。当前为 PoC 空目录，
内容随内部审批结果更新。