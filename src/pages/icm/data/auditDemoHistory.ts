import type { AuditProject, AuditProjectType, ProjectStage } from './auditProjects'
import type { WorkflowIssue, WorkflowRectification } from '../store/workflowStore'

// Stable, fictional fixtures shared by the business ledgers and analytics.
// Persisted records with the same IDs always take precedence over these defaults.
const subjects = [
  ['华北装备制造集团西北分公司', '采购与供应商管理', '财务审计', '供应商准入复核未覆盖关联关系', '采购验收与付款审批衔接不完整'],
  ['财务共享中心', '资金支付与账户管理', '财务审计', '资金支付授权未按岗位变更及时调整', '银行账户对账差异处理不及时'],
  ['西南建设投资集团有限公司', '工程建设与结算管理', '工程审计', '工程变更签证缺少完整审批记录', '结算复核未充分核对合同计价依据'],
  ['华东装备制造有限公司', '存货与资产管理', '财务审计', '存货盘点差异未及时查明原因', '闲置资产处置计划未明确责任期限'],
  ['集团本部及所属单位', '主要负责人经济责任', '经济责任审计', '重大经营决策执行跟踪不充分', '任期目标完成情况缺少持续评价'],
  ['西北能源开发有限公司', '投资项目与后评价', '财务审计', '投资项目后评价未按计划开展', '投资收益测算关键假设缺少复核'],
  ['华南制造有限公司', '销售合同与应收账款', '财务审计', '客户信用额度调整未履行完整审批', '逾期应收账款催收记录不完整'],
  ['信息技术中心', '信息系统与数据权限', '财务审计', '离岗人员系统权限未及时清理', '关键业务数据备份恢复验证不足'],
  ['工程建设事业部', '在建工程与项目成本', '工程审计', '项目成本归集存在跨项目分摊', '施工进度与支付节点核对不充分'],
  ['境外业务事业部', '境外经营与合规管理', '财务审计', '境外业务重大事项报告不及时', '境外合同履约风险台账更新不足'],
] as const
const owners = ['李娜', '王锐', '张衡', '赵明']
const date = (year: number, month: number, day: number) => `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
export const demoHistoryProjects: AuditProject[] = []
export const demoHistoryIssues: WorkflowIssue[] = []
export const demoHistoryRectifications: WorkflowRectification[] = []

for (const year of [2024, 2025, 2026]) {
  const months = year === 2024 ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] : year === 2025 ? [1, 3, 5, 7, 8, 10] : [1, 2, 3, 4, 5, 6, 7, 8, 9, 11]
  months.forEach((month, index) => {
    const [subject, domain, type, findingA, findingB] = subjects[index]
    const serial = `${year}-${String(index + 1).padStart(3, '0')}`
    const id = `AUD-DEMO-${serial}`, itemId = `DEMO-${serial}`, owner = owners[index % owners.length]
    const stage: ProjectStage = year === 2024 || (year === 2025 && index < 5) || (year === 2026 && index < 3) ? '已归档'
      : year === 2025 || index < 6 ? '整改跟踪' : index === 6 ? '报告中' : index < 9 ? '实施中' : '准备中'
    const start = date(year, month, 5), end = date(year, month + 1, 18), reportedAt = `${date(year, month + 1, 22)} 10:00:00`
    const deadline = date(year, Math.min(12, month + 2), 20), closedAt = `${date(year, Math.min(12, month + 2), 18)} 14:30:00`
    const archived = stage === '已归档', signed = archived || stage === '整改跟踪', started = stage !== '准备中'
    const name = `${domain}专项审计`
    const project: AuditProject = {
      id, planId: `AP-${year}-001/${itemId}`, managementYear: year, sourceType: '年度计划', name,
      type: type as AuditProjectType, subject, period: `${year - 1}-01-01 至 ${year - 1}-12-31`,
      plannedImplementation: `${start} 至 ${end}`, actualImplementation: started ? (signed || stage === '报告中' ? `${start} 至 ${end}` : start) : undefined,
      owner, stage, risk: findingA, scope: `覆盖${domain}的授权审批、执行控制、台账管理与整改落实情况。`,
      scenario: type === '工程审计' ? 'engineering' : type === '经济责任审计' ? 'economic' : 'finance',
      taskIds: [], notes: ['演示数据：年度审计历史与执行样本。'], todoItems: [], draftItems: [], currentRevision: 1,
      preparation: { status: started ? '已批准' : '草稿', objective: `评价${domain}管理有效性`, procedures: '台账核对、样本检查、访谈与异常追踪', members: `${owner}（组长）、审计组成员`, reviewer: '郑刚', notice: `${year}年度专项审计通知（演示）`, confirmedAt: started ? `${date(year, month, 2)} 09:00:00` : undefined },
      executionLinks: [{ id: `LINK-DEMO-${serial}`, annualPlanId: `AP-${year}-001`, itemId, year, version: year === 2024 ? 1 : 2, itemName: name, scope: `实施${domain}专项审计`, deliverable: '审计报告及问题整改清单', owner, linkedAt: `${year}-01-03 10:00:00`, linkedBy: '内审机构（演示记录）' }],
      ...(signed || stage === '报告中' ? { auditReport: { title: `${name}报告`, content: `# ${name}报告\n\n本报告为演示记录。审计范围覆盖${subject}的${domain}。\n\n## 审计发现\n${findingA}；${findingB}。\n\n## 审计建议\n明确整改责任与完成期限，补全业务记录，开展整改复核。`, status: signed ? '已签发' as const : '待复核' as const, version: 1, history: [{ action: signed ? '签发报告' : '提交复核', by: signed ? '郑刚' : owner, at: reportedAt }], versions: signed ? [{ version: 1, title: `${name}报告`, content: `演示签发版本：${findingA}；${findingB}。`, at: reportedAt, by: '郑刚' }] : [] } } : {}),
      ...(archived ? { archivedAt: `${date(year, Math.min(12, month + 2), 28)} 16:00:00`, closedAt, archiveNote: '报告签发、整改复核及归档记录已完成（演示历史）。' } : {}),
    }
    demoHistoryProjects.push(project)
    if (!started) return
    const titles = index % 3 === 0 ? [findingA, findingB, `${domain}制度执行记录留痕不充分`] : [findingA, findingB]
    titles.forEach((title, n) => {
      const issueId = `ISS-DEMO-${serial}-${n + 1}`, rectId = `RCT-DEMO-${serial}-${n + 1}`
      const pending = stage === '实施中' && n === 0
      const closed = archived || (stage === '整改跟踪' && n === 0 && index !== 3)
      const completed = !closed && stage === '整改跟踪' && n === 1
      const rectStatus = closed ? '已销号' : completed ? '已整改' : stage === '报告中' ? '待方案审批' : '整改中'
      const level = n === 0 && index % 3 === 0 ? '重大' : n === 1 ? '一般' : '重要'
      const updatedAt = closed ? closedAt : `${year === 2026 ? '2026-10-20' : date(year, Math.min(12, month + 2), 19)} 15:00:00`
      demoHistoryIssues.push({ id: issueId, projectId: id, title, level, gradedLevel: pending ? undefined : level, status: pending ? '待确认' : closed ? '已关闭' : completed ? '已整改' : '整改中', owner: subject, deadline, workpaperId: '', evidenceIds: [], fact: `演示审计发现：${subject}${title}。对业务台账与审批记录的核对显示，相关控制执行仍有改进空间。`, basis: '本单位相关业务管理制度及年度审计实施方案（演示依据）。', rootCause: '责任划分、执行检查和记录管理未有效衔接。', impact: `影响${domain}管理的规范性与可追溯性。`, suggestion: '明确责任人，补全控制要求与业务记录，按期限完成整改并提交复核。', rectificationId: pending ? undefined : rectId, updatedAt, creator: owner, gradingAuditor: pending ? undefined : '郑刚', gradingOpinion: pending ? undefined : '结合影响范围与控制缺陷确认等级（演示）。', objection: { status: '无', reason: '', raisedBy: '', raisedAt: '' }, mergeCandidates: [], sourceFindingIds: [] })
      if (pending) return
      demoHistoryRectifications.push({ id: rectId, issueId, title: `${title}整改`, owner: subject, status: rectStatus, planStatus: rectStatus === '待方案审批' ? '待审批' : '审批通过', progress: closed || completed ? 100 : rectStatus === '待方案审批' ? 0 : 35 + n * 20, proofCount: 0, verifyConclusion: closed ? '历史复核记录：措施落实并完成销号（演示）。' : completed ? '责任单位已完成整改，待审计复核。' : '按整改方案推进并跟踪。', updatedAt, deadline, planContent: '补全审批与台账记录，明确责任岗位，开展专项复核并固化检查机制。', evidenceChecklist: [], closeOutAt: closed ? closedAt : undefined, followUpCount: closed ? 1 : 0, overdueWarned: !closed && deadline < '2026-10-25', handlingLog: [{ at: updatedAt, by: owner, text: closed ? '登记历史整改复核与销号结果（演示）。' : '登记整改进度与后续跟踪事项（演示）。' }] })
    })
  })
}

export function appendMissingDemoRecords<T extends { id: string }>(saved: T[], additions: T[]): T[] {
  const ids = new Set(saved.map((row) => row.id))
  return [...saved, ...additions.filter((row) => !ids.has(row.id))]
}
