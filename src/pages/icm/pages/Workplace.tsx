import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, ChevronRight, Clock3, FolderKanban, Megaphone, Newspaper, ShieldAlert } from 'lucide-react'

import { Button, Card, DataTable, Tag, type Tone } from '../components/IcmPageKit'
import { useWorkflowStore } from '../store/workflowStore'
import HomeIntelligence from '../components/HomeIntelligence'
import HomeAnalytics from '../components/HomeAnalytics'
import { useAuditProjectStore } from '../store/auditProjectStore'
import { useAnnualPlanStore } from '../store/annualPlanStore'
import { canSeePageRoute, canSeeTopPage } from '../pageVisibility'
import { useIcmDemoRole } from '../AppShell'
import { canViewProject, daysUntil, isActiveProject, isOpenIssue, isOverdueRectification, isUnfinishedRectification, uniqueWorkItems } from './workplaceMetrics'
import './home-ai.css'

type HomeTab = 'todo' | 'mine' | 'tracking' | 'notice'

const notices = [
  ['关于报送2026年二季度内控检查整改情况的通知', '2026-07-12'],
  ['关于开展采购围标风险专项检查的工作提示', '2026-07-10'],
  ['关于补充供应商准入资料的催办通知', '2026-07-08'],
  ['关于更新检查底稿模板及引用口径的公告', '2026-07-06'],
  ['内控检查管理系统例行维护公告', '2026-07-03'],
]

const news = [
  { title: '集团召开年度内控检查工作推进会', date: '2026-07-12', image: '/images/news-meeting.jpg' },
  { title: '采购管理专项检查经验在系统内发布', date: '2026-07-10', image: '/images/news-experience.jpg' },
  { title: '内控监督部组织检查组业务培训', date: '2026-07-08', image: '/images/news-training.jpg' },
]

const groupNews = [
  ['集团发布2026年下半年内控检查工作安排', '2026-07-12'],
  ['华北装备制造集团完成采购管理制度修订', '2026-07-11'],
  ['财务共享中心上线付款审批异常预警规则', '2026-07-09'],
  ['供应链管理部开展供应商准入专项自查', '2026-07-07'],
  ['内控监督部召开整改闭环专题会', '2026-07-05'],
]

