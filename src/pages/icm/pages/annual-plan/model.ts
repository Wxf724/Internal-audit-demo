import type { AuditProjectType } from '../../data/auditProjects'
import type { PlanConversation } from './conversationTypes'

export interface PlanActor { id: string; name: string }
export type AnnualStatus = '编制中' | '审批中' | '已批准' | '已退回'
export interface AnnualProjectItem {
  id: string
  name: string
  type: AuditProjectType
  subject: string
  period: string
  start: string
  end: string
  owner: string
  workdays: number
  scope: string
  risk: string
  projectId?: string
  priority?: '高' | '中' | '低'
  source?: string
  basisRefs?: string[]
  riskId?: string
  locked?: boolean
  resourceNeeds?: string
}
export interface PlanContent {
  name: string
  department: string
  basis: string
  objective: string
  reviewer: PlanActor
  approver: PlanActor
  items: AnnualProjectItem[]
  evidence?: PlanningEvidence[]
  risks?: PlanningRisk[]
  reviewStages?: string[]
  capacity?: number
  followUp?: string
  resourceStrategy?: string
  approvalAuthority?: string
  governanceBasis?: string
  deferred?: { riskId: string; reason: string }[]
}
export interface PlanningEvidence { id: string; name: string; source: string; version: string; status: '待补充' | '待确认' | '已确认'; note: string; confirmedAt?: string }
export interface PlanningRisk { id: string; subject: string; domain: string; title: string; likelihood: number; impact: number; required: boolean; evidenceIds: string[]; lastAudit: string; recommendation: string; workdays: number }
export interface PlanningSuggestion { id: string; riskId: string; item: AnnualProjectItem; reason: string; sources: string[]; status: '待确认' | '已采纳' | '暂不纳入'; decisionReason?: string }
export interface PlanningRun { id: string; at: string; agents: string[]; sources: string[]; suggestions: PlanningSuggestion[]; findings: string[] }
export interface ApprovalStep {
  name: string
  actor: PlanActor
  status: '待处理' | '待流转' | '通过' | '退回'
  opinion: string
  at: string
  reference?: string
}
export interface PlanSubmission {
  version: number
  content: PlanContent
  submittedAt: string
  submittedBy: PlanActor
  reason: string
  steps: ApprovalStep[]
}
export interface AnnualPlan {
  id: string
  year: number
  status: AnnualStatus
  creator: PlanActor
  content: PlanContent
  submissions: PlanSubmission[]
  approved?: PlanSubmission
  adjustmentReason: string
  updatedAt: string
  recordingMode?: boolean
  demo?: boolean
  summary?: string
  aiRuns?: PlanningRun[]
  conversation?: PlanConversation
}

export const PLAN_STATUSES: AnnualStatus[] = ['编制中', '审批中', '已批准', '已退回']
export const now = () => new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai' })
export const newId = () => crypto.randomUUID()
const copy = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T
export const canEditPlan = (plan: AnnualPlan, actor: PlanActor) =>
  (plan.recordingMode || actor.id === plan.creator.id) && (plan.status === '编制中' || plan.status === '已退回')

export function validateContent(plan: AnnualPlan) {
  const { content: c } = plan
  if (![c.name, c.department, c.basis, c.objective].every((value) => value.trim())) throw new Error('请补全计划名称、编制部门、编制依据和总体目标。')
  if (!plan.recordingMode && (!c.reviewer.id || !c.approver.id || new Set([plan.creator.id, c.reviewer.id, c.approver.id]).size !== 3)) throw new Error('编制人、复核人和批准人须分别指定，不能由同一人兼任。')
  if (plan.recordingMode && !c.reviewStages?.includes('有权机构批准')) throw new Error('请在审议安排中保留最终批准环节。')
  if (c.evidence?.some((entry) => entry.status !== '已确认')) throw new Error('请先补充并确认全部编制依据。')
  if (c.risks?.some((risk) => risk.required && !c.items.some((item) => item.riskId === risk.id))) throw new Error('必审事项尚未全部纳入，请核对候选项目。')
  if (plan.conversation?.riskLibrary?.some((risk) => risk.required && !c.items.some((item) => item.riskId === risk.id))) throw new Error('必审事项尚未全部纳入，请在资源库选择相应事项并补充计划。')
  if (plan.conversation && c.items.reduce((sum, item) => sum + item.workdays, 0) > (c.capacity ?? 0)) throw new Error('计划投入超出可用人天，请调整项目组合或资源安排。')
  if (plan.conversation?.standardsVersion === 2) {
    if (!c.followUp?.trim() || !c.resourceStrategy?.trim()) throw new Error('请补充后续审计安排和专业能力、外部资源安排。')
    if (!c.approvalAuthority?.trim() || !c.governanceBasis?.trim()) throw new Error('请明确批准主体及本单位审议程序依据。')
    if (!c.items.every((item) => item.resourceNeeds?.trim() && item.basisRefs?.length)) throw new Error('请补全各项目的资源需求及编制依据。')
    if (!c.evidence?.length) throw new Error('请关联并核对编制依据。')
  }
  if (c.capacity !== undefined && (!Number.isFinite(c.capacity) || c.capacity <= 0)) throw new Error('请填写有效的年度可用人天。')
  if (c.risks?.some((risk) => !Number.isFinite(risk.workdays) || risk.workdays <= 0 || ![1, 2, 3, 4, 5].includes(risk.likelihood) || ![1, 2, 3, 4, 5].includes(risk.impact) || !risk.evidenceIds.length || risk.evidenceIds.some((id) => !c.evidence?.some((entry) => entry.id === id)))) throw new Error('请核对风险评分、预计人天和关联依据。')
  if (!c.items.length) throw new Error('请至少添加一个拟开展的审计项目。')
  if (new Set(c.items.map((item) => item.id)).size !== c.items.length) throw new Error('项目清单存在重复编号，请重新核对。')
  for (const item of c.items) {
    if (![item.name, item.subject, item.period, item.start, item.end, item.owner, item.scope].every((value) => value.trim())) throw new Error(`请补全“${item.name || '未命名项目'}”的对象、期间、实施时间、负责人和范围。`)
    if (item.start > item.end || !item.start.startsWith(`${plan.year}-`) || !item.end.startsWith(`${plan.year}-`)) throw new Error(`“${item.name}”的实施时间应在计划年度内，且开始日期不得晚于结束日期。`)
    if (!Number.isFinite(item.workdays) || item.workdays <= 0) throw new Error(`“${item.name}”的计划工时须大于零。`)
  }
}

