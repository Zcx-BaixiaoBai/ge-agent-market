> 开发者（Developer）：张宸熙（Zcx-BaixiaoBai） · 仓库：https://github.com/Zcx-BaixiaoBai/GE-MCP

# 瑞信电表 MCP 技能

> 81 个工具 | 智慧预付费管控系统 | http://netge.czrxdzonline.cn

---

## 何时使用

当用户需要操作瑞信智慧预付费管控系统：
- 查询/管理电表数据、用电量、余额
- 新建/修改/删除房间、建筑、用户、角色、电价方案、身份标签、设备
- 查看充值记录、补助、结算、断电、预警
- 监控设备通信状态、温度信号
- 控制电表开关（通电/断电/解除手动）
- 大屏数据分析和能源统计

**关键词**: 瑞信、电表、预付费、用电、充值、购电、余额、能耗、电价、网关、仪表

---

## ⚠️ CRUD 操作铁律（每次写操作前必读）

```
Step 1: 拉取全量数据 → 列出所有选项给用户
Step 2: 用户明确选择后 → 执行写入
```

## ⚠️ 查询交互铁律（每次查询前必读）

**绝不允许直接调用查询工具！必须先询问用户查询条件。**

```
Step 1: 根据用户需求，列出该工具支持的筛选条件
Step 2: 询问用户要按什么条件查询（时间范围？哪个建筑？哪个房间？）
Step 3: 用户明确条件后，组装 filters 参数调用工具
```

**交互示例：**
- 用户说"查充值记录" → 必须先问：哪个房间？时间范围？每页条数？
- 用户说"查设备列表" → 必须先问：哪个网关？设备类型？在线状态？
- 用户说"查预警记录" → 必须先问：时间范围？预警类型？哪个建筑？
- 用户说"查用能明细" → 必须先问：房间/建筑？时间？能源类型？

**绝对禁止：**
- ❌ 用户说"查xxx"就直接调用工具用默认参数
- ❌ 不问条件就传空 filters `"{}"`
- ❌ 返回大量数据后才说"下次可以加筛选条件"

## ⚠️ 查询交互铁律（每次查询前必读）

**绝不允许直接调用查询工具！必须先询问用户查询条件。**

```
Step 1: 根据用户需求，列出该工具支持的筛选条件
Step 2: 询问用户要按什么条件查询（时间范围？哪个建筑？哪个房间？）
Step 3: 用户明确条件后，组装 filters 参数调用工具
```

### 各查询工具的交互示例

**用户说"查充值记录" → Agent 必须问：**
- "要查哪个房间的充值记录？（可输入房间名或房间ID，留空查全部）"
- "时间范围？（默认最近30天，可指定开始/结束日期）"
- "每页显示多少条？（默认20条）"

**用户说"查设备列表" → Agent 必须问：**
- "要查哪个网关的设备？（留空查全部）"
- "设备类型？（电表/水表/气表，留空查全部）"
- "在线状态？（在线/离线/全部）"

**用户说"查预警记录" → Agent 必须问：**
- "时间范围？（默认最近30天）"
- "预警类型？（欠费/离线/故障，留空查全部）"
- "哪个建筑的预警？（留空查全部）"

**用户说"查用能明细" → Agent 必须问：**
- "查哪个房间/建筑的用能？"
- "时间范围？"
- "能源类型？（电/水/气/热，留空查全部）"

### 绝对禁止

- ❌ 用户说"查xxx"就直接调用工具用默认参数
- ❌ 不问条件就传空 filters `"{}"`
- ❌ 猜测用户想查什么范围
- ❌ 返回大量数据后才说"下次可以加筛选条件"

### 正确示范

```
用户: "查一下充值记录"
Agent: "好的，请问：
  1. 查哪个房间的充值记录？（可输入房间名或房间ID，留空查全部）
  2. 时间范围？（默认最近30天，可指定如 2026-05-01 到 2026-06-10）
  3. 每页显示多少条？（默认20条）"
用户: "查101室，最近7天"
Agent: → prepay_charge_query('{"room":"101","StartTime":"2026-06-03","EndTime":"2026-06-10"}')
```

