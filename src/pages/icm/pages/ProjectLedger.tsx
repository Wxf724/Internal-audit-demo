import { useState, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowUpRight, CalendarRange, Plus } from 'lucide-react'
import { Button, Input } from '@/components'
import { Card, DataTable, Kpi, PageFrame, Tag, Toolbar } from '../components/IcmPageKit'
import { useAuditProjectStore } from '../store/auditProjectStore'
import { useAnnualPlanStore } from '../store/annualPlanStore'
import { useIcmDemoRole } from '../AppShell'
import { canViewProject, isActiveProject } from './workplaceMetrics'
import { isCarryover, projectLinks, projectSource, projectYear } from './projectRelations'
import { ExecutionArrangement } from './ExecutionArrangement'
import { ProjectDeleteButton } from './ProjectDeleteButton'
import './project-planning.css'

export default function ProjectLedger({ viewSwitch }: { viewSwitch?: ReactNode }) {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const { role } = useIcmDemoRole()
  const projects = useAuditProjectStore((s) => s.projects)
  const plans = useAnnualPlanStore((s) => s.plans)
  const [keyword, setKeyword] = useState('')
  const [create, setCreate] = useState<'plan' | 'adhoc'>()
  const currentYear = new Date().getFullYear()
  // Dashboard drilldowns retain the full range unless a year is supplied.
  const year = params.get('year') ?? (params.has('stage') || params.has('type') ? 'all' : String(currentYear))
  const yearBy = params.get('yearBy') ?? 'management'
  const stage = params.get('stage') ?? 'all'
  const type = params.get('type') ?? 'all'
  const source = params.get('source') ?? 'all'
  const setFilter = (key: string, value: string) => setParams((next) => { if (!next.has('year')) next.set('year', year); next.set(key, value); return next })
  const years = [...new Set([currentYear, ...projects.map(projectYear), ...plans.map((p) => p.year)])].filter(Number.isFinite).sort((a, b) => b - a)
  const visible = projects.filter((p) => canViewProject(p, role)
    && (!keyword.trim() || `${p.name}${p.id}${p.subject}${p.owner}${p.risk}`.includes(keyword.trim()))
    && (type === 'all' || type === '全部类型' || p.type === type)
    && (stage === 'all' || stage === '全部阶段' || (stage === 'active' ? isActiveProject(p) : p.stage === stage))
    && (source === 'all' || projectSource(p) === source)
    && (year === 'all' || (yearBy === 'plan' ? projectLinks(p, plans).some((l) => l.year === Number(year)) : projectYear(p) === Number(year) || isCarryover(p, Number(year)))))
  return <PageFrame title="项目台账" titleAccessory={viewSwitch} subtitle="统筹审计项目、执行安排与跨年结转。" actions={<><Button type="default" icon={<CalendarRange size={15} />} onClick={() => setCreate('plan')}>从计划安排执行</Button><Button type="primary" icon={<Plus size={15} />} onClick={() => setCreate('adhoc')}>临时授权立项</Button></>}>
    <div className="project-summary-grid">
      <Kpi compact value={String(visible.length)} label="项目总数" note="按项目编号去重" tone="blue" />
      <Kpi compact value={String(visible.filter(isActiveProject).length)} label="在审项目" note="准备、实施与报告阶段" tone="cyan" />
      <Kpi compact value={String(visible.filter((p) => isCarryover(p, year === 'all' ? currentYear : Number(year))).length)} label="跨年结转" note={`${year === 'all' ? currentYear : year} 年仍需关注`} tone="amber" />
      <Kpi compact value={String(visible.filter((p) => p.stage === '整改跟踪').length)} label="整改跟踪项目" note="报告后持续跟踪" tone="green" />
    </div>
    <Toolbar>
      <Input search value={keyword} onChange={setKeyword} placeholder="项目 / 审计对象 / 主审" aria-label="搜索项目" />
      <select className="icm-select" aria-label="年度口径" value={yearBy} onChange={(e) => setFilter('yearBy', e.target.value)}><option value="management">管理年度（含结转）</option><option value="plan">来源计划年度</option></select>
      <select className="icm-select" aria-label="项目年度" value={year} onChange={(e) => setFilter('year', e.target.value)}><option value="all">全部年度</option>{years.map((y) => <option key={y} value={y}>{y} 年</option>)}</select>
      <select className="icm-select" aria-label="按审计类型筛选" value={type} onChange={(e) => setFilter('type', e.target.value)}><option value="all">全部类型</option>{['财务审计', '工程审计', '经济责任审计'].map((t) => <option key={t}>{t}</option>)}</select>
      <select className="icm-select" aria-label="按项目阶段筛选" value={stage} onChange={(e) => setFilter('stage', e.target.value)}><option value="all">全部阶段</option><option value="active">在审项目</option>{['准备中', '实施中', '报告中', '整改跟踪', '已归档'].map((s) => <option key={s}>{s}</option>)}</select>
      <select className="icm-select" aria-label="项目来源" value={source} onChange={(e) => setFilter('source', e.target.value)}><option value="all">全部来源</option>{['年度计划', '临时授权', '历史导入'].map((s) => <option key={s}>{s}</option>)}</select>
    </Toolbar>
    <Card title="执行项目" note={yearBy === 'management' ? '管理年度包含往年未结束项目；审计覆盖期间独立维护。' : '一个项目可承接多个年度、多个计划项；本表按项目去重。'} action={<Tag tone="blue">{visible.length} 个项目</Tag>}>
      {visible.length ? <DataTable columns={['项目 / 类型', '审计对象 / 主审', '年度与来源', '实施窗口', '计划关联', '阶段', '操作']} rows={visible.map((p) => {
        const links = projectLinks(p, plans)
        return [<button className="icm-link project-table-title" onClick={() => navigate(`/projects/${p.id}`)}><strong>{p.name}</strong><small>{p.type} · {p.id}</small></button>, <>{p.subject}<small className="project-block">主审：{p.owner}</small></>, <>{projectYear(p)} 年 · {projectSource(p)}{isCarryover(p, year === 'all' ? currentYear : Number(year)) && <small className="project-block"><Tag tone="amber">跨年结转</Tag></small>}</>, p.plannedImplementation, links.length ? <>{links.length} 个计划项<small className="project-block">{[...new Set(links.map((l) => l.year))].join(' / ')} 年</small></> : p.planId ? '历史计划来源' : '无年度计划关联', <Tag tone={p.stage === '已归档' ? 'green' : p.stage === '实施中' ? 'blue' : 'amber'}>{p.stage}</Tag>, <div className="icm-actions"><Button icon={<ArrowUpRight size={14} />} onClick={() => navigate(`/projects/${p.id}`)}>进入</Button><ProjectDeleteButton project={p}/></div>]
      })} /> : <div className="icm-empty-inline">当前条件下暂无项目，请调整年度或筛选条件。</div>}
    </Card>
    {create && <ExecutionArrangement adhoc={create === 'adhoc'} onClose={() => setCreate(undefined)} />}
  </PageFrame>
}
