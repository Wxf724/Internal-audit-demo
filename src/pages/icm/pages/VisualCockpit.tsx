import { CheckCircle2, AlertTriangle, TrendingUp } from 'lucide-react'
import type { EChartsOption } from 'echarts'
import ReactECharts from 'echarts-for-react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { cockpit, issues, overview, workpapers, rectifications, plans } from '../data'
import { Card, Tag, type Tone } from '../components/IcmPageKit'

const S = {
  red: issues.filter((i) => i.level === '重大').length,
  overdue: issues.filter((i) => i.status !== '已销号' && i.deadline < '2026-07-06').length,
  posWp: workpapers.filter((w) => w.result === '问题记录').length,
  closed: rectifications.filter((r) => r.lane === '已整改').length,
  get rate() { return Math.round((this.closed / Math.max(rectifications.length, 1)) * 100) },
  get disp() { return plans.filter((p) => p.status === '已派发').length },
}

const DOMAIN_CT = cockpit.domains.length
const ALERT_MAJOR = cockpit.alerts.filter((a) => a.level === '重大').length
const LIVE_ALERTS = [
  ...cockpit.alerts,
  { domain: '计划', level: '正常', text: 'PL-2026-001 采购专项检查方案审批通过，任务 TK-001 已派发。', owner: '检查计划', action: '持续跟踪' },
  { domain: '审查记录', level: '正常', text: 'WP-0460 供应商准入资料抽样核查通过，未形成问题。', owner: '审查记录', action: '归档留痕' },
  { domain: '取证', level: '正常', text: 'EV-0312 采购合同台账取证单已归档并完成链上校验。', owner: '取证台账', action: '证据可用' },
  { domain: '问题', level: '正常', text: 'ISS-090 验收记录补录事项已完成整改。', owner: '问题台账', action: '关闭观察' },
  { domain: '整改', level: '正常', text: 'RC-090 整改佐证复核成立，已回写关闭状态。', owner: '整改闭环', action: '闭环完成' },
  { domain: '报告', level: '正常', text: 'RPT-001 采购围标风险专项检查报告已同步引用审查记录。', owner: '报告中心', action: '草稿完善' },
]

const KPI7 = [
  { v: plans.length.toString(), l: '检查计划', n: S.disp + '项已派发', c: '#155bd4' },
  { v: cockpit.metrics[1].value, l: '问题线索', n: '红色' + S.red + '条', c: '#dc2626' },
  { v: S.rate + '%', l: '整改闭环', n: S.closed + '已整改', c: '#16a34a' },
  { v: '86%', l: '证据完整', n: '较上月+9%', c: '#16a34a' },
  { v: '4/8域', l: '审查覆盖', n: '8域全覆盖', c: '#155bd4' },
  { v: LIVE_ALERTS.length + '条', l: '实时预警', n: '重大' + ALERT_MAJOR + '条', c: '#dc2626' },
  { v: '1项', l: '流程核验', n: '进行中', c: '#d97706' },
]
const SEEN = new Set(cockpit.heat.map((h) => h.domain))
const DOMAIN_ONLY = cockpit.domains
  .filter((d) => !SEEN.has(d.name))
  .map((d) => ({ domain: d.name, unit: d.name, score: d.score, level: d.score >= 85 ? '红色' : d.score >= 70 ? '橙色' : d.score >= 55 ? '黄色' : '蓝色' }))
const HEAT_ALL = [...cockpit.heat, ...DOMAIN_ONLY]

const LVL: Record<string, string> = { '红色': '#dc2626', '橙色': '#f97316', '黄色': '#eab308', '蓝色': '#3b82f6' }

const TIME_OPTIONS = [
  { key: '12m', label: '一年', months: 12 },
  { key: '6m', label: '6个月', months: 6 },
  { key: '3m', label: '三个月', months: 3 },
  { key: '1m', label: '一个月', months: 1 },
] as const
type TimeKey = typeof TIME_OPTIONS[number]['key']

function alertTone(level: string): Tone {
  return level === '重大' ? 'red' : level === '重要' ? 'amber' : 'green'
}


const MODS = [
  { v: plans.length.toString(), l: '检查计划', n: S.disp + '项已派发', p: '/plan-workbench', c: '#155bd4' },
  { v: cockpit.metrics[1].value, l: '智能审查', n: '风险线索', p: '/review-workbench', c: '#dc2626' },
  { v: workpapers.length.toString(), l: '审查记录', n: S.posWp + '份问题记录', p: '/workpaper', c: '#0891b2' },
  { v: issues.length.toString(), l: '问题线索', n: S.red + '重大/' + S.overdue + '超期', p: '/workpaper', c: '#d97706' },
  { v: S.rate + '%', l: '整改闭环', n: S.closed + '/' + rectifications.length + '已整改', p: '/rectify', c: '#16a34a' },
  { v: '5', l: '报告中心', n: '2份草稿', p: '/report', c: '#7c3aed' },
]
type MetricTileProps = {
  value: string
  label: string
  note: string
  color?: string
  compact?: boolean
  onClick?: () => void
}

