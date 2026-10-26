import { useNavigate } from 'react-router-dom'
import { ArrowUpRight, ChevronRight } from 'lucide-react'
import { Button } from '@/components'
import type { AnalyticsData, AnalyticsFilter, AnalyticsRow } from './model'
import { AgingChart, IssueMatrix, Panel, PeriodChart, RectificationStatus, ResourceChart, RiskChart, StageChart } from './Charts'

interface Props {
  data: AnalyticsData; year: number; quarter: boolean; percent: boolean; section: string
  setQuarter: (value: boolean) => void
  change: (value: Partial<AnalyticsFilter>) => void
  openRows: (title: string, rows: AnalyticsRow[], description?: string) => void
}
export function Dashboard({ data, year, quarter, percent, section, setQuarter, change, openRows }: Props) {
  const navigate = useNavigate()
  const periods = <div className="analysis-segment"><button aria-pressed={!quarter} onClick={() => setQuarter(false)}>月度</button><button aria-pressed={quarter} onClick={() => setQuarter(true)}>季度</button></div>
  const focus = <div className="analysis-focus">{data.focus.slice(0, 3).map((row) => <button title={`${row.name} · ${row.detail}`} key={`${row.kind}:${row.id}`} onClick={() => openRows(row.name, [row])}><span className={`analysis-kind ${row.kind === '问题' ? 'red' : 'amber'}`}>{row.kind}</span><span><strong>{row.name}</strong><small>{row.detail}</small></span><ChevronRight size={13} /></button>)}{!data.focus.length && <div className="analysis-empty">暂无待关注事项</div>}</div>
  return <div className={`analysis-dashboard ${data.planning ? 'is-planning' : ''}`} data-section={section}>
    {data.planning ? <>
      <Panel className="board-execution" title="年度风险与拟覆盖" action={<Button type="ghost" size="xs" onClick={() => openRows('年度风险清单', data.rows.risks)}>全部风险 · {data.risks.length}</Button>}>
        <RiskChart data={data} onRows={openRows} />
        <div className="analysis-chart-key"><span><i className="green" />拟纳入</span><span><i className="amber" />待评估</span><span><i className="red" />必审待评估</span></div>
      </Panel>
      <Panel className="board-stages" title="计划资源配置"><ResourceChart data={data} onRows={openRows} /></Panel>
      <Panel className="board-issues" title="风险纳入明细" action={<Button type="ghost" size="xs" onClick={() => openRows('年度风险清单', data.rows.risks)}>查看全部 · {data.risks.length}</Button>}>
        <div className="analysis-risk-list">{data.rows.risks.slice(0, 6).map((r) => <button key={r.id} title={r.detail} onClick={() => openRows(r.name, [r])}><span><strong>{r.name}</strong><small>{r.unit}</small></span><em className={r.status === '拟纳入' ? 'green' : 'amber'}>{r.status}</em></button>)}{!data.rows.risks.length && <div className="analysis-empty">尚未登记年度风险评估结果</div>}</div>
      </Panel>
      <Panel className="board-rectification" title="年度计划编制" action={<span>{data.plan?.status ?? '尚未建立'}</span>}>
        <div className="analysis-planning-callout"><strong>{data.rows.plans.length}<small> 个拟开展项目</small></strong><p>风险评估 → 项目安排 → 资源核对 → 提交审议</p><Button type="primary" onClick={() => navigate(data.plan ? `/plan-workbench?annual=${data.plan.id}&tab=compose` : `/plan-workbench?year=${year}`)}>进入年度计划编制<ArrowUpRight size={14} /></Button></div>
      </Panel>
      <Panel className="board-attention" title="待评估事项" action={<Button type="ghost" size="xs" onClick={() => openRows('待评估事项', data.focus)}>全部 · {data.focus.length}</Button>}>{focus}</Panel>
    </> : <>
      <Panel className="board-execution" title="年度计划与执行" action={<div className="board-panel-actions"><Button type="ghost" size="xs" onClick={() => openRows('执行记录', data.rows.projects)}>查看记录</Button>{periods}</div>}>
        <PeriodChart data={data} quarter={quarter} onPeriod={(period) => change({ period })} />
      </Panel>
      <Panel className="board-stages" title="项目阶段" action={<Button type="ghost" size="xs" onClick={() => openRows('执行项目', data.rows.projects)}>全部项目</Button>}><StageChart data={data} percent={percent} onStage={(stage) => change({ stage })} onRows={openRows} /></Panel>
      <Panel className="board-issues" title="单位问题分布 · 前 5" action={<Button type="ghost" size="xs" onClick={() => openRows('已确认问题', data.rows.issues)}>全部问题</Button>}><IssueMatrix data={data} percent={percent} limit={5} onUnit={(unit) => change({ unit })} onRows={openRows} /></Panel>
      <Panel className="board-rectification" title="整改成效" action={<Button type="ghost" size="xs" onClick={() => openRows('整改记录', data.rows.rects)}>全部整改</Button>}>
        <RectificationStatus data={data} onRows={openRows} />
        <PeriodChart data={data} quarter={quarter} rectification onPeriod={(period) => change({ period })} />
      </Panel>
      <Panel className="board-attention" title="逾期与重点关注" action={<Button type="ghost" size="xs" onClick={() => openRows('重点关注', data.focus)}>全部 · {data.focus.length}</Button>}><AgingChart data={data} onRows={openRows} />{focus}</Panel>
    </>}
  </div>
}
