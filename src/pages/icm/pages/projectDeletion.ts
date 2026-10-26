import { useAuditProjectStore } from '../store/auditProjectStore'
import { useAnnualPlanStore } from '../store/annualPlanStore'
import { useTaskDispatchStore } from '../store/taskDispatchStore'
import { useWorkpaperStore } from '../store/workpaperStore'
import { useProjectDocumentStore } from '../store/projectDocumentStore'
import { useWorkflowStore } from '../store/workflowStore'
import { useAgentRuntimeStore } from '../agents/store'
import { issueProjectId, legacyPaperOwners } from './projectScope'
import { canViewProject } from './workplaceMetrics'

export function projectDeletionBlockers(id: string): string[] {
  const p = useAuditProjectStore.getState().projects.find(p => p.id === id)
  if (!p) return ['项目不存在或已删除。']
  const reasons: string[] = []
  if (p.stage !== '准备中' || p.archivedAt || p.archivePending || p.closedAt) reasons.push('项目已进入实施或后续阶段，需保留完整业务记录。')
  const workflow = useWorkflowStore.getState(), docs = useProjectDocumentStore.getState()
  if (p.preparation?.confirmedAt || p.preparation?.status === '待审核' || p.preparationVersions?.length || workflow.audits.some(a => a.projectId === id)) reasons.push('存在方案批准版本或审核记录。')
  if (p.taskIds.length || useTaskDispatchStore.getState().tasks.some(t => t.projectId === id)) reasons.push('已关联执行任务。')
  if (useWorkpaperStore.getState().papers.some(p => (p.projectId ?? legacyPaperOwners[p.id]) === id)) reasons.push('已形成审计底稿。')
  if ([...docs.demands, ...docs.evidences, ...docs.files].some(d => d.projectId === id)) reasons.push('已登记资料需求、证据或原始文件。')
  if (workflow.issues.some(i => issueProjectId(i) === id)) reasons.push('已登记审计发现或关联整改事项。')
  if (p.auditReport) reasons.push('已建立审计报告。')
  if (useAgentRuntimeStore.getState().runs.some(r => r.projectId === id)) reasons.push('已关联智能体运行记录。')
  return reasons
}

export function deleteDraftProject(id: string, actor: { id: string; name: string }) {
  const p = useAuditProjectStore.getState().projects.find(p => p.id === id)
  if (!p || !canViewProject(p, actor)) throw new Error('当前项目不存在或不可访问。')
  const reasons = projectDeletionBlockers(id)
  if (reasons.length) throw new Error(reasons.join(' '))
  useAuditProjectStore.getState().removeProject(id, actor.name)
  // Only detach live execution pointers; approved plan content and its versions remain.
  useAnnualPlanStore.setState(state => ({ plans: state.plans.map(plan => plan.content.items.some(item => item.projectId === id) ? { ...plan, content: { ...plan.content, items: plan.content.items.map(item => item.projectId === id ? { ...item, projectId: undefined } : item) } } : plan) }))
}
