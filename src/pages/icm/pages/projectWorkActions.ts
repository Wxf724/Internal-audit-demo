import { useAuditProjectStore } from '../store/auditProjectStore'
import { useTaskDispatchStore } from '../store/taskDispatchStore'
import { useWorkpaperStore, paperReviewStep } from '../store/workpaperStore'
import { useProjectDocumentStore } from '../store/projectDocumentStore'
import { useWorkflowStore, type WorkflowAudit } from '../store/workflowStore'
import { workEvent, workId, type AuditProgram, type ReportSection } from '../data/projectWork'
import type { ProjectPreparation } from '../data/auditProjects'
import { issueProjectId, legacyPaperOwners } from './projectScope'

export function workProject(id: string) {
  const p = useAuditProjectStore.getState().projects.find((p) => p.id === id)
  if (!p) throw new Error('项目不存在。')
  return p
}
export function workProjectPapers(id: string) { return useWorkpaperStore.getState().papers.filter((p) => (p.projectId ?? legacyPaperOwners[p.id]) === id) }
export function isPaperApproved(p: ReturnType<typeof workProjectPapers>[number]) { return p.reviewState ? p.reviewState === '已复核' : paperReviewStep(p) >= 4 }
export function programComplete(projectId: string, programId: string) {
  const papers = workProjectPapers(projectId).filter((p) => p.programIds?.includes(programId))
  return papers.length > 0 && papers.every(isPaperApproved)
}
function mutable(id: string) { const p = workProject(id); if (p.archivedAt || p.auditReport?.status === '已签发') throw new Error('审计成果已封存，后续整改请在整改跟踪中办理。'); return p }
function requestReview(projectId: string, object: NonNullable<WorkflowAudit['projectObject']>, businessId: string, title: string, actor: string, version: number) {
  const s = useWorkflowStore.getState()
  if (s.audits.some((a) => a.projectObject === object && a.businessId === businessId && a.status === '待处理')) throw new Error('该业务已提交审核。')
  const audit: WorkflowAudit = { id: workId('APR'), type: object === 'preparation' ? '项目方案审核' : object === 'paper' ? '底稿复核' : object === 'archive' ? '项目归档审核' : '报告审核', projectObject: object, projectId, sourceVersion: version, title, businessId, route: `/projects/${projectId}?tab=${object === 'preparation' ? 'preparation' : object === 'paper' ? 'execution&section=papers&paper=' + businessId : object === 'report' ? 'report' : 'archive'}`, applicant: actor, status: '待处理', node: { preparation: '项目方案审核', paper: '底稿复核', report: '项目报告复核', archive: '项目归档审核' }[object], submittedAt: new Date().toISOString() }
  useWorkflowStore.setState({ audits: [...s.audits, audit] }); return audit.id
}
export function savePreparation(id: string, draft: ProjectPreparation, actor: string) {
  const p = mutable(id)
  if (p.preparation?.status === '待审核' || p.preparation?.confirmedAt) throw new Error('请先退回或发起方案变更。')
  useAuditProjectStore.getState().updateProject(id, { preparation: { ...draft, version: draft.version ?? 1, status: '草稿', history: [...(p.preparation?.history ?? []), workEvent('保存方案', actor)] } })
}
export function saveProgram(id: string, input: Omit<AuditProgram, 'id' | 'taskIds'>, existingId?: string) {
  const p = mutable(id)
  if (p.preparation?.confirmedAt || p.preparation?.status === '待审核') throw new Error('请先发起方案变更。')
  if (![input.title, input.risk, input.control, input.criteria, input.method, input.owner, input.reviewer, input.deadline].every((v) => v.trim())) throw new Error('请补全风险、控制、评价标准、方法、人员和期限。')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.deadline)) throw new Error('请填写有效的执行期限。')
  const existing = p.programs?.find((r) => r.id === existingId)
  const row = { ...input, id: existing?.id ?? workId('PRG'), taskIds: existing?.taskIds ?? [] }
  useAuditProjectStore.getState().updateProject(id, { programs: existing ? p.programs!.map((r) => r.id === existingId ? row : r) : [...(p.programs ?? []), row] })
}
export function submitPreparation(id: string, actor: string) {
  const p = mutable(id), d = p.preparation
  if (!d || d.status === '待审核' || d.confirmedAt) throw new Error('请先保存可提交的方案草稿。')
  if (![d.objective, d.procedures, d.members, d.reviewer, d.notice].every((v) => v.trim())) throw new Error('请补全目标与范围、审计方法、人员分工、复核安排和进场安排。通知送达在方案批准后登记。')
  const version = d.version ?? 1
  requestReview(id, 'preparation', id, `${p.name} · 方案 V${version}`, actor, version)
  useAuditProjectStore.getState().updateProject(id, { preparation: { ...d, status: '待审核', history: [...(d.history ?? []), workEvent('提交方案审核', actor)] } })
}
export function revisePreparation(id: string, reason: string, actor: string) {
  const p = mutable(id); if (!p.preparation?.confirmedAt || !reason.trim()) throw new Error('请填写方案变更原因。')
  useAuditProjectStore.getState().updateProject(id, { preparation: { ...p.preparation, version: (p.preparation.version ?? 1) + 1, status: '草稿', confirmedAt: undefined, notificationNo: '', deliveredAt: '', changeReason: reason, history: [...(p.preparation.history ?? []), workEvent('发起方案变更', actor, reason + '；原通知：' + (p.preparation.notificationNo || '未登记') + '；原送达：' + (p.preparation.deliveredAt || '未登记'))] } })
}
export function recordPreparationNotice(id: string, notificationNo: string, deliveredAt: string, actor: string) {
  const p = mutable(id), d = p.preparation
  if (!d?.confirmedAt || d.status !== '已批准') throw new Error('请先完成方案审核，再登记通知送达。')
  if (!notificationNo.trim() || !deliveredAt.trim()) throw new Error('请填写实际通知文号，以及送达日期、接收方和送达方式。')
  useAuditProjectStore.getState().updateProject(id, { preparation: { ...d, notificationNo: notificationNo.trim(), deliveredAt: deliveredAt.trim(), history: [...(d.history ?? []), workEvent('登记通知送达', actor, `V${d.version ?? 1} · ${notificationNo.trim()} · ${deliveredAt.trim()}`)] } })
}
export function arrangeProgramTask(id: string, programIds: string[], existingTaskId?: string) {
  const p = mutable(id)
  if (!p.preparation?.confirmedAt) throw new Error('请先完成方案审核。')
  const programs = (p.programs ?? []).filter((r) => programIds.includes(r.id)); if (!programs.length) throw new Error('请选择程序。')
  const store = useTaskDispatchStore.getState()
  let task = existingTaskId ? store.tasks.find((t) => t.id === existingTaskId && (t.projectId === id || p.taskIds.includes(t.id))) : undefined
  if (existingTaskId && !task) throw new Error('只能关联当前项目的任务。')
  if (!task) {
    const first = programs[0]
    task = { id: workId('TK'), projectId: id, programIds, type: '检查任务', name: programs.map((r) => r.title).join('、'), unit: p.subject, owner: first.owner, reviewer: first.reviewer, start: new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Shanghai' }), end: first.deadline, status: '待启动', progress: 0, outputs: ['审计底稿与执行结论'], blockers: [] }
    store.addTask(task)
  } else useTaskDispatchStore.setState({ tasks: store.tasks.map((t) => t.id !== task!.id ? t : { ...t, programIds: [...new Set([...(t.programIds ?? []), ...programIds])] }) })
  const taskId = task.id
  useAuditProjectStore.getState().updateProject(id, { taskIds: [...new Set([...p.taskIds, taskId])], programs: p.programs!.map((r) => programIds.includes(r.id) ? { ...r, taskIds: [...new Set([...r.taskIds, taskId])] } : r) })
  return taskId
}
export function submitPaper(id: string, actor: string) {
  const paper = useWorkpaperStore.getState().papers.find((p) => p.id === id)
  if (!paper?.projectId) throw new Error('请先明确底稿所属项目。')
  const project = mutable(paper.projectId)
  if (!project.preparation?.confirmedAt) throw new Error('方案尚未批准。')
  if (!['草稿', '退回修改'].includes(paper.reviewState ?? '草稿')) throw new Error('底稿已提交或复核通过。')
  if (![paper.body.procedure, paper.body.facts, paper.body.conclusion].every((s) => s.trim()) || !paper.evidenceIds?.length) throw new Error('请补全执行步骤、事实、结论及证据引用。无异常也需保留测试证据。')
  if (paper.body.conclusion.trim().startsWith('待核实')) throw new Error('请先核实分析线索并填写实际审计结论，不能直接提交模板占位结论。')
  if (paper.type==='待判定') throw new Error('请根据实际测试结论选择问题底稿或合规底稿。')
  if (paper.evidenceIds.some((id) => !useProjectDocumentStore.getState().evidences.some((e) => e.id === id && e.projectId === project.id))) throw new Error('底稿存在其他项目或失效的证据引用。')
  requestReview(project.id, 'paper', id, paper.title, actor, paper.version ?? 1)
  useWorkpaperStore.setState((s) => ({ papers: s.papers.map((p) => p.id !== id ? p : { ...p, reviewState: '待复核', status: '一级复核', history: [...(p.history ?? []), workEvent('提交底稿复核', actor)] }) }))
}
export function findingFromPaper(id: string, actor: string) {
  const paper = useWorkpaperStore.getState().papers.find((p) => p.id === id)
  const projectId = paper?.projectId ?? (paper && legacyPaperOwners[paper.id])
  if (!paper || !projectId || !isPaperApproved(paper)) throw new Error('请先完成底稿复核。')
  const p = mutable(projectId)
  if (paper.type !== '问题底稿') throw new Error('当前底稿记录无异常结论，无需生成问题。')
  const s = useWorkflowStore.getState(), exists = s.issues.find((i) => i.workpaperId === id && issueProjectId(i) === projectId)
  if (exists) return exists.id
  const basis = (p.programs ?? []).filter((r) => paper.programIds?.includes(r.id)).map((r) => r.criteria).join('\n') || (p.resourceRefs ?? []).map((r)=>r.snapshot.title+'（V'+r.version+'）').join('\n')
  const issueId = s.createIssueDraft({ projectId, title: paper.title, level: '一般', owner: p.subject, workpaperId: id, evidenceIds: paper.evidenceIds ?? [], basis })
  s.saveIssueDraft(issueId, { fact: paper.body.facts, basis, rootCause: '', impact: '', suggestion: paper.body.next })
  useWorkflowStore.setState((s) => ({ issues: s.issues.map((i) => i.id === issueId ? { ...i, creator: actor } : i) }))
  useWorkpaperStore.setState((s) => ({ papers: s.papers.map((r) => r.id === id ? { ...r, issueId, history: [...(r.history ?? []), workEvent('形成发现草稿', actor, issueId)] } : r) })); return issueId
}
export function saveProjectReport(id: string, title: string, sections: ReportSection[], actor: string) {
  const p = mutable(id), old = p.auditReport
  if (old && old.status !== '草稿') throw new Error('当前报告已送审，请先退回。')
  if (!title.trim()) throw new Error('请填写报告名称。')
  const content = sections.map((s) => `${s.title}\n${s.content}`).join('\n\n')
  useAuditProjectStore.getState().updateProject(id, { auditReport: { ...old, title, content, sections, status: '草稿', version: (old?.version ?? 0) + 1, history: [...(old?.history ?? []), workEvent('保存报告草稿', actor)] } })
}
export function reportBlockers(id: string) {
  const p = workProject(id), issues = useWorkflowStore.getState().issues.filter((i) => issueProjectId(i) === id && !i.mergedIntoId)
  const blockers: string[] = []
  if (!p.preparation?.confirmedAt) blockers.push('项目方案尚未批准')
  if (!p.preparation?.notificationNo?.trim() || !p.preparation?.deliveredAt?.trim()) blockers.push('请先在方案与分工登记实际通知文号与送达记录')
  const papers = workProjectPapers(id)
  if (!papers.length) blockers.push('尚未形成支持审计结论的底稿')
  else if (papers.some((paper) => !isPaperApproved(paper))) blockers.push('存在尚未完成复核的底稿')
  if (issues.some((i) => ['待确认', '待分级审核', '分级审核不通过', '异议中'].includes(i.status))) blockers.push('存在尚未确认、定级或处理异议的发现')
  if (!p.auditReport?.sections?.length || !p.auditReport.sections.every((s) => s.content.trim())) blockers.push('请补全报告章节；不适用内容请明确说明')
  if (!p.auditReport?.communications?.length || p.auditReport.communications.some((c) => !c.resolvedAt)) blockers.push('请完成报告征求意见并记录采纳结论')
  return blockers
}
export function submitReport(id: string, actor: string) {
  const p = mutable(id); const blockers = reportBlockers(id)
  if (blockers.length) throw new Error(blockers.join('；'))
  if (p.auditReport?.status !== '草稿') throw new Error('报告不在草稿状态。')
  requestReview(id, 'report', id, p.auditReport.title, actor, p.auditReport.version ?? 1)
  useAuditProjectStore.getState().updateProject(id, { auditReport: { ...p.auditReport, status: '待复核', findingIds: useWorkflowStore.getState().issues.filter((i) => issueProjectId(i) === id && !i.mergedIntoId).map((i) => i.id), history: [...p.auditReport.history, workEvent('提交报告复核', actor)] }, stage: '报告中' })
}
export function signReport(id: string, opinion: string, actor: string) {
  const p = mutable(id), r = p.auditReport
  if (r?.status !== '已复核' || !opinion.trim()) throw new Error('请完成报告复核，并填写签发意见。')
  if (reportBlockers(id).length) throw new Error('报告依赖的业务已变化，请重新核对。')
  useAuditProjectStore.getState().updateProject(id, { auditReport: { ...r, status: '已签发', versions: [...(r.versions ?? []), { version: r.version ?? 1, title: r.title, content: r.content, at: new Date().toISOString(), by: actor }], history: [...r.history, workEvent('签发报告', actor, opinion)] }, closedAt: new Date().toISOString(), stage: '整改跟踪' })
}
