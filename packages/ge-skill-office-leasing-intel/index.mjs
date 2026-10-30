import { readFile } from 'node:fs/promises'

export const name = 'ge-skill-office-leasing-intel'
export const inject = ['skills']

const SKILL_URL = new URL('./skills/office-leasing-intel/SKILL.md', import.meta.url)
const RESOURCE_BASE = {
  kind: 'directory',
  path: new URL('./skills/office-leasing-intel/', import.meta.url).pathname
}
const CANDIDATE = {
  name: 'office-leasing-intel',
  description:
    '写字楼招商情报分析：基于地图 POI 与公开市场数据，输出区位画像、竞品比对、商圈成熟度、产业氛围、交通可达性、评分卡与招商评估报告。开发者：颜政。',
  invocation: { modelInvocable: true, userInvocable: true },
  provider: 'ge-skill-office-leasing-intel',
  source: 'bundled',
  resourceBase: RESOURCE_BASE,
  rank: 600,
  locator: SKILL_URL
}

const provider = {
  name: 'ge-skill-office-leasing-intel',
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