import { useIcmDemoRole } from '../AppShell'
import { canSeeTopPage } from '../pageVisibility'
import { useNavigate } from 'react-router-dom'
import ReactECharts from 'echarts-for-react'
import { ArrowUpRight, ClipboardCheck, FileText, Inbox, Send, UserCheck } from 'lucide-react'
import { Button } from './IcmPageKit'
import type { AuditProject } from '../data/auditProjects'
import type { WorkflowIssue, WorkflowRectification } from '../store/workflowStore'
import { buildHomeAnalytics, type AnalyticsItem } from '../pages/homeAnalytics'

const palette = ['#2369b9', '#d99327', '#56a5b4', '#29966d', '#7f91a6']
const axis = { axisLine: { lineStyle: { color: '#dbe5f1' } }, axisTick: { show: false }, axisLabel: { color: '#64748b', fontSize: 10 } }
const chartBase = { animationDuration: 250, aria: { enabled: true }, textStyle: { fontFamily: 'Microsoft YaHei, sans-serif' } }

function ringOption(items: AnalyticsItem[], centerText: string, centerLabel: string, colors: string[]) {
  const total = items.reduce((sum, item) => sum + item.value, 0)
  return {
    ...chartBase,
    color: colors,
    title: { text: total ? centerText : '—', subtext: total ? centerLabel : '暂无数据', left: '29%', top: 'center', padding: 0, textAlign: 'center', itemGap: 4, textStyle: { fontSize: 20, color: '#173554' }, subtextStyle: { fontSize: 10, color: '#64748b' } },
    tooltip: { trigger: 'item', formatter: '{b}：{c} 项（{d}%）' },
    legend: { data: items.map((item) => item.name), orient: 'vertical', right: 0, top: 'middle', selectedMode: false, itemWidth: 7, itemHeight: 7, itemGap: 10, textStyle: { fontSize: 10, color: '#64748b' }, formatter: (name: string) => `${name === '已整改' ? '已整改待销号' : name}  ${items.find((item) => item.name === name)?.value ?? 0}` },
    series: [{ type: 'pie', radius: ['50%', '73%'], center: ['29%', '50%'], label: { show: false }, showEmptyCircle: true, emptyCircleStyle: { color: '#e8eef7' }, data: total ? items : [], cursor: 'pointer' }],
  }
}

