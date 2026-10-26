import type { AuditProject } from '../../data/auditProjects'
import type { WorkflowIssue, WorkflowRectification } from '../../store/workflowStore'
import type { AnnualPlan, PlanningRisk } from '../annual-plan/model'
import { linkedProjects, projectYear, isCarryover } from '../projectRelations'

export const STAGES = ['准备中', '实施中', '报告中', '整改跟踪', '已归档']
export const LEVELS = ['重大', '重要', '一般']
export const RECT_STAGES = ['待方案审批', '整改中', '已整改', '已销号']
export interface AnalyticsFilter { year: number; unit: string; type: string; period: string; stage: string }
export interface AnalyticsRow { id: string; name: string; unit: string; status: string; detail: string; route: string; kind: '计划' | '项目' | '问题' | '整改' | '风险' }
export interface AnalyticsInput { plans: AnnualPlan[]; projects: AuditProject[]; issues: WorkflowIssue[]; rectifications: WorkflowRectification[]; today: string }
export function validDate(value?: string): string | undefined {
  const date = value?.match(/\d{4}-\d{2}-\d{2}/)?.[0]
  if (!date) return undefined
  const parsed = new Date(`${date}T00:00:00Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date ? date : undefined
}
export const overdueDays = (deadline: string, today: string) => {
  const date = validDate(deadline)
  return date ? Math.max(0, Math.floor((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${date}T00:00:00Z`)) / 86400000)) : null
}
export function periodMonths(period: string) {
  if (/^Q[1-4]$/.test(period)) return Array.from({ length: 3 }, (_, i) => (Number(period[1]) - 1) * 3 + i + 1)
  return /^(0[1-9]|1[0-2])$/.test(period) ? [Number(period)] : Array.from({ length: 12 }, (_, i) => i + 1)
}
function overlaps(start: string | undefined, end: string | undefined, filter: AnalyticsFilter) {
  if (filter.period === 'all') return true
  const months = periodMonths(filter.period)
  if (!start || !end) return false
  const from = `${filter.year}-${String(months[0]).padStart(2, '0')}-01`
  const to = new Date(Date.UTC(filter.year, months.at(-1)!, 0)).toISOString().slice(0, 10)
  return start <= to && end >= from
}
export const signedDate = (p: AuditProject) => p.auditReport?.status === '已签发' ? validDate(p.auditReport.history.find((e) => e.action === '签发报告')?.at ?? p.auditReport.versions?.at(-1)?.at) : undefined
export const isConfirmed = (i: WorkflowIssue) => !i.mergedIntoId && ['整改中', '已整改', '已关闭'].includes(i.status)
export function buildAnalytics(input: AnalyticsInput, filter: AnalyticsFilter) {
  const { plans, projects, issues, rectifications, today } = input
  const plan = plans.find((p) => p.year === filter.year)
  const planning = filter.year > Number(today.slice(0, 4)) && !plan?.approved
  const content = planning ? plan?.content : plan?.approved?.content
  const baseProjects = projects.filter((p) => projectYear(p) === filter.year || p.executionLinks?.some((l) => l.year === filter.year) || isCarryover(p, filter.year))
  const scopedProjects = baseProjects.filter((p) => {
    const dates = p.plannedImplementation.match(/\d{4}-\d{2}-\d{2}/g) ?? []
    return (!filter.unit || p.subject === filter.unit) && (!filter.type || p.type === filter.type) && (!filter.stage || p.stage === filter.stage) && overlaps(validDate(dates[0]), validDate(dates.at(-1)), filter)
  })
  const projectIds = new Set(scopedProjects.map((p) => p.id))
  const projectById = new Map(projects.map((p) => [p.id, p]))
  const scopedIssues = issues.filter((i) => !i.mergedIntoId && i.projectId && projectIds.has(i.projectId))
  const confirmed = scopedIssues.filter(isConfirmed)
  const scopedIssueIds = new Set(scopedIssues.map((i) => i.id))
  const rects = rectifications.filter((r) => scopedIssueIds.has(r.issueId))
  const issueById = new Map(issues.map((i) => [i.id, i]))
  const planItems = (content?.items ?? []).filter((i) => (!filter.unit || i.subject === filter.unit) && (!filter.type || i.type === filter.type) && overlaps(validDate(i.start), validDate(i.end), filter) && (!filter.stage || Boolean(plan && linkedProjects(plan, i, scopedProjects).length)))
  const arranged = planItems.filter((i) => plan && linkedProjects(plan, i, projects).length)
  const riskType = (r: PlanningRisk) => r.domain === '工程' ? '工程审计' : r.domain === '经济责任' ? '经济责任审计' : '财务审计'
  const risks = [...new Map([...(plan?.conversation?.riskLibrary ?? []), ...(plan?.content.risks ?? [])].map((r) => [r.id, r])).values()].filter((r) => (!filter.unit || r.subject === filter.unit) && (!filter.type || riskType(r) === filter.type))
  const coveredRisks = risks.filter((r) => planItems.some((i) => i.riskId === r.id))
  const highRisks = risks.filter((r) => r.likelihood * r.impact >= 20), requiredRisks = risks.filter((r) => r.required)
  const projectRow = (p: AuditProject): AnalyticsRow => ({ id: p.id, name: p.name, unit: p.subject, status: p.stage, detail: `${p.type} · ${p.plannedImplementation}`, route: `/projects/${encodeURIComponent(p.id)}`, kind: '项目' })
  const issueRow = (i: WorkflowIssue): AnalyticsRow => ({ id: i.id, name: i.title, unit: projectById.get(i.projectId ?? '')?.subject ?? '未关联项目', status: i.status, detail: `${i.gradedLevel ?? i.level} · 责任人/部门：${i.owner}`, route: `/issues?issue=${encodeURIComponent(i.id)}`, kind: '问题' })
  const rectRow = (r: WorkflowRectification): AnalyticsRow => ({ id: r.id, name: r.title, unit: projectById.get(issueById.get(r.issueId)?.projectId ?? '')?.subject ?? '未关联项目', status: r.status === '已整改' ? '已整改待复核' : r.status, detail: `期限 ${r.deadline} · ${r.owner}${(overdueDays(r.deadline, today) ?? 0) > 0 && r.status !== '已销号' ? ` · 逾期 ${overdueDays(r.deadline, today)} 天` : ''}`, route: `/rectify?rect=${encodeURIComponent(r.id)}`, kind: '整改' })
  const itemRows: AnalyticsRow[] = planItems.map((i) => ({ id: i.id, name: i.name, unit: i.subject, status: planning ? '编制草案' : arranged.includes(i) ? '已安排执行' : '待安排', detail: `${i.start} 至 ${i.end} · ${i.workdays} 人天`, route: `/plan-workbench?year=${filter.year}&view=gantt&peek=${encodeURIComponent(i.id)}`, kind: '计划' }))
  const riskRows: AnalyticsRow[] = risks.map((r) => ({ id: r.id, name: r.title, unit: r.subject, status: coveredRisks.includes(r) ? '拟纳入' : '待评估', detail: `风险评分 ${r.likelihood} × ${r.impact} = ${r.likelihood * r.impact}${r.required ? ' · 必审' : ''} · 预计 ${r.workdays} 人天`, route: `/plan-workbench?annual=${plan?.id}&tab=compose`, kind: '风险' }))
  const rows = { plans: itemRows, projects: scopedProjects.map(projectRow), issues: confirmed.map(issueRow), rects: rects.map(rectRow), risks: riskRows }
  const major = confirmed.filter((i) => (i.gradedLevel ?? i.level) === '重大' && i.status !== '已关闭')
  const overdue = rects.filter((r) => r.status !== '已销号' && (overdueDays(r.deadline, today) ?? 0) > 0)
  const closed = rects.filter((r) => r.status === '已销号')
  const active = scopedProjects.filter((p) => ['准备中', '实施中', '报告中'].includes(p.stage))
  const signed = scopedProjects.filter((p) => p.auditReport?.status === '已签发')
  const groups = STAGES.map((name) => ({ name, rows: scopedProjects.filter((p) => p.stage === name).map(projectRow) }))
  const rectGroups = RECT_STAGES.map((name) => ({ name: name === '已整改' ? '已整改待复核' : name, rows: rects.filter((r) => r.status === name).map(rectRow) }))
  const aging = [[1, 30], [31, 60], [61, 90], [91, Infinity]].map(([min, max]) => ({ name: max === Infinity ? '90 天以上' : `${min}–${max} 天`, rows: overdue.filter((r) => { const d = overdueDays(r.deadline, today)!; return d >= min && d <= max }).map(rectRow) }))
  const matrix = [...new Set(scopedProjects.map((p) => p.subject))].map((unit) => ({ unit, cells: LEVELS.map((level) => confirmed.filter((i) => projectById.get(i.projectId!)?.subject === unit && (i.gradedLevel ?? i.level) === level).map(issueRow)) })).sort((a, b) => b.cells.flat().length - a.cells.flat().length || a.unit.localeCompare(b.unit, 'zh'))
  const months = Array.from({ length: 12 }, (_, n) => {
    const prefix = `${filter.year}-${String(n + 1).padStart(2, '0')}`
    return { name: `${n + 1}月`, month: n + 1, planned: planItems.filter((i) => i.start.startsWith(prefix)).length, started: scopedProjects.filter((p) => validDate(p.actualImplementation)?.startsWith(prefix)).length, signed: signed.filter((p) => signedDate(p)?.startsWith(prefix)).length, due: rects.filter((r) => validDate(r.deadline)?.startsWith(prefix)).length, closed: closed.filter((r) => validDate(r.closeOutAt)?.startsWith(prefix)).length }
  })
  const unknownIssues = issues.filter((i) => !i.mergedIntoId && (!i.projectId || !projectById.has(i.projectId)))
  const orphanRects = rectifications.filter((r) => !issueById.has(r.issueId))
  const unlinkedRows = [...unknownIssues.map(issueRow), ...orphanRects.map(rectRow)]
  const missingDates = [...active.filter((p) => p.stage !== '准备中' && !validDate(p.actualImplementation)), ...signed.filter((p) => !signedDate(p))].map(projectRow)
  const quality = [...new Map([...unlinkedRows, ...missingDates, ...closed.filter((r) => !validDate(r.closeOutAt)).map(rectRow)].map((r) => [`${r.kind}:${r.id}`, r])).values()]
  const latePlans = planItems.filter((i) => plan?.approved && validDate(i.start) && i.start < today && !arranged.includes(i))
  const focus: AnalyticsRow[] = planning ? riskRows.filter((r) => r.status === '待评估').sort((a, b) => Number(b.detail.includes('必审')) - Number(a.detail.includes('必审'))) : [...major.map(issueRow), ...overdue.sort((a, b) => (overdueDays(b.deadline, today) ?? 0) - (overdueDays(a.deadline, today) ?? 0)).map(rectRow), ...itemRows.filter((r) => latePlans.some((p) => p.id === r.id)), ...rects.filter((r) => r.status === '已整改' && !overdue.includes(r)).map(rectRow)]
  const workload = planItems.reduce((sum, i) => sum + i.workdays, 0), capacity = content?.capacity ?? null
  const metric = (id: string, label: string, value: string | number, unit: string, detail: string, metricRows: AnalyticsRow[], tone = 'blue') => ({ id, label, value, unit, detail, rows: metricRows, tone })
  const metrics = planning ? [
    metric('plans', '拟纳入计划', planItems.length, '项', '当前年度草案，未计入执行统计', rows.plans),
    metric('risks', '高风险拟覆盖', `${highRisks.filter((r) => coveredRisks.includes(r)).length}/${highRisks.length}`, '项', '风险评分不低于 20 的事项', riskRows.filter((r) => highRisks.some((h) => h.id === r.id)), 'amber'),
    metric('required', '必审事项拟覆盖', `${requiredRisks.filter((r) => coveredRisks.includes(r)).length}/${requiredRisks.length}`, '项', '年度风险与必审需求清单', riskRows.filter((r) => requiredRisks.some((h) => h.id === r.id))),
    metric('days', '计划投入', workload, '人天', '草案计划投入，不代表实际工时', rows.plans),
    metric('capacity', '年度可用预算', capacity ?? '—', '人天', '年度资源台账上限', rows.plans),
    metric('remaining', '未分配预算', capacity === null ? '—' : capacity - (content?.items.reduce((sum, i) => sum + i.workdays, 0) ?? 0), '人天', '全年度预算减去全年度草案投入，不受单位筛选影响', rows.plans, capacity !== null && workload > capacity ? 'red' : 'green'),
  ] : [
    metric('plans', '已批准计划项', planItems.length, '项', '最新批准版本；调整草案不计入', rows.plans),
    metric('arranged', '计划安排率', planItems.length ? Math.round(arranged.length / planItems.length * 100) : '—', '%', `${arranged.length} / ${planItems.length} 项；一个计划项只计一次`, itemRows.filter((r) => arranged.some((i) => i.id === r.id))),
    metric('active', '在审项目', active.length, '个', '准备中、实施中和报告中的执行项目', active.map(projectRow)),
    metric('signed', '已签发报告', signed.length, '份', '按项目当前已签发审计报告去重', signed.map(projectRow), 'green'),
    metric('major', '重大未关闭问题', major.length, '项', '已确认、未关闭、未合并的重大问题', major.map(issueRow), 'red'),
    metric('overdue', '逾期未销号整改', overdue.length, '项', `截至 ${today}；已整改待复核仍单独跟踪`, overdue.map(rectRow), 'amber'),
  ]
  return { plan, planning, content, metrics, rows, groups, rectGroups, aging, matrix, months, focus, risks, coveredRisks, capacity, workload, quality, unlinkedRows, pendingIssues: scopedIssues.filter((i) => !isConfirmed(i)).map(issueRow), closedCount: closed.length, closeRate: rects.length ? Math.round(closed.length / rects.length * 100) : null, sourceCounts: ['年度计划', '临时授权', '历史导入'].map((name) => ({ name, value: scopedProjects.filter((p) => (p.sourceType ?? (p.planId ? '年度计划' : '历史导入')) === name).length })), units: [...new Set([...baseProjects.map((p) => p.subject), ...(content?.items ?? []).map((i) => i.subject), ...(plan?.content.risks ?? []).map((r) => r.subject)])].sort((a, b) => a.localeCompare(b, 'zh')) }
}
export type AnalyticsData = ReturnType<typeof buildAnalytics>
