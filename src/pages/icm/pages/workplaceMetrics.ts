import type { AuditProject } from '../data/auditProjects'
import type { WorkflowIssue, WorkflowRectification } from '../store/workflowStore'

/** 按本地自然日计算，截止日当天不算逾期；缺失或非法日期不参与统计。 */
export function daysUntil(deadline: string, now = new Date()): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(deadline)) return null
  const [year, month, day] = deadline.split('-').map(Number)
  const due = new Date(Date.UTC(year, month - 1, day))
  if (due.getUTCFullYear() !== year || due.getUTCMonth() !== month - 1 || due.getUTCDate() !== day) return null
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  return (due.getTime() - today) / 86400000
}

export const isOpenIssue = (issue: WorkflowIssue) => issue.status !== '已关闭' && !issue.mergedIntoId
export const isActiveProject = (project: AuditProject) => ['准备中', '实施中', '报告中'].includes(project.stage)
export const canViewProject = (project: AuditProject, role: { id: string; name: string }) => role.id !== 'auditor' || project.owner === role.name || project.taskIds.length > 0
export const isUnfinishedRectification = (rect: WorkflowRectification) => rect.status !== '已整改' && rect.status !== '已销号'
export function isOverdueRectification(rect: WorkflowRectification, now = new Date()) {
  const days = daysUntil(rect.deadline, now)
  return isUnfinishedRectification(rect) && days !== null && days < 0
}

/** 同一业务先出现的审核记录优先，避免状态推导的办理事项再次计数。 */
export function uniqueWorkItems<T extends { sourceId: string }>(items: T[]): T[] {
  const seen = new Set<string>()
  return items.filter((item) => {
    if (seen.has(item.sourceId)) return false
    seen.add(item.sourceId)
    return true
  })
}