export default function HomeAnalytics({ projects, issues, rectifications }: { projects: AuditProject[]; issues: WorkflowIssue[]; rectifications: WorkflowRectification[] }) {
  const navigate = useNavigate()
  const { roleId } = useIcmDemoRole()
  const data = buildHomeAnalytics(projects, issues, rectifications)
  const onChartClick = (event: { data?: { route?: string } }) => {
    if (event.data?.route) navigate(event.data.route)
  }
  const stageOption = {
    ...chartBase,
    tooltip: { trigger: 'item', formatter: '{b}：{c} 个项目' },
    grid: { left: 8, right: 12, top: 18, bottom: 5, containLabel: true },
    xAxis: { ...axis, type: 'category', data: data.stages.map((item) => item.name), axisLabel: { ...axis.axisLabel, interval: 0 } },
    yAxis: { ...axis, type: 'value', minInterval: 1, splitNumber: 3, splitLine: { lineStyle: { color: '#edf2f8' } } },
    series: [{ type: 'bar', barMaxWidth: 32, label: { show: true, position: 'top', color: '#64748b', fontSize: 10 }, data: data.stages.map((item, index) => ({ ...item, itemStyle: { color: palette[index], borderRadius: [2, 2, 0, 0] } })) }],
  }
  const issueOption = {
    ...chartBase,
    color: [palette[0], palette[3]],
    tooltip: { trigger: 'item', formatter: '{b} · {a}：{c} 个问题' },
    legend: { top: 0, right: 0, selectedMode: false, itemWidth: 8, itemHeight: 6, textStyle: { fontSize: 10, color: '#64748b' } },
    grid: { left: 8, right: 12, top: 25, bottom: 5, containLabel: true },
    xAxis: { ...axis, type: 'category', data: data.issueSeries[0].items.map((item) => item.name) },
    yAxis: { ...axis, type: 'value', minInterval: 1, splitNumber: 3, splitLine: { lineStyle: { color: '#edf2f8' } } },
    series: data.issueSeries.map((group) => ({ name: group.name, type: 'bar', barMaxWidth: 26, label: { show: true, position: 'top', color: '#64748b', fontSize: 10 }, data: group.items })),
  }
  const charts = [
    { id: 'project-stages', title: '项目阶段分布', note: `全部 ${data.projectTotal} 项`, description: '全部可访问项目按当前阶段统计；准备、实施、报告三阶段之和等于上方在审项目数。', route: '/projects', option: stageOption, links: data.stages },
    { id: 'issue-levels', title: '问题等级与闭环', note: `有效问题 ${data.issueTotal} 项`, description: '按重大、重要、一般展示待闭环和已关闭问题，排除被合并记录；待闭环柱合计等于上方待闭环问题数。', route: '/issues?scope=unmerged', option: issueOption, links: data.issueSeries.flatMap((group) => group.items.map((item) => ({ ...item, name: `${item.name} · ${group.name}` }))) },
    { id: 'project-types', title: '在审项目类型', note: '按审计类型', description: '与上方在审项目使用相同范围，展示财务、工程、经济责任审计的构成。', route: '/projects?stage=active', option: ringOption(data.types, String(data.activeTotal), '在审项目', palette), links: data.types },
    { id: 'rectification-stages', title: '整改销号进度', note: `${data.closed}/${data.rectTotal} 已销号`, description: `销号率 = 已销号 ${data.closed} 项 ÷ 全部整改 ${data.rectTotal} 项。已整改待销号不算闭环，逾期整改属于待方案审批或整改中的子集。`, route: '/rectify', option: ringOption(data.rectStages, `${data.closeRate ?? 0}%`, '销号率', [palette[1], palette[0], palette[2], palette[3]]), links: data.rectStages },
  ]

  return <section className="icm-home-analytics icm-card" aria-label="项目与整改分析">
    <div className="icm-home-chart-grid">
      {charts.map((chart) => <article className="icm-home-chart" key={chart.id} data-chart={chart.id}>
        <button className="icm-home-chart-title" type="button" title={`${chart.description} 点击查看全部明细。`} onClick={() => navigate(chart.route)}><strong>{chart.title}</strong><span>{chart.note}</span><ArrowUpRight size={12} /></button>
        <div className="icm-home-chart-canvas" role="group" aria-label={chart.description}>
          <ReactECharts style={{ height: '100%', minHeight: 0 }} option={chart.option} onEvents={{ click: onChartClick }} notMerge />
          <div className="icm-home-chart-accessible">{chart.links.map((item) => <button key={item.name} type="button" onClick={() => navigate(item.route)}>{item.name}：{item.value} 项，查看明细</button>)}</div>
        </div>
      </article>)}
    </div>
    <div className="icm-home-shortcuts">
      <span><ClipboardCheck size={14} />快捷入口</span>
      {canSeeTopPage(roleId, 'plan') && <Button size="sm" type="default-soft" icon={<Send size={13} />} onClick={() => navigate('/plan-workbench')}>年度审计计划</Button>}
      <Button size="sm" type="default-soft" icon={<Inbox size={13} />} onClick={() => navigate('/data-collect')}>材料采集</Button>
      <Button size="sm" type="default-soft" icon={<UserCheck size={13} />} onClick={() => navigate('/audit-center')}>审核待办</Button>
      <Button size="sm" type="default-soft" icon={<FileText size={13} />} onClick={() => navigate('/report')}>报告中心</Button>
    </div>
  </section>
}
