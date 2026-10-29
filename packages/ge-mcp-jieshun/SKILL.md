> 开发者（Developer）：颜政 · 包名：ge-mcp-jieshun · 只读 MCP

# 捷顺云停车只读 MCP 技能

> 9 个工具 | 捷顺云停车门户（jygw.jslife.net） | 只读查询，不含任何写操作

---

## 何时使用

当用户需要查询捷顺云停车的数据时：

- 有哪些车场/组织可用（`parking_orgs`）
- 某车场下的停车场与 parkId（`parking_parks`）
- 服务人员台账（`parking_persons`）
- 区间通行量、6 类异常放行、识别率，可按月拆分（`parking_traffic`）
- 通行（出场）明细、场内未出场车辆（`parking_vehicle_records` / `parking_inside_vehicles`）
- 停车优惠/打折汇总与商户用量 Top（`parking_discount_summary`）
- 收费统计（按支付方式，含收入/退款/净额）（`parking_charge_summary`）

**关键词**：捷顺、云停车、车场、停车、通行记录、异常放行、场内车辆、停车优惠、收费统计

---

## 前置条件

1. **车场账号文件**：默认读取 `~/.jlite/accounts.csv`，也可用环境变量
   `JLITE_ACCOUNT_FILE` 指向其他 CSV/JSON 文件。

   ```csv
   车场,账号,密码
   示例车场,example001,********
   ```

   也支持 JSON：`{"示例车场": {"account": "example001", "password": "********"}}`。
   凭据只保存在本机，不要粘贴到对话或提交进仓库。

2. **网络**：能访问捷顺云停车门户（默认 `http://jygw.jslife.net:8081`，
   可用 `JIESHUN_HOST` 覆盖）。

---

## 工具与参数

所有工具都要求先确定 `org`（车场名，可用 `parking_orgs` 列出；支持包含匹配）。
日期参数为 `YYYY-MM-DD`，缺省为本月 1 日到今天，返回里的 `defaulted_range` 会标记。

| 工具 | 主要参数 | 说明 |
|---|---|---|
| `parking_orgs` | `keyword?` | 列出账号文件中的车场 |
| `parking_parks` | `org` | 车场下的停车场（名称 + parkId） |
| `parking_persons` | `org`, `keyword?` | 服务人员（编号/姓名/账号/状态） |
| `parking_traffic` | `org`, `start?`, `end?`, `by_month?` | 通行量 + 异常放行 + 识别率 |
| `parking_vehicle_records` | `org`, `start?`, `end?`, `page?`, `page_size?`, `plate?`, `park?` | 出场明细分页 |
| `parking_inside_vehicles` | `org`, `start?`, `end?`, `page?`, `page_size?` | 场内未出场车辆 |
| `parking_discount_summary` | `org`, `start?`, `end?`, `max_pages?` | 打折记录/方案/商户 Top |
| `parking_charge_summary` | `org`, `start?`, `end?` | 按支付方式统计收费 |
| `parking_server_info` | — | 服务状态、账号文件位置、只读说明 |

---

## 使用建议

- 先调 `parking_orgs` 确认车场名，再查明细，避免车场名歧义（重名会报错并列出候选）。
- 汇总类问题用 `parking_traffic` / `parking_discount_summary` / `parking_charge_summary`，
  不要逐页拉明细再自己加总。
- `parking_discount_summary` 默认只扫描前 4 页（每页 5000 条）；结果里
  `truncated=true` 时提示用户调大 `max_pages`（上限 40）。
- 大区间查询建议先按月（`by_month=true`）看趋势，再钻取具体月份。

## 安全边界

- 仅调用查询接口，无新增、修改、停用、删除。
- 账号密码只在本机账号文件中读取；登录 token 仅在进程内复用。
- 验证码识别失败时返回明确错误，不绕过验证码。