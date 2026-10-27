import {{ readFile }} from 'node:fs/promises'

export const name = 'ge-skill-fuca-skill'
export const inject = ['skills']

const SKILL_URL = new URL('./SKILL.md', import.meta.url)
const RESOURCE_BASE = {{ kind: 'directory', path: new URL('./', import.meta.url).pathname }}
const CANDIDATE = {{
  name: 'ge-skill-fuca',
  description: '通过 MCP 调用 eFlex 能碳管理平台（67 工具）的作业指引。开发者：张宸熙。',
  invocation: {{ modelInvocable: true, userInvocable: true }},
  provider: 'ge-skill-fuca',
  source: 'bundled',
  resourceBase: RESOURCE_BASE,
  rank: 600,
  locator: SKILL_URL
}}

const provider = {{
  name: 'ge-skill-fuca',
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
