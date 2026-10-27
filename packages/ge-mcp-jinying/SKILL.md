> 开发者（Developer）：张宸熙（Zcx-BaixiaoBai） · 仓库：https://github.com/Zcx-BaixiaoBai/GE-MCP

# 金鹰物业安全管理系统 MCP 技能

> 28 个工具 | Snowy 1.8 框架 | http://safety.jinying.com:18181

---

## 何时使用

当用户需要操作金鹰物业安全管理系统：
- 隐患整改、隐患核查、隐患查询
- 安全文档发布/审核
- 品控任务管理
- 安全履职计划（我的计划、油烟管道、装修日报）
- 安全事故记录/优秀案例
- 天气预警
- 安全自评
- 消控室值守/值班查岗
- 安全培训
- 安全维保（任务/模式）
- 危险作业（区域/作业票）
- 设备点位管理
- 消防水压监测/火灾报警
- 组织架构、用户、岗位管理

**关键词**: 金鹰安全、隐患整改、品控、消防档案、维保任务、作业票、值班查岗、安全评估

---

## ⚠️ CRUD 操作铁律

```
Step 1: 拉取全量数据 → 列出所有选项
Step 2: 用户确认后 → 执行写入
```

## ⚠️ 查询交互铁律（每次查询前必读）

**绝不允许直接调用查询工具！必须先询问用户查询条件。**

```
Step 1: 根据用户需求，列出该工具支持的筛选条件
Step 2: 询问用户要按什么条件查询
Step 3: 用户明确条件后，组装参数调用工具
```

**交互示例：**
- 用户说"查隐患整改" → 必须先问：哪个部门？状态？时间范围？责任人？
- 用户说"查值班查岗" → 必须先问：哪天？哪个项目？
- 用户说"查维保任务" → 必须先问：哪个模式？状态？组织？
- 用户说"查设备点位" → 必须先问：哪个建筑？设备类型？

**绝对禁止：**
- ❌ 直接调用默认参数查询
- ❌ 不问条件就传空 filters
- ❌ 返回大量数据后才说"下次可以加筛选"

## ⚠️ 查询交互铁律（每次查询前必读）

**绝不允许直接调用查询工具！必须先询问用户查询条件。**

```
Step 1: 根据用户需求，列出该工具支持的筛选条件
Step 2: 询问用户要按什么条件查询
Step 3: 用户明确条件后，组装参数调用工具
```

**交互示例：**
- 用户说"查隐患整改" → 必须先问：哪个部门？状态？时间范围？责任人？
- 用户说"查值班查岗" → 必须先问：哪天？哪个项目？
- 用户说"查维保任务" → 必须先问：哪个模式？状态？组织？
- 用户说"查设备点位" → 必须先问：哪个建筑？设备类型？

**绝对禁止：**
- ❌ 直接调用默认参数查询
- ❌ 不问条件就传空 filters
- ❌ 返回大量数据后才说"下次可以加筛选"

## ⚠️ 查询交互铁律（每次查询前必读）

**绝不允许直接调用查询工具！必须先询问用户查询条件。**

```
Step 1: 根据用户需求，列出该工具支持的筛选条件
Step 2: 询问用户要按什么条件查询（时间范围？哪个部门？哪个责任人？）
Step 3: 用户明确条件后，组装 filters 参数调用工具
```

### 各查询工具的交互示例

**用户说"查隐患整改" → Agent 必须问：**
- "要查哪个部门的隐患？（留空查全部）"
- "隐患状态？（待整改/已整改/已验收/全部）"
- "时间范围？（发现时间，默认不限）"
- "责任人？（留空查全部）"

**用户说"查值班查岗" → Agent 必须问：**
- "查哪天的值班记录？（默认今天，可指定日期如 2026-06-10）"
- "哪个项目的值班？（留空查全部）"
- "每页显示多少条？（默认50条）"

**用户说"查维保任务" → Agent 必须问：**
- "查哪个维保模式的任务？（消防/电梯/空调/全部）"
- "任务状态？（待执行/执行中/已完成/全部）"
- "哪个组织的任务？（留空查全部）"

