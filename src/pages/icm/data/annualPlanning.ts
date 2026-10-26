import type { AuditProject } from './auditProjects'
import type { PlanningEvidence, PlanningRisk } from '../pages/annual-plan/model'

// A single historical project fixture is shared by the project centre and annual planning.
export const historicalAuditProjects: AuditProject[] = [
  ['采购与供应商管理专项审计', '采购管理中心', '财务审计', '02-10', '03-21', '供应商准入与采购透明度'],
  ['资金收支与支付审批审计', '财务共享中心', '财务审计', '03-10', '04-18', '资金支付与权限控制'],
  ['基建工程结算专项审计', '工程建设事业部', '工程审计', '04-15', '06-06', '工程变更与结算真实性'],
  ['所属企业财务收支审计', '华东装备制造有限公司', '财务审计', '06-09', '07-18', '收入确认与费用合规'],
  ['境外经营与投资专项审计', '国际业务事业部', '财务审计', '07-14', '08-29', '境外授权与投资风险'],
  ['资产管理与处置专项审计', '资产运营中心', '财务审计', '08-18', '09-26', '资产完整性与处置合规'],
  ['主要负责人任期经济责任审计', '华南分公司', '经济责任审计', '10-09', '11-21', '重大决策与履职责任'],
  ['重点问题整改后续审计', '集团本部及所属单位', '财务审计', '11-10', '12-19', '重复发生问题与整改实效'],
].map(([name, subject, type, start, end, risk], index) => ({
  id: `AUD-2025-${String(index + 1).padStart(3, '0')}`, planId: `AP-2025-001/API-2025-${index + 1}`,
  name, subject, type: type as AuditProject['type'], period: index === 6 ? '2022-01-01 至 2024-12-31' : '2024-01-01 至 2024-12-31',
  plannedImplementation: `2025-${start} 至 2025-${end}`, actualImplementation: `2025-${start} 至 2025-${end}`,
  owner: ['张衡', '李娜', '王锐'][index % 3], stage: index === 7 ? '整改跟踪' : '已归档', risk,
  scope: `围绕${risk}开展审计，形成审计结论并跟踪整改。`,
  scenario: type === '工程审计' ? 'engineering' : type === '经济责任审计' ? 'economic' : 'finance',
  taskIds: [], notes: index === 7 ? ['年度审计工作已完成，相关整改继续跟踪。'] : [], todoItems: [], draftItems: [], currentRevision: 1,
}))

export function planningEvidence(year: number): PlanningEvidence[] {
  return [
    { id: 'strategy', name: '战略目标与经营重点', source: '年度经营重点资料包（演示）', version: `${year}-草案1`, status: '已确认', note: '关注采购集中管理、重大工程和境外经营。' },
    { id: 'risk', name: '年度风险评估', source: '所属单位风险识别与评估台账（演示）', version: `${year - 1}-Q3`, status: '已确认', note: '以可能性和影响程度进行分级，提交前由内审机构确认。' },
    { id: 'history', name: '历史审计与覆盖情况', source: '项目中心 / 历史审计项目', version: `${year - 1}-10`, status: '已确认', note: '关联既有项目，核对覆盖空白和重复审计。' },
    { id: 'rectification', name: '历史问题与整改情况', source: '整改台账 / 当前记录', version: `${year - 1}-10`, status: '已确认', note: '结合未销号事项评估后续审计需求。' },
    { id: 'mandatory', name: '交办与必审事项', source: '内审机构年度需求征集（演示）', version: `${year}-征集稿`, status: year === 2027 ? '待确认' : '已确认', note: '经济责任审计需求待与有关部门确认。' },
    { id: 'resource', name: '人员与预算测算', source: '内审机构资源预算（演示）', version: `${year}-预算草案`, status: year === 2027 ? '待补充' : '已确认', note: '请补充可投入人天、专业能力与外部资源。' },
  ]
}

export function planningRisks(year: number): PlanningRisk[] {
  return [
    ['采购管理中心', '采购', '供应商集中与关联交易风险', 5, 5, false, '采购与供应商管理专项审计', 45],
    ['工程建设事业部', '工程', '工程变更与结算偏差风险', 4, 5, false, '基建工程结算专项审计', 60],
    ['财务共享中心', '资金', '大额支付与授权控制风险', 4, 4, false, '资金收支与支付审批审计', 36],
    ['国际业务事业部', '境外', '境外投资与经营合规风险', 3, 5, false, '境外经营与投资专项审计', 50],
    ['华南分公司', '经济责任', '主要负责人履职责任审计需求', 3, 4, true, '主要负责人任期经济责任审计', 55],
    ['集团本部及所属单位', '整改', '历史重大问题整改未闭环', 4, 4, false, '重点问题整改后续审计', 24],
  ].map(([subject, domain, title, likelihood, impact, required, recommendation, workdays], index) => ({
    id: `RISK-${year}-${index + 1}`, subject: String(subject), domain: String(domain), title: String(title),
    likelihood: Number(likelihood), impact: Number(impact), required: Boolean(required),
    evidenceIds: index === 4 ? ['mandatory', 'history'] : index === 5 ? ['rectification', 'history'] : ['risk', 'strategy', 'history'],
    lastAudit: '2025', recommendation: String(recommendation), workdays: Number(workdays),
  }))
}
