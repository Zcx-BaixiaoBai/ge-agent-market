> 开发者（Developer）：Zcx-BaixiaoBai · 仓库：https://github.com/Zcx-BaixiaoBai/GE-MCP

# eFlex能碳管理平台 MCP Skill

> 金鹰集团 AIoT 能源管理系统 — 温度、运行状态、能耗、报警全覆盖

## 系统概述

**eFlex能碳管理平台** (`https://aiot-fuca.com`) 是金鹰集团使用的 AIoT 智慧能源管理系统，覆盖：
- **综合监控**: 冷水机房、冷水机组、水泵、冷却塔的实时运行数据
- **能源监控**: 全厂用电量、设备能耗排名、用能趋势
- **用能分析**: 用能查询/排名/占比、尖峰平谷、能效日历、COP/SCOP
- **智慧运维**: 工单管理、巡检任务、设备健康诊断
- **报警管理**: 实时/历史报警、设备报警
- **报表**: 能源报表、运营报表、自定义报表
- **系统管理**: 用户/角色/权限/日志

## ⚠️ 查询交互铁律

**所有查询操作前必须先询问用户查询条件，绝不允许直接用默认参数调用！**

正确流程：
1. 用户说"查一下报警" → 反问："请问要查哪个时间段的报警？实时的还是历史的？"
2. 用户给了条件 → 调用对应工具
3. 拿到结果 → 解读给用户

## ⚠️ CRUD铁律

所有写入操作（目前本系统为只读，无写入API）：
1. 先查询关联数据获取有效选项
2. 列举给用户确认
3. 用户确认后再执行

## 关键数据

### 设备层级（南京金鹰世界 tenantId=1033）

| 设备类型 | 编码前缀 | 说明 | 数量 |
|---------|---------|------|------|
| 冷水机房 | KTXT-CWER-XXXX | 机房（含多台机组+水泵+冷却塔） | 6个 |
| 冷水机组 | KTXT-CWER-CWEG-XXXX | 实际制冷设备（有温度/功率/COP） | ~12台 |
| 冷水泵 | KTXT-CWER-LDWP-XXXX | 冷冻水循环泵 | ~12台 |
| 冷却水泵 | KTXT-CWER-CDWP-XXXX | 冷却水循环泵 | ~12台 |
| 冷却塔 | KTXT-CWER-CTWR-XXXX | 散热冷却塔 | ~12台 |

### 已知设备ID

| 设备名称 | 设备编码 | 设备ID |
|---------|---------|--------|
| 裙楼冷水机房 | KTXT-CWER-0001 | 753 |
| 空中商业冷水机房 | KTXT-CWER-0002 | 791 |
| A塔办公冷水机房 | KTXT-CWER-0003 | 792 |
| 酒店冷水机房 | KTXT-CWER-0004 | 793 |
| C塔冷水机房 | KTXT-CWER-0005 | 1571 |
| 末端冷水机房 | KTXT-CWER-0006 | 1611 |
| 裙楼冷水机组#1 | KTXT-CWER-CWEG-0001 | 906 |
| 裙楼冷水机组#2 | KTXT-CWER-CWEG-0002 | 907 |

### 关键字段说明

**设备运行信息** (`device_running_info`):
- 温度: 冷冻水进/出水温度、冷却水进/出水温度
- 运行状态: 运行/停机/故障
- 功率: 实时功率(kW)
- 电流: 三相电流(A)
- COP: 瞬时/累计能效比

**环境参数** (`cockpit_env_params`):
- 室外温度(°C)
- 室外湿度(%)
- 湿球温度(℃)
- 焓值(kJ/kg)

**用能数据** (`cockpit_energy_usage`):
- todayE: 今日用电量(kWh)
- todayMoM: 环比昨日(%)
- monthE: 本月用电量(MWh)
- monthMoM: 环比上月(%)
- energyThisMonthList: 本月每日用电趋势
- energyLastMonthList: 上月每日用电趋势

**能效数据** (`cockpit_room_energy`):
- copInstant: 机房瞬时COP
- copAvg: 机房累计COP
- unitCopInstant: 机组瞬时COP
- unitCopAvg: 机组累计COP

## API 架构

### 认证流程
```
POST /emp-admin/auth/account          → {username, password} → token
GET  /emp-admin/auth/account/groupList → ?loginName=xxx → 租户列表
GET  /emp-admin/auth/account/mb/token  → ?loginName=xxx&tenantId=xxx → 最终token
```
所有后续请求 Header: `Authorization: Bearer <token>`

