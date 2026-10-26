import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Settings2 } from 'lucide-react'
import { Button, Modal, Textarea } from '@/components'
import { useIcmDemoRole } from '../../AppShell'
import { Card, DataTable, DetailLine, PageFrame, Tag } from '../../components/IcmPageKit'
import { useAnnualPlanStore } from '../../store/annualPlanStore'
import { useAuditProjectStore } from '../../store/auditProjectStore'
import { AdjustmentRecords, ApprovalRecords } from './ApprovalRecords'
import { PlanBasics, ProjectItemForm } from './PlanForms'
import { EvidenceWorkspace, PlanningAssistant, RiskWorkspace } from './PlanningWorkspace'
import { canEditPlan } from './model'
import type { AnnualPlan, AnnualProjectItem, PlanContent } from './model'
import { REVIEW_STAGES } from './planning'
import { linkedProjects } from '../projectRelations'
import { ExecutionArrangement } from '../ExecutionArrangement'

const sections = [['basic', '计划概况'], ['evidence', '编制依据'], ['risks', '风险与选项'], ['projects', '项目与资源'], ['approval', '审议记录'], ['changes', '调整记录']]

export function AnnualPlanDetail({ plan, tab, onTab, onBack }: { plan: AnnualPlan; tab: string; onTab: (tab: string) => void; onBack: () => void }) {
  const navigate = useNavigate()
  const { role } = useIcmDemoRole()
  const save = useAnnualPlanStore((state) => state.save)
  const submit = useAnnualPlanStore((state) => state.submit)
  const adjust = useAnnualPlanStore((state) => state.adjust)
  const projects = useAuditProjectStore((state) => state.projects)
  const [arrangeItem, setArrangeItem] = useState<string>()
  const [notice, setNotice] = useState('')
  const [basicOpen, setBasicOpen] = useState(false)
  const [itemEditor, setItemEditor] = useState<{ item?: AnnualProjectItem } | null>(null)
  const [removeId, setRemoveId] = useState('')
  const [adjustOpen, setAdjustOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [stagesOpen, setStagesOpen] = useState(false)
  const [stages, setStages] = useState(plan.content.reviewStages ?? [...REVIEW_STAGES])
  const editable = canEditPlan(plan, role)
  const activeTab = sections.some(([key]) => key === tab) ? tab : 'basic'
  const update = (content: PlanContent) => { save(plan.id, content, role); setNotice('草案已保存。') }
  const attempt = (action: () => void) => { try { action() } catch (error) { setNotice((error as Error).message) } }
  const launch = (id: string) => attempt(() => {
    const item = plan.approved?.content.items.find((entry) => entry.id === id)
    if (!item) throw new Error('该项目尚未纳入批准版本。')
    setArrangeItem(item.id)
  })
  return <PageFrame title={plan.content.name} subtitle={`${plan.id} · ${plan.content.department}编制${plan.demo ? ' · 演示数据' : ''}`} actions={<><Button icon={<ArrowLeft size={14} />} onClick={onBack}>返回年度总览</Button>{editable && <Button type="primary" onClick={() => attempt(() => { submit(plan.id, role); onTab('approval'); setNotice('年度计划及编制依据已按版本送审。') })}>提交审议</Button>}{plan.status === '已批准' && <Button type="primary" onClick={() => setAdjustOpen(true)}>发起计划调整</Button>}</>}>
    <div className="annual-context"><Tag tone={plan.status === '已批准' ? 'green' : 'blue'}>{plan.status}</Tag><span>{plan.content.items.length} 个项目</span><span>{plan.content.items.reduce((sum, item) => sum + item.workdays, 0)} 人天</span><span>{plan.approved ? `批准版本 V${plan.approved.version} 持续有效` : '尚无批准版本'}</span></div>
    {notice && <p role="status" className="annual-notice">{notice}</p>}
    <div className="annual-detail-layout"><nav className="annual-detail-nav" aria-label="年度计划详情导航">{sections.map(([key, label]) => <button key={key} aria-current={activeTab === key ? 'page' : undefined} onClick={() => onTab(key)}>{label}</button>)}</nav><div className="annual-detail-main">
      {['basic', 'evidence', 'risks', 'projects'].includes(activeTab) && <PlanningAssistant plan={plan} editable={editable} />}
      {activeTab === 'basic' && <Card title="计划概况" action={editable ? <Button onClick={() => setBasicOpen(true)}>编辑基本信息</Button> : undefined}><DetailLine label="编制机构" value={plan.content.department} /><DetailLine label="年度目标" value={plan.content.objective || '待完善'} /><DetailLine label="编制依据" value={plan.content.basis || '待完善'} /><DetailLine label="资源预算" value={`${plan.content.capacity ?? 0} 人天`} /><DetailLine label="审议安排" value={(plan.content.reviewStages ?? []).join(' → ')} /><DetailLine label="最近更新" value={plan.updatedAt} /><div className="annual-actions annual-bottom-actions"><Button icon={<Settings2 size={15} />} disabled={!editable} onClick={() => { setStages(plan.content.reviewStages ?? [...REVIEW_STAGES]); setStagesOpen(true) }}>配置审议环节</Button><Button onClick={() => onTab('evidence')}>查看编制准备</Button></div>{plan.summary && <div className="annual-summary"><strong>年度总结</strong><p>{plan.summary}</p></div>}</Card>}
      {activeTab === 'evidence' && <EvidenceWorkspace plan={plan} editable={editable} onSave={(content) => attempt(() => update(content))} />}
      {activeTab === 'risks' && <RiskWorkspace plan={plan} editable={editable} onSave={(content) => attempt(() => update(content))} />}
      {activeTab === 'projects' && <Card title="项目清单与资源安排" note={`草案合计 ${plan.content.items.reduce((sum, item) => sum + item.workdays, 0)} 人天 / 可用 ${plan.content.capacity ?? 0} 人天。项目程序与具体人员分工在项目准备阶段细化。`} action={editable ? <Button type="primary" onClick={() => setItemEditor({})}>添加拟开展项目</Button> : undefined}>
        {plan.content.items.reduce((sum, item) => sum + item.workdays, 0) > (plan.content.capacity ?? Infinity) && <p className="annual-notice">计划投入超出可用人天，请核实资源安排或调整项目组合。</p>}
        {plan.content.items.length ? <DataTable columns={['项目名称 / 对象', '风险与来源', '实施窗口 / 覆盖期间', '资源', '操作']} rows={plan.content.items.map((item) => [<><strong>{item.name}</strong><small className="annual-muted annual-block">{item.subject}</small></>, <>{item.risk}<small className="annual-muted annual-block">{item.priority ?? '中'}优先级 · {item.source ?? '年度安排'}</small></>, <>{item.start} 至 {item.end}<small className="annual-muted annual-block">审计覆盖：{item.period}</small></>, `${item.workdays} 人天`, <div className="annual-actions">{editable && <><Button onClick={() => setItemEditor({ item })}>编辑</Button><Button onClick={() => setRemoveId(item.id)}>移出</Button></>}{plan.approved?.content.items.some((entry) => entry.id === item.id) && <><Button onClick={() => launch(item.id)}>安排执行</Button>{linkedProjects(plan, item, projects).map((project) => <Button key={project.id} onClick={() => navigate(`/projects/${project.id}`)}>{project.name}</Button>)}</>}</div>])} /> : <div className="icm-empty-inline">尚未纳入项目。可从 AI 建议采纳候选项目，或由内审机构手动添加。</div>}
      </Card>}
      {activeTab === 'approval' && <ApprovalRecords plan={plan} />}
      {activeTab === 'changes' && <AdjustmentRecords plan={plan} />}
    </div></div>
    {arrangeItem && <ExecutionArrangement annualId={plan.id} itemId={arrangeItem} onClose={() => setArrangeItem(undefined)} />}
    {basicOpen && <PlanBasics plan={plan} onClose={() => setBasicOpen(false)} onSave={(content) => attempt(() => { update(content); setBasicOpen(false) })} />}
    {itemEditor && <ProjectItemForm year={plan.year} item={itemEditor.item} onClose={() => setItemEditor(null)} onSave={(item) => attempt(() => { update({ ...plan.content, items: itemEditor.item ? plan.content.items.map((entry) => entry.id === item.id ? item : entry) : [...plan.content.items, item] }); setItemEditor(null) })} />}
    <Modal className="annual-overlay" open={Boolean(removeId)} title="移出草案项目" onClose={() => setRemoveId('')} footer={<><Button onClick={() => setRemoveId('')}>取消</Button><Button type="primary" onClick={() => attempt(() => { update({ ...plan.content, items: plan.content.items.filter((item) => item.id !== removeId) }); setRemoveId('') })}>确认移出</Button></>}><p>从当前草案移出“{plan.content.items.find((item) => item.id === removeId)?.name}”。已批准的历史版本和执行项目仍可追溯。</p></Modal>
    <Modal className="annual-overlay" open={adjustOpen} title="发起年度计划调整" onClose={() => setAdjustOpen(false)} footer={<><Button onClick={() => setAdjustOpen(false)}>取消</Button><Button type="primary" disabled={!reason.trim()} onClick={() => attempt(() => { adjust(plan.id, role, reason); setAdjustOpen(false); setReason(''); onTab('projects'); setNotice('已建立调整草案，原批准版本继续用于执行。') })}>建立调整草案</Button></>}><label>调整原因<Textarea value={reason} onChange={setReason} placeholder="说明新增、取消、延期或资源调整的原因" /></label></Modal>
    <Modal className="annual-overlay" open={stagesOpen} title="配置审议环节" onClose={() => setStagesOpen(false)} footer={<><Button onClick={() => setStagesOpen(false)}>取消</Button><Button type="primary" onClick={() => attempt(() => { update({ ...plan.content, reviewStages: REVIEW_STAGES.filter((name) => stages.includes(name)) }); setStagesOpen(false) })}>保存审议安排</Button></>}><p className="annual-muted">按企业制度勾选适用环节，下列顺序为本次送审顺序。勾选不代表该环节已完成。</p><div className="annual-stage-options">{REVIEW_STAGES.map((name, index) => <label className="annual-checkbox" key={name}><input type="checkbox" checked={stages.includes(name)} disabled={name === '有权机构批准'} onChange={(e) => setStages(e.target.checked ? [...stages, name] : stages.filter((entry) => entry !== name))} /><span>{index + 1}. {name}</span>{name === '有权机构批准' && <small>必需</small>}</label>)}</div></Modal>
  </PageFrame>
}
