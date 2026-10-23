import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ReactECharts from 'echarts-for-react'
import { AlertTriangle, ClipboardCheck, Clock3, FileCheck2, FileText, Inbox, Megaphone, Newspaper, Send, ShieldAlert, UserCheck } from 'lucide-react'

import { Button, Card, DataTable, PageFrame, Tag, Toolbar, type Tone } from '../components/IcmPageKit'
import { cockpit, overview, rectifications as legacyRects, tasks } from '../data'
import { useWorkflowStore } from '../store/workflowStore'

type HomeTab = 'todo' | 'mine' | 'tracking' | 'notice'

const notices = [
  ['关于报送2026年二季度内控检查整改情况的通知', '2026-07-12'],
  ['关于开展采购围标风险专项检查的工作提示', '2026-07-10'],
  ['关于补充供应商准入资料的催办通知', '2026-07-08'],
  ['关于更新检查底稿模板及引用口径的公告', '2026-07-06'],
  ['内控检查管理系统例行维护公告', '2026-07-03'],
]

const news = [
  { title: '集团召开年度内控检查工作推进会', date: '2026-07-12', image: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=900&q=80' },
  { title: '采购管理专项检查经验在系统内发布', date: '2026-07-10', image: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=900&q=80' },
  { title: '内控监督部组织检查组业务培训', date: '2026-07-08', image: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=900&q=80' },
]

const groupNews = [
  ['集团发布2026年下半年内控检查工作安排', '2026-07-12'],
  ['华北装备制造集团完成采购管理制度修订', '2026-07-11'],
  ['财务共享中心上线付款审批异常预警规则', '2026-07-09'],
  ['供应链管理部开展供应商准入专项自查', '2026-07-07'],
  ['内控监督部召开整改闭环专题会', '2026-07-05'],
]

function lineOption(labels: string[], planned: number[], actual: number[], plannedName = '计划目标', actualName = '实际完成') {
  return { tooltip: { trigger: 'axis' }, legend: { top: 0, right: 0, textStyle: { color: '#64748b', fontSize: 10 }, itemWidth: 10, itemHeight: 6 }, grid: { left: 28, right: 8, top: 30, bottom: 24, containLabel: true }, xAxis: { type: 'category', data: labels, boundaryGap: false, axisLine: { lineStyle: { color: '#dbe5f1' } }, axisLabel: { color: '#748299', fontSize: 10 } }, yAxis: { type: 'value', splitLine: { lineStyle: { color: '#edf2f8' } }, axisLabel: { color: '#94a3b8', fontSize: 10 } }, series: [{ name: plannedName, type: 'line', smooth: true, data: planned, symbolSize: 5, lineStyle: { color: '#155bd4', width: 2 }, itemStyle: { color: '#155bd4' }, areaStyle: { color: 'rgba(21,91,212,.08)' } }, { name: actualName, type: 'line', smooth: true, data: actual, symbolSize: 5, lineStyle: { color: '#16a34a', width: 2 }, itemStyle: { color: '#16a34a' } }] }
}

function pieOption(value: number, label: string, color = '#155bd4') {
  return { title: { text: `${value}%`, subtext: label, left: 'center', top: '37%', textStyle: { color: '#0b1f43', fontSize: 26, fontWeight: 800 }, subtextStyle: { color: '#748299', fontSize: 11 } }, series: [{ type: 'pie', radius: ['62%', '78%'], center: ['50%', '53%'], label: { show: false }, data: [{ value, itemStyle: { color } }, { value: 100 - value, itemStyle: { color: '#e8eef7' } }] }] }
}

function daysUntil(deadline: string) {
  if (!deadline || deadline === '待确认') return null
  const diff = Math.ceil((new Date(deadline).getTime() - new Date('2026-07-23').getTime()) / (1000 * 60 * 60 * 24))
  return diff
}

export default function Workplace() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<HomeTab>('todo')
  const [slide, setSlide] = useState(0)
  const [infoTab, setInfoTab] = useState<'group' | 'notice'>('group')

  useEffect(() => {
    const timer = window.setInterval(() => setSlide((index) => (index + 1) % news.length), 5000)
    return () => window.clearInterval(timer)
  }, [])

  const issues = useWorkflowStore((state) => state.issues)
  const rectifications = useWorkflowStore((state) => state.rectifications)
  const audits = useWorkflowStore((state) => state.audits)
  const plans = useWorkflowStore((state) => state.plans)
  const reports = useWorkflowStore((state) => state.reports)

  const todoList = useMemo(() => {
    const items: { type: string; title: string; sourceId: string; node: string; status: string; priority: '高' | '中' | '低'; route: string; dueHint: string }[] = []
    audits.filter((a) => a.status === '待处理').forEach((a) => {
      items.push({
        type: a.type,
        title: a.title,
        sourceId: a.businessId,
        node: a.node,
        status: '待处理',
        priority: a.type === '计划校审' || a.type === '报告审核' ? '高' : '中',
        route: a.route,
        dueHint: a.submittedAt.slice(0, 10),
      })
    })
    issues.filter((i) => i.status === '待确认' || i.status === '分级审核不通过').forEach((i) => {
      items.push({
        type: '问题定稿',
        title: i.title,
        sourceId: i.id,
        node: i.status,
        status: '待处理',
        priority: i.level === '重大' ? '高' : '中',
        route: `/issues?issue=${i.id}`,
        dueHint: i.deadline,
      })
    })
    rectifications.filter((r) => r.status === '待方案审批' || (r.status === '整改中' && r.planStatus === '待提交')).forEach((r) => {
      items.push({
        type: '整改方案',
        title: r.title,
        sourceId: r.id,
        node: r.planStatus,
        status: '待处理',
        priority: '中',
        route: `/rectify?rect=${r.id}`,
        dueHint: r.deadline,
      })
    })
    reports.filter((r) => r.status === '审核不通过').forEach((r) => {
      items.push({
        type: '报告修改',
        title: r.title,
        sourceId: r.id,
        node: '审核不通过',
        status: '待处理',
        priority: '高',
        route: `/report?report=${r.id}`,
        dueHint: r.updatedAt.slice(0, 10),
      })
    })
    return items.sort((a, b) => (a.priority === '高' ? -1 : 1) - (b.priority === '高' ? -1 : 1))
  }, [audits, issues, rectifications, reports])

  const myInitiated = plans.filter((p) => p.owner === '当前用户' || p.owner === '张衡').length
  const myTracking = rectifications.filter((r) => r.status === '整改中' || r.status === '待方案审批').length
  const overdueIssues = issues.filter((i) => {
    const d = daysUntil(i.deadline)
    return d !== null && d < 0 && i.status !== '已整改' && i.status !== '已关闭'
  }).length
  const overdueRects = rectifications.filter((r) => {
    const d = daysUntil(r.deadline)
    return d !== null && d < 0 && r.status !== '已整改' && r.status !== '已销号'
  }).length

  const majorIssues = issues.filter((i) => i.level === '重大' && i.status !== '已整改' && i.status !== '已关闭').length

  const warningItems = useMemo(() => {
    const items: { level: 'red' | 'amber'; text: string; route: string }[] = []
    if (overdueIssues > 0) items.push({ level: 'red', text: `${overdueIssues} 个问题已逾期，请督促整改`, route: '/issues' })
    if (overdueRects > 0) items.push({ level: 'red', text: `${overdueRects} 个整改事项已逾期`, route: '/rectify' })
    if (majorIssues > 0) items.push({ level: 'red', text: `${majorIssues} 个重大问题待闭环`, route: '/issues' })
    const pendingGrading = issues.filter((i) => i.status === '待分级审核').length
    if (pendingGrading > 0) items.push({ level: 'amber', text: `${pendingGrading} 个问题待分级审核`, route: '/audit-center' })
    const pendingPlanApproval = plans.filter((p) => p.status === '待校审').length
    if (pendingPlanApproval > 0) items.push({ level: 'amber', text: `${pendingPlanApproval} 个计划待校审`, route: '/audit-center' })
    return items
  }, [overdueIssues, overdueRects, majorIssues, issues, plans])

  const finishedRects = legacyRects.filter((item) => item.lane === '已整改').length
  const rectRate = Math.round((finishedRects / Math.max(legacyRects.length, 1)) * 100)

  const stats = [
    { label: '待处理', value: todoList.length, note: '需当前用户处理', icon: Clock3, tone: 'amber' as Tone },
    { label: '我发起的', value: myInitiated, note: '检查计划与专项抽查', icon: Send, tone: 'blue' as Tone },
    { label: '我跟踪的', value: myTracking, note: '整改中事项', icon: FileCheck2, tone: 'cyan' as Tone },
    { label: '逾期预警', value: overdueIssues + overdueRects, note: '问题/整改已逾期', icon: AlertTriangle, tone: 'red' as Tone },
  ]

  return (
    <PageFrame
      title="工作台"
      subtitle="个人工作入口，集中处理待办、跟踪整改、查看预警和执行进度。"
      actions={<><Button type="primary" onClick={() => navigate('/plan-workbench')}>新建检查计划</Button><Button type="primary-soft" onClick={() => navigate('/audit-center')}>进入审核中心</Button></>}
    >
      <div className="icm-home-stat-grid">
        {stats.map((item) => {
          const Icon = item.icon
          return (
            <div className={`icm-home-stat tone-${item.tone}`} key={item.label}>
              <span className="icm-home-stat-icon"><Icon size={24} /></span>
              <div><strong>{item.value}</strong><b>{item.label}</b><em>{item.note}</em></div>
            </div>
          )
        })}
      </div>

      {warningItems.length > 0 ? (
        <div className="icm-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12, marginBottom: 16 }}>
          {warningItems.map((item, index) => (
            <div
              key={index}
              className="icm-card"
              style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', borderLeft: `3px solid ${item.level === 'red' ? '#dc2626' : '#d97706'}` }}
              onClick={() => navigate(item.route)}
              role="button"
              tabIndex={0}
            >
              <ShieldAlert size={18} color={item.level === 'red' ? '#dc2626' : '#d97706'} />
              <span style={{ color: '#0f172a', fontSize: 13, fontWeight: 700 }}>{item.text}</span>
            </div>
          ))}
        </div>
      ) : null}

      <div className="icm-home-main-grid">
        <Card title="我的待办" note="集中处理待办、跟踪整改与我发起的检查计划">
          <div className="icm-home-tabs" role="tablist">
            {([
              ['todo', `待办事项${todoList.length > 0 ? `（${todoList.length}）` : ''}`],
              ['mine', '我发起的'],
              ['tracking', '我跟踪的'],
            ] as const).map(([key, label]) => (
              <button className={tab === key ? 'active' : ''} type="button" key={key} onClick={() => setTab(key)}>{label}</button>
            ))}
          </div>

          {tab === 'todo' ? (
            <div className="icm-home-scroll">
              {todoList.length === 0 ? (
                <div className="icm-empty-inline">当前无待办事项</div>
              ) : (
                <DataTable
                  columns={['事项类型', '摘要', '业务编号', '当前节点', '优先级', '状态', '操作']}
                  rows={todoList.map((item) => [
                    item.type,
                    item.title,
                    item.sourceId,
                    item.node,
                    <Tag tone={item.priority === '高' ? 'red' : item.priority === '中' ? 'amber' : 'blue'}>{item.priority}</Tag>,
                    <Tag tone="amber">{item.status}</Tag>,
                    <button className="icm-link" type="button" onClick={() => navigate(item.route)}>处理</button>,
                  ])}
                />
              )}
            </div>
          ) : tab === 'mine' ? (
            <div className="icm-home-scroll">
              <DataTable
                columns={['计划编号', '计划名称', '受检单位', '状态', '操作']}
                rows={plans.filter((p) => p.owner === '当前用户' || p.owner === '张衡').map((p) => [
                  p.id,
                  p.name,
                  p.unit,
                  <Tag tone={p.status === '已立项' ? 'green' : p.status === '已派发' ? 'cyan' : 'amber'}>{p.status}</Tag>,
                  <button className="icm-link" type="button" onClick={() => navigate(`/plan-workbench?plan=${p.id}`)}>查看</button>,
                ])}
              />
            </div>
          ) : (
            <div className="icm-home-scroll">
              <DataTable
                columns={['整改编号', '整改事项', '责任部门', '进度', '状态', '操作']}
                rows={rectifications.filter((r) => r.status === '整改中' || r.status === '待方案审批').map((r) => {
                  const issue = issues.find((i) => i.id === r.issueId)
                  return [
                    r.id,
                    r.title,
                    issue?.owner ?? r.owner,
                    `${r.progress}%`,
                    <Tag tone={r.status === '整改中' ? 'amber' : 'red'}>{r.status}</Tag>,
                    <button className="icm-link" type="button" onClick={() => navigate(`/rectify?rect=${r.id}`)}>查看</button>,
                  ]
                })}
              />
            </div>
          )}
        </Card>

        <Card title="工作动态" note="集团要闻与通知公告">
          <div className="icm-home-news-layout">
            <div className="icm-home-carousel">
              <img src={news[slide].image} alt={news[slide].title} />
              <div className="icm-home-carousel-caption">{news[slide].title}</div>
              <div className="icm-home-carousel-dots">
                {news.map((item, index) => <button aria-label={`第${index + 1}条资讯`} className={slide === index ? 'active' : ''} key={item.title} type="button" onClick={() => setSlide(index)} />)}
              </div>
            </div>
            <div className="icm-home-news-right">
              <div className="icm-home-tabs icm-home-tabs-sm" role="tablist">
                {([['group', '集团要闻'], ['notice', '通知公告']] as const).map(([key, label]) => (
                  <button className={infoTab === key ? 'active' : ''} type="button" key={key} onClick={() => setInfoTab(key)}>{label}</button>
                ))}
              </div>
              <div className="icm-home-news-list">
                {(infoTab === 'group' ? groupNews : notices).map(([title, date]) => (
                  <div className="icm-home-text-row" key={title}>
                    <span>{infoTab === 'group' ? <Newspaper size={15} /> : <Megaphone size={15} />}{title}</span>
                    <time>{date}</time>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="icm-grid cols-4" style={{ marginTop: 12 }}>
        <Card title="月度执行情况" note="计划目标与实际完成"><ReactECharts style={{ height: 168 }} option={lineOption(['2月', '3月', '4月', '5月', '6月', '7月'], [18, 24, 31, 38, 46, 54], [15, 21, 26, 31, 39, 44])} /></Card>
        <Card title="全年执行情况" note="2026年内控检查执行趋势"><ReactECharts style={{ height: 168 }} option={lineOption(overview.trends.map((item) => item.month.slice(5)), overview.trends.map((item) => item.findings), overview.trends.map((item) => item.rectified), '问题发现', '完成整改')} /></Card>
        <Card title="计划执行完成率" note={`${tasks.length} 个任务包`}><ReactECharts style={{ height: 168 }} option={pieOption(58, '执行完成率')} /></Card>
        <Card title="问题整改情况" note={`${finishedRects}/${legacyRects.length} 已整改`}><ReactECharts style={{ height: 168 }} option={pieOption(rectRate, '整改闭环率', '#16a34a')} /></Card>
      </div>

      <Toolbar>
        <ClipboardCheck size={15} /><span style={{ color: '#607089', fontSize: 12 }}>快捷入口</span>
        <Button type="default-soft" icon={<Send size={15} />} onClick={() => navigate('/plan-workbench')}>工作计划</Button>
        <Button type="default-soft" icon={<Inbox size={15} />} onClick={() => navigate('/data-collect')}>材料采集</Button>
        <Button type="default-soft" icon={<UserCheck size={15} />} onClick={() => navigate('/audit-center')}>审核中心</Button>
        <Button type="default-soft" icon={<FileText size={15} />} onClick={() => navigate('/report')}>报告中心</Button>
        <span className="icm-toolbar-spacer" /><Tag tone="blue">{cockpit.alerts.length} 条实时预警</Tag>
      </Toolbar>
    </PageFrame>
  )
}