**用户说"查设备点位" → Agent 必须问：**
- "查哪个建筑的设备？"
- "设备类型？（烟感/温感/手报/全部）"
- "在线状态？（在线/离线/全部）"

### 绝对禁止

- ❌ 用户说"查xxx"就直接调用工具用默认参数
- ❌ 不问条件就传空 filters `"{}"`
- ❌ 猜测用户想查什么范围
- ❌ 返回大量数据后才说"下次可以加筛选条件"

### 正确示范

```
用户: "查一下隐患整改"
Agent: "好的，请问：
  1. 查哪个部门的隐患？（留空查全部）
  2. 隐患状态？（待整改/已整改/已验收/全部）
  3. 时间范围？（发现时间，如 2026-05-01 到 2026-06-10，留空不限）
  4. 责任人？（留空查全部）"
用户: "查待整改的，安保部的"
Agent: → list_data(module="fix", filters="riskStatus=待整改&orgName=安保部")
```

### 各操作前置查询

| 操作 | 必须先调 | 为什么 |
|------|---------|--------|
| 提交隐患整改 | `risk_fix_list()` | 确认待整改项 |
| 新增隐患名称 | `risk_name_list()` | 避免重复 |
| 新增维保任务 | `user_list()` + `get_org_tree()` | 需要责任人和组织 |
| 新增/编辑/删除作业区域 | `work_area_list()` | 确认现有区域 |
| 任何删除操作 | 对应 list 先查 | 删除不可逆！ |

### 绝对禁止

- ❌ 跳过查询直接写
- ❌ 猜测 ID
- ❌ 不列出完整选项
- ❌ 删除未经用户确认

---

## 一、连接与配置（2 个工具）

### configure

配置连接参数。