function MetricTile({ value, label, note, color = '#0b1f43', compact, onClick }: MetricTileProps) {
  return (
    <div
      className="icm-card icm-kpi"
      style={{
        display: 'grid',
        gridTemplateColumns: compact ? '54px minmax(0, 1fr)' : '82px minmax(0, 1fr)',
        alignItems: 'center',
        gap: compact ? 8 : 12,
        cursor: onClick ? 'pointer' : 'default',
        padding: compact ? '6px 10px' : '7px 12px',
        minHeight: 0,
        borderLeft: compact ? '4px solid ' + color : undefined,
        background: compact ? 'linear-gradient(90deg, ' + color + '14 0%, #fff 42%)' : '#fff',
      }}
      onClick={onClick}
    >
      <strong style={{ fontSize: compact ? 16 : 18, lineHeight: 1.05, color, whiteSpace: 'nowrap' }}>{value}</strong>
      <span style={{ minWidth: 0, display: 'grid', gap: compact ? 1 : 2, textAlign: 'right' }}>
        <span style={{ color: '#607089', fontSize: compact ? 11 : 11, marginTop: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
        <b style={{ color: '#334155', fontSize: compact ? 10 : 10, lineHeight: 1.15, marginTop: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{note}</b>
      </span>
    </div>
  )
}
export default function VisualCockpit() {
  const nav = useNavigate()
  const [searchParams] = useSearchParams()
  const timeRange = searchParams.get('range') as TimeKey | null
  const activeRange = TIME_OPTIONS.find((item) => item.key === timeRange) ?? TIME_OPTIONS[1]
  return (
    <div style={{ display: 'grid', gridTemplateRows: '132px 206px minmax(0, 1fr) 28px', gap: 8, height: '100%', minHeight: 0, overflow: 'hidden' }}>

      {/* 7 KPIs: row1(4) + row2(3) */}
      <div style={{ display: 'grid', gridTemplateRows: 'repeat(2, minmax(0, 1fr))', gap: 8, minHeight: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8, minHeight: 0 }}>
          {KPI7.slice(0, 4).map((k, i) => (
            <MetricTile key={i} value={k.v} label={k.l} note={k.n} color={k.c} />
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, minHeight: 0 }}>
          {KPI7.slice(4).map((k, i) => (
            <MetricTile key={i} value={k.v} label={k.l} note={k.n} color={k.c} />
          ))}
        </div>
      </div>

      {/* heatmap + chain */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(300px,.42fr)', gap: 8, minHeight: 0 }}>
        <Card title="风险热力分布" compact>
          <HeatDist />
        </Card>
        <Card title="自动闭环进度" compact>
          <LoopProgress />
        </Card>
      </div>

      {/* 3-column body: cards | trend | alerts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(164px,.25fr) minmax(0,1fr) minmax(400px,.72fr)', gap: 8, minHeight: 0 }}>

        {/* left: 6 shortcut cards */}
        <div style={{ display: 'grid', gridTemplateRows: 'repeat(6, minmax(0, 1fr))', gap: 7, minHeight: 0 }}>
          {MODS.map((m, i) => (
            <MetricTile key={i} value={m.v} label={m.l} note={m.n} color={m.c} compact onClick={() => nav(m.p)} />
          ))}
        </div>

        {/* middle: trend */}
        <Card title="风险趋势" compact>
          <TrendChart months={activeRange.months} />
        </Card>

        {/* right: alerts */}
        <Card title="实时预警" compact>
          <div style={{ height: '100%', display: 'grid', gridTemplateRows: `repeat(${LIVE_ALERTS.length}, minmax(0, 1fr))`, gap: 5, minHeight: 0 }}>
            {LIVE_ALERTS.map((a, k) => (
              <div key={k} style={{ display: 'grid', gridTemplateColumns: '54px minmax(0,1fr) 72px 74px', alignItems: 'center', gap: 8, minHeight: 0, border: '1px solid #e2eaf5', borderRadius: 7, background: '#fbfdff', padding: '4px 8px' }}>
                <Tag tone={alertTone(a.level)}>{a.level}</Tag>
                <span style={{ minWidth: 0, color: '#263244', fontSize: 11, lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.text}</span>
                <strong style={{ color: '#334155', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.owner}</strong>
                <span style={{ color: '#155bd4', fontSize: 11, fontWeight: 800, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.action}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* bottom bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 12px', border: '1px solid #e5e7eb', borderRadius: 5, background: '#fafbfc', color: '#6b7280', fontSize: 11, minHeight: 0 }}>
        <span>数据覆盖 11 个领域 · 当前筛选 {activeRange.label} · 检查周期 2026-01 至 2026-07</span>
        <span style={{ display: 'flex', gap: 12 }}>
          <span><CheckCircle2 size={11} color="#22c55e" /> {S.rate}% 闭环率</span>
          <span><AlertTriangle size={11} color="#ef4444" /> {S.red} 项重大</span>
          <span><TrendingUp size={11} color="#155bd4" /> 86% 完整度</span>
        </span>
      </div>
    </div>
  )
}

function HeatDist() {
  const opt: EChartsOption = {
    grid: { left: 34, right: 12, top: 20, bottom: 32 },
    xAxis: {
      type: 'category', data: HEAT_ALL.map((h) => h.domain),
      axisLabel: { color: '#64748b', fontSize: 10 }, axisTick: { show: false },
    },
    yAxis: {
      type: 'value', min: 0, max: 100,
      axisLabel: { color: '#64748b', fontSize: 10 },
      splitLine: { lineStyle: { color: '#e7edf6', type: 'dashed' } },
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params: unknown) => {
        const item = (Array.isArray(params) ? params[0] : params) as { dataIndex: number }
        const h = HEAT_ALL[item.dataIndex]
        return `${h.domain}<br/>${h.unit}<br/>评分：${h.score} · 等级：${h.level}`
      },
    },
    series: [{
      type: 'bar',
      data: HEAT_ALL.map((h) => ({
        value: h.score,
        itemStyle: { color: LVL[h.level], borderRadius: [3, 3, 0, 0] },
      })),
      barMaxWidth: 30,
      label: { show: true, position: 'top', color: '#0b1f43', fontSize: 10, fontWeight: 800 },
    }],
  }
  return <ReactECharts option={opt} style={{ height: 160 }} />
}

function LoopProgress() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7, height: '100%', justifyContent: 'space-between' }}>
      {overview.chain.map((c) => (
        <div key={c.key} style={{ display: 'grid', gridTemplateColumns: '64px minmax(0,1fr) 36px', alignItems: 'center', gap: 6, fontSize: 11 }}>
          <span style={{ fontWeight: 800, color: '#334155', textAlign: 'right' }}>{c.label}</span>
          <span style={{ height: 8, borderRadius: 999, background: '#e5e7eb', overflow: 'hidden' }}>
            <span style={{ display: 'block', height: '100%', width: c.percent + '%', borderRadius: 999, background: c.percent >= 100 ? '#16a34a' : c.percent >= 70 ? '#155bd4' : c.percent >= 40 ? '#f59e0b' : '#94a3b8' }} />
          </span>
          <span style={{ fontWeight: 900, color: '#0b1f43' }}>{c.percent}%</span>
        </div>
      ))}
    </div>
  )
}

function TrendChart({ months: rangeMonths }: { months: number }) {
  const visibleTrends = overview.trends.slice(-Math.min(rangeMonths, overview.trends.length))
  const months = visibleTrends.map((t) => t.month.slice(5))
  const opt: EChartsOption = {
    grid: { left: 34, right: 12, top: 28, bottom: 24, containLabel: true },
    xAxis: { type: 'category', data: months, axisLabel: { color: '#64748b', fontSize: 10 }, axisTick: { show: false } },
    yAxis: { type: 'value', axisLabel: { color: '#64748b', fontSize: 10 }, splitLine: { lineStyle: { color: '#e7edf6', type: 'dashed' } } },
    series: [
      { name: '风险指数', type: 'line', data: visibleTrends.map((t) => t.risk), smooth: true, lineStyle: { color: '#ef4444', width: 1.5 }, itemStyle: { color: '#ef4444' }, symbol: 'circle', symbolSize: 3 },
      { name: '发现问题', type: 'line', data: visibleTrends.map((t) => t.findings), smooth: true, lineStyle: { color: '#f59e0b', width: 1.5 }, itemStyle: { color: '#f59e0b' }, symbol: 'circle', symbolSize: 3 },
      { name: '已整改', type: 'line', data: visibleTrends.map((t) => t.rectified), smooth: true, lineStyle: { color: '#22c55e', width: 1.5 }, itemStyle: { color: '#22c55e' }, symbol: 'circle', symbolSize: 3 },
    ],
    legend: { data: ['风险指数', '发现问题', '已整改'], textStyle: { color: '#64748b', fontSize: 10 }, right: 0, top: 0 },
    tooltip: { trigger: 'axis' },
  }
  return <ReactECharts option={opt} style={{ width: '100%', height: '100%', minHeight: 0 }} />
}

