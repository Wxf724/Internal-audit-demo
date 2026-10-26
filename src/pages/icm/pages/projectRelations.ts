import type { AuditProject, ProjectPlanLink } from '../data/auditProjects'
import type { AnnualPlan, AnnualProjectItem } from './annual-plan/model'

export const projectYear = (project: AuditProject) => project.managementYear ?? Number(project.plannedImplementation.match(/\d{4}/)?.[0] ?? project.id.match(/\d{4}/)?.[0])
export const projectSource = (project: AuditProject) => project.sourceType ?? (project.planId ? '年度计划' : '历史导入')

export function linkedProjects(plan: AnnualPlan, item: AnnualProjectItem, projects: AuditProject[]) {
  return projects.filter((p) => p.executionLinks?.some((link) => link.annualPlanId === plan.id && link.itemId === item.id)
    || p.id === item.projectId || p.planId === `${plan.id}/${item.id}`)
}

export function projectLinks(project: AuditProject, plans: AnnualPlan[]): ProjectPlanLink[] {
  const links = [...(project.executionLinks ?? [])]
  for (const plan of plans) for (const item of (plan.approved?.content ?? plan.content).items) {
    if ((item.projectId === project.id || project.planId === `${plan.id}/${item.id}`)
      && !links.some((link) => link.annualPlanId === plan.id && link.itemId === item.id)) {
      // Legacy links have no frozen approval snapshot. Do not invent an approved version.
      links.push({ id: `legacy-${plan.id}-${item.id}`, annualPlanId: plan.id, itemId: item.id, year: plan.year, version: 0, itemName: item.name, scope: item.scope, deliverable: '待确认执行成果与验收口径', owner: item.owner, linkedAt: '', linkedBy: '历史关联' })
    }
  }
  return links
}

export function itemExecutionStatus(plan: AnnualPlan, item: AnnualProjectItem, projects: AuditProject[]) {
  const linked = linkedProjects(plan, item, projects)
  if (!linked.length) return plan.approved ? '待安排' : '拟纳入'
  if (linked.every((p) => p.auditReport?.status === '已签发' || ['已归档', '整改跟踪'].includes(p.stage))) return '待验收'
  return linked.some((p) => p.stage !== '准备中') ? '执行中' : '已安排'
}

export function isCarryover(project: AuditProject, year: number) {
  const start = projectYear(project)
  const end = Number(project.plannedImplementation.match(/\d{4}/g)?.at(-1) ?? start)
  const archivedYear = Number(project.archivedAt?.slice(0, 4) ?? start)
  return start < year && (end >= year || project.stage === '整改跟踪' || (project.stage !== '已归档' && !project.archivedAt) || archivedYear >= year)
}
