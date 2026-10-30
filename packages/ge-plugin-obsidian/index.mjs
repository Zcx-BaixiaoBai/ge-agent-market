import { readFile } from 'node:fs/promises'

export const name = 'ge-plugin-obsidian'
export const inject = ['skills']

const SKILLS = [
  {
    name: 'obsidian-setup',
    directory: 'setup',
    description:
      '检测并安装 Obsidian 技能依赖的 CLI：官方 Obsidian CLI、defuddle、knap；首次使用或工具缺失时先跑它。'
  },
  {
    name: 'obsidian-markdown',
    directory: 'obsidian-markdown',
    description:
      '创建和编辑 Obsidian 风格 Markdown：双链、嵌入、callout、properties 等 Obsidian 专有语法。'
  },
  {
    name: 'obsidian-bases',
    directory: 'obsidian-bases',
    description:
      '创建和编辑 Obsidian Bases（.base）：视图、筛选、公式、汇总，用笔记搭数据库视图。'
  },
  {
    name: 'json-canvas',
    directory: 'json-canvas',
    description:
      '创建和编辑 JSON Canvas（.canvas）白板：节点、连线、分组；支持从文本生成 MindMap 或自由布局。'
  },
  {
    name: 'mermaid-visualizer',
    directory: 'mermaid-visualizer',
    description:
      '把文本转成专业 Mermaid 图：流程、思维导图、时序、状态，内置语法防错规则。'
  },
  {
    name: 'excalidraw-diagram',
    directory: 'excalidraw-diagram',
    description:
      '生成手绘风格 Excalidraw 图：Obsidian .md、标准 .excalidraw、动画三种模式。'
  },
  {
    name: 'obsidian-cli',
    directory: 'obsidian-cli',
    description:
      '通过 Obsidian CLI 读写、搜索、管理运行中 Obsidian 库的笔记，也支持插件/主题开发调试。'
  },
  {
    name: 'defuddle',
    directory: 'defuddle',
    description:
      '从网页提取干净正文为 Markdown，去掉导航和广告，节省 token；适合把网页文章存入 Obsidian。'
  },
  {
    name: 'knap',
    directory: 'knap',
    description:
      '用 Knap 模板和 JSON/CSV 数据批量渲染 Markdown 笔记，适合按模板生成大量笔记。'
  }
]

const CANDIDATES = SKILLS.map((skill) => ({
  name: skill.name,
  description: skill.description,
  invocation: { modelInvocable: true, userInvocable: true },
  provider: 'ge-plugin-obsidian',
  source: 'bundled',
  resourceBase: {
    kind: 'directory',
    path: new URL(`./skills/${skill.directory}/`, import.meta.url).pathname
  },
  rank: 600,
  locator: new URL(`./skills/${skill.directory}/SKILL.md`, import.meta.url)
}))

const provider = {
  name: 'ge-plugin-obsidian',
  list: () => Promise.resolve(CANDIDATES),
  async get(candidate) {
    const skill = SKILLS.find((entry) => entry.name === candidate.name)
    if (!skill) return undefined
    return {
      ...CANDIDATES.find((entry) => entry.name === skill.name),
      content: await readFile(
        new URL(`./skills/${skill.directory}/SKILL.md`, import.meta.url),
        'utf8'
      )
    }
  }
}

export function apply(ctx) {
  ctx.skills.registerProvider(() => provider)
}