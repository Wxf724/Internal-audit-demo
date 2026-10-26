import { useState } from 'react'
import { ExecutionArrangement } from '../ExecutionArrangement'
import { linkedProjects, itemExecutionStatus } from '../projectRelations'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowUpRight, CalendarDays } from 'lucide-react'
import { Button, Modal } from '@/components'
import { demoRoles, useIcmDemoRole } from '../../AppShell'
import { DetailLine, PageFrame, Tag } from '../../components/IcmPageKit'
import { useAnnualPlanStore } from '../../store/annualPlanStore'
import { useAuditProjectStore } from '../../store/auditProjectStore'
import { AnnualOverview } from './AnnualOverview'
import { AnnualPlanDetail } from './AnnualPlanDetail'
import { PlanConversation } from './PlanConversation'
import { canEditPlan } from './model'
import { businessContent, chinaToday } from './planning'
import './annual-plan.css'

export default function AnnualPlanningHub() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const { role } = useIcmDemoRole()
  const plans = useAnnualPlanStore((state) => state.plans)
  const create = useAnnualPlanStore((state) => state.create)
  const projects = useAuditProjectStore((state) => state.projects)
  const [arrangeOpen, setArrangeOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(() => ['create', 'fill'].includes(params.get('view') ?? ''))
  const [newYear, setNewYear] = useState(Number(chinaToday().slice(0, 4)) + 1)
  const [notice, setNotice] = useState('')
  const currentYear = Number(chinaToday().slice(0, 4))
  const requested = params.get('annual') ?? params.get('plan')
  const detail = plans.find((plan) => plan.id === requested || plan.content.items.some((item) => item.id === requested))
  const year = Number(params.get('year') ?? currentYear)
  const plan = detail ?? plans.find((item) => item.year === year) ?? plans.find((item) => item.year === currentYear) ?? plans[0]
  const view = params.get('view') === 'list' ? 'list' : 'gantt'
  const peek = params.get('peek')
  const content = businessContent(plan)
  const item = content.items.find((entry) => entry.id === peek)
  const linked = item ? linkedProjects(plan, item, projects) : []
  const project = linked.length === 1 ? linked[0] : undefined
  const goDetail = (tab = 'basic') => setParams({ annual: plan.id, year: String(plan.year), tab, view })
  const closePeek = () => { const next = new URLSearchParams(params); next.delete('peek'); setParams(next, { replace: true }) }
  const launch = () => { if (item && plan.approved) setArrangeOpen(true) }
  const handleCreate = () => {
    try {
      const others = demoRoles.filter((person) => person.id !== role.id)
      const id = create(newYear, role, others[0], others[1])
      setCreateOpen(false); setParams({ annual: id, year: String(newYear), tab: 'compose' }); setNotice('')
    } catch (error) { setNotice((error as Error).message) }
  }
  if (requested && !detail) return <PageFrame title="年度计划未找到" subtitle="该计划编号不存在或已失效。"><Button onClick={() => setParams({ year: String(currentYear) })}>返回年度总览</Button></PageFrame>
  if (detail && (params.get('tab') === 'compose' || (canEditPlan(detail, role) && !['approval', 'changes'].includes(params.get('tab') ?? '')))) return <PlanConversation key={detail.id} plan={detail} onBack={() => setParams({ year: String(detail.year), view })} />
  if (detail) return <AnnualPlanDetail key={detail.id} plan={detail} tab={params.get('tab') ?? 'basic'} onTab={goDetail} onBack={() => setParams({ year: String(detail.year), view })} />
  return <div className="annual-hub"><PageFrame title="年度审计计划" subtitle="">

    {notice && <p role="status" className="annual-notice">{notice}</p>}
    {params.get('view') === 'approve' && <div className="annual-notice">{plans.filter((p) => p.status === '审批中').length ? plans.filter((p) => p.status === '审批中').map((p) => <Button key={p.id} onClick={() => setParams({ annual: p.id, tab: 'approval' })}>办理 {p.year} 年度计划</Button>) : '暂无待审议的年度计划。'}</div>}
    <AnnualOverview key={plan.id} plan={plan} projects={projects} view={view} annualControls={<><select className="icm-select annual-year-filter" aria-label="计划年度" value={plan.year} onChange={(e) => { setNotice(''); setParams({ year: e.target.value, view }) }}>{[...plans].sort((a, b) => b.year - a.year).map((entry) => <option key={entry.id} value={entry.year}>{entry.year} 年度</option>)}</select><Tag tone={plan.approved ? 'green' : 'blue'}>{plan.status}</Tag></>} onPlan={() => setParams({ year: String(plan.year), view, peek: 'annual' })} onCreate={() => setCreateOpen(true)} onView={(next) => setParams({ year: String(plan.year), view: next })} onSelect={(id) => setParams({ year: String(plan.year), view, peek: id })} onDetail={goDetail} />
    <Modal className="annual-overlay" open={Boolean(peek)} drawer width="min(560px, 100vw)" title={peek === 'annual' ? '年度计划概览' : '项目计划详情'} onClose={closePeek} footer={<><Button onClick={closePeek}>关闭</Button><Button onClick={() => goDetail(item ? 'projects' : 'basic')}>查看详情</Button>{item && plan.approved && <Button type="primary" icon={<ArrowUpRight size={15} />} onClick={launch}>安排执行</Button>}</>}>
      {peek === 'annual' ? <div className="annual-drawer-content"><CalendarDays size={26} /><h2>{content.name}</h2><Tag tone={plan.approved ? 'green' : 'blue'}>{plan.status}</Tag><DetailLine label="计划编号" value={plan.id} /><DetailLine label="编制机构" value={content.department} /><DetailLine label="年度目标" value={content.objective || '待补充'} /><DetailLine label="编制依据" value={content.basis || '待补充'} /><DetailLine label="项目与资源" value={`${content.items.length} 项 / ${content.items.reduce((sum, entry) => sum + entry.workdays, 0)} 人天`} /><DetailLine label="批准版本" value={plan.approved ? `V${plan.approved.version} · ${plan.approved.steps.at(-1)?.at}` : '尚未批准'} /><h3>审议安排</h3><ol className="annual-step-list">{(plan.content.reviewStages ?? []).map((name) => <li key={name}><strong>{name}</strong><span>{plan.submissions.at(-1)?.steps.find((step) => step.name === name)?.status ?? '未提交'}</span></li>)}</ol></div> : item ? <div className="annual-drawer-content"><span className="annual-eyebrow">{plan.year} 年度 · {item.type}</span><h2>{item.name}</h2><div className="annual-actions"><Tag tone="blue">{itemExecutionStatus(plan, item, projects)}</Tag><Tag tone={item.priority === '高' ? 'red' : 'gray'}>{item.priority ?? '中'}优先级</Tag></div><DetailLine label="被审计单位" value={item.subject} /><DetailLine label="安排依据" value={item.risk} /><DetailLine label="项目来源" value={item.source ?? '年度安排'} /><DetailLine label="审计覆盖期间" value={item.period} /><DetailLine label="计划实施窗口" value={`${item.start} 至 ${item.end}`} /><DetailLine label="实际实施" value={project?.actualImplementation ?? '尚未登记'} /><DetailLine label="资源投入" value={`${item.workdays} 人天 · ${item.owner}`} /><DetailLine label="目标与范围" value={item.scope} /><DetailLine label="执行项目" value={linked.length ? `${linked.length} 个项目` : '尚未安排执行'} /><div className="annual-actions">{linked.map((entry) => <Button key={entry.id} onClick={() => navigate(`/projects/${entry.id}`)}>{entry.name} · {entry.stage}</Button>)}</div></div> : <p>未找到对应项目，请重新选择。</p>}
    </Modal>
    {arrangeOpen && item && <ExecutionArrangement annualId={plan.id} itemId={item.id} onClose={() => setArrangeOpen(false)} />}
    <Modal className="annual-overlay" open={createOpen} title="新建年度计划" onClose={() => { setCreateOpen(false); setNotice('') }} footer={<><Button onClick={() => setCreateOpen(false)}>取消</Button><Button type="primary" onClick={handleCreate}>创建草案</Button></>}><div className="annual-form"><label>计划年度<input className="icm-input" type="number" min="2000" max="2100" value={newYear} onChange={(e) => setNewYear(Number(e.target.value))} /></label><p>由内审机构统一编制，同一年度维护一份计划及其调整版本。</p>{notice && <p role="alert" className="annual-error">{notice}</p>}</div></Modal>
  </PageFrame></div>
}
