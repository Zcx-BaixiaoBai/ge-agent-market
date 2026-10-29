import { readFile } from 'node:fs/promises'

export const name = 'ge-skill-officecli-docx'
export const inject = ['skills']

const SKILL_URL = new URL('./SKILL.md', import.meta.url)
const RESOURCE_BASE = { kind: 'directory', path: new URL('./', import.meta.url).pathname }
const CANDIDATE = {
  name: 'officecli-docx',
  description:
    '创建、读取、编辑 Word .docx 文档：报告、信函、备忘、模板、批注、修订、目录。使用 officecli CLI，无需安装 Office。',
  invocation: { modelInvocable: true, userInvocable: true },
  provider: 'ge-skill-officecli-docx',
  source: 'bundled',
  resourceBase: RESOURCE_BASE,
  rank: 600,
  locator: SKILL_URL
}

const provider = {
  name: 'ge-skill-officecli-docx',
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