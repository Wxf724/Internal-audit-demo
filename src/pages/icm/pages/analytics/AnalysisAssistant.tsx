import { useState } from 'react'
import { Button, Modal } from '@/components'
import { useAnnualPlanStore } from '../../store/annualPlanStore'
import { usePlanningLibraryStore } from '../../store/planningLibraryStore'
import { newId, now } from '../annual-plan/model'
import type { AnalyticsData, AnalyticsFilter, AnalyticsRow } from './model'

// Local, deterministic interpretation: business records never leave the browser.
export function AnalysisAssistant({ data, filter, today, onClose, onRows }: { data: AnalyticsData; filter: AnalyticsFilter; today: string; onClose: () => void; onRows: (title: string, rows: AnalyticsRow[]) => void }) {
  const plans = useAnnualPlanStore((s) => s.plans)
  const targets = plans.filter((p) => p.year >= filter.year && ['编制中', '已退回'].includes(p.status)).sort((a, b) => a.year - b.year)
  const [target, setTarget] = useState(targets[0]?.id ?? ''), [savedSnapshot, setSavedSnapshot] = useState(''), [error, setError] = useState('')
  const pendingRisk = data.rows.risks.filter((r) => r.status === '待评估')
  const major = data.metrics.find((m) => m.id === 'major')?.rows ?? []
  const overdue = data.aging.flatMap((g) => g.rows)
  const insights = data.planning ? [
    { title: '风险与计划覆盖', text: `${data.risks.length} 项已登记风险中，${data.coveredRisks.length} 项拟纳入计划，${pendingRisk.length} 项待评估。优先核对必审事项、高评分风险及其依据。`, rows: pendingRisk },
    { title: '资源投入', text: `当前范围计划投入 ${data.workload} 人天；全年度预算 ${data.capacity ?? '未登记'} 人天。专业能力和实际工时须另行核实，不能据此计算实际利用率。`, rows: data.rows.plans },
  ] : [
    { title: '计划落实', text: `当前范围有 ${data.rows.plans.length} 个批准计划项、${data.rows.projects.length} 个执行项目。计划安排率 ${data.metrics.find((m) => m.id === 'arranged')?.value ?? '—'}%。可进一步核对未安排计划项的启动窗口。`, rows: data.rows.plans.filter((r) => r.status === '待安排') },
    { title: '重大问题与整改', text: `有 ${major.length} 项重大未关闭问题、${overdue.length} 项逾期未销号整改。建议逐项核实责任、复核进度及后续审计需求，问题数量不直接代表单位风险高低。`, rows: [...major, ...overdue] },
    { title: '整改成效', text: `${data.closedCount} / ${data.rows.rects.length} 项整改已销号，${data.rectGroups.find((g) => g.name === '已整改待复核')?.rows.length ?? 0} 项已整改待复核。后续计划可评估长期未销号事项是否需要专项跟踪。`, rows: data.rectGroups.find((g) => g.name === '已整改待复核')?.rows ?? [] },
  ]
  const snapshot = JSON.stringify({ filter, today, insights, metrics: data.metrics.map(({ label, value, detail }) => ({ label, value, detail })), quality: data.quality, references: data.rows })
  const save = () => {
    const targetPlan = useAnnualPlanStore.getState().plans.find((p) => p.id === target)
    if (!targetPlan || !['编制中', '已退回'].includes(targetPlan.status)) { setError('目标年度当前不可编制，请重新选择。'); return }
    const id = `analysis:${newId()}`
    usePlanningLibraryStore.getState().add([{ id, planId: target, shared: false, category: '历史审计与整改', year: targetPlan.year, name: `${filter.year}年度统计分析 · ${today}`, source: '统计分析 / 内审机构确认', version: now(), summary: `本地统计分析；不代表批准结论。\n${insights.map((i) => `${i.title}：${i.text}`).join('\n')}\n引用快照：\n${snapshot}`, confirmedAt: now() }])
    useAnnualPlanStore.getState().selectResources(target, [...(targetPlan.conversation?.selectedResourceIds ?? []), id])
    setSavedSnapshot(snapshot)
  }
  return <Modal open centered width="min(760px, calc(100vw - 32px))" title="分析当前数据" onClose={onClose} footer={<Button onClick={onClose}>关闭</Button>}><div className="analysis-assistant">
    <div className="analysis-ai-scope"><strong>{filter.year} 年度 · {filter.unit || '全部单位'} · {filter.type || '全部审计类型'}</strong><span>本地统计分析 · 截至 {today}</span></div>
    {insights.map((i) => <article key={i.title}><h3>{i.title}</h3><p>{i.text}</p><Button type="ghost" onClick={() => onRows(i.title, i.rows)}>查看依据 · {i.rows.length}</Button></article>)}
    {data.quality.length > 0 && <p>存在未关联或缺少事件日期的记录，趋势仅反映已登记事件。</p>}
    {error && <p role="alert" className="analysis-error">{error}</p>}
    <div className="analysis-ai-save"><label>纳入编制年度<select className="icm-select" aria-label="纳入编制年度" value={target} onChange={(e) => { setTarget(e.target.value); setSavedSnapshot('') }}>{!targets.length && <option value="">暂无可编制年度</option>}{targets.map((p) => <option key={p.id} value={p.id}>{p.year} 年度</option>)}</select></label><Button disabled={!target || savedSnapshot === snapshot} onClick={save}>{savedSnapshot === snapshot ? '已加入编制资料' : '确认加入编制资料'}</Button></div>
  </div></Modal>
}
