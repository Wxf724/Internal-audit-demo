import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button } from '@/components'
import { canSeeProjectPage, canSeeTopPage } from '../pageVisibility'
import { useIcmDemoRole } from '../AppShell'
import { Card, DataTable, DetailLine, Kpi, PageFrame, Tag } from '../components/IcmPageKit'
import { projectSections } from '../components/ProjectNavigation'
import { useAnnualPlanStore } from '../store/annualPlanStore'
import { useTaskDispatchStore } from '../store/taskDispatchStore'
import { useAgentRuntimeStore } from '../agents/store'
import { ExecutionArrangement } from './ExecutionArrangement'
import { ProjectPreparation } from './ProjectPreparation'
import { ProjectDeleteButton } from './ProjectDeleteButton'
import { ProjectAuditReport } from './ProjectAuditReport'
import { projectLinks } from './projectRelations'
import { useProjectNavigate, useProjectRecords, useProjectScope } from './projectScope'
import { canViewProject } from './workplaceMetrics'
import TaskCenter from './TaskCenter'
import IssueLedger from './IssueLedger'
import RectifyBoard from './RectificationLedger'
import './audit-project-workspace.css'
import './project-planning.css'
import './project-detail.css'
import { EmbeddedProject } from '../components/EmbeddedProject'
import { ProjectExecution } from './ProjectExecution'
import { ProjectPapers } from './ProjectPapers'
import { ProjectArchive } from './ProjectArchive'
import { ProjectAI } from './ProjectAI'
import type { ProjectAssistRequest } from './projectAssistTypes'