export function saveContent(plan: AnnualPlan, content: PlanContent, actor: PlanActor): AnnualPlan {
  if (!canEditPlan(plan, actor)) throw new Error('仅编制人可修改编制中或已退回的计划；批准后的计划请先发起调整。')
  return { ...plan, content: copy(content), updatedAt: now() }
}

export function submitPlan(plan: AnnualPlan, actor: PlanActor): AnnualPlan {
  if (!canEditPlan(plan, actor)) throw new Error('当前状态或身份不能提交计划。')
  validateContent(plan)
  const submission: PlanSubmission = {
    version: plan.submissions.length + 1,
    content: copy(plan.content), submittedAt: now(), submittedBy: copy(actor), reason: plan.adjustmentReason,
    steps: plan.recordingMode ? (plan.content.reviewStages ?? []).map((name, index) => ({ name, actor: { id: `record-${index}`, name: '待登记' }, status: index === 0 ? '待处理' : '待流转', opinion: '', at: '' })) : [
      { name: '部门复核', actor: copy(plan.content.reviewer), status: '待处理', opinion: '', at: '' },
      { name: '授权批准', actor: copy(plan.content.approver), status: '待流转', opinion: '', at: '' },
    ],
  }
  return { ...plan, status: '审批中', submissions: [...plan.submissions, submission], updatedAt: now() }
}

export function decidePlan(plan: AnnualPlan, actor: PlanActor, decision: '通过' | '退回', opinion: string, reference = ''): AnnualPlan {
  if (plan.status !== '审批中') throw new Error('该计划不在审批中，不能重复办理。')
  const latest = plan.submissions.at(-1)
  const index = latest?.steps.findIndex((step) => step.status === '待处理') ?? -1
  if (!latest || index < 0 || (!plan.recordingMode && (latest.steps[index].actor.id !== actor.id || actor.id === plan.creator.id))) throw new Error('仅当前节点的指定处理人可以办理。')
  if (!opinion.trim()) throw new Error('请填写审批意见。')
  if (plan.recordingMode && !reference.trim()) throw new Error('请填写会议、决议或审核记录编号。')
  const next = copy(latest)
  next.steps[index] = { ...next.steps[index], actor: plan.recordingMode ? copy(actor) : next.steps[index].actor, status: decision, opinion: opinion.trim(), reference: reference.trim(), at: now() }
  if (decision === '通过' && index + 1 < next.steps.length) next.steps[index + 1].status = '待处理'
  const passed = next.steps.every((step) => step.status === '通过')
  return {
    ...plan, status: decision === '退回' ? '已退回' : passed ? '已批准' : '审批中',
    submissions: [...plan.submissions.slice(0, -1), next],
    approved: passed ? copy(next) : plan.approved, updatedAt: now(),
  }
}

export function adjustPlan(plan: AnnualPlan, actor: PlanActor, reason: string): AnnualPlan {
  if (plan.status !== '已批准' || (!plan.recordingMode && actor.id !== plan.creator.id)) throw new Error('仅编制人可对已批准计划发起调整。')
  if (!reason.trim()) throw new Error('请填写计划调整原因。')
  return { ...plan, status: '编制中', adjustmentReason: reason.trim(), updatedAt: now() }
}

export function describeChanges(before: PlanContent | undefined, after: PlanContent): string[] {
  if (!before) return ['首次编制年度审计计划']
  const changes: string[] = []
  for (const [key, label] of [['evidence', '编制依据资料'], ['risks', '风险评估'], ['reviewStages', '审议安排'], ['capacity', '资源预算']] as const) {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) changes.push(`调整${label}`)
  }
  for (const [key, label] of [['name', '计划名称'], ['department', '编制部门'], ['basis', '编制依据'], ['objective', '总体目标'], ['reviewer', '复核人'], ['approver', '批准人']] as const) {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) changes.push(`调整${label}`)
  }
  after.items.forEach((item) => {
    const old = before.items.find((entry) => entry.id === item.id)
    if (!old) changes.push(`新增项目：${item.name}`)
    else {
      const fields = [['name', '项目名称'], ['type', '审计类型'], ['subject', '审计对象'], ['period', '审计期间'], ['start', '实施开始'], ['end', '实施结束'], ['owner', '负责人'], ['workdays', '计划人天'], ['scope', '目标与范围'], ['risk', '风险主题']] as const
      const differences = fields.filter(([key]) => old[key] !== item[key]).map(([key, label]) => `${label}：${old[key]} → ${item[key]}`)
      if (differences.length) changes.push(`调整项目：${item.name}（${differences.join('；')}）`)
    }
  })
  before.items.filter((item) => !after.items.some((entry) => entry.id === item.id)).forEach((item) => changes.push(`取消项目：${item.name}`))
  return changes.length ? changes : ['计划内容未变更']
}
