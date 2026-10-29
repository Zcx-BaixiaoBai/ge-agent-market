> 开发者（Developer）：颜政 · 包名：ge-mcp-robot-partner · 只读 MCP

# 高仙机器人合作伙伴平台只读 MCP 技能

> 10 个工具 | 高仙机器人合作伙伴平台（partner.gs-robot.com） | 只读查询，不含任务下发与设备写操作

---

## 何时使用

当用户需要查询高仙清洁机器人的运营数据时：

- 项目/工作空间（`robot_list_projects`）
- 设备台账、在线状态、项目归属、完成率（`robot_list_devices` / `robot_get_device`）
- 实时概览：总数、在线、任务中、离线（`robot_get_overview`）
- 日任务统计汇总，适合项目级批量分析（`robot_list_task_statistics`）
- 单台设备的区间汇总、逐日明细、月度任务日历（`robot_get_task_summary` /
  `robot_list_daily_tasks` / `robot_get_task_calendar`）
- 达标阈值（`robot_get_thresholds`）
- 当前告警与历史告警（`robot_list_alerts`）

**关键词**：高仙、清洁机器人、扫地机器人、设备在线率、任务完成率、清洁面积、告警

---

## 前置条件

1. **登录会话**（二选一）：
   - 直接提供 token：环境变量 `ROBOT_PARTNER_ACCESS_TOKEN`（可选 `ROBOT_PARTNER_REFRESH_TOKEN`）。
   - 使用浏览器扫码/登录后保存的会话文件：默认 `~/.robot-partner/session.json`，
     可用 `ROBOT_PARTNER_SESSION_FILE` 覆盖。
2. **网络**：能访问 `https://partner.gs-robot.com`（可用 `ROBOT_PARTNER_BASE_URL` 覆盖）。
3. 首次登录可运行包内的 `robot-partner-auth`（打开独立浏览器窗口，只读取平台域名下的
   `accessToken` / `refreshToken`，不接收账号密码）。会话过期时重新执行即可。

> 建议使用专门的只读集成账号。凭据只保存在本机，不要粘贴到对话或提交进仓库。

---

## 工具与参数

日期格式 `YYYY-MM-DD`，月份格式 `YYYY-MM`；`measureType`：1=平方米（默认），2=平方英尺。

| 工具 | 主要参数 | 说明 |
|---|---|---|
| `robot_list_projects` | `pageNumber?`, `pageSize?`, `workspaceNo?`, `workspaceName?` | 项目/工作空间 |
| `robot_list_devices` | `pageNumber?`, `pageSize?`, `measureType?`, `orderBy?`, `filter?` | 设备台账与状态 |
| `robot_get_device` | `robotSn` | 单台设备详情 |
| `robot_get_overview` | `filter?` | 实时概览 |
| `robot_list_task_statistics` | `startDate`, `endDate`, `pageNumber?`, `pageSize?`, `measureType?`, `filter?`, `isCompliant?`, `orderBy?` | 全量设备日任务统计 |
| `robot_get_task_summary` | `robotSn`, `startDate`, `endDate`, `measureType?` | 单设备区间汇总 |
| `robot_list_daily_tasks` | `robotSn`, `date`, `measureType?` | 单设备逐任务明细 |
| `robot_get_task_calendar` | `robotSn`, `yearMonth`, `measureType?` | 单设备月度日历 |
| `robot_get_thresholds` | `measureType?` | 达标阈值 |
| `robot_list_alerts` | `robotSn`, `history?`, `pageNumber?`, `pageSize?`, `filter?` | 当前/历史告警 |

`filter` 是平台原生筛选对象，原样透传；不确定字段时先不传。

---

## 使用建议

- 先 `robot_list_projects` 或 `robot_list_devices` 找到 `robotSn`，再查详情/日历/告警。
- 项目级汇总优先用 `robot_list_task_statistics`；单台设备的多日趋势用
  `robot_get_task_summary` + `robot_get_task_calendar`，不要逐日循环拉明细。
- 问「达标情况」时同时读 `robot_get_thresholds`，用平台阈值解释完成率。
- 返回的分页字段原样保留；需要更多数据时递增 `pageNumber`，不要一次把 `pageSize` 调到很大。

## 安全边界

- 仅暴露白名单查询接口，没有通用 URL 透传工具，也不提供任务下发、排班修改、设备升级、
  参数修改、告警处理或结算写入。
- 只在收到 401 时刷新一次 token，不无限重试；过期后提示重新登录，不绕过验证码。
- 平台接口属于适配实现，前端发版后可能需要重新核对端点与字段。