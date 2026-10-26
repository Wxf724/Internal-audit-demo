import type { AuditProject } from '../../data/auditProjects'
import type { WorkflowRectification } from '../../store/workflowStore'
import type { AnnualPlan } from './model'
import type { PlanResource, ResourceCategory } from './conversationTypes'
import { businessContent, isFinished, resolveProject } from './planning'

export const RESOURCE_CATEGORIES: ResourceCategory[] = ['审计对象库', '年度风险评估结果', '资源台账', '监管日历', '上年度结转', '历史审计与整改', '战略与经营重点']

export function getPlanResources(plan: AnnualPlan, plans: AnnualPlan[], projects: AuditProject[], rectifications: WorkflowRectification[]): PlanResource[] {
  const resources: PlanResource[] = []
  const risks = plan.conversation?.riskLibrary ?? plan.content.risks ?? []
  const subjects = [...new Set([...risks.map((risk) => risk.subject), ...projects.map((project) => project.subject)])]
  for (const subject of subjects) {
    const records = projects.filter((project) => project.subject === subject)
    resources.push({ id: `object:${subject}`, category: '审计对象库', name: subject, subject, source: '审计项目库 / 对象索引', version: `关联 ${records.length} 项`, summary: records.length ? records.map((project) => `${project.name}；${project.period}；${project.stage}；编号 ${project.id}`).join('\n') : '已登记风险，尚无关联审计项目。' })
  }
  for (const risk of risks) {
    // Uploaded assessments retain their original file resource and locator.
    if (risk.id.startsWith('risk:')) continue
    resources.push({ id: `risk:${risk.id}`, category: '年度风险评估结果', name: risk.title, subject: risk.subject, source: '年度风险评估台账', version: `${risk.likelihood}×${risk.impact} / ${risk.workdays}人天`, summary: `${risk.subject}；${risk.domain}；风险评分 ${risk.likelihood * risk.impact}；上次审计 ${risk.lastAudit || '待核对'}；建议 ${risk.recommendation}；预计 ${risk.workdays} 人天。`, risk: structuredClone(risk) })
    if (risk.required) resources.push({ id: `calendar:${risk.id}`, category: '监管日历', name: risk.recommendation, subject: risk.subject, source: '内审机构必审需求清单（演示）', version: `${plan.year}年度`, summary: `年度必审事项；${risk.subject}；具体完成期限待确认，尚无额外监管日期依据。`, required: true, risk: structuredClone(risk) })
  }
  const capacity = plan.conversation?.capacityLimit ?? plan.content.capacity ?? 300
  resources.push({ id: `capacity:${plan.id}`, category: '资源台账', name: `${plan.year}年度可用审计人天`, source: '内审机构资源预算', version: `${capacity}人天`, capacity, summary: `可用 ${capacity} 人天；具体专业人员和外部采购额度待机构核对。` })
  const prior = plans.find((entry) => entry.year === plan.year - 1)
  if (prior) for (const item of businessContent(prior).items) {
    const project = resolveProject(prior, item, projects)
    if (!isFinished(project)) resources.push({ id: `carry:${prior.id}/${item.id}`, category: '上年度结转', name: item.name, subject: item.subject, source: `${prior.year}年度计划 / ${project?.id ?? item.id}`, version: project ? `v${project.currentRevision}` : `V${prior.approved?.version ?? 0}`, summary: `${project?.stage ?? '待启动'}；原安排 ${item.start} 至 ${item.end}；原计划 ${item.workdays} 人天。结转及剩余工作量待内审机构确认。`, project: structuredClone(item) })
  }
  for (const record of rectifications) resources.push({ id: `rect:${record.id}`, category: '历史审计与整改', name: record.title, source: `整改台账 / ${record.id}`, version: record.updatedAt, summary: `状态 ${record.status}；进度 ${record.progress}%；截止日期 ${record.deadline}；责任人 ${record.owner}。` })
  for (const evidence of plan.conversation?.evidenceLibrary ?? plan.content.evidence ?? []) {
    if (evidence.id.startsWith('chat:')) continue
    resources.push({ id: `evidence:${evidence.id}`, category: evidence.id === 'strategy' ? '战略与经营重点' : evidence.id === 'mandatory' ? '监管日历' : evidence.id === 'resource' ? '资源台账' : evidence.id === 'risk' ? '年度风险评估结果' : '历史审计与整改', name: evidence.name, source: evidence.source, version: evidence.version, summary: `${evidence.note}\n资料状态：${evidence.status}` })
  }
  return resources
}

export function recommendedResourceIds(resources: PlanResource[]) {
  const subjects = new Set(resources.filter((entry) => entry.risk).map((entry) => entry.subject))
  return resources.filter((entry) => entry.risk || entry.capacity !== undefined || (entry.category === '审计对象库' && subjects.has(entry.subject))).map((entry) => entry.id)
}
