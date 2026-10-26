import { plans, tasks } from './mock'
import { historicalAuditProjects } from './annualPlanning'
import { demoHistoryProjects } from './auditDemoHistory'
import type { ProjectResourceRef } from './resourceModel'
import type { AuditProgram, ArchiveSnapshot, Communication, ReportSection, WorkEvent } from './projectWork'

export type AuditProjectType = '财务审计' | '工程审计' | '经济责任审计'
export type ProjectStage = '准备中' | '实施中' | '报告中' | '整改跟踪' | '已归档'

export interface ProjectPlanLink {
  id: string
  annualPlanId: string
  itemId: string
  year: number
  version: number
  itemName: string
  sourceSnapshot?: { name: string; subject: string; scope: string; period: string; start: string; end: string; workdays: number }
  scope: string
  deliverable: string
  owner: string
  linkedAt: string
  linkedBy: string
}

export interface ProjectPreparation {
  version?: number
  status?: '草稿' | '待审核' | '已批准'
  changeReason?: string
  notificationNo?: string
  deliveredAt?: string
  history?: WorkEvent[]
  objective: string
  procedures: string
  members: string
  reviewer: string
  notice: string
  confirmedAt?: string
}

export interface ProjectAuditReport {
  version?: number
  sections?: ReportSection[]
  findingIds?: string[]
  communications?: Communication[]
  versions?: { version: number; title: string; content: string; at: string; by: string }[]
  title: string
  content: string
  status: '草稿' | '待复核' | '已复核' | '已签发'
  history: { action: string; by: string; at: string }[]
}

export interface AuditProject {
  programs?: AuditProgram[]
  preparationVersions?: { version: number; content: ProjectPreparation; programs: AuditProgram[]; at: string }[]
  archiveSnapshot?: ArchiveSnapshot
  archiveCandidate?: ArchiveSnapshot
  archivePending?: boolean
  closedAt?: string
  id: string
  planId?: string
  resourceRefs?: ProjectResourceRef[]
  managementYear?: number
  sourceType?: '年度计划' | '临时授权' | '历史导入'
  authorization?: string
  executionLinks?: ProjectPlanLink[]
  preparation?: ProjectPreparation
  auditReport?: ProjectAuditReport
  archivedAt?: string
  archiveNote?: string
  name: string
  type: AuditProjectType
  subject: string
  period: string
  plannedImplementation: string
  actualImplementation?: string
  owner: string
  stage: ProjectStage
  risk: string
  scope: string
  scenario: 'finance' | 'engineering' | 'economic'
  taskIds: string[]
  notes: string[]
  todoItems: AuditProjectTodo[]
  draftItems: AuditProjectDraft[]
  currentRevision: number
}

export interface AuditProjectTodo {
  id: string
  title: string
  summary: string
  status: '待处理' | '已完成'
  owner: string
  createdAt: string
  source: '智能助手' | '智能体'
}

export interface AuditProjectDraft {
  id: string
  title: string
  summary: string
  kind: string
  acceptedBy: string
  acceptedAt: string
}

const projectTypeForPlan = (planId: string, name: string): AuditProjectType => {
  if (planId === 'PL-2026-008' || planId === 'PL-2026-058') return '工程审计'
  if (/经济责任|负责人履职/.test(name)) return '经济责任审计'
  return '财务审计'
}

const projectScenario = (type: AuditProjectType): AuditProject['scenario'] => {
  if (type === '工程审计') return 'engineering'
  if (type === '经济责任审计') return 'economic'
  return 'finance'
}

const projectStage = (status: string, linkedTaskIds: string[]): ProjectStage => {
  if (/归档|已完成/.test(status)) return '已归档'
  if (/整改/.test(status)) return '整改跟踪'
  if (/报告/.test(status)) return '报告中'
  if (linkedTaskIds.length) return '实施中'
  return '准备中'
}

const fromPlan = (plan: (typeof plans)[number]): AuditProject => {
  const linkedTasks = tasks.filter((task) => task.planId === plan.id)
  const type = projectTypeForPlan(plan.id, plan.name)
  return {
    id: `AUD-${plan.id}`,
    planId: plan.id,
    name: plan.name.replace(/内控检查|检查计划/g, '审计项目').replace(/综合核查计划/g, '综合审计项目'),
    type,
    subject: plan.unit,
    period: plan.period,
    plannedImplementation: plan.period,
    actualImplementation: linkedTasks.some((task) => task.status === '进行中') ? plan.period : undefined,
    owner: plan.owner,
    stage: projectStage(plan.status, linkedTasks.map((task) => task.id)),
    risk: plan.riskTheme,
    scope: plan.objective,
    scenario: projectScenario(type),
    taskIds: linkedTasks.map((task) => task.id),
    notes: linkedTasks.flatMap((task) => task.blockers),
    todoItems: [],
    draftItems: [],
    currentRevision: 1,
  }
}

const seedProjects: AuditProject[] = [
  ...demoHistoryProjects,
  ...historicalAuditProjects,
  ...plans.map(fromPlan),
  {
    id: 'AUD-ECON-2026-001',
    name: '主要负责人任期经济责任审计',
    type: '经济责任审计',
    subject: '运营管理部 / 王某任职事项',
    period: '2023-01-01 至 2025-12-31',
    plannedImplementation: '2026-10-01 至 2026-11-15',
    owner: '张衡',
    stage: '实施中',
    risk: '重大决策与资产管理',
    scope: '围绕任职期间职责、重大经济事项决策、资金资产管理和历史审计整改开展审计。',
    scenario: 'economic',
    taskIds: [],
    notes: ['待分别登记被审计人员与所在单位的意见回执。'],
    todoItems: [],
    draftItems: [],
    currentRevision: 1,
  },
]

export const auditProjects = seedProjects

export function getAuditProject(projectId?: string) {
  return auditProjects.find((project) => project.id === projectId)
}

export function getProjectTypeLabel(type: AuditProjectType) {
  return type
}

