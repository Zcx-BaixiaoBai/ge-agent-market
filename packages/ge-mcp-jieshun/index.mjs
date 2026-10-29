import { readFile } from 'node:fs/promises'

export const name = 'ge-mcp-jieshun-skill'
export const inject = ['skills']

const SKILL_URL = new URL('./SKILL.md', import.meta.url)
const RESOURCE_BASE = { kind: 'directory', path: new URL('./', import.meta.url).pathname }
const DEVELOPER = '颜政'
const CANDIDATE = {
  name: 'ge-mcp-jieshun',
  description:
    '通过 MCP 查询捷顺云停车（只读）：车场、人员、通行记录、异常放行、场内车辆、停车优惠与收费统计。开发者：颜政。',
  invocation: { modelInvocable: true, userInvocable: true },
  provider: 'ge-mcp-jieshun',
  source: 'bundled',
  resourceBase: RESOURCE_BASE,
  rank: 600,
  locator: SKILL_URL
}

const provider = {
  name: 'ge-mcp-jieshun',
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