### 各实体前置查询

| 操作 | 必须先调 | 为什么 |
|------|---------|--------|
| 新建房间 | `basic_buildings_query('{"id":0}')` | 需要 buildingid（整数） |
| 新建房间 | `basic_identities_query('{"NeedPaging":0}')` | 需要 identityid（整数） |
| 新建房间 | `basic_prices_query('{"NeedPaging":0}')` | 需要 priceschemeid（整数） |
| 新建用户 | `basic_roles_query('{"NeedPaging":0}')` | 需要 roleid |
| 新建设备 | `signal_gateway_list('{"NeedPaging":0}')` | 需要 gatewaynum |
| 修改电价 | `price_scheme_analyze()` | 了解现有结构再改 |
| 删除任何 | 对应 query 先查 | 删除不可逆！ |
| 控制电表 | `prepay_workbench()` | 确认设备ID |

### 绝对禁止

- ❌ 跳过查询直接写
- ❌ 只查一页就当全部（必须 `NeedPaging=0`）
- ❌ 猜测 ID、名称、编码
- ❌ 字符串替代整数 ID（`identityid="137"` → 必须 `identityid=137`）
- ❌ `electricprice` 直接写数字（必须 `[{"price":0.72}]` 格式）

---

## 一、连接与配置（4 个工具）

### configure

配置连接参数。

