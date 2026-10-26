import type { AuditProject } from '../../data/auditProjects'
import { linkedProjects } from '../projectRelations'
import type { AnnualPlan, AnnualProjectItem, PlanContent, PlanningRun } from './model'
import { newId, now } from './model'

export const REVIEW_STAGES = ['内审机构负责人审核', '审计委员会审议', '党委前置研究', '有权机构批准']
export const DEFAULT_REVIEW_STAGES = ['内审机构负责人审核', '有权机构批准']
export const businessContent = (plan: AnnualPlan): PlanContent => plan.approved?.content ?? plan.content
export const resolveProject = (plan: AnnualPlan, item: AnnualProjectItem, projects: AuditProject[]) =>
  linkedProjects(plan, item, projects)[0]
export const projectStatus = (project?: AuditProject, approved = false) => project?.stage ?? (approved ? '待启动' : '拟纳入')
export const isFinished = (project?: AuditProject) => Boolean(project && ['已归档', '整改跟踪'].includes(project.stage))
export const dateRange = (text = '') => text.match(/\d{4}-\d{2}-\d{2}/g) ?? []
export const chinaToday = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Shanghai' })
export function timelinePosition(start: string, end: string, year: number) {
  const origin = Date.UTC(year, 0, 1), limit = Date.UTC(year + 1, 0, 1), day = 86400000
  const from = Date.parse(start), to = Date.parse(end) + day
  if (!Number.isFinite(from) || !Number.isFinite(to) || to <= origin || from >= limit || to <= from) return null
  return { left: `${(Math.max(origin, from) - origin) / (limit - origin) * 100}%`, width: `${(Math.min(limit, to) - Math.max(origin, from)) / (limit - origin) * 100}%` }
}

export function buildPlanningRun(plan: AnnualPlan, projects: AuditProject[], openRectifications: number): PlanningRun {
  const c = plan.content
  const ranked = [...(c.risks ?? [])].sort((a, b) => Number(b.required) - Number(a.required) || b.likelihood * b.impact - a.likelihood * a.impact)
  const missing = (c.evidence ?? []).filter((entry) => entry.status !== '已确认')
  const total = ranked.reduce((sum, risk) => sum + risk.workdays, 0)
  return {
    id: `APR-${newId()}`, at: now(), agents: ['AG01', 'AG02', 'AG06', 'AG04'],
    sources: (c.evidence ?? []).map((entry) => `${entry.name} · ${entry.version} · ${entry.status}`),
    findings: [
      ...missing.map((entry) => `资料待确认：${entry.name}（${entry.version}）。相关建议仅供编制研判。`),
      `整改台账当前有 ${openRectifications} 条未销号记录，建议核对重大问题与后续审计需求。`,
      `候选项目预计 ${total} 人天，可用 ${c.capacity ?? 300} 人天${total > (c.capacity ?? 300) ? '，资源不足，请调整组合或补充资源' : '，可进一步校核专业能力与实施窗口'}。`,
      ...(ranked.some((risk) => risk.required) ? ['必审事项单列优先安排，不因风险分值较低而自动剔除。'] : []),
    ],
    suggestions: ranked.map((risk, index) => {
      const history = projects.filter((project) => project.subject === risk.subject)
      const sources = (c.evidence ?? []).filter((entry) => risk.evidenceIds.includes(entry.id)).map((entry) => `${entry.name} / ${entry.version}`)
      sources.push(...history.map((project) => `项目 ${project.id} / v${project.currentRevision} / ${project.stage}`))
      const month = Math.min(11, 2 + index * 2)
      return {
        id: `SUG-${risk.id}`, riskId: risk.id, status: '待确认', sources,
        reason: `${risk.required ? '年度必审需求；' : ''}可能性 ${risk.likelihood} × 影响 ${risk.impact} = ${risk.likelihood * risk.impact}。${history.length ? `项目库中有 ${history.length} 项同单位审计记录，纳入前需核对范围是否重叠。` : '项目库中未发现同单位审计记录，建议核对覆盖空白。'}`,
        item: { id: `API-${risk.id}`, name: risk.recommendation, type: risk.domain === '工程' ? '工程审计' : risk.domain === '经济责任' ? '经济责任审计' : '财务审计', subject: risk.subject, period: `${plan.year - 1}-01-01 至 ${plan.year - 1}-12-31`, start: `${plan.year}-${String(month).padStart(2, '0')}-01`, end: `${plan.year}-${String(Math.min(12, month + 1)).padStart(2, '0')}-20`, owner: '内审机构统筹', workdays: risk.workdays, scope: `核查${risk.title}相关控制与执行情况，审计程序在项目准备阶段细化。`, risk: risk.title, riskId: risk.id, priority: risk.required || risk.likelihood * risk.impact >= 20 ? '高' : '中', source: risk.required ? '必审事项' : '风险评估' },
      }
    }),
  }
}
