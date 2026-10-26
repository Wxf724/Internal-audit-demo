import { auditProjects } from '../../data/auditProjects'
import { demoHistoryProjects } from '../../data/auditDemoHistory'
import { planningEvidence, planningRisks } from '../../data/annualPlanning'
import type { AnnualPlan, PlanContent, PlanSubmission } from './model'
import { dateRange, REVIEW_STAGES, DEFAULT_REVIEW_STAGES } from './planning'

export function seedAnnualPlan(year: number): AnnualPlan {
  const creator = { id: 'auditor', name: '李娜' }
  const content: PlanContent = {
    name: `${year}年度审计计划`, department: '审计部',
    basis: '年度风险评估、企业经营重点、历史审计与整改情况、必审及交办需求、内审资源预算。',
    objective: '以风险为导向统筹年度审计覆盖，突出重点领域和重大事项，兼顾后续审计与资源可行性。',
    reviewer: { id: 'project-lead', name: '张衡' }, approver: { id: 'audit-lead', name: '郑刚' },
    reviewStages: year === 2027 ? [...DEFAULT_REVIEW_STAGES] : [...REVIEW_STAGES], capacity: year === 2027 ? 300 : 420,
    evidence: planningEvidence(year), risks: year === 2027 ? planningRisks(year) : [],
    items: auditProjects.filter((project) => project.plannedImplementation.startsWith(`${year}-`)).map((project, index) => {
      const [start, end] = dateRange(project.plannedImplementation)
      return { id: project.planId?.startsWith(`AP-${year}`) ? project.planId.split('/')[1] : project.planId ?? `API-${year}-${index + 1}`, projectId: project.id, name: project.name, type: project.type, subject: project.subject, period: project.period, start, end: end ?? start, owner: project.owner, workdays: [45, 36, 60, 32, 50, 28, 55, 24][index % 8], scope: project.scope, risk: project.risk, priority: index % 3 === 0 ? '高' : '中', source: '年度安排' }
    }),
  }
  content.capacity = year < 2027 ? Math.max(420, Math.ceil(content.items.reduce((sum, item) => sum + item.workdays, 0) / 50) * 50) : content.capacity
  const approved: PlanSubmission | undefined = year < 2027 ? {
    version: 1, content: structuredClone(content), submittedAt: `${year - 1}-12-10 09:00:00`, submittedBy: creator, reason: '',
    steps: REVIEW_STAGES.map((name, index) => ({ name, actor: { id: `seed-${index}`, name: ['内审机构', '审计委员会办公室', '党委办公室', '董事会办公室'][index] }, status: '通过', opinion: '按年度计划安排组织实施（演示记录）。', at: `${year - 1}-12-${12 + index * 3} 10:00:00`, reference: `演示-${year}-年度计划-${index + 1}` })),
  } : undefined
  const plan: AnnualPlan = { id: `AP-${year}-001`, year, status: approved ? '已批准' : '编制中', creator, content, submissions: approved ? [approved] : [], approved, adjustmentReason: '', updatedAt: approved ? `${year - 1}-12-21 10:00:00` : '2026-10-24 09:00:00', recordingMode: true, demo: true, aiRuns: [] }
  if (approved && (year === 2025 || year === 2026)) {
    // Keep the original annual approval and record the supplement as a separate version.
    const original = { ...structuredClone(approved), content: { ...structuredClone(content), items: content.items.filter((item) => !item.id.startsWith('DEMO-')) } }
    const supplement = supplementalSubmission(plan, content)
    return { ...plan, submissions: [original, supplement], approved: supplement, updatedAt: supplement.steps.at(-1)!.at }
  }
  return plan
}

function supplementalSubmission(plan: AnnualPlan, content: PlanContent): PlanSubmission {
  return { version: (plan.approved?.version ?? 0) + 1, content: structuredClone(content), submittedAt: `${plan.year}-01-02 09:00:00`, submittedBy: plan.creator, reason: '补充年度重点领域审计安排（演示记录）。', steps: REVIEW_STAGES.map((name, index) => ({ name, actor: { id: `seed-${index}`, name: ['内审机构', '审计委员会办公室', '党委办公室', '董事会办公室'][index] }, status: '通过', opinion: '同意补充安排并按资源预算组织实施（演示记录）。', at: `${plan.year}-01-03 ${String(9 + index).padStart(2, '0')}:00:00`, reference: `演示-${plan.year}-计划补充-${index + 1}` })) }
}

export const initialAnnualPlans = [2024, 2025, 2026, 2027].map(seedAnnualPlan)

function supplementUntouchedDemo(plan: AnnualPlan): AnnualPlan {
  if (![2025, 2026].includes(plan.year) || plan.id !== `AP-${plan.year}-001` || !plan.demo || plan.status !== '已批准' || plan.approved?.version !== 1 || plan.adjustmentReason || plan.conversation || JSON.stringify(plan.content) !== JSON.stringify(plan.approved.content)) return plan
  const seed = initialAnnualPlans.find((entry) => entry.year === plan.year)!
  const additions = seed.content.items.filter((item) => item.id.startsWith('DEMO-') && !plan.content.items.some((old) => old.id === item.id))
  if (!additions.length) return plan
  const content = { ...structuredClone(plan.content), items: [...plan.content.items, ...additions] }
  content.capacity = Math.max(content.capacity ?? 420, Math.ceil(content.items.reduce((sum, item) => sum + item.workdays, 0) / 50) * 50)
  const approved = supplementalSubmission(plan, content)
  return { ...plan, content, approved, submissions: [...plan.submissions, approved], updatedAt: approved.steps.at(-1)!.at, summary: undefined }
}

export function restoreAnnualPlans(saved: AnnualPlan[] | undefined) {
  if (!saved) return initialAnnualPlans
  const restored = saved.map((plan) => {
    // Upgrade only the untouched first-version demo fixture; never replace user edits or submissions.
    const legacyProjects = auditProjects.filter((project) => project.plannedImplementation.startsWith('2026-') && !demoHistoryProjects.some((demo) => demo.id === project.id))
    const pristine = plan.id === 'AP-2026-001' && plan.status === '编制中' && !plan.submissions.length && !plan.approved && !plan.adjustmentReason && !plan.recordingMode && plan.creator.id === 'auditor'
      && plan.content.name === '2026年度审计计划' && plan.content.department === '审计部'
      && plan.content.basis === '企业内部审计制度、年度风险评估及历史审计整改情况。'
      && plan.content.objective === '统筹年度审计覆盖和资源安排，重点关注采购、资金、工程及经济责任事项。'
      && plan.content.reviewer.id === 'project-lead' && plan.content.approver.id === 'audit-lead'
      && plan.content.items.length === legacyProjects.length && plan.content.items.every((item, index) => {
        const project = legacyProjects[index]
        return item.projectId === project.id && item.name === project.name && item.subject === project.subject && item.type === project.type && item.period === project.period && item.scope === project.scope && item.risk === project.risk && item.owner === project.owner && item.start === '2026-11-01' && item.end === '2026-11-30' && item.workdays === 20
      })
    if (pristine) return seedAnnualPlan(2026)
    return supplementUntouchedDemo({ ...plan, recordingMode: true, content: { ...plan.content, reviewStages: plan.content.reviewStages ?? [...REVIEW_STAGES], evidence: plan.content.evidence ?? planningEvidence(plan.year), risks: plan.content.risks ?? [], capacity: plan.content.capacity ?? 420 } })
  })
  return [...restored, ...initialAnnualPlans.filter((seed) => !restored.some((plan) => plan.year === seed.year))]
}
