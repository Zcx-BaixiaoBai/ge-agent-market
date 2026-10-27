# 水表 MCP 技能（shuibiao-mcp）

> 开发者（Developer）：张宸熙 · 仓库：https://github.com/Zcx-BaixiaoBai/shuibiao-mcp
> 64 个工具（含 20 个写操作）· 南京金鹰智慧能源管理平台（https://shuibiao.jinying.com）

## 何时使用

当用户需要查询或操作南京金鹰智慧能源管理平台（智能水表/电表）的数据时使用：
- 看板概览、设备档案、楼栋/房间信息
- 抄表采集数据、用量明细、异常表具
- 报警消息、工单处理
- 收费账单、欠费查询、缴费记录
- 能耗分析、报表导出（Excel 落盘）
- 系统管理、表单写操作（新增/修改档案、下发指令等）

## 工具分组

| 分组 | 说明 |
|---|---|
| auth | 验证码、登录、会话状态（`auth_get_captcha` → `auth_login`） |
| dashboard | 看板汇总指标 |
| archives | 项目/楼栋/房间/表具档案 |
| metering | 抄表与采集数据 |
| alarm | 报警消息与处理 |
| charge | 收费、账单、欠费、缴费 |
| energy | 能耗分析与对比 |
| reports | 报表导出（返回落盘路径） |
| system | 系统管理 |
| writes | 20 个写操作（新增/修改/下发指令，调用前先向用户确认） |

## 认证流程（验证码）

1. 调用 `auth_get_captcha`，返回 `imageBase64` 与 `checkKey`
2. 识别图中 4 位字母（人工或视觉模型）
3. 调用 `auth_login(captcha=..., checkKey=...)`
4. 会话约 3 小时有效，缓存在项目根 `.session.json`；过期后重复上述流程
5. 用 `auth_status` 检查登录状态

## 配置

在项目根创建 `.env`（参考 `.env.example`）：
- `SHUIBIAO_USERNAME` / `SHUIBIAO_PASSWORD`：平台登录凭据
- `SHUIBIAO_DOWNLOAD_DIR`：报表导出目录
- `SHUIBIAO_BASE_URL`：默认生产站

## 注意

- 写操作会真实修改平台数据，执行前必须向用户确认目标与内容。
- 报表与导出类工具会把文件写到 `SHUIBIAO_DOWNLOAD_DIR`，返回绝对路径。
- 不要把 `.env`、`.session.json` 提交到任何仓库或分享出去。