### API 服务分组

| 服务 | 路径前缀 | 功能 |
|------|---------|------|
| 综合监控 | `/integrateMonitor/` | 首页驾驶舱、设备运行、能源监控 |
| 用能分析 | `/analysisWeb/` | 能耗查询/排名/占比、能效、尖峰平谷 |
| 报警管理 | `/intelligentAlarm/` | 实时/历史报警、工单、任务 |
| 报表服务 | `/empReport/` | 报表列表、自定义报表 |
| 系统管理 | `/emp-admin/` | 用户/角色/日志/配置 |

## 工具清单（67个）

> 67个工具覆盖 71 个真实抓包API（功能性全覆盖）。验证结果：**55个工具返回真实数据**，**9个200-空数据（业务无数据）**，**3个平台500 bug**（已在下方标注）

### 首页/驾驶舱 (9个)
| 工具 | 功能 | 返回关键数据 |
|------|------|-------------|
| `cockpit_indicator_card` | 指标卡片 | 运行天数、累计用能、制冷量、减排、报警数 |
| `cockpit_room_list` | 机房列表 | 6个冷水机房（名称/编码/ID） |
| `cockpit_energy_usage` | 用能情况 | 今日/本月用电量、环比、每日趋势 |
| `cockpit_device_energy_rank_top5` | 设备能耗Top5 | 本月设备电能排名 |
| `cockpit_alarm_info` | 报警信息 | 实时报警数、今日报警、最近报警列表 |
| `cockpit_room_energy` | 机房能耗 | 瞬时/累计COP、设备电能占比 |
| `cockpit_efficiency_calendar` | 能效日历 | 每天的制冷量/用电量/COP |
| `cockpit_env_params` | 环境参数 | 室外温度/湿度/湿球温度/焓值 |
| `cockpit_module_menu_key` | 模块菜单Key | 驾驶舱自定义模块 |

### 驾驶舱大屏 (9个) ⭐ 光伏/储能/充电桩/碳排放
| 工具 | 功能 | 返回关键数据 |
|------|------|-------------|
| `cockpit_screen_electric` | 大屏-用电 | 综合楼32870+生产厂31486+办公楼6932kWh |
| `cockpit_screen_carbon` | 大屏-碳排放 | 光伏月32325、碳减排19323.88 |
| `cockpit_screen_project_info` | 大屏-项目信息 | 光伏装机497kW、充电桩202、储能配置 |
| `cockpit_screen_photovoltaic` | 大屏-光伏列表 | 各光伏板状态、发电功率 |
| `cockpit_screen_photovoltaic_total` | 大屏-光伏累计 | 总累计发电量 |
| `cockpit_screen_energy_storage` | 大屏-储能列表 | 电池状态、SOC、充放电功率（金鹰世界暂无） |
| `cockpit_screen_charge_pile` | 大屏-充电桩 | 8个桩、895次充电、16287元 |
| `cockpit_screen_tenant_total_ec` | 大屏-租户总能耗 | 按租户分类汇总 |

### 设备运行 (5个) ⭐ 温度/运行状态核心
| 工具 | 功能 | 返回关键数据 |
|------|------|-------------|
| `device_tree` | 设备树 | 按类型层级的设备列表 |
| `device_running_info` | **运行信息** | **温度（蒸发器/冷凝器进/出水）、运行状态、功率、负载** |
| `device_extension_info` | 扩展信息 | 状态参数详情（957当前无扩展数据） |
| `device_energy_trend` | 能耗趋势 | 按小时/天/月的能耗曲线 |
| `device_alarm_info` | 设备报警 | 设备级报警记录（YXZT/inAlarm） |

### 设备管理 (8个) ⭐ 设备台账/健康/拓扑
| 工具 | 功能 |
|------|------|
| `device_info` | 设备台账列表（型号/厂家/位置/投运日期） |
| `device_info_by_id` | 单台设备详情（按ID） |
| `device_type_tree` | 设备类型树 |
| `device_tree_config` | 设备树配置 |
| `device_topology_v1` | 设备拓扑 V1（推荐使用） |
| `device_topology_v2` | 设备拓扑 V2（V2 在 group_admin 权限下500，已自动回退到V1） |
| `device_health_threshold` | **设备健康度阈值**（group_admin 权限下 records=null） |
| `point_list` | **测点列表**（温度/压力/流量的点位信息） |
| `point_list_to_bind` | 可绑定的测点列表 |

