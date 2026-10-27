import {{ readFile }} from 'node:fs/promises'

export const name = 'ge-skill-shuibiao-skill'
export const inject = ['skills']

const SKILL_URL = new URL('./SKILL.md', import.meta.url)
const RESOURCE_BASE = {{ kind: 'directory', path: new URL('./', import.meta.url).pathname }}
const CANDIDATE = {{
  name: 'ge-skill-shuibiao',
  description: '通过 MCP 调用南京金鹰智慧能源管理平台（64 工具）的作业指引。开发者：张宸熙。',
  invocation: {{ modelInvocable: true, userInvocable: true }},
  provider: 'ge-skill-shuibiao',
  source: 'bundled',
  resourceBase: RESOURCE_BASE,
  rank: 600,
  locator: SKILL_URL
}}

const provider = {{
  name: 'ge-skill-shuibiao',
  list: () => Promise.resolve([CANDIDATE]),
  async get() {{
    return {{
      name: CANDIDATE.name,
      description: CANDIDATE.description,
      invocation: CANDIDATE.invocation,
      provider: CANDIDATE.provider,
      source: CANDIDATE.source,
      resourceBase: RESOURCE_BASE,
      content: await readFile(SKILL_URL, 'utf8')
    }}
  }}
}}

export function apply(ctx) {{
  ctx.skills.registerProvider(() => provider)
}}