```
configure(username="你的账号", password="你的密码")
configure(token="eyJhbG...", base_url="http://192.168.1.100:8080")
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | str | 否 | 登录用户名 |
| password | str | 否 | 登录密码 |
| token | str | 否 | 手动设置 token |
| base_url | str | 否 | 服务器地址 |

### login

手动触发登录（通常自动处理）。无参数。

```
login()
```

### get_status

获取连接状态、Token 有效期。无参数。

```
get_status()
→ {"server":"...","username":"...","token_expire":"...","token_valid":"有效"}
```

### list_api_modules

列出所有 API 模块和工具对应关系。无参数。

```
list_api_modules()
→ 文本列表，涵盖全部81个工具
```

---

## 二、房间管理（6 个工具）

### basic_rooms_query

查询房间列表。

```
basic_rooms_query('{"name":"101"}')           # 按名称模糊查
basic_rooms_query('{"buildingid":"2356"}')     # 按建筑ID查
basic_rooms_query('{"NeedPaging":0}')          # 全量查（7508条）
```

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| filters | str | `"{}"` | JSON 参数 |

**返回字段**: id, name, num, buildingid, identityid, priceschemeid, ownername, phonenum, peoplenumber, area, sortnum, payenable, status 等

### basic_rooms_queryextend

查询房间扩展信息（更多字段）。

```
basic_rooms_queryextend('{"roomid":"10726"}')
```

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| filters | str | `"{}"` | JSON 参数 |

### basic_rooms_identity

管理房间身份策略。

```
basic_rooms_identity(action="query", data='{"roomid":"10726"}')
basic_rooms_identity(action="update", data='{"roomid":"10726","identityid":137}')
```

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| action | str | `"query"` | 操作：`query` / `update` |
| data | str | `"{}"` | JSON 参数 |

### crud_rooms_create

创建房间。

```
crud_rooms_create('{"name":"101室","num":"R101","buildingid":2356,"identityid":1,"priceschemeid":1,"ownername":"张三","peoplenumber":2,"area":85.5,"phonenum":"13800138000","payenable":1}')
```

| 参数 | 类型 | 说明 |
|------|------|------|
| data_json | str | 房间数据 JSON |

**必填字段（7个）**:

| 字段 | 类型 | 说明 |
|------|------|------|
| name | string | 房间名称 |
| num | string | 房间编号（唯一） |
| buildingid | int | 所属建筑ID |
| identityid | int | 身份策略ID（68个可选） |
| priceschemeid | int | 定价方案ID（97个可选） |
| ownername | string | 业主姓名 |
| peoplenumber | int | 房间人数 |

**可选字段（13个）**: area, sortnum, phonenum, payenable, meterids, warningenable, warningthreshold, blackoutamount, propertywalletexpiretime, propertywalletexpireaction, isseparatecashwallet, capacityprice, contractnum

### crud_rooms_update

修改房间。

```
crud_rooms_update("10726", '{"name":"102室"}')
crud_rooms_update("10726", '{"priceschemeid":13,"ownername":"李四"}')
```

| 参数 | 类型 | 说明 |
|------|------|------|
| entity_id | str | 房间ID |
| data_json | str | 要修改的字段 JSON（只传需改的） |

### crud_rooms_delete

删除房间。

```
crud_rooms_delete("10726")
```

| 参数 | 类型 | 说明 |
|------|------|------|
| entity_id | str | 房间ID |

⚠️ 删除不可逆，必须先 basic_rooms_query 查出来让用户确认！

---

## 三、建筑管理（4 个工具）

### basic_buildings_query

查询建筑树。

```
basic_buildings_query('{"id":0}')    # 完整树形结构（必用 id=0）
basic_buildings_query('{"id":2356}')  # 某棵子树
```

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| filters | str | `"{}"` | JSON 参数 |

⚠️ 建筑是树形结构，返回嵌套 children，必须传 `id=0` 获取完整树。
根节点：金鹰集团(id=1)、水表测试(id=2356)

### crud_buildings_create

创建建筑。

```
crud_buildings_create('{"name":"新建筑","num":"B001","parentid":1,"area":5000,"sortnum":1}')
```

| 参数 | 类型 | 说明 |
|------|------|------|
| data_json | str | 建筑数据 JSON |

**必填**: name, num, parentid
**可选**: area, sortnum, description

### crud_buildings_update

```
crud_buildings_update("2356", '{"name":"新名称"}')
```

### crud_buildings_delete

```
crud_buildings_delete("2356")
```

---

## 四、用户管理（5 个工具）

### basic_users_query

```
basic_users_query('{"name":"张"}')              # 按名称查
basic_users_query('{"roleid":"2"}')             # 按角色查
basic_users_query('{"NeedPaging":0}')           # 全量（105条）
```

### basic_users_detail

获取用户详细信息。无参数。

### basic_users_center

获取用户中心信息。无参数。

### crud_users_create

```
crud_users_create('{"name":"zhangsan","nickname":"张三","phonenum":"13800138000","roleid":2,"status":1}')
```

**必填**: name, roleid（先 basic_roles_query 查88个角色）
**可选**: nickname, phonenum, email, sex(0男1女), avataricon, status, modules, aduitlevel, chargeauth, mailtypes

### crud_users_update / crud_users_delete

```
crud_users_update("184", '{"status":0}')
crud_users_delete("184")
```

---

## 五、电价方案管理（5 个工具）⚠️ 格式陷阱

### basic_prices_query

```
basic_prices_query('{"NeedPaging":0}')         # 全量（97个方案）
basic_prices_query('{"name":"南京","NeedPaging":0}')  # 按名称
```

⚠️ 默认只返回15条！查全量必须加 `NeedPaging=0`

### price_scheme_analyze

**人类可读的方案详情分析**，自动解析嵌套价格结构。

```
price_scheme_analyze()            # 列出全部97个方案
price_scheme_analyze("南京")       # 按名称模糊匹配
```

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| scheme_name | str | `""` | 方案名称（模糊匹配） |

**返回格式**:
```
━━━ 方案 #1: 南京珠江壹号 ━━━
  用电计费模式: 普通单价计费
  电价: 0.6582 元/kWh
  冷水价: 1 元/t
  ...
