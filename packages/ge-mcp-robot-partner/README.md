# ge-mcp-robot-partner

高仙机器人合作伙伴平台的本地只读 MCP 服务。把项目、设备、任务统计、任务日历、达标阈值与告警
封装成标准 MCP 工具，供金鹰 Agent（dsh）或任意 MCP 客户端调用。

> 开发者：颜政 · 只读：不提供任务下发、排班修改、设备升级、参数修改、告警处理或结算写入。

## 安装（金鹰 Agent 插件市场）

在桌面端「插件 → 发现」中搜索「高仙机器人」安装即可。插件会把以下两项注册到当前 profile：

- 技能 `ge-mcp-robot-partner`（SKILL.md）
- MCP 连接 `robot_partner`（stdio，`mcp__robot_partner__*` 工具）

## 工具

| 工具 | 用途 |
| --- | --- |
| `robot_list_projects` | 项目/工作空间列表 |
| `robot_list_devices` | 设备台账与状态 |
| `robot_get_device` | 单台设备详情 |
| `robot_get_overview` | 实时运营概览 |
| `robot_list_task_statistics` | 全量设备日任务统计 |
| `robot_get_task_summary` | 单设备区间任务汇总 |
| `robot_list_daily_tasks` | 单设备逐任务明细 |
| `robot_get_task_calendar` | 单设备月度任务日历 |
| `robot_get_thresholds` | 当前达标阈值 |
| `robot_list_alerts` | 单设备当前/历史告警 |

## 登录与会话

平台请求使用 `Authorization: Bearer <accessToken>`。三种提供方式：

1. 环境变量 `ROBOT_PARTNER_ACCESS_TOKEN`（可选 `ROBOT_PARTNER_REFRESH_TOKEN`）；
2. 会话文件 `~/.robot-partner/session.json`（可用 `ROBOT_PARTNER_SESSION_FILE` 覆盖）；
3. 首次登录运行 `robot-partner-auth`：打开独立浏览器窗口，用户在窗口内自行完成平台登录，
   脚本只读取平台域名下的 `accessToken` / `refreshToken`，不接收或保存账号密码。
   支持 Windows Edge、macOS Edge/Chrome/Chromium、Linux Chrome/Chromium；
   也可用 `ROBOT_PARTNER_BROWSER_PATH` 指定浏览器可执行文件。

验证登录：

```bash
robot-partner-doctor
```

成功时输出实时概览 JSON；登录过期时提示重新执行 `robot-partner-auth`。

服务使用 stdio 传输：

```bash
robot-partner-mcp
```

插件默认用桌面端自带的 Electron（`ELECTRON_RUN_AS_NODE=1`）运行包内 `dist/index.js`；
命令行环境可用 `GE_MCP_NODE` 指定 node，或用 `GE_MCP_ROBOT_PARTNER_ENTRY` 覆盖入口路径。

## 安全边界

- MCP 只暴露白名单查询接口，没有通用 URL 透传工具。
- API 客户端只在收到 401 时执行一次 token 刷新，不无限重试。
- 请求结果原样返回，不会自动向外部系统发送数据。
- 会话过期后只提示重新登录，不尝试绕过登录或验证码。
- 平台接口属于适配实现，前端发版后可能需要重新核对端点与字段。

## 许可证

MIT。开发者：颜政。