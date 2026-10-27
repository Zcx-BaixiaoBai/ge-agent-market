import { readFile } from 'node:fs/promises'

export const name = 'ge-mcp-ruixin-skill'
export const inject = ['skills']

const SKILL_URL = new URL('./SKILL.md', import.meta.url)
const RESOURCE_BASE = { kind: 'directory', path: new URL('./', import.meta.url).pathname }
const DEVELOPER = 'Zcx-BaixiaoBai'
const CANDIDATE = {
  name: 'ge-mcp-ruixin',
  description: '通过 MCP 调用瑞信智慧预付费电表系统（RSA 加密），81 个工具。开发者：Zcx-BaixiaoBai。',
  invocation: { modelInvocable: true, userInvocable: true },
  provider: 'ge-mcp-ruixin',
  source: 'bundled',
  resourceBase: RESOURCE_BASE,
  rank: 600,
  locator: SKILL_URL
}

const provider = {
  name: 'ge-mcp-ruixin',
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
