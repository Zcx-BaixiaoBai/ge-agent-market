# ge-mcp-jieshun

捷顺云停车（jygw.jslife.net）**只读** MCP 服务。把门户里"只能点页面"的查询能力封装成标准 MCP 工具，
供金鹰 Agent（dsh）或任意 MCP 客户端调用。

> 开发者：颜政 · 只读：仅调用 `getCount*` / `get*Record` / `get*Report` / `parks` 等查询接口，
> 不含新增、修改、停用、删除。

## 安装（金鹰 Agent 插件市场）

在桌面端「插件 → 发现」中搜索「捷顺云停车」安装即可。插件会把以下两项注册到当前 profile：

- 技能 `ge-mcp-jieshun`（SKILL.md）
- MCP 连接 `jieshun`（stdio，`mcp__jieshun__*` 工具）

## 配置

账号文件按顺序查找：`JLITE_ACCOUNT_FILE` → `~/.jlite/accounts.csv`。

CSV（UTF-8，首行可带表头）：

```csv
车场,账号,密码
示例车场,example001,********
```

也支持 JSON：`{"示例车场": {"account": "example001", "password": "********"}}`。

> 凭据不要提交进仓库，运行环境里通过 `JLITE_ACCOUNT_FILE` 指向本地文件。

## 工具

| 工具 | 说明 |
|---|---|
| `parking_orgs` | 可用车场列表（可按关键词过滤） |
| `parking_parks` | 某车场下的停车场（名称 + parkId） |
| `parking_persons` | 组织内服务人员（编号/姓名/账号/状态） |
| `parking_traffic` | 通行记录数 + 6 类异常放行 + 识别率，`by_month` 可逐月 |
| `parking_vehicle_records` | 分页查通行（出场）明细 |
| `parking_inside_vehicles` | 分页查场内未出场车辆 |
| `parking_discount_summary` | 区间打折记录数、全部优惠方案、商户用量 Top |
| `parking_charge_summary` | 区间收费统计（按支付方式，含收入/退款/净额） |
| `parking_server_info` | 服务状态与账号文件位置 |

## 直接运行

```bash
node src/server.js --selftest   # 握手 + 工具列表 + 服务信息
node src/server.js              # 作为 MCP stdio 服务
```

插件默认用桌面端自带的 Electron（`ELECTRON_RUN_AS_NODE=1`）运行同包内的
`src/server.js`；命令行环境可用 `GE_MCP_NODE` 指定 node，或用
`GE_MCP_JIESHUN_ENTRY` 覆盖入口路径。

## 实现说明

- 协议：自带 MCP 2024-11-05 的 stdio JSON-RPC（initialize / tools/list / tools/call / ping），
  无第三方 MCP SDK 依赖。
- 登录：`/jportal/randomCode` 取图 → 4 位模板法识别 → `des-ede3-cbc` 加密密码 → `/jportal/login`；
  同进程内按车场复用 token。
- 验证码图片实际是 JPEG，用 vendored 的 `jpeg-js` 解码（`vendor/jpeg-js`，MIT），因此零运行时 npm 依赖。
- 平台接口属于适配实现，门户发版后可能需要重新核对端点与字段。

## 许可证

MIT。开发者：颜政。`vendor/jpeg-js` 版权归其原作者所有，许可证见该目录。