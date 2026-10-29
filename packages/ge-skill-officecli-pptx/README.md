# ge-skill-officecli-pptx

PowerPoint `.pptx` 技能：创建、读取、编辑演示文稿、模板、版式、图表和演讲备注。
底层使用 [OfficeCLI](https://github.com/iOfficeAI/OfficeCLI)（Apache-2.0），单二进制，
不需要安装 Microsoft Office。

> 来源：iOfficeAI/OfficeCLI · 技能内容按其 Apache-2.0 许可分发，见 LICENSE/NOTICE。

## 安装（金鹰 Agent 插件市场）

在桌面端「插件 → 发现」中搜索「OfficeCLI PowerPoint」安装即可，安装后注册技能 `officecli-pptx`。

## 首次使用

技能会先检查 `officecli` 是否可用；缺少时按提示安装：

```bash
# macOS / Linux
curl -fsSL https://d.officecli.ai/install.sh | bash

# Windows PowerShell
irm https://d.officecli.ai/install.ps1 | iex

# 或 npm
npm install -g @officecli/officecli
```

安装后 `officecli --version` 验证。所有操作在本地文件上完成，不上传演示文稿内容。

## 能做什么

- 新建/编辑幻灯片、版式、模板、主题、形状、图片、图表
- 读取/解析/提取 `.pptx` 文本、表格、备注
- 合并/拆分演示文稿，调整页序
- 用 `officecli view <file> html` 或截图检查排版后再交付

## 许可

Apache-2.0。OfficeCLI 版权归其作者所有，NOTICE 随包分发。