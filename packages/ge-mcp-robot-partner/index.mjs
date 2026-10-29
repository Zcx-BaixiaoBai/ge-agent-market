import { readFile } from 'node:fs/promises'

export const name = 'ge-mcp-robot-partner-skill'
export const inject = ['skills']

const SKILL_URL = new URL('./SKILL.md', import.meta.url)
const RESOURCE_BASE = { kind: 'directory', path: new URL('./', import.meta.url).pathname }
const DEVELOPER = '颜政'
const CANDIDATE = {
  name: 'ge-mcp-robot-partner',
  description:
    '通过 MCP 查询高仙机器人合作伙伴平台（只读）：项目、设备、实时概览、任务统计、任务日历、达标阈值与告警。开发者：颜政。',
  invocation: { modelInvocable: true, userInvocable: true },
  provider: 'ge-mcp-robot-partner',
  source: 'bundled',
  resourceBase: RESOURCE_BASE,
  rank: 600,
  locator: SKILL_URL
}

const provider = {
  name: 'ge-mcp-robot-partner',
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

export { DEVELOPER }