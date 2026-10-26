import type { AuditProject } from '../data/auditProjects'
import type { WorkflowIssue, WorkflowRectification } from '../store/workflowStore'
import { isActiveProject, isOpenIssue } from './workplaceMetrics'

export interface AnalyticsItem { name: string; value: number; route: string }

/** projects 由调用方按角色过滤，与首页指标、项目台账共用同一范围。 */
export function buildHomeAnalytics(projects: AuditProject[], issues: WorkflowIssue[], rectifications: WorkflowRectification[]) {
  const active = projects.filter(isActiveProject)
  const validIssues = issues.filter((issue) => !issue.mergedIntoId)
  const levels = ['重大', '重要', '一般']
  const stages: AnalyticsItem[] = ['准备中', '实施中', '报告中', '整改跟踪', '已归档'].map((name) => ({
    name, value: projects.filter((project) => project.stage === name).length, route: `/projects?stage=${encodeURIComponent(name)}`,
  }))
  const types: AnalyticsItem[] = ['财务审计', '工程审计', '经济责任审计'].map((name) => ({
    name, value: active.filter((project) => project.type === name).length, route: `/projects?stage=active&type=${encodeURIComponent(name)}`,
  }))
  const issueSeries = [{ name: '待闭环', status: 'open' }, { name: '已关闭', status: '已关闭' }].map((group) => ({
    name: group.name,
    items: levels.map((name) => ({ name, value: validIssues.filter((issue) => issue.level === name && (group.status === 'open' ? isOpenIssue(issue) : issue.status === '已关闭')).length, route: `/issues?scope=unmerged&level=${encodeURIComponent(name)}&status=${encodeURIComponent(group.status)}` })),
  }))
  const rectStages: AnalyticsItem[] = ['待方案审批', '整改中', '已整改', '已销号'].map((name) => ({
    name, value: rectifications.filter((rect) => rect.status === name).length, route: `/rectify?status=${encodeURIComponent(name)}`,
  }))
  const closed = rectStages.find((item) => item.name === '已销号')!.value
  return { stages, types, issueSeries, rectStages, projectTotal: projects.length, activeTotal: active.length, issueTotal: validIssues.length, rectTotal: rectifications.length, closed, closeRate: rectifications.length ? Math.round(closed / rectifications.length * 100) : null }
}
