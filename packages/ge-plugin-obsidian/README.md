# ge-plugin-obsidian

Obsidian 官方 Agent Skills 插件（ZCode 版 0.1.2 适配到金鹰 Agent）。把
[kepano/obsidian-skills](https://github.com/kepano/obsidian-skills) 的 6 个官方技能和
[axtonliu/axton-obsidian-visual-skills](https://github.com/axtonliu/axton-obsidian-visual-skills)
的 Mermaid/Excalidraw 可视化技能打包为一个插件，并附带依赖检测的 `setup` 技能。

> 封装自 Z.ai obsidian 0.1.2（MIT）；上游技能作者：Steph Ango（kepano）与 Axton Liu。
> 上游 commit、许可证与适配差异见 [UPSTREAM.md](./UPSTREAM.md)。

## 安装（金鹰 Agent 插件市场）

在桌面端「插件 → 发现」中搜索「Obsidian」安装即可，安装后注册以下技能：

| 技能 | 用途 |
|---|---|
| `obsidian-setup` | 检测/安装 Obsidian CLI、defuddle、knap |
| `obsidian-markdown` | Obsidian 风格 Markdown：双链、嵌入、callout、properties |
| `obsidian-bases` | `.base` 数据库视图：视图、筛选、公式、汇总 |
| `json-canvas` | `.canvas` 白板：节点、连线、分组，文本转 MindMap/自由布局 |
| `mermaid-visualizer` | 文本转 Mermaid 图，内置语法防错 |
| `excalidraw-diagram` | 手绘风 Excalidraw 图，三种输出模式 |
| `obsidian-cli` | 读写/搜索/管理运行中的 Obsidian 库 |
| `defuddle` | 网页正文提取为干净 Markdown |
| `knap` | 模板 + JSON/CSV 批量生成笔记 |

## 前置条件

- **Obsidian 1.12+**：官方 CLI 随桌面应用提供，需在 Obsidian 内开启
  「设置 → 通用 → 命令行界面」，并保持 Obsidian 运行。
- **defuddle**：`npm install -g defuddle`（网页提取）。
- **knap**：`npm install -g knap`（Node.js 20+，模板渲染）。
- **Excalidraw 插件**（可选）：Obsidian 社区插件，`excalidraw-diagram` 的 Obsidian `.md`
  输出模式需要；标准 `.excalidraw` 输出不需要。

首次使用对 Agent 说「帮我配置 Obsidian 工具链」或调用 `obsidian-setup`，它会逐项检测并
在安装前征求确认。

## 使用示例

```text
把这篇网页文章提取成干净笔记，存到我的 Obsidian 库
给所有带 #book 标签的笔记建一个 .base，按 status 分组、卡片视图显示评分
用 knap 按 books.csv 批量套模板生成读书笔记
把这篇文章整理成 Excalidraw 思维导图
画一个 CI/CD 流水线的 Mermaid 流程图，存到库里
```

## 许可

MIT。上游技能版权归 Steph Ango（kepano）与 Axton Liu 所有，完整声明见 [LICENSE](./LICENSE)。