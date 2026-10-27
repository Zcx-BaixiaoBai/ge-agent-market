import { readFile } from 'node:fs/promises'

export const name = 'ge-skill-workorder-report-skill'
export const inject = ['skills']

const SKILL_URL = new URL('./SKILL.md', import.meta.url)
const RESOURCE_BASE = { kind: 'directory', path: new URL('./', import.meta.url).pathname }
const CANDIDATE = {
  name: 'ge-skill-workorder-report',
  description: '金鹰智慧物业工单日报智能体：自动登录、项目×技能标签统计、飞书/邮件推送、HTML 晨报。开发者：张宸熙。',
  invocation: { modelInvocable: true, userInvocable: true },
  provider: 'ge-skill-workorder-report',
  source: 'bundled',
  resourceBase: RESOURCE_BASE,
  rank: 600,
  locator: SKILL_URL
}

const provider = {
  name: 'ge-skill-workorder-report',
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