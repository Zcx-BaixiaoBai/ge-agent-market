# 数据管理中心工作台（ge-workbench-datacenter）

按项目查看金鹰集团「数据管理中心」的业务全景：设备故障、瑞信电表、安全隐患与值班、预算执行。

面向的使用场景是工程与物业管理者：先选定自己负责的项目，工作台只呈现这个项目的数据，
不再需要在一大张集团汇总表里逐行翻找。

## 界面形态

整页业务看板，不常驻会话区。

- 首次进入：引导选择项目（可多选，支持搜索），确认后进入看板。
- 看板：顶部为项目切换、刷新与「让 AI 协助分析」；下方为总览、设备、电表、安全、预算五个分类。
- 需要 AI 协助时点击按钮，宿主才会为本工作台创建会话并显示对话区，关闭后回到业务视图。

## 数据来源

服务端代理数据管理中心的只读接口（`http://datacenter.zcx-baixiaobai.cn/api`）：

| 接口 | 用途 |
|---|---|
| `/projects` | 项目清单与工程/物业负责人 |
| `/equipment`、`/meters`、`/safety`、`/budget`、`/summary` | 各项目汇总指标 |
| `/equipment/detail`、`/meters/detail`、`/safety/hazards`、`/safety/duties` | 按项目过滤后的明细 |

工单推送、数据同步与管理设置需要登录，未纳入本工作台。

项目选择保存在 `dshHomePath('datacenter-workbench')/selection.json`，卸载工作台不会删除该文件。

## 开发

```bash
# 构建客户端单文件
esbuild src/entry.js --bundle --format=iife --target=es2022 \
  --jsx=transform --jsx-factory=React.createElement --jsx-fragment=React.Fragment \
  --outfile=lib/client.js

# 打包
pnpm pack
```

客户端通过 `window.__ModuleLoader__.load` 注册业务面板，React 取自宿主共享基线，
其余界面代码随包打包为单文件 `lib/client.js`。

## 开发者

张宸熙 (Zcx-BaixiaoBai)
