import { readFile } from 'node:fs/promises'

export const name = 'ge-skill-office-operation'
export const inject = ['skills']

const SKILL_ROOT = new URL('./skills/office-operation-report/', import.meta.url)
const RESOURCE_BASE = {
  kind: 'directory',
  path: SKILL_ROOT.pathname
}

const SKILLS = [
  {
    name: 'office-operation-report',
    file: 'SKILL.md',
    userInvocable: true,
    description:
      '写字楼经营分析总控：从 BI 取数 Excel 生成办公业态经营分析报告，覆盖指标口径、异常规则、十一章节模板、财务风 HTML/PDF 版式与问数助手；调度 6 个专项子技能。开发者：冯杰。'
  },
  {
    name: 'office-operation-occupancy',
    file: 'subskills/occupancy.SKILL.md',
    userInvocable: false,
    description:
      '出租率与空置分析子技能：读取可租赁面积、已出租面积，计算出租率、空置面积与空置占比，输出项目明细表和空置排名。由 office-operation-report 总控调用。'
  },
  {
    name: 'office-operation-contracts',
    file: 'subskills/contracts.SKILL.md',
    userInvocable: false,
    description:
      '合同动态与净吸纳子技能：读取新签、续签、掉铺面积，计算净吸纳，输出项目明细表和净流失排名。由 office-operation-report 总控调用。'
  },
  {
    name: 'office-operation-rent-price',
    file: 'subskills/rent-price.SKILL.md',
    userInvocable: false,
    description:
      '租金与量价分析子技能：读取在营均价、平均租金与出租率同比，判断量价态势，输出各项目租金水平表。由 office-operation-report 总控调用。'
  },
  {
    name: 'office-operation-finance-forecast',
    file: 'subskills/finance-forecast.SKILL.md',
    userInvocable: false,
    description:
      '财务权责与全年预测子技能：读取收入、支出、可控利润、EBITDA、同比与全年预估，输出财务明细和收入/利润缺口。由 office-operation-report 总控调用。'
  },
  {
    name: 'office-operation-competitors',
    file: 'subskills/competitors.SKILL.md',
    userInvocable: false,
    description:
      '竞品对标子技能：读取竞品租金、出租率、优劣势，输出竞争定位对比表和对抗策略判断。由 office-operation-report 总控调用。'
  },
  {
    name: 'office-operation-pipeline',
    file: 'subskills/pipeline.SKILL.md',
    userInvocable: false,
    description:
      '租户储备与招商漏斗子技能：读取可跟进、已转化、已流失客户数据，计算储备覆盖倍数，输出漏斗表和重点客户表。由 office-operation-report 总控调用。'
  }
]

const CANDIDATES = SKILLS.map((skill) => ({
  name: skill.name,
  description: skill.description,
  invocation: { modelInvocable: true, userInvocable: skill.userInvocable },
  provider: 'ge-skill-office-operation',
  source: 'bundled',
  resourceBase: RESOURCE_BASE,
  rank: skill.name === 'office-operation-report' ? 600 : 601,
  locator: new URL(skill.file, SKILL_ROOT)
}))

const provider = {
  name: 'ge-skill-office-operation',
  list: () => Promise.resolve(CANDIDATES),
  async get(candidate) {
    const skill = SKILLS.find((entry) => entry.name === candidate.name)
    if (!skill) return undefined
    return {
      ...CANDIDATES.find((entry) => entry.name === skill.name),
      content: await readFile(new URL(skill.file, SKILL_ROOT), 'utf8')
    }
  }
}

export function apply(ctx) {
  ctx.skills.registerProvider(() => provider)
}