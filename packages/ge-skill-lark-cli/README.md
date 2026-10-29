# ge-skill-lark-cli

飞书 CLI 办公助手。通过本机 `lark-cli` 操作飞书云文档、表格、多维表格、日历、消息等 SaaS 资源，
内置安装、应用配置、OAuth 登录引导和写操作确认。

> 封装自 [Z.ai lark-cli 0.1.2](https://github.com/larksuite/cli)（MIT），基于官方
> [Lark CLI](https://github.com/larksuite/cli)。本包只做 DeepSeek Harness 技能适配，
> 不内置凭证、MCP 或远程服务。

## 安装（金鹰 Agent 插件市场）

在桌面端「插件 → 发现」中搜索「飞书 CLI」安装即可。插件会注册两个技能：

| 技能 | 用途 |
|---|---|
| `lark-cli-setup` | 检查/安装最新版 `lark-cli`，配置应用并登录 |
| `lark-cli` | 使用文档、表格、多维表格、日历、消息等 CLI 能力 |

## 首次使用

对 Agent 说「帮我配置飞书 CLI」或直接调用 `lark-cli-setup`。它会：

1. 检查 `lark-cli --version`；缺少时给出 `npm install -g @larksuite/cli@latest` 并征求同意；
2. 优先复用已有 profile，用 `lark-cli auth status --json --verify` 检查身份；
3. 未配置时引导 `lark-cli config init --new`（浏览器完成应用配置）；
4. 缺少用户授权时分步展示 OAuth 链接/二维码，用户完成后再用 device code 收尾；
5. 用 `lark-cli auth check --scope ...` 和一次最小只读请求验证。

## 安全边界

- 默认显式使用 `--as user`；切换 bot 身份必须由用户指定。
- 发消息、修改文档/表格、权限和日程等写操作会先展示资源、接收人和 scope，并请求确认。
- 不要求用户在聊天中粘贴 App Secret、OAuth Token 或 Cookie，也不回显本地配置。
- 所有飞书操作通过用户本机的 `lark-cli` 执行，不经过第三方服务器。

## 上游与许可

- 上游 CLI：<https://github.com/larksuite/cli>（MIT，Copyright (c) 2026 Lark Technologies Pte. Ltd.）
- 技能封装：Z.ai lark-cli 0.1.2（MIT）
- 本仓库适配：金鹰平台团队