```

### 计费模式对照表

| electricmode | 模式 | 价格字段格式 |
|---|---|---|
| 1 | 普通单价 | `electricprice: [{"price": 0.72}]` |
| 3 | 分回路 | `channelPrice: {"channelCount":2, "detail":[{"name":"第1路","price":0.6},...]}` |
| 4 | 复费率 | `multiRatePrice: [{"name":"尖","price":1.2},{"name":"峰","price":0.9},{"name":"平","price":0.6},{"name":"谷","price":0.3}]` |
| 5 | 计划生效 | `timePrice: {"timeCount":1, "detail":[{"name":"时段1","startDate":"2026-01-01","endDate":"2026-12-31","price":0.7}]}` |

⚠️ 所有价格字段必须用 `[{"price": 数值}]` 数组格式，不能直接写数字！

### crud_prices_create

```
crud_prices_create('{"name":"测试方案","electricmode":1,"electricprice":[{"price":0.72}],"coldwaterprice":[{"price":3.5}],"hotwaterprice":[{"price":25}],"subsidyprice":0,"propertyprice":0,"serviceprice":0}')
```

### crud_prices_update

```
# 只改电价
crud_prices_update("1", '{"electricprice":[{"price":0.72}]}')

# 切成复费率
crud_prices_update("1", '{"electricmode":4,"multiRatePrice":[{"name":"尖","price":1.2},{"name":"峰","price":0.9},{"name":"平","price":0.6},{"name":"谷","price":0.3}]}')
```

**铁律**: 先 `price_scheme_analyze()` 看现有结构 → 列出给用户 → 确认后改。

### crud_prices_delete

```
crud_prices_delete("1")
```

⚠️ 删除前确认方案名下没有房间引用。

---

## 六、身份标签管理（4 个工具）

### basic_identities_query

```
basic_identities_query('{"NeedPaging":0}')    # 全量（68个标签）
```

返回字段: id, name, remark, module

### crud_identities_create / update / delete

```
crud_identities_create('{"name":"新身份标签","remark":"说明"}')
crud_identities_update("137", '{"name":"新名称"}')
crud_identities_delete("137")
```

---

## 七、角色管理（4 个工具）

### basic_roles_query

```
basic_roles_query('{"NeedPaging":0}')    # 全量（88个角色）
```

### crud_roles_create / update / delete

```
crud_roles_create('{"name":"新角色","remark":"说明","menuids":"121,122,...","buildingids":"1,2,...","identityids":"137,...","priceschemeids":"1,2,..."}')
crud_roles_update("2", '{"name":"新名称"}')
crud_roles_delete("2")
```

---

## 八、设备管理（4 个工具）

### basic_meters_switch_status

```
basic_meters_switch_status('{"roomid":"10726"}')  # 查开关状态
```

### crud_devices_create

```
crud_devices_create('{"name":"电表01","gatewaynum":254,"channelnum":1,"productid":1,"address":"001","meterid":"M001","code":"D001","location":"1号楼101室"}')
```

常用字段: name, gatewaynum（246个网关可选）, channelnum, productid, address, meterid, code, location, branchid, deptid, areaname

### crud_devices_update / delete

```
crud_devices_update("12345", '{"name":"新名称"}')
crud_devices_delete("12345")
```

---

## 九、电表控制（3 个工具）⚠️ 高风险

### meter_control_list_commands

列出所有可用控制命令。无参数。

```
meter_control_list_commands()
```

**可用命令**:

| 命令名 | cmdNo | control | 说明 |
|--------|-------|---------|------|
| 通电/手动开电 | C21 | 1 | 开电 |
| 断电/手动关电 | C21 | 0 | 关电 |
| 解除手动 | C22 | 0 | 恢复自动 |
| 欠费告警投入 | C23 | 1 | 投入告警 |
| 欠费告警解除 | C23 | 0 | 解除告警 |
| 取消红外保电 | C24 | 0 | — |
| 取消应急送电 | C25 | 0 | — |
| 人工干预 | C26 | 0 | — |

多回路: tunnel=2/3/4 控制第2/3/4路

### meter_control_execute

```
# 单个设备通电
meter_control_execute('["deviceid1"]', "通电", "1")

