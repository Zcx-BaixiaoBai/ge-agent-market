import { readFile } from 'node:fs/promises'

export const name = 'ge-skill-internal-comms'
export const inject = ['skills']

const SKILL_URL = new URL('./SKILL.md', import.meta.url)
const RESOURCE_BASE = { kind: 'directory', path: new URL('./', import.meta.url).pathname }
const CANDIDATE = {
  name: 'internal-comms',
  description:
    '撰写内部沟通材料：状态报告、领导更新、3P（Progress/Plans/Problems）、公司通讯、FAQ、事故报告、项目更新。',
  invocation: { modelInvocable: true, userInvocable: true },
  provider: 'ge-skill-internal-comms',
  source: 'bundled',
  resourceBase: RESOURCE_BASE,
  rank: 600,
  locator: SKILL_URL
}

const provider = {
  name: 'ge-skill-internal-comms',
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