# 写字楼经营分析（office-operation-report）

写字楼/办公业态经营分析报告的总控技能：从 BI 取数 Excel 出发，按固定口径与异常规则完成指标计算，
汇总为十一章节的管理层报告，并可输出金鹰暖色财务风 HTML/PDF。

> 开发者：冯杰 · 内部使用 · 示例报告含真实经营数据，请只在公司内部流转。

## 安装（金鹰 Agent 插件市场）

在桌面端「插件 → 发现」中搜索「写字楼经营分析」安装即可，安装后注册技能 `office-operation-report`。

## 包内包含

| 路径 | 内容 |
|---|---|
| `SKILL.md` | 报告总控流程、口径优先级、十一章节骨架、自检清单 |
| `references/knowledge_base/` | 指标字典、口径规则、异常规则、报告模板、财务风样式规范、BI Excel 结构映射 |
| `scripts/fetch_bi_data.py` | 从观远 BI 拉取 12 张卡，产出标准 Excel（读环境变量） |
| `scripts/bi_auth_refresh.js` | OA → SSO → BI 的 token 自动刷新（读环境变量） |
| `scripts/gen_pdf_jinying.js` | HTML → A4 PDF（输入/输出由命令行参数指定） |
| `scripts/exact_body_tpl.json` | 复杂报表请求体模板 |
| `scripts/.oa_credentials.json.example` | 凭证文件模板（推荐用环境变量） |
| `frontend/办公业态经营分析_2026年10月_金鹰版.html` | 现行报告样例，视觉/结构基准 |
| `frontend/金鹰版-内网部署模板.html` + `frontend/vendor/` | 内网无外网时可直接托管的模板 |

**不包含**：六个子技能（出租率与空置、合同动态与净吸纳、租金与量价、财务权责与全年预测、
竞品对标、租户储备与招商漏斗）。市场版可直接按 SKILL.md 与知识库逐章完成，也可以另装这些子技能后按顺序调用。

## 配置（环境变量）

本包不内置任何 OA/BI 账号、密码、工号或内网地址，全部从环境变量读取。

先装依赖：

```bash
python3 -m venv .venv && . .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r scripts/requirements.txt
cd scripts && npm install && cd .              # playwright / puppeteer-core / guancli
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
| `NODE_BIN` | 否 | node 可执行文件，默认 PATH 里的 `node` |
| `CHROME_BIN` | 否 | Chrome/Chromium 路径，PDF 导出用 |

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

# ② 让 Agent 按技能生成报告（Markdown / HTML）
#    例：用 data/写字楼经营分析-BI取数_2026-10-29.xlsx 出一份经营分析报告

# ③ HTML → PDF
node scripts/gen_pdf_jinying.js output/办公业态经营分析_2026年10月.html output/办公业态经营分析_2026年10月.pdf
```

## 口径要点

- 报告期间 = 当年 1 月 1 日至报告截止日；C 类合同表为「本年累计」口径
- 单位：面积㎡、金额万元、租金元/㎡/天、百分比保留 1 位小数；涨红跌绿
- 数据缺失/异常如实标注「数据未提供/待补全」，不得用推算或虚构数字填充
- 示例报告是真实经营数据，只用于内部视觉/结构对照，对外分发前必须脱敏

## 许可

内部资料，版权归金鹰所有，仅供公司内部使用。本包不含任何账号、密码、Token 或内网地址。