# 多个设备断电
meter_control_execute('["dev1","dev2"]', "断电", "1")

# 第2路通电
meter_control_execute('["dev1"]', "通电", "2")
```

| 参数 | 类型 | 说明 |
|------|------|------|
| device_ids_json | str | 设备ID数组 JSON |
| command | str | 命令名称（见上表） |
| tunnel | str | 回路号（默认"1"） |

**铁律**: 先 `prepay_workbench()` 查设备列表 → 列出目标给用户 → 确认后才执行！

### meter_control_task_status

查询控制任务状态。

```
meter_control_task_status('["taskid1","taskid2"]')
```

---

## 十、预付费管理（18 个工具）

### prepay_workbench

预付费工作台（7896条电表数据）。

```
prepay_workbench(nopaging=True)                        # 全量
prepay_workbench(orderby="sortnum asc", nopaging=False)  # 分页
```

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| orderby | str | `"sortnum asc"` | 排序字段 |
| nopaging | bool | `True` | 是否全量返回 |

### prepay_charge_query / prepay_charge_total / prepay_charge_bill

```
prepay_charge_query('{"room":"10726"}')       # 充值记录
prepay_charge_query('{"begin":"2026-06-01","end":"2026-06-09"}')
prepay_charge_total('{"begin":"2026-06-01"}') # 充值统计
prepay_charge_bill('{"room":"10726"}')        # 充值账单
```

### prepay_used_query / prepay_used_total

```
prepay_used_query('{"room":"10726","begin":"2026-06-01","end":"2026-06-09"}')
prepay_used_total('{"begin":"2026-06-01"}')
```

### prepay_clear_query / prepay_blackout_query

```
prepay_clear_query('{"room":"10726"}')    # 清零记录
prepay_blackout_query('{"room":"10726"}') # 断电记录
```

### prepay_warning_query / prepay_warning_realtime

```
prepay_warning_query('{"room":"10726"}')  # 预警记录
prepay_warning_realtime('{}')             # 实时预警
```

### prepay_log_query

```
prepay_log_query('{"begin":"2026-06-01"}')  # 操作日志
```

### prepay_resettle_detail / prepay_resettle_progress

```
prepay_resettle_detail('{"room":"10726"}')   # 结算明细
prepay_resettle_progress()                   # 结算进度
```

### prepay_subsidy_query

```
prepay_subsidy_query('{"room":"10726"}')     # 补助记录
```

### prepay_apportion_queryconfig / prepay_apportion_queryused

```
prepay_apportion_queryconfig('{}')           # 分摊配置
prepay_apportion_queryused('{"room":"10726"}')  # 分摊用量
```

### prepay_financial_room_month_balance / prepay_financial_room_quarter_balance

```
prepay_financial_room_month_balance('{"begin":"2026-06"}')     # 月度余额
prepay_financial_room_quarter_balance('{"begin":"2026-Q2"}')   # 季度余额
```

### prepay_devicetree_cascade_used

设备树级联用能。无参数。

```
prepay_devicetree_cascade_used()
```

---

## 十一、设备信号（8 个工具）

### signal_device_list / signal_device_comm_status

```
signal_device_list('{"NeedPaging":0}')          # 设备列表（13103条）
signal_device_comm_status('{"devid":"12345"}')  # 通信状态
```

### signal_gateway_list / signal_gateway_ping / signal_gateway_policy

```
signal_gateway_list('{"NeedPaging":0}')   # 网关列表（246个）
signal_gateway_ping("254")                # 网关Ping测试
signal_gateway_policy()                   # 网关策略
```

### signal_policy_list

```
signal_policy_list('{"NeedPaging":0}')    # 策略配置列表
```

### signal_temperature_query / signal_wavelength_query

```
signal_temperature_query('{"NeedPaging":0}')  # 温度信号
signal_wavelength_query('{"NeedPaging":0}')   # 波长信号
```

---

## 十二、能源分析（3 个工具）

### energy_analog_info / energy_analog_history / energy_atom_tree

```
energy_analog_info()                               # 模拟量信息
energy_analog_history('{"devid":"12345"}')         # 模拟量历史
energy_atom_tree()                                 # 能源原子树
```

---

## 十三、大屏展示（8 个工具）

全部无参数，直接调用：

```
bigscreen_hardware()           # 硬件状态
bigscreen_day_used()           # 日用能统计
bigscreen_hour_used()          # 小时用能统计
bigscreen_top_used()           # 用能Top排名
bigscreen_warning()            # 告警统计
bigscreen_forewarning()        # 预警统计
bigscreen_chain_used()         # 用能趋势图
bigscreen_energy_item_used()   # 能源分项统计
```

---

## 十四、其他工具（3 个）

### basic_dictionary

查数据字典。

```
basic_dictionary("meter_type")    # 按字典类型查
basic_dictionary()                # 全部字典
```

### basic_menus_query

查菜单权限。

```
basic_menus_query('{"NeedPaging":0}')
```

### license_info

查系统授权。无参数。

```
license_info()
```

### api_call

通用 API 调用（可调用任意 140 个端点）。

```
api_call("GET", "/api/basic/rooms/query", params='{"name":"101"}')
api_call("POST", "/api/basic/rooms", json_body='{"name":"新房间",...}')
api_call("PUT", "/api/basic/rooms", json_body='{"id":"123","name":"改名"}')
api_call("DELETE", "/api/basic/rooms", json_body='{"id":"123"}')
```

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| method | str | 必填 | GET / POST / PUT / DELETE |
| path | str | 必填 | API 路径（如 `/api/basic/rooms/query`） |
| params | str | `"{}"` | URL 参数 JSON |
| json_body | str | `"{}"` | 请求体 JSON |

完整端点列表见 `api_catalog.json`（140 个端点）。

---

## API 响应格式

成功: `{"status": 1, "data": {...}}`
失败: `{"status": 0, "data": "错误信息"}`

data 结构:
- 列表: `{"list": [...], "total": N}`
- 单条: `{"id": ..., "name": ..., ...}`
- 操作: `null`（创建成功不返回ID）

**翻页**: 默认 15 条/页，查全量加 `{"NeedPaging": 0}`

---

## 已知限制

以下端点在当前服务器上存在已知问题（JS逆向确认路径正确，但服务器端有限制）：

| 工具 | 问题 | 原因 | 替代方案 |
|------|------|------|---------|
| `prepay_warning_realtime` | 超时 | 数据量 1100 万+，服务端无法在 10 秒内返回 | 改用 `prepay_warning_query` |
| `prepay_financial_room_month_balance` | 400/超时 | 服务端对参数格式敏感，日期范围限制不明确 | 改用 `prepay_financial_room_quarter_balance`（季度收支，已验证可用） |
| `energy_analog_info` | 404 | 端点未部署 | 无替代 |
| `energy_analog_history` | 404 | 端点未部署 | 无替代 |
| `energy_atom_tree` | 404 | 端点未部署 | 无替代 |
| `signal_temperature_query` | 无数据 | 系统无温度设备 | 正常 |

### 需要特殊参数的端点

| 工具 | 必填参数 | 说明 |
|------|---------|------|
| `prepay_charge_bill` | `id` (房间ID) | 查某个房间的购电账单 |
| `prepay_resettle_detail` | `roomid` (房间ID) | 查某个房间的结算明细 |
| `prepay_used_total` | `StartTime` + `EndTime` | 日期范围，默认最近30天 |
| `prepay_financial_room_quarter_balance` | `StartTime` + `EndTime` + `ReportType` | 默认最近90天 |
