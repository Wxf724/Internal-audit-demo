import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowUpRight, BarChart3, FilterX, Sparkles, X } from 'lucide-react'
import { Button } from '@/components'
import { useAnnualPlanStore } from '../../store/annualPlanStore'
import { useAuditProjectStore } from '../../store/auditProjectStore'
import { useWorkflowStore } from '../../store/workflowStore'
import { useWorkpaperStore } from '../../store/workpaperStore'
import { issueProjectId, legacyPaperOwners } from '../projectScope'
import { projectYear } from '../projectRelations'
import { chinaToday } from '../annual-plan/planning'
import { buildAnalytics } from './model'
import type { AnalyticsFilter, AnalyticsRow } from './model'
import { Dashboard } from './Dashboard'
import { AnalyticsDetails } from './Details'
import type { DetailSelection } from './Details'
import { AnalysisAssistant } from './AnalysisAssistant'
import './analytics.css'

export default function AuditAnalytics() {
  const plans = useAnnualPlanStore((s) => s.plans), projects = useAuditProjectStore((s) => s.projects)
  const issues = useWorkflowStore((s) => s.issues), rectifications = useWorkflowStore((s) => s.rectifications)
  const papers = useWorkpaperStore((s) => s.papers)
  const [params, setParams] = useSearchParams()
  const [today, setToday] = useState(chinaToday)
  useEffect(() => { const timer = window.setInterval(() => setToday(chinaToday()), 60000); return () => clearInterval(timer) }, [])
  const currentYear = Number(today.slice(0, 4))
  const requestedYear = Number(params.get('year') ?? currentYear)
  const filter: AnalyticsFilter = { year: Number.isInteger(requestedYear) && requestedYear >= 2000 && requestedYear <= 2100 ? requestedYear : currentYear, unit: params.get('unit') ?? '', type: params.get('type') ?? '', period: params.get('period') ?? 'all', stage: params.get('stage') ?? '' }
  const [quarter, setQuarter] = useState(false), [percent, setPercent] = useState(false)
  const [detail, setDetail] = useState<DetailSelection | null>(null), [assistant, setAssistant] = useState(false)
  const linkedIssues = useMemo(() => issues.map((i) => ({ ...i, projectId: issueProjectId(i) ?? papers.find((p) => p.id === i.workpaperId)?.projectId ?? legacyPaperOwners[i.workpaperId] })), [issues, papers])
  const data = useMemo(() => buildAnalytics({ plans, projects, issues: linkedIssues, rectifications, today }, filter), [plans, projects, linkedIssues, rectifications, today, filter.year, filter.unit, filter.type, filter.period, filter.stage]) // eslint-disable-line react-hooks/exhaustive-deps
  const years = [...new Set([...plans.map((p) => p.year), ...projects.map(projectYear), currentYear, filter.year])].filter(Number.isFinite).sort((a, b) => b - a)
  const change = (patch: Partial<AnalyticsFilter>) => {
    const next = { ...filter, ...patch }
    const search = new URLSearchParams({ year: String(next.year) })
    for (const key of ['unit', 'type', 'period', 'stage'] as const) if (next[key] && next[key] !== 'all') search.set(key, next[key])
    setParams(search); setDetail(null)
  }
  const openRows = (title: string, rows: AnalyticsRow[], description?: string) => setDetail({ title, rows, description })
  const periodLabel = filter.period.startsWith('Q') ? `第 ${filter.period[1]} 季度` : `${Number(filter.period)} 月`
  const modeLabel = data.planning ? '编制分析' : filter.year < currentYear ? '成果与后续跟踪' : '执行分析'
  const hasFilters = filter.unit || filter.type || filter.stage || filter.period !== 'all'
  const [section, setSection] = useState('execution')
  return <div className="audit-analysis">
    <header className="analysis-heading"><div><span className="analysis-mark"><BarChart3 size={19} /></span><h1>统计分析</h1><span className="analysis-mode">{modeLabel}</span></div><div><Button type="primary" icon={<Sparkles size={14} />} onClick={() => setAssistant(true)}>分析当前数据</Button></div></header>
    <div className="analysis-filters"><label>年度<select className="icm-select" aria-label="统计年度" value={filter.year} onChange={(e) => change({ year: Number(e.target.value), unit: '', type: '', stage: '', period: 'all' })}>{years.map((year) => <option key={year} value={year}>{year} 年度</option>)}</select></label><label>单位<select className="icm-select" aria-label="被审计单位" value={filter.unit} onChange={(e) => change({ unit: e.target.value })}><option value="">全部单位</option>{data.units.map((unit) => <option key={unit}>{unit}</option>)}</select></label><label>类型<select className="icm-select" aria-label="审计类型" value={filter.type} onChange={(e) => change({ type: e.target.value, unit: '' })}><option value="">全部类型</option>{['财务审计', '工程审计', '经济责任审计'].map((type) => <option key={type}>{type}</option>)}</select></label><label>实施窗口<select className="icm-select" aria-label="实施窗口" value={filter.period} onChange={(e) => change({ period: e.target.value })}><option value="all">全年</option>{[1, 2, 3, 4].map((q) => <option key={`Q${q}`} value={`Q${q}`}>第 {q} 季度</option>)}{Array.from({ length: 12 }, (_, i) => <option key={i} value={String(i + 1).padStart(2, '0')}>{i + 1} 月</option>)}</select></label><span className="analysis-asof">当前状态截至 {today}</span></div>
    {hasFilters && <div className="analysis-chips"><span>联动范围</span>{([['unit', filter.unit], ['type', filter.type], ['stage', filter.stage], ['period', filter.period === 'all' ? '' : periodLabel]] as const).filter(([, value]) => value).map(([key, value]) => <button key={key} onClick={() => change({ [key]: key === 'period' ? 'all' : '' })}>{value}<X size={12} /></button>)}<Button type="ghost" size="xs" icon={<FilterX size={12} />} onClick={() => change({ unit: '', type: '', stage: '', period: 'all' })}>重置筛选</Button></div>}
    <div className="analysis-kpis">{data.metrics.map((m) => <button key={m.id} className={`analysis-kpi ${m.tone}`} title={m.detail} aria-label={`${m.label} ${m.value}${m.unit}`} onClick={() => openRows(m.label, m.rows, m.detail)}><span>{m.label}<ArrowUpRight size={13} /></span><strong>{m.value}<small>{m.value === '—' ? '' : m.unit}</small></strong></button>)}</div>
    <div className="analysis-chart-controls"><select className="analysis-section-select icm-select" aria-label="看板区域" value={section} onChange={(e) => setSection(e.target.value)}>{(data.planning ? [['execution', '风险覆盖'], ['stages', '资源配置'], ['issues', '风险明细'], ['rectification', '计划编制'], ['attention', '待评估事项']] : [['execution', '计划执行'], ['stages', '项目阶段'], ['issues', '问题分布'], ['rectification', '整改成效'], ['attention', '逾期与关注']]).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><div><span className="analysis-dot" />{filter.year} 年度 · {data.planning ? `${data.risks.length} 项风险待统筹` : `${data.rows.projects.length} 个项目 · ${data.rows.issues.length} 项确认问题`}</div>{!data.planning && <div className="analysis-segment" aria-label="图表数值方式"><button aria-pressed={!percent} onClick={() => setPercent(false)}>数量</button><button aria-pressed={percent} onClick={() => setPercent(true)}>占比</button></div>}</div>
    <Dashboard data={data} year={filter.year} quarter={quarter} percent={percent} section={section} setQuarter={setQuarter} change={change} openRows={openRows} />
    <footer className="analysis-footer"><span>统计来自年度计划、项目、问题与整改台账</span><div><button onClick={() => openRows('待确认问题', data.pendingIssues)}>待确认问题 {data.pendingIssues.length}</button><button onClick={() => openRows('数据待完善', data.quality, '包含跨年度未关联项目的记录，以及当前范围缺少启动、签发或销号日期的记录。未关联记录未计入本页年度与单位统计。')}>数据待完善 {data.quality.length}</button></div></footer>
    {detail && <AnalyticsDetails key={detail.title} selection={detail} onClose={() => setDetail(null)} />}{assistant && <AnalysisAssistant data={data} filter={filter} today={today} onClose={() => setAssistant(false)} onRows={(title, rows) => { setAssistant(false); openRows(title, rows) }} />}
  </div>
}

