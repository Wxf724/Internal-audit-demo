import type { AuditProject } from '../data/auditProjects'
import type { AnnualPlan } from '../pages/annual-plan/model'

// One-time, explicitly requested removal of the test project named "1".
// This migration is scoped to this exact ID; normal deletion guards stay intact.
export const REQUESTED_PROJECT_REMOVAL = 'AUD-2026-8971CF5D'
export interface DeletedProjectRecord {
  project: AuditProject
  deletedAt: string
  deletedBy: string
  reason?: string
}

export function applyRequestedProjectRemoval<T extends { projects?: AuditProject[]; deletedProjects?: DeletedProjectRecord[] }>(saved: T, at: string): T {
  const project = saved.projects?.find((item) => item.id === REQUESTED_PROJECT_REMOVAL)
  if (!project) return saved
  const deletedProjects = saved.deletedProjects ?? []
  return {
    ...saved,
    projects: saved.projects!.filter((item) => item.id !== REQUESTED_PROJECT_REMOVAL),
    deletedProjects: deletedProjects.some((entry) => entry.project.id === project.id) ? deletedProjects : [
      ...deletedProjects,
      { project: structuredClone(project), deletedAt: at, deletedBy: '用户指定清理', reason: '按用户指定编号移除测试项目；方案、版本和执行关联保留在此快照，审核与智能体记录保留在原台账。' },
    ],
  }
}

export function detachRequestedProject(plans: AnnualPlan[] | undefined, deletedProjects: DeletedProjectRecord[]): AnnualPlan[] | undefined {
  if (!plans || !deletedProjects.some((entry) => entry.project.id === REQUESTED_PROJECT_REMOVAL)) return plans
  return plans.map((plan) => plan.content.items.some((item) => item.projectId === REQUESTED_PROJECT_REMOVAL)
    ? { ...plan, content: { ...plan.content, items: plan.content.items.map((item) => item.projectId === REQUESTED_PROJECT_REMOVAL ? { ...item, projectId: undefined } : item) } }
    : plan)
}