export default function Workplace() {
  const navigate = useNavigate()
  const { role } = useIcmDemoRole()
  const projects = useAuditProjectStore((state) => state.projects)
  const [tab, setTab] = useState<HomeTab>('todo')
  const showPlans = canSeeTopPage(role.id, 'plan')
  const activeTab = tab === 'mine' && !showPlans ? 'todo' : tab
  const [slide, setSlide] = useState(0)
  const [infoTab, setInfoTab] = useState<'group' | 'notice'>('group')

  useEffect(() => {
    const timer = window.setInterval(() => setSlide((index) => (index + 1) % news.length), 5000)
    return () => window.clearInterval(timer)
  }, [])

  const issues = useWorkflowStore((state) => state.issues)
  const rectifications = useWorkflowStore((state) => state.rectifications)
  const audits = useWorkflowStore((state) => state.audits)
  const plans = useAnnualPlanStore((state) => state.plans)
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
        priority: a.type === '计划校审' || a.type === '报告审核' || issues.some((issue) => issue.id === a.businessId && issue.level === '重大') ? '高' : '中',
        route: a.route,
        dueHint: a.submittedAt.slice(0, 10),
      })
    })
    issues.filter((i) => !i.mergedIntoId && (i.status === '待确认' || i.status === '分级审核不通过')).forEach((i) => {
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
    plans.filter((plan) => plan.status !== '已批准').forEach((plan) => {
      const pendingNode = plan.status === '审批中' ? plan.submissions.at(-1)?.steps.find((node) => node.status === '待处理') : undefined
      items.push({ type: pendingNode ? '计划审批' : '计划编制', title: plan.content.name, sourceId: plan.id, node: pendingNode ? `${pendingNode.name} · ${pendingNode.actor.name}` : plan.status === '已退回' ? '退回修订' : '编制并提交审批', status: '待处理', priority: plan.status === '已退回' ? '高' : '中', route: `/plan-workbench?annual=${plan.id}&tab=${pendingNode ? 'approval' : 'basic'}`, dueHint: '' })
    })
    return uniqueWorkItems(items).filter((item) => canSeePageRoute(role.id, item.route)).sort((a, b) => (a.priority === '高' ? -1 : 1) - (b.priority === '高' ? -1 : 1))
  }, [audits, issues, rectifications, reports, plans, role.id])

  const visibleProjects = projects.filter((project) => canViewProject(project, role))
  const activeProjects = visibleProjects.filter(isActiveProject)
  const openIssues = issues.filter(isOpenIssue)
  const overdueRects = rectifications.filter((rect) => isOverdueRectification(rect))
  const dueSoonRects = rectifications.filter((rect) => {
    const days = daysUntil(rect.deadline)
    return isUnfinishedRectification(rect) && days !== null && days >= 0 && days <= 7
  })
  const longestOverdue = Math.max(0, ...overdueRects.map((rect) => -(daysUntil(rect.deadline) ?? 0)))
  const openTodos = () => {
    setTab('todo')
    window.requestAnimationFrame(() => {
      const list = document.getElementById('home-todo-list')
      list?.scrollIntoView({ block: 'nearest' })
      list?.focus({ preventScroll: true })
    })
  }

  const stats = [
    { label: '待办事项', value: todoList.length, note: `高优先级 ${todoList.filter((item) => item.priority === '高').length} · 计划办理 ${todoList.filter((item) => item.type.startsWith('计划')).length}`, hint: '当前业务数据中的待办，按业务编号合并；包含审核、问题定稿、整改方案、报告修改和计划办理。点击查看待办清单。', icon: Clock3, tone: 'amber' as Tone, onClick: openTodos },
    { label: '在审项目', value: activeProjects.length, note: `准备 ${activeProjects.filter((p) => p.stage === '准备中').length} · 实施 ${activeProjects.filter((p) => p.stage === '实施中').length} · 报告 ${activeProjects.filter((p) => p.stage === '报告中').length}`, hint: '当前角色可访问的准备中、实施中、报告中项目；不含整改跟踪和已归档项目。点击查看在审项目。', icon: FolderKanban, tone: 'blue' as Tone, onClick: () => navigate('/projects?stage=active') },
    { label: '待闭环问题', value: openIssues.length, note: `重大 ${openIssues.filter((i) => i.level === '重大').length} · 已整改待关闭 ${openIssues.filter((i) => i.status === '已整改').length}`, hint: '尚未关闭且未被合并的问题；已整改但未关闭仍计入。点击查看待闭环问题。', icon: ShieldAlert, tone: 'cyan' as Tone, onClick: () => navigate('/issues?status=open') },
    { label: '逾期整改', value: overdueRects.length, note: `最长逾期 ${longestOverdue} 天 · 7天内到期 ${dueSoonRects.length}`, hint: '截至今天，超过整改期限且尚未完成整改的事项，按整改编号统计，不再叠加来源问题。点击查看逾期整改。', icon: AlertTriangle, tone: 'red' as Tone, onClick: () => navigate('/rectify?status=overdue') },
  ]

  return (
    <div className="icm-home-dashboard"><div className="icm-page" aria-label="首页">
      <div className="icm-home-stat-grid">
        {stats.map((item) => {
          const Icon = item.icon
          return (
            <button type="button" className={`icm-home-stat tone-${item.tone}`} key={item.label} onClick={item.onClick} title={item.hint} aria-label={`${item.label} ${item.value}，${item.note}，查看明细`}>
              <span className="icm-home-stat-icon"><Icon size={24} /></span>
              <div><strong>{item.value}</strong><b>{item.label}</b><em>{item.note}</em></div>
              <ChevronRight className="icm-home-stat-arrow" size={15} />
            </button>
          )
        })}
      </div>

      <div className="icm-home-workspace">
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
        <Card title="工作待办" action={<div className="icm-home-todo-actions"><Button size="sm" type="primary" onClick={() => navigate('/projects')}>进入审计项目</Button><Button size="sm" type="primary-soft" onClick={() => navigate('/audit-center')}>处理审核事项</Button></div>}>
          <div className="icm-home-tabs" role="tablist">
            {([
              ['todo', `待办事项${todoList.length > 0 ? `（${todoList.length}）` : ''}`],
              ['mine', '我负责的计划'],
              ['tracking', '整改跟踪'],
            ] as const).filter(([key]) => key !== 'mine' || showPlans).map(([key, label]) => (
              <button className={activeTab === key ? 'active' : ''} type="button" key={key} onClick={() => setTab(key)}>{label}</button>
            ))}
          </div>

          {activeTab === 'todo' ? (
            <div className="icm-home-scroll" id="home-todo-list" tabIndex={-1} aria-label="待办事项清单">
              {todoList.length === 0 ? (
                <div className="icm-empty-inline">当前无待办事项</div>
              ) : (
                <DataTable compact
                  columns={['事项类型', '摘要', '当前节点', '优先级']}
                  onRowClick={(index) => navigate(todoList[index].route)}
                  rows={todoList.map((item) => [
                    item.type,
                    item.title,
                    item.node,
                    <Tag tone={item.priority === '高' ? 'red' : item.priority === '中' ? 'amber' : 'blue'}>{item.priority}</Tag>,
                  ])}
                />
              )}
            </div>
          ) : activeTab === 'mine' ? (
            <div className="icm-home-scroll">
              <DataTable compact
                columns={['计划名称', '编制部门']}
                onRowClick={(index) => navigate(`/plan-workbench?annual=${plans.filter((plan) => plan.creator.id === role.id)[index].id}`)}
                rows={plans.filter((p) => p.creator.id === role.id).map((p) => [
                  p.content.name,
                  p.content.department,
                ])}
              />
            </div>
          ) : (
            <div className="icm-home-scroll">
              <DataTable compact
                columns={['整改事项', '责任部门', '进度']}
                onRowClick={(index) => navigate(`/rectify?rect=${rectifications.filter((rectification) => rectification.status === '整改中' || rectification.status === '待方案审批')[index].id}`)}
                rows={rectifications.filter((r) => r.status === '整改中' || r.status === '待方案审批').map((r) => {
                  const issue = issues.find((i) => i.id === r.issueId)
                  return [
                    r.title,
                    issue?.owner ?? r.owner,
                    `${r.progress}%`,
                  ]
                })}
              />
            </div>
          )}
        </Card>
        <HomeAnalytics projects={visibleProjects} issues={issues} rectifications={rectifications} />
        <HomeIntelligence />
      </div>
    </div></div>
  )
}