### 能源监控 (1个)
| 工具 | 功能 |
|------|------|
| `energy_factory_overview` | 全厂能源概览（今日/本月用电、逐时曲线） |

### 用能分析 (8个)
| 工具 | 功能 |
|------|------|
| `analysis_asset_topology` | 资产拓扑树 |
| `analysis_energy_params` | COP/SCOP能效参数点位 |
| `analysis_energy_consumption` | 用能数据查询（HXJY+day维度业务无数据） |
| `analysis_energy_usage_detail` | 用能查询（详细版） |
| `analysis_energy_ranking` | 用能排名 |
| `analysis_peak_valley` | 尖峰平谷分析 |
| `energy_efficiency_query` | 能效查询 |
| `analysis_dict` | 分析系统字典 |

### 报警管理 (3个)
| 工具 | 功能 |
|------|------|
| `alarm_realtime` | 实时报警列表 |
| `alarm_history` | 历史报警列表 |
| `alarm_by_device` | 设备报警 |

### 智慧运维 (2个)
| 工具 | 功能 |
|------|------|
| `operation_work_orders` | 工单列表 |
| `operation_tasks` | 任务列表 |

### 报表 (3个)
| 工具 | 功能 |
|------|------|
| `report_list` | 报表列表 |
| `report_custom_configs` | 自定义报表配置（暂无配置） |
| `report_point_data` | 点位数据查询（**平台500 bug**） |

### 系统管理 (14个)
| 工具 | 功能 |
|------|------|
| `system_user_info` | 当前用户信息 |
| `system_users` | 用户列表 |
| `system_login_logs` | 登录日志 |
| `system_operation_logs` | 操作日志 |
| `system_online_users` | 在线用户 |
| `system_routes` | 路由/菜单 |
| `system_area_info` | 区域信息（**平台500 bug**） |
| `system_role` | 角色列表 |
| `system_dept_tree` | 部门树 |
| `system_area_tree` | 区域树 |
| `system_menu_tree` | 菜单树 |
| `system_options` | 系统选项（代理到 common_option） |
| `dict_list` | 字典列表 |

### 拓扑/辅助 (4个)
| 工具 | 功能 |
|------|------|
| `topology_all` | 全量拓扑 |
| `point_type_page` | 测点类型分页（**平台500 bug**） |
| `cockpit_files` | 驾驶舱文件/图片 |
| `common_option` | 公共选项（site_title等） |
| `common_dict` | 公共字典（按类型） |
| `common_dept_tree` | 公共部门树 |

## ⚠️ 已知问题

| 工具 | 问题 | 解决方式 |
|------|------|---------|
| `report_point_data` | 平台500异常 | 平台bug，需联系运维 |
| `system_area_info` | 平台500异常 | 平台bug |
| `point_type_page` | 平台500异常 | 平台bug |
| `device_health_threshold` | group_admin 权限返回 records=null | 需用 project_admin 权限账号 |
| `device_topology_v2` | group_admin 权限返回500 | 已自动回退到 v1 |
| `device_extension_info(957)` | 该设备当前无扩展数据 | 用 `device_running_info` 查温度/功率即可 |
| `cockpit_screen_energy_storage` | 金鹰世界暂无储能 | 业务上无该数据 |
| `analysis_energy_consumption` | HXJY+day 维度无数据 | 改用 hour/月 维度或别的节点 |

## 典型使用流程

### 查看设备温度和运行状态
```
1. cockpit_room_list → 获取机房列表（得到 deviceId）
2. device_tree(device_code="CWER") → 获取设备树（得到具体设备ID）
3. device_running_info(device_id=906) → 获取温度/运行状态/功率/电流
```

### 查看今日用电量
```
1. cockpit_energy_usage → 今日用电量、环比、每日趋势
2. energy_factory_overview → 全厂逐时用电曲线
```

### 查看报警
```
1. cockpit_alarm_info → 报警概览（实时报警数）
2. alarm_realtime(start_time, end_time) → 具体报警列表
3. alarm_by_device(device_id) → 设备级报警
```

### 查看能效COP
```
1. cockpit_room_energy(device_id, device_code) → 机房COP
2. analysis_energy_params → COP点位信息
3. energy_efficiency_query(...) → 历史能效数据
```