export default function ProjectWorkbench() {
  const { project } = useProjectScope()
  const { role } = useIcmDemoRole()
  const navigate = useProjectNavigate()
  const [params, setParams] = useSearchParams()
  const plans = useAnnualPlanStore((s) => s.plans)
  const allTasks = useTaskDispatchStore((s) => s.tasks)
  const allRuns = useAgentRuntimeStore((s) => s.runs)
  const { issues, rectifications } = useProjectRecords()
  const [arrange, setArrange] = useState(false)
  const [ai, setAi] = useState<ProjectAssistRequest>(), [draftRevision, setDraftRevision] = useState(0)
  const visibleSections = projectSections.filter((section) => canSeeProjectPage(role.id, section.id))
  const requested = params.get('tab') ?? 'overview'
  const tab = requested === 'materials' ? 'execution' : visibleSections.some((s) => s.id === requested) ? requested : 'overview'
  const execution = requested === 'materials' ? 'data' : params.get('section') ?? 'data'
  const setTab = (next: string) => setParams((p) => { p.set('tab', next); return p })
  if (!project || !canViewProject(project, role)) return <PageFrame title="项目不可访问" subtitle="请返回台账，选择当前身份可访问的项目。"><Button onClick={() => navigate('/projects')}>返回项目台账</Button></PageFrame>
  const links = projectLinks(project, plans)
  const tasks = allTasks.filter((t) => t.projectId === project.id || project.taskIds.includes(t.id))
  const runs = allRuns.filter((r) => r.projectId === project.id)
  const openRects = rectifications.filter((r) => r.status !== '已销号')
  const archived = Boolean(project.archivedAt || project.stage === '已归档')
  const section = projectSections.find((s) => s.id === tab)!
  return <div className="project-detail"><PageFrame title={project.name} subtitle={section.label + ' · ' + project.id} actions={<><Tag tone="blue">{project.closedAt ? '审计已结项' : project.stage}</Tag><Tag tone={openRects.length ? 'amber' : 'green'}>{openRects.length ? openRects.length + ' 项整改跟踪中' : '无待销号整改'}</Tag><Tag tone={archived ? 'green' : 'gray'}>{archived ? '已归档' : '未归档'}</Tag><ProjectDeleteButton project={project} onDeleted={() => navigate('/projects?view=projects')}/></>}>
    <nav className="project-mobile-stages" aria-label="小屏项目环节">{visibleSections.map((s)=><button key={s.id} aria-current={tab===s.id?'page':undefined} onClick={()=>setTab(s.id)}>{s.label}</button>)}</nav>
    <EmbeddedProject.Provider value={true}><div className="project-workspace-content">
      {tab === 'overview' && <>
        <div className="project-summary-grid"><Kpi compact label="执行任务" value={String(tasks.length)} note={`${tasks.filter((t) => ['已完成', '已归档'].includes(t.status)).length} 项已完成`} tone="blue" /><Kpi compact label="审计发现" value={String(issues.filter((i) => !i.mergedIntoId).length)} note="问题台账关联记录" tone="amber" /><Kpi compact label="待销号整改" value={String(openRects.length)} note="含已整改待销号事项" tone="cyan" /><Kpi compact label="智能体运行" value={String(runs.length)} note="当前项目运行记录" tone="green" /></div>
        <div className="project-overview-single"><Card title="项目范围与实施安排"><DetailLine label="项目编号" value={project.id} /><DetailLine label="审计类型" value={project.type} /><DetailLine label="覆盖期间" value={project.period} /><DetailLine label="目标与范围" value={project.scope} /><DetailLine label="风险主题" value={project.risk || '尚未登记'} /><DetailLine label="实际实施" value={project.actualImplementation || '尚未登记'} />{project.authorization && <DetailLine label="立项授权" value={project.authorization} />}</Card></div>
        <Card title="计划执行关联" note="一个项目可承接多个计划项；一个计划项可拆为多个执行项目。" action={!archived && <Button onClick={() => setArrange(true)}>关联计划项</Button>}>
          {links.length ? <DataTable columns={['计划项 / 来源年度', '批准版本', '本项目承担范围', '成果与验收要求', '关联记录']} rows={links.map((link) => [canSeeTopPage(role.id, 'plan') ? <button className="icm-link project-table-title" onClick={() => navigate(`/plan-workbench?year=${link.year}&peek=${link.itemId}`)}>{link.itemName}<small>{link.year} 年 · {link.annualPlanId}</small></button> : <span className="project-table-title">{link.itemName}<small>{link.year} 年 · {link.annualPlanId}</small></span>, link.version ? `V${link.version}` : '历史版本未留存', link.scope, link.deliverable, <>{link.linkedBy}<small className="project-block">{link.linkedAt ? new Date(link.linkedAt).toLocaleDateString('zh-CN') : '历史导入'}</small></>])} /> : <p className="project-help">{project.planId ? `历史计划来源：${project.planId}，尚未关联年度计划项。` : '本项目未关联年度计划项，可根据批准的年度安排补充关联。'}</p>}
        </Card>
      </>}
      {tab === 'preparation' && <ProjectPreparation key={project.id + ':' + project.preparation?.version + ':' + project.preparation?.status + ':' + draftRevision} project={project} onAssist={setAi} />}
      {tab === 'execution' && <><nav className="project-subnav" aria-label="审计实施功能">{[['data', '资料与分析'], ['papers', '底稿与复核'], ['tasks', '任务跟进']].map(([id, label]) => <button className={execution === id ? 'active' : ''} key={id} onClick={() => setParams((p) => {p.set('tab','execution'); p.set('section',id); return p})}>{label}</button>)}</nav>
        {execution === 'tasks' && <><details open className="project-section"><summary>执行任务明细（{tasks.length}）</summary><TaskCenter /></details></>}
        {execution === 'data' && <ProjectExecution project={project} />}
        {execution === 'papers' && <ProjectPapers key={draftRevision} project={project} onAssist={setAi} />}
        {execution === 'agents' && <Card title="辅助功能已融入业务环节" note="在具体编辑位置选择资料、预览并采纳，无需到独立页面寻找。"><div className="icm-actions"><Button onClick={() => setTab('preparation')}>去整理方案方法</Button><Button onClick={() => setParams((p) => {p.set('section','papers');return p})}>去整理底稿事实</Button>{canSeeProjectPage(role.id, 'report') && <Button onClick={() => setTab('report')}>去起草报告章节</Button>}</div></Card>}
      </>}
      {tab === 'findings' && <IssueLedger />}
      {tab === 'report' && <ProjectAuditReport key={project.id + ':' + project.auditReport?.status + ':' + draftRevision} project={project} />}
      {tab === 'rectification' && <RectifyBoard />}
      {tab === 'archive' && <ProjectArchive project={project} />}
    </div></EmbeddedProject.Provider>
    {ai && <ProjectAI project={project} request={ai} onClose={() => setAi(undefined)} onApplied={() => setDraftRevision((v) => v + 1)} />}
    {arrange && <ExecutionArrangement projectId={project.id} onClose={() => setArrange(false)} />}
  </PageFrame></div>
}
