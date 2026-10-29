# ge-skill-officecli-docx

Word `.docx` 文档技能：创建、读取、编辑报告、信函、备忘、模板、批注、修订和目录。
底层使用 [OfficeCLI](https://github.com/iOfficeAI/OfficeCLI)（Apache-2.0），单二进制，
不需要安装 Microsoft Office。

> 来源：iOfficeAI/OfficeCLI · 技能内容按其 Apache-2.0 许可分发，见 LICENSE/NOTICE。

## 安装（金鹰 Agent 插件市场）

在桌面端「插件 → 发现」中搜索「OfficeCLI Word」安装即可，安装后注册技能 `officecli-docx`。

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

安装后 `officecli --version` 验证。所有操作在本地文件上完成，不上传文档内容。

## 能做什么

- 新建 Word 文档、报告、提案、信函、备忘
- 读取/解析/提取 `.docx` 文本、表格、批注、修订
- 编辑现有文档：样式、页眉页脚、目录、分栏、图片
- 用 `officecli view <file> html` 渲染检查排版后再交付

## 许可

Apache-2.0。OfficeCLI 版权归其作者所有，NOTICE 随包分发。