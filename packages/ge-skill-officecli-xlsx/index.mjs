import { readFile } from 'node:fs/promises'

export const name = 'ge-skill-officecli-xlsx'
export const inject = ['skills']

const SKILL_URL = new URL('./SKILL.md', import.meta.url)
const RESOURCE_BASE = { kind: 'directory', path: new URL('./', import.meta.url).pathname }
const CANDIDATE = {
  name: 'officecli-xlsx',
  description:
    '创建、读取、编辑 Excel .xlsx/.csv：公式、图表、透视表、数据看板、财务模型。使用 officecli CLI，无需安装 Office。',
  invocation: { modelInvocable: true, userInvocable: true },
  provider: 'ge-skill-officecli-xlsx',
  source: 'bundled',
  resourceBase: RESOURCE_BASE,
  rank: 600,
  locator: SKILL_URL
}

const provider = {
  name: 'ge-skill-officecli-xlsx',
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