```
configure(username="你的账号", password="你的密码")
configure(token="eyJhbG...", base_url="http://192.168.1.100:18181")
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | str | 否 | 登录账号 |
| password | str | 否 | 登录密码 |
| token | str | 否 | 手动设置 token |
| base_url | str | 否 | 服务器地址 |

⚠️ Snowy 登录密码 RSA 加密，API 直登可能失败，系统自动启动 Playwright 无头浏览器兜底。

### get_status

获取连接状态。无参数。

```
get_status()
→ {"server":"...","username":"...","token_expire":"...","token_valid":"有效"}
```

---

## 二、通用查询（6 个工具）

### list_data

**通用分页列表查询，支持 32 个模块。**

```
list_data("fix")                                    # 隐患整改
list_data("fix", page=2, page_size=50)              # 翻页
list_data("fix", filters="status=待整改")            # 筛选
list_data("devicePoint", page=1, page_size=100)     # 设备点位
```

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| module | str | 必填 | 模块名（见下表） |
| page | int | `1` | 页码 |
| page_size | int | `20` | 每页条数 |
| filters | str | `""` | 筛选条件 `key=value&key2=value2` |

**支持的 32 个模块**:

| 模块名 | 说明 | API 路径 | 数据量 |
|--------|------|----------|--------|
| `allRisk` | 隐患查询 | `/api/allRisk/page` | 全量 |
| `fix` | 隐患整改 | `/api/fix/page` | 8条 |
| `audit` | 隐患审核 | `/api/audit/page` | — |
| `planOwn` | 我的计划 | `/api/planOwn/page` | — |
| `yyqx` | 应急演练 | `/api/plan/yyqx/page` | — |
| `publish` | 文档发布 | `/api/safetyLedgerPublish/page` | — |
| `ledgerAudit` | 文档审核 | `/api/safetyLedgerAudit/page` | — |
| `fireFile` | 消防档案 | `/api/safetyFireFile/page` | 10条 |
| `quality` | 品控任务 | `/api/quality/task/page` | — |
| `accident` | 安全事故 | `/api/safety/accident/page` | — |
| `accidentCase` | 事故案例 | `/api/safety/accident/case/page` | — |
| `weather` | 天气预警 | `/api/safety/weather/page` | — |
| `assessment` | 安全评估 | `/api/assessment/page` | — |
| `guard` | 值班查岗 | `/api/guard/page` | 2267条 |
| `courseware` | 培训课件 | `/api/v2/safety/train/courseware/page` | — |
| `maintainTask` | 维保任务 | `/api/maintainTask/page` | 30条 |
| `maintainModel` | 维保模式 | `/api/maintainModel/page` | — |
| `workArea` | 作业区域 | `/api/safety/work/area/page` | 1条 |
| `workTicket` | 作业票 | `/api/safety/work/ticket/page` | 15条 |
| `deviceThreshold` | 设备阈值 | `/api/device/data/water/getDetailList` | — |
| `devicePoint` | 设备点位 | `/api/device/point/fire/page` | 20315条 |
| `fireData` | 消防数据 | `/api/device/data/fire/page` | — |
| `waterData` | 水系统数据 | `/api/device/data/water/page` | — |
| `fireAlarm` | 消防告警 | `/api/alarm/warning/fire/pressure/page` | — |
| `waterAlarm` | 水系统告警 | `/api/alarm/warning/water/pressure/page` | — |
| `org` | 组织机构 | `/api/sysOrg/page` | — |
| `user` | 用户管理 | `/api/sysUser/page` | 105条 |
| `position` | 岗位管理 | `/api/sysPos/page` | 35条 |
| `riskName` | 隐患名称 | `/api/safety/risk/name/page` | 17条 |
| `notice` | 通知公告 | `/api/sysNotice/received` | — |

### get_statistics

获取统计数据。

```
get_statistics("workplace")        # 工作台统计（今日任务/待办）
get_statistics("hidden_danger")    # 隐患统计（总数/待整改/已完成）
get_statistics("device")           # 设备统计（在线/离线/告警）
get_statistics("maintain")         # 维保统计（任务数/完成率）
get_statistics("weather")          # 天气统计（预警数量）
```

| 参数 | 类型 | 说明 |
|------|------|------|
| category | str | 统计类别：`workplace` / `hidden_danger` / `device` / `maintain` / `weather` |

### get_org_tree

获取组织架构树。无参数。

```
get_org_tree()
```

### get_detail

获取记录详情。

```
get_detail("fix", "12345")           # 隐患整改详情
get_detail("maintainTask", "67890")  # 维保任务详情
get_detail("devicePoint", "ABC123")  # 设备点位详情
```

| 参数 | 类型 | 说明 |
|------|------|------|
| module | str | 模块名（见 list_data 表） |
| id | str | 记录 ID |

**支持详情的模块**: fix, audit, planOwn, fireFile, quality, accident, accidentCase, weather, assessment, guard, courseware, maintainTask, maintainModel, workArea, workTicket, deviceThreshold, devicePoint, riskName, notice

### search_plans

搜索计划。

```
search_plans("消防演练")
search_plans("安全检查")
```

| 参数 | 类型 | 说明 |
|------|------|------|
| keyword | str | 搜索关键词 |

### do_action

执行操作（审批/提交等）。

```
do_action("fix", "submit", '{"id":"12345","rectification":"已更换设备"}')
do_action("audit", "approve", '{"id":"12345","comment":"同意"}')
do_action("audit", "reject", '{"id":"12345","comment":"不符合要求"}')
do_action("ledgerAudit", "approve", '{"id":"12345"}')
```

| 参数 | 类型 | 说明 |
|------|------|------|
| module | str | 模块名 |
| action | str | 操作类型 |
| data_json | str | 操作数据 JSON |

**支持的操作**:

| 模块 | action | 说明 |
|------|--------|------|
| `fix` | `submit` | 提交整改 |
| `audit` | `approve` / `reject` | 隐患审批通过/拒绝 |
| `ledgerAudit` | `approve` / `reject` | 文档审批 |
| `assessment` | `submit` | 提交评估 |

### get_alarms

获取告警数据。

```
get_alarms("fire")    # 消防告警
get_alarms("water")   # 水系统告警
get_alarms("fire", page=2, page_size=50)
```

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| alarm_type | str | `"fire"` | 告警类型：`fire` / `water` |
| page | int | `1` | 页码 |
| page_size | int | `20` | 每页条数 |

### api_call

通用 API 调用。

```
api_call("GET", "/api/fix/page", params='{"pageNo":1,"pageSize":20}')
api_call("POST", "/api/fix/add", json_body='{"name":"新隐患","level":"一般"}')
api_call("PUT", "/api/fix/edit", json_body='{"id":"12345","status":"已完成"}')
api_call("DELETE", "/api/fix/delete", json_body='{"id":"12345"}')
```

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| method | str | 必填 | GET / POST / PUT / DELETE |
| path | str | 必填 | API 路径 |
| params | str | `"{}"` | URL 参数 JSON |
| json_body | str | `"{}"` | 请求体 JSON |

---

## 三、隐患整改（2 个工具）

### risk_fix_list

查询隐患整改列表（8 条，35 字段）。

```
risk_fix_list()                              # 全部
risk_fix_list('{"status":"待整改"}')          # 按状态
risk_fix_list('{"responsiblePerson":"张三"}') # 按责任人
```

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| filters | str | `"{}"` | 筛选 JSON |

**35 个字段**: id, orgId, orgName, riskName, riskNameId, inspectType, riskLevel, responsibleUser, responsibleUserName, responsibleUserAccount, rectificationTime, riskDescript, riskPhoto, riskPhotoPath, recordId, rectificationMeasure, rectificationPhoto, rectificationPhotoPath, checkStatus, checkDescript, completionTime, riskStatus, delayDay, delayStatus, delayRemark, createUserName, createTime, createUser, createUserAccount, updateTime, updateUser, recordCreateTime, delayFlag, remainingDays, sort

### risk_fix_submit

提交隐患整改。

```
risk_fix_submit("12345", '{"rectificationMeasure":"已更换灭火器","checkDescript":"确认完成"}')
```

| 参数 | 类型 | 说明 |
|------|------|------|
| record_id | str | 整改记录 ID（从 risk_fix_list 获取） |
| data_json | str | 整改数据 JSON |

**铁律**: 先 `risk_fix_list()` 列出待整改项 → 给用户选择 → 确认后提交。

---

## 四、隐患名称（3 个工具）

### risk_name_list

查询隐患名称（17 条，6 字段：id, riskName, createTime, createUser, updateTime, updateUser）。

```
risk_name_list()
```

### risk_name_add

```
risk_name_add("消防通道堵塞")
```

| 参数 | 类型 | 说明 |
|------|------|------|
| risk_name | str | 隐患名称 |

### risk_name_edit

```
risk_name_edit("12345", "消防通道堵塞（严重）")
```

| 参数 | 类型 | 说明 |
|------|------|------|
| name_id | str | 名称 ID |
| risk_name | str | 新名称 |

---

## 五、设备点位（1 个工具）

### device_point_list

查询消防设备点位（20315 条，13 字段）。

```
device_point_list()                              # 默认50条
device_point_list('{"orgName":"南京"}')           # 按组织
device_point_list('{"pageSize":200}')            # 大页
```

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| filters | str | `"{}"` | 筛选 JSON |

**13 个字段**: id, deviceId, fireSystemType, fireSystemName, fireComponentType, fireComponentName, deviceNo, loopNo, pointNo, componentAddress, position, orgName, deviceName

---

## 六、维保任务（2 个工具）

### maintain_task_list

查询维保任务（30 条，24 字段）。

```
maintain_task_list()                         # 全部
maintain_task_list('{"status":"待执行"}')     # 按状态
```

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| filters | str | `"{}"` | 筛选 JSON |

**24 个字段**: id, type, taskYear, orgId, startDate, endDate, status, taskName, fileId, taskSuggestion, checkResult, checkSuggestion, reportReason, taskHours, userNames, orgName, points, fileName, lastStatus, reportingList 等

### maintain_task_add

```
maintain_task_add('{"taskName":"季度消防检查","taskYear":"2026","orgId":"123","type":"1","startDate":"2026-06-01","endDate":"2026-06-30"}')
```

| 参数 | 类型 | 说明 |
|------|------|------|
| data_json | str | 任务数据 JSON |

**必填**: taskName, taskYear, orgId（先 get_org_tree 查）, type, startDate, endDate

---

## 七、作业区域（4 个工具）

### work_area_list

查询作业区域（10 字段：id, orgId, orgName, workArea, managerUserId, managerUserName, projectUserId, projectUserName, orgUserId, orgUserName）。

```
work_area_list()
```

### work_area_add

```
work_area_add('{"orgId":"123","workArea":"A区天台","managerUserId":"456"}')
```

| 参数 | 类型 | 说明 |
|------|------|------|
| data_json | str | 区域数据 JSON |

**必填**: orgId, workArea, managerUserId

### work_area_edit

```
work_area_edit("12345", '{"workArea":"新名称","managerUserId":"789"}')
```

| 参数 | 类型 | 说明 |
|------|------|------|
| area_id | str | 区域 ID |
| data_json | str | 要修改的字段 JSON |

### work_area_delete

```
work_area_delete("12345")
```

| 参数 | 类型 | 说明 |
|------|------|------|
| area_id | str | 区域 ID |

⚠️ 删除不可逆，先 `work_area_list()` 查出来让用户确认！

---

## 八、作业票（1 个工具）

### work_ticket_list

查询作业票（15 条，14 字段）。

```
work_ticket_list()                           # 全部
work_ticket_list('{"status":"待审批"}')       # 按状态
```

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| filters | str | `"{}"` | 筛选 JSON |

**14 个字段**: id, orgName, ticketType, ticketFireType, ticketHighType, workBeginTime, workEndTime, applyUserId, applyUserName, applyUserPhone, workCompany, custodyUserName, ticketStatus, remark

---

## 九、文档发布（1 个工具）

### document_publish_list

```
document_publish_list()
document_publish_list('{"name":"安全手册"}')
```

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| filters | str | `"{}"` | 筛选 JSON |

---

## 十、值班查岗（1 个工具）

### guard_list

查询值班查岗记录（2267 条，18 字段）。

```
guard_list()                              # 默认50条
guard_list('{"date":"2026-06-09"}')       # 按日期
```

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| filters | str | `"{}"` | 筛选 JSON |

**18 个字段**: id, orgId, userId, respondTime, respondResult, orgName, userName, mobile, reportingStatus, reportingContent, reportingDate, fileIds, reviewContent, unqualifiedContent, createTime, createUser, updateTime, updateUser

---

## 十一、用户管理（1 个工具）

### user_list

查询用户（105 条，13 字段）。

```
user_list()                              # 全部
user_list('{"department":"安保部"}')      # 按部门
```

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| filters | str | `"{}"` | 筛选 JSON |

**13 个字段**: id, account, nickName, name, avatar, birthday, sex, email, phone, tel, sysEmpInfo, status, employeeId

---

## 十二、岗位管理（1 个工具）

### position_list

查询岗位（35 条，10 字段）。

```
position_list()                          # 全部
position_list('{"name":"安全员"}')        # 按名称
```

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| filters | str | `"{}"` | 筛选 JSON |

**10 个字段**: id, name, code, sort, remark, status, createTime, createUser, updateTime, updateUser

---

## 十三、模块索引（1 个工具）

### list_crud_modules

列出所有可用工具。无参数。

```
list_crud_modules()
→ 文本，包含所有28个工具的分类和功能说明
```

---

## API 响应格式

Snowy 1.8 标准格式:

成功: `{"success": true, "code": 200, "message": "请求成功", "data": {"rows": [...], "totalRows": N, "pageNo": 1, "pageSize": 20, "totalPage": M}}`

失败: `{"success": false, "code": 错误码, "message": "错误信息"}`

**注意**: Snowy 用 `success` 判断成败（不是 `code==200`）

---

## 系统统计

| 模块 | 数量 |
|------|------|
| 隐患整改 | 8 条 |
| 隐患名称 | 17 条 |
| 设备点位 | 20315 条 |
| 维保任务 | 30 条 |
| 作业票 | 15 条 |
| 值班查岗 | 2267 条 |
| 用户 | 105 条 |
| 岗位 | 35 条 |
