---
name: obsidian-setup
description: 检测并安装 Obsidian 技能包依赖的 CLI：Obsidian 1.12+ 自带的官方 Obsidian CLI、defuddle、knap。当 `obsidian`/`defuddle`/`knap` 缺失或不可用、用户要求配置、或其他 Obsidian 技能检查依赖失败时使用。
---

# 配置 Obsidian 工具链

> 来源：Z.ai obsidian 0.1.2（MIT）· 上游 kepano/obsidian-skills、axtonliu/axton-obsidian-visual-skills

引导用户验证并安装本技能包依赖的命令行工具：官方 Obsidian CLI、defuddle、knap。

## 组件

用户可指定要检查的组件；未指定时检查全部：

- `obsidian`：验证官方 Obsidian CLI 以及它与正在运行的 Obsidian 应用的连接
- `defuddle`：验证网页正文提取 CLI
- `knap`：验证模板渲染 CLI
- `all`：检查全部（默认）

## 示例

```text
obsidian-setup
obsidian-setup obsidian
obsidian-setup defuddle knap
```

## 步骤

1. 对每个选中的组件，完整读取并执行 `references/setup-preflight.md`；任何安装或环境改动前，先走它的安装确认门禁。
2. 如果 Obsidian CLI 缺失（包括 preflight 里的兜底探测——Agent 的 shell 可能看不到用户的 PATH），引导用户在 Obsidian 应用内完成官方注册流程（设置 → 通用 → 命令行界面），等用户完成并重启终端后重新验证。
3. 如果 `defuddle` 或 `knap` 缺失，引导用户执行对应的 `npm install -g` 命令（knap 需要 Node.js 20+），等用户完成后重新验证。
4. 在宣布 Obsidian CLI 就绪前，确认 Obsidian 应用正在运行——CLI 与运行中的应用通信，第一条命令可能会启动它。
5. 成功后报告：
   - 每个已验证组件的版本；
   - Obsidian CLI 就绪时 `obsidian vaults` 列出的库；
   - 现在可用的技能清单。
6. setup 过程中不要创建、修改或删除任何库内容。

## 重要

- 在 `references/setup-preflight.md` 的验证命令对每个选中组件都通过之前，不要声称 setup 成功。
- 调用 setup 或发现缺失依赖都不等于安装授权。执行前按 preflight 的要求向用户确认（在对话中提问并等待明确答复）。
- 官方 Obsidian CLI 随 Obsidian 桌面应用分发。不要安装 npm 上无关的 `obsidian-cli` 包。