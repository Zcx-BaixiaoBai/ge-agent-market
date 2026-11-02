# 写字楼经营分析（office-operation-report）

写字楼/办公业态经营分析报告的完整技能包：1 个报告总控 + 6 个专项子技能。从 BI 取数 Excel 出发，
按固定口径与异常规则完成指标计算，汇总为十一章节的管理层报告，并可输出金鹰暖色财务风 HTML/PDF
（内置问数助手）。

> 开发者：冯杰 · 内部使用 · 示例报告含真实经营数据，请只在公司内部流转。

## 安装（金鹰 Agent 插件市场）

在桌面端「插件 → 发现」中搜索「写字楼经营分析」安装即可。安装后注册 7 个技能：

- `office-operation-report`：报告总控（用户/模型均可调用）
- `office-operation-occupancy`：出租率与空置分析（第三章）
- `office-operation-contracts`：合同动态与净吸纳（第四章）
- `office-operation-rent-price`：租金与量价分析（第五章）
- `office-operation-finance-forecast`：财务权责与全年预测（第八章）
- `office-operation-competitors`：竞品对标（第六章）
- `office-operation-pipeline`：租户储备与招商漏斗（第七章）

6 个专项子技能默认只由模型在总控流程中调用，不单独出现在用户技能列表里。

## 包内包含

| 路径 | 内容 |
|---|---|
| `SKILL.md` | 报告总控流程、口径优先级、十一章节骨架、自检清单 |
| `subskills/*.SKILL.md` | 6 个专项子技能的完整章节规范（数据来源、计算逻辑、输出格式、异常处理） |
| `references/knowledge_base/` | 指标字典、口径规则、异常规则、报告模板、财务风样式规范、BI Excel 结构映射 |
| `scripts/fetch_bi_data.py` | 从观远 BI 拉取 13 张卡（12 张普通卡 + 1 张复杂报表），产出标准 Excel（读环境变量） |
| `scripts/bi_auth_refresh.js` | OA → SSO → BI 的 token 自动刷新（读环境变量） |
| `scripts/gen_pdf_jinying.js` | HTML → A4 PDF（输入/输出由命令行参数指定，自动隐藏问数助手） |
| `scripts/chat_widget.html` | 问数助手组件（纯前端规则引擎，注入报告 HTML） |
| `scripts/exact_body_tpl.json` | 复杂报表请求体模板 |
| `scripts/.oa_credentials.json.example` | 凭证文件模板（推荐用环境变量） |
| `frontend/办公业态经营分析_2026年11月_金鹰版.html` | 2026-11 报告样例（截止 2026-11-01），视觉/结构基准 |
| `frontend/金鹰版-内网部署模板.html` + `frontend/vendor/` | 内网无外网时可直接托管的模板（Chart.js 已本地化） |

**未包含**：`scripts/legacy/`（已弃用脚本）、`scripts/daily-build-archive/`（每日构建样例存档）、
`config/`（交付方预留的空目录）。这些不属于稳定运行链路，未打入市场包。

## 配置（环境变量）

本包不内置任何 OA/BI 账号、密码、工号或内网地址，全部从环境变量读取。

先装依赖：

```bash
python3 -m venv .venv && . .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r scripts/requirements.txt
cd scripts && npm install && cd ..             # playwright / puppeteer-core / guancli
```

再设置变量（按实际环境替换尖括号内容）：

| 变量 | 必填 | 说明 |
|---|---|---|
| `BI_BASE` | 是 | 观远 BI 地址，如 `https://<BI域名>` |
| `BI_ORIGIN` | 是 | BI 站点地址，通常与 `BI_BASE` 相同 |
| `OA_URL` | 是 | OA 登录页，如 `http://<OA域名>:8090/wui/index.html` |
| `OA_SSO_URL` | 是 | OA SSO 中转地址 |
| `OA_LOGIN_ID` | 是 | OA 工号/账号（建议用专用服务账号） |
| `OA_PASSWORD` | 是 | OA 密码（建议走平台密钥管理） |
| `GUANCLI_BIN` | 否 | guancli 可执行文件，默认 PATH 里的 `guancli` |
| `GUANCLI_CONFIG` | 否 | guancli 配置路径，默认按平台 |
| `BI_PROFILE` | 否 | guancli profile 名，默认 `jinying` |
| `PROJECT_ROOT` | 否 | 数据/输出根目录，默认当前目录 |
| `BI_CARDS_FILE` | 否 | 卡片清单 JSON，BI 重建卡片时覆盖内置清单 |
| `BI_COMPLEX_CDID` | 否 | 复杂报表卡 ID，默认内置值 |
| `BI_COMPLEX_BODY_TPL` | 否 | 复杂报表请求体模板路径，默认 `scripts/exact_body_tpl.json` |
| `NODE_BIN` | 否 | node 可执行文件，默认 PATH 里的 `node` |
| `CHROME_BIN` / `CHROME_PATH` | 否 | Chrome/Chromium 路径，PDF 导出用 |

macOS/Linux 示例：

```bash
export BI_BASE="https://<BI域名>"
export BI_ORIGIN="$BI_BASE"
export OA_URL="http://<OA域名>:8090/wui/index.html"
export OA_SSO_URL="http://<OA域名>:8090/interface/ywf/GoToOtherSys.jsp?syscode=001"
export OA_LOGIN_ID="<OA工号>"
export OA_PASSWORD="<OA密码>"
```

Windows PowerShell 用 `$env:BI_BASE = "..."` 形式。正式部署建议把同样变量放进平台密钥管理，
不要写进脚本或提交到仓库。

## 使用

```bash
# ① 取数（默认截止日=昨日，产出 data/写字楼经营分析-BI取数_YYYY-MM-DD.xlsx）
python scripts/fetch_bi_data.py

# ② 让 Agent 按总控 + 子技能生成报告（Markdown / HTML）
#    例：用 data/写字楼经营分析-BI取数_2026-11-01.xlsx 出一份经营分析报告

# ③ HTML → PDF
node scripts/gen_pdf_jinying.js output/办公业态经营分析_2026年11月.html output/办公业态经营分析_2026年11月.pdf
```

## 问数助手

每期报告 HTML 在 `</body>` 前注入 `scripts/chat_widget.html`，把 `__REPORT_DATA__` 替换为当期数据快照
JSON（字段口径见组件文件头部注释），并在顶部导航加「问数」入口。组件只回答快照内数据，快照外问题
回复「暂未入库」，严禁编造；打印/PDF 时自动隐藏。

## 口径要点

- 报告期间 = 当年 1 月 1 日至报告截止日；C 类合同表为「本年累计」口径
- 单位：面积㎡、金额万元、租金元/㎡/天、百分比保留 1 位小数；涨红跌绿
- 数据缺失/异常如实标注「数据未提供/待补全」，不得用推算或虚构数字填充
- 示例报告是真实经营数据，只用于内部视觉/结构对照，对外分发前必须脱敏

## 许可

内部资料，版权归金鹰所有，仅供公司内部使用。本包不含任何账号、密码、Token 或内网地址；
BI 卡片 ID 是取数默认值，BI 侧重建卡片后可用 `BI_CARDS_FILE` / `BI_COMPLEX_CDID` 覆盖。