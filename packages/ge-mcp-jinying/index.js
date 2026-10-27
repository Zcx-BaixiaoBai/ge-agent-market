import { readFile } from 'node:fs/promises'

export const name = 'ge-mcp-jinying-skill'
export const inject = ['skills']

const SKILL_URL = new URL('./SKILL.md', import.meta.url)
const RESOURCE_BASE = { kind: 'directory', path: new URL('./', import.meta.url).pathname }
const DEVELOPER = '张宸熙'
const CANDIDATE = {
  name: 'ge-mcp-jinying',
  description: '通过 MCP 调用金鹰物业安全管理系统（Snowy 1.8，SM2 加密），28 个工具。开发者：张宸熙。',
  invocation: { modelInvocable: true, userInvocable: true },
  provider: 'ge-mcp-jinying',
  source: 'bundled',
  resourceBase: RESOURCE_BASE,
  rank: 600,
  locator: SKILL_URL
}

const provider = {
  name: 'ge-mcp-jinying',
  list: () => Promise.resolve([CANDIDATE]),
  async get() {
    return {
      name: CANDIDATE.name,
      description: CANDIDATE.description,
      invocation: CANDIDATE.invocation,
      provider: CANDIDATE.provider,
      source: CANDIDATE.source,
      resourceBase: RESOURCE_BASE,
      content: await readFile(SKILL_URL, 'utf8')
    }
  }
}

export function apply(ctx) {
  ctx.skills.registerProvider(() => provider)
}
