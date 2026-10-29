import { readFile } from 'node:fs/promises'

export const name = 'ge-skill-lark-cli'
export const inject = ['skills']

const SKILLS = [
  {
    name: 'lark-cli-setup',
    description:
      '飞书 CLI 安装与登录：检查或安装最新 Lark CLI，复用已有 profile，引导首次应用配置与 OAuth 登录，并验证身份、scope 和一次最小只读调用。',
    directory: new URL('./skills/setup/', import.meta.url),
    file: new URL('./skills/setup/SKILL.md', import.meta.url)
  },
  {
    name: 'lark-cli',
    description:
      '通过本机 Lark CLI 操作飞书文档、表格、多维表格、日历、消息等 SaaS 资源；默认用户身份，写操作先确认。',
    directory: new URL('./skills/cli/', import.meta.url),
    file: new URL('./skills/cli/SKILL.md', import.meta.url)
  }
]

const CANDIDATES = SKILLS.map((skill) => ({
  name: skill.name,
  description: skill.description,
  invocation: { modelInvocable: true, userInvocable: true },
  provider: 'ge-skill-lark-cli',
  source: 'bundled',
  resourceBase: { kind: 'directory', path: skill.directory.pathname },
  rank: 600,
  locator: skill.file
}))

const provider = {
  name: 'ge-skill-lark-cli',
  list: () => Promise.resolve(CANDIDATES),
  async get(candidate) {
    const skill = SKILLS.find((entry) => entry.name === candidate.name)
    if (!skill) return undefined
    return {
      ...CANDIDATES.find((entry) => entry.name === skill.name),
      content: await readFile(skill.file, 'utf8')
    }
  }
}

export function apply(ctx) {
  ctx.skills.registerProvider(() => provider)
}