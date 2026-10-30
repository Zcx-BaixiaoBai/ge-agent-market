import { readFile } from 'node:fs/promises'

export const name = 'ge-skill-office-operation'
export const inject = ['skills']

const SKILL_URL = new URL('./skills/office-operation-report/SKILL.md', import.meta.url)
const RESOURCE_BASE = {
  kind: 'directory',
  path: new URL('./skills/office-operation-report/', import.meta.url).pathname
}
const CANDIDATE = {
  name: 'office-operation-report',
  description:
    '写字楼经营分析：从 BI 取数 Excel 生成办公业态经营分析报告，覆盖指标口径、异常规则、十一章节模板与财务风 HTML/PDF 版式。开发者：冯杰。',
  invocation: { modelInvocable: true, userInvocable: true },
  provider: 'ge-skill-office-operation',
  source: 'bundled',
  resourceBase: RESOURCE_BASE,
  rank: 600,
  locator: SKILL_URL
}

const provider = {
  name: 'ge-skill-office-operation',
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