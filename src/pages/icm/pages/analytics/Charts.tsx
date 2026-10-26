import type { ReactNode } from 'react'
import type { EChartsOption, SeriesOption } from 'echarts'
import { EChart } from '../../components/IcmChart'
import type { AnalyticsData, AnalyticsRow } from './model'
import { LEVELS } from './model'

const colors = ['#155bd4', '#0891b2', '#f59e0b', '#7c3aed', '#16a34a']
const axis = { color: '#64748b', fontSize: 11 }
const base: EChartsOption = { animationDuration: 280, aria: { enabled: true }, tooltip: { trigger: 'axis', renderMode: 'richText', confine: true }, grid: { top: 25, left: 30, right: 12, bottom: 8 }, textStyle: { fontFamily: 'Microsoft YaHei, sans-serif' } }
export function Panel({ title, subtitle, action, children, className = '' }: { title: string; subtitle?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`analysis-panel ${className}`}><header><div><h2>{title}</h2>{subtitle && <span>{subtitle}</span>}</div>{action}</header>{children}</section>
}
export function PeriodChart({ data, quarter, rectification, onPeriod }: { data: AnalyticsData; quarter: boolean; rectification?: boolean; onPeriod: (period: string) => void }) {
  const groups = quarter ? Array.from({ length: 4 }, (_, i) => ({ name: `Q${i + 1}`, rows: data.months.slice(i * 3, i * 3 + 3) })) : data.months.map((m) => ({ name: m.name, rows: [m] }))
  const fields = rectification ? ['due', 'closed'] as const : ['planned', 'started', 'signed'] as const
  const names = rectification ? ['到期整改', '已销号'] : ['计划启动（项）', '实际启动（项目）', '报告签发（份）']
  const palette = rectification ? [colors[2], colors[4]] : [colors[0], colors[1], colors[4]]
  const series: SeriesOption[] = fields.map((field, i): SeriesOption => {
    const common = { name: names[i], data: groups.map((g) => g.rows.reduce((sum, r) => sum + r[field], 0)) }
    return i === fields.length - 1
      ? { ...common, type: 'line', symbol: 'circle', symbolSize: 6, smooth: false, itemStyle: { color: palette[i] }, lineStyle: { width: 2.5, color: palette[i] }, emphasis: { focus: 'series' } }
      : { ...common, type: 'bar', barMaxWidth: 22, itemStyle: { borderRadius: [3, 3, 0, 0], color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: palette[i] }, { offset: 1, color: `${palette[i]}88` }] } }, emphasis: { focus: 'series' } }
  })
  const option: EChartsOption = { ...base, color: palette, legend: { left: 6, top: 0, icon: 'roundRect', itemWidth: 12, itemHeight: 6, textStyle: axis }, xAxis: { type: 'category', data: groups.map((g) => g.name), axisTick: { show: false }, axisLine: { lineStyle: { color: '#dce4ec' } }, axisLabel: { show: false } }, yAxis: { type: 'value', minInterval: 1, axisLabel: axis, splitLine: { lineStyle: { type: 'dashed', color: '#eaf0f5' } } }, series }
  return <><div className="analysis-chart" aria-label={rectification ? '整改到期与销号趋势图' : '年度计划与执行图'}><EChart option={option} onEvents={{ click: (e) => onPeriod(quarter ? `Q${e.dataIndex + 1}` : String(e.dataIndex + 1).padStart(2, '0')) }} /></div><div className="analysis-period-links" aria-label="按期间联动筛选">{groups.map((g, i) => <button key={g.name} onClick={() => onPeriod(quarter ? `Q${i + 1}` : String(i + 1).padStart(2, '0'))}>{g.name}</button>)}</div></>
}
export function StageChart({ data, percent, onStage, onRows }: { data: AnalyticsData; percent: boolean; onStage: (stage: string) => void; onRows: (title: string, rows: AnalyticsRow[]) => void }) {
  const total = data.rows.projects.length
  return <><div className="analysis-stage-total"><strong>{total}<small> 个项目</small></strong><span>当前阶段分布</span></div><div className="analysis-stage-track">{data.groups.map((g, i) => g.rows.length > 0 && <button key={g.name} aria-label={`筛选${g.name}`} style={{ flex: g.rows.length, background: colors[i] }} onClick={() => onStage(g.name)} title={`${g.name} · ${g.rows.length} 个`}>{g.rows.length}</button>)}</div><div className="analysis-stage-legend">{data.groups.map((g, i) => <div key={g.name}><button onClick={() => onStage(g.name)}><i style={{ background: colors[i] }} />{g.name}</button><button aria-label={`查看${g.name}项目`} onClick={() => onRows(g.name, g.rows)}>{percent ? `${total ? Math.round(g.rows.length / total * 100) : 0}%` : `${g.rows.length} 个`}</button></div>)}</div><div className="analysis-source-mix">{data.sourceCounts.map((s) => <span key={s.name}>{s.name}<b>{s.value}</b></span>)}</div></>
}
export function IssueMatrix({ data, percent, limit, onUnit, onRows }: { data: AnalyticsData; percent: boolean; limit?: number; onUnit: (unit: string) => void; onRows: (title: string, rows: AnalyticsRow[]) => void }) {
  const max = Math.max(1, ...data.matrix.flatMap((m) => m.cells.map((c) => c.length)))
  return <div className="analysis-matrix-scroll"><table className="analysis-matrix"><thead><tr><th>被审计单位</th>{LEVELS.map((l) => <th key={l}>{l}</th>)}<th>合计</th></tr></thead><tbody>{data.matrix.slice(0, limit).map((m) => <tr key={m.unit}><th><button onClick={() => onUnit(m.unit)} title={`筛选 ${m.unit}`}>{m.unit}</button></th>{m.cells.map((rows, i) => <td key={i}><button title={`${m.unit} · ${LEVELS[i]} · ${rows.length} 项`} className={rows.length ? 'has-value' : ''} style={rows.length ? { background: `color-mix(in srgb, var(--analysis-matrix-${i}) ${15 + rows.length / max * 45}%, var(--surface))` } : {}} onClick={() => onRows(`${m.unit} · ${LEVELS[i]}问题`, rows)}>{percent ? `${data.rows.issues.length ? Math.round(rows.length / data.rows.issues.length * 100) : 0}%` : rows.length}</button></td>)}<td><button onClick={() => onRows(`${m.unit} · 已确认问题`, m.cells.flat())}>{m.cells.flat().length}</button></td></tr>)}</tbody></table>{!data.matrix.length && <div className="analysis-empty">当前范围暂无已关联项目</div>}</div>
}
export function RectificationStatus({ data, onRows }: { data: AnalyticsData; onRows: (title: string, rows: AnalyticsRow[]) => void }) {
  const total = data.rows.rects.length
  let angle = 0
  const stops = data.rectGroups.map((g, i) => { const start = angle; angle += total ? g.rows.length / total * 360 : 0; return `${colors[i === 3 ? 4 : i]} ${start}deg ${angle}deg` })
  return <div className="analysis-rect-status"><button className="analysis-ring" style={{ background: total ? `conic-gradient(${stops.join(',')})` : 'var(--bg-soft)' }} onClick={() => onRows('已销号整改', data.rectGroups.at(-1)!.rows)} aria-label="查看已销号整改"><span><strong>{data.closeRate === null ? '—' : `${data.closeRate}%`}</strong><small>销号率</small></span></button><div>{data.rectGroups.map((g, i) => <button key={g.name} onClick={() => onRows(g.name, g.rows)}><i style={{ background: colors[i === 3 ? 4 : i] }} /><span>{g.name}</span><b>{g.rows.length}</b></button>)}<small>{data.closedCount} / {total} 项已销号</small></div></div>
}
export function AgingChart({ data, onRows }: { data: AnalyticsData; onRows: (title: string, rows: AnalyticsRow[]) => void }) {
  const max = Math.max(1, ...data.aging.map((a) => a.rows.length))
  return <div className="analysis-aging">{data.aging.map((a, i) => <button key={a.name} onClick={() => onRows(`逾期 ${a.name}`, a.rows)}><span>{a.name}</span><div><i style={{ width: `${a.rows.length / max * 100}%`, background: i > 1 ? 'var(--danger)' : 'var(--warning)' }} /></div><b>{a.rows.length}</b></button>)}</div>
}
export function RiskChart({ data, onRows }: { data: AnalyticsData; onRows: (title: string, rows: AnalyticsRow[]) => void }) {
  const points = [...new Set(data.risks.map((r) => `${r.impact}:${r.likelihood}`))].map((key) => {
    const risks = data.risks.filter((r) => `${r.impact}:${r.likelihood}` === key)
    return { risks, rows: data.rows.risks.filter((row) => risks.some((r) => r.id === row.id)) }
  })
  const cells = Array.from({ length: 25 }, (_, n) => {
    const impact = n % 5 + 1, likelihood = Math.floor(n / 5) + 1
    const point = points.find((p) => p.risks[0].impact === impact && p.risks[0].likelihood === likelihood)
    const risks = point?.risks ?? []
    return { rows: point?.rows ?? [], name: risks.length ? risks.map((r) => `${r.subject} · ${r.title}`).join('\n') : '暂无风险事项', value: [impact - 1, likelihood - 1, risks.length], itemStyle: { color: !risks.length ? '#f0f5fc' : risks.some((r) => r.required && !data.coveredRisks.includes(r)) ? '#dc2626' : risks.every((r) => data.coveredRisks.includes(r)) ? colors[4] : colors[2], borderColor: '#fff', borderWidth: 3 } }
  })
  const option: EChartsOption = { ...base, visualMap: { show: false, min: 0, max: Math.max(1, ...cells.map((cell) => cell.value[2])), dimension: 2, inRange: { opacity: 1 } }, tooltip: { trigger: 'item', renderMode: 'richText', confine: true }, grid: { top: 20, left: 42, right: 12, bottom: 33 }, xAxis: { name: '影响程度', nameLocation: 'middle', nameGap: 18, type: 'category', data: ['1', '2', '3', '4', '5'], axisLabel: axis, axisTick: { show: false }, axisLine: { show: false } }, yAxis: { name: '发生可能性', nameGap: 7, type: 'category', data: ['1', '2', '3', '4', '5'], axisLabel: axis, axisTick: { show: false }, axisLine: { show: false } }, series: [{ name: '年度风险评估', type: 'heatmap', data: cells, label: { show: true, color: '#fff', fontWeight: 'bold', fontSize: 11, formatter: (params) => { const count = (params.value as number[])[2]; return count ? String(count) : '' } }, emphasis: { itemStyle: { borderColor: '#155bd4', borderWidth: 2 } } }] }
  return <div className="analysis-chart analysis-risk-chart" aria-label="年度风险评估矩阵"><EChart option={option} onEvents={{ click: (e) => { if (cells[e.dataIndex].rows.length) onRows('同评分风险事项', cells[e.dataIndex].rows) } }} /></div>
}
export function ResourceChart({ data, onRows }: { data: AnalyticsData; onRows: (title: string, rows: AnalyticsRow[]) => void }) {
  const totalWork = data.content?.items.reduce((sum, i) => sum + i.workdays, 0) ?? 0
  return <div className="analysis-resource"><div className="analysis-stage-total"><strong>{data.workload}<small> 人天</small></strong><span>当前范围计划投入</span></div><div className="analysis-resource-track"><i style={{ width: `${data.capacity ? Math.min(100, totalWork / data.capacity * 100) : 0}%`, background: data.capacity !== null && totalWork > data.capacity ? 'var(--danger)' : 'var(--accent)' }} /></div><div className="analysis-budget"><span>全年度已安排<b>{totalWork}</b></span><span>全年度预算<b>{data.capacity ?? '—'}</b></span></div><div className="analysis-type-days">{['财务审计', '工程审计', '经济责任审计'].map((type) => { const items = data.content?.items.filter((i) => i.type === type && data.rows.plans.some((r) => r.id === i.id)) ?? []; return <button key={type} onClick={() => onRows(type, data.rows.plans.filter((r) => items.some((i) => i.id === r.id)))}><span>{type}</span><b>{items.reduce((sum, i) => sum + i.workdays, 0)}<small>人天</small></b></button> })}</div></div>
}


