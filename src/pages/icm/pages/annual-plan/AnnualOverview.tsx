import { useState, type ReactNode } from 'react'
import { itemExecutionStatus, linkedProjects } from '../projectRelations'
import { ArrowUpRight, Plus, Sparkles } from 'lucide-react'
import { Button, Input } from '@/components'
import { Card, DataTable, Tag } from '../../components/IcmPageKit'
import type { AuditProject } from '../../data/auditProjects'
import type { AnnualPlan } from './model'
import { businessContent } from './planning'
import { AnnualTimeline } from './AnnualTimeline'
import { PlanViewSwitch } from './PlanViewSwitch'

export function AnnualOverview({ plan, projects, view, annualControls, onPlan, onCreate, onView, onSelect, onDetail }: { plan: AnnualPlan; projects: AuditProject[]; view: string; annualControls: ReactNode; onPlan: () => void; onCreate: () => void; onView: (view: string) => void; onSelect: (id: string) => void; onDetail: (tab: string) => void }) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('全部状态')
  const [type, setType] = useState('全部类型')
  const content = businessContent(plan)
  const states = content.items.map((item) => itemExecutionStatus(plan, item, projects))
  const finished = states.filter((state) => state === '待验收').length
  const ongoing = states.filter((state) => state === '执行中').length
  const resource = content.items.reduce((sum, item) => sum + item.workdays, 0)
  const visible = content.items.filter((item) => `${item.name}${item.subject}${item.risk}`.includes(search.trim()) && (type === '全部类型' || item.type === type) && (status === '全部状态' || itemExecutionStatus(plan, item, projects) === status))
  return <Card title={plan.approved ? '年度计划执行全景' : '年度计划草案'} action={<div className="annual-view-switch"><Button onClick={onPlan}>查看年度计划</Button><Button icon={<Plus size={14} />} onClick={onCreate}>新建年度</Button><PlanViewSwitch value={view} onChange={onView} /></div>}>
    <div className="annual-filter">{annualControls}<Input search aria-label="搜索年度项目" placeholder="项目 / 单位 / 风险主题" value={search} onChange={setSearch} /><select className="icm-select" aria-label="审计类型筛选" value={type} onChange={(e) => setType(e.target.value)}>{['全部类型', '财务审计', '工程审计', '经济责任审计'].map((v) => <option key={v}>{v}</option>)}</select><select className="icm-select" aria-label="项目状态筛选" value={status} onChange={(e) => setStatus(e.target.value)}>{['全部状态', '拟纳入', '待安排', '已安排', '执行中', '待验收'].map((v) => <option key={v}>{v}</option>)}</select></div>
    <div className="annual-metrics">{[
      [content.items.length, plan.approved ? '年度计划项' : '草案计划项', '项'],
      [finished, '执行结束待验收', '项'], [ongoing, '执行中计划项', '项'],
      [content.items.length - finished - ongoing, plan.approved ? '已安排 / 待安排' : '拟开展', '项'], [resource, '计划投入', '人天'],
    ].map(([value, label, unit]) => <div key={label}><span>{label}</span><strong>{value}<small>{unit}</small></strong></div>)}</div>
    {plan.approved && plan.status !== '已批准' && <div className="annual-baseline"><span>执行版本 V{plan.approved.version}</span><button className="icm-link" onClick={() => onDetail('changes')}>调整草案</button></div>}
      {!content.items.length && !plan.approved ? <button className="annual-empty-compose" onClick={() => onDetail('compose')}><Sparkles size={23} /><strong>进入计划编制</strong><span>尚未纳入项目</span></button> : view === 'gantt' ? <AnnualTimeline plan={plan} items={visible} projects={projects} onSelect={onSelect} /> : visible.length ? <DataTable columns={['计划项 / 类型', '被审计单位', '优先级 / 来源', '计划实施窗口', '资源', '执行状态', '']} rows={visible.map((item) => {
        const state = itemExecutionStatus(plan, item, projects)
        const count = linkedProjects(plan, item, projects).length
        return [<button className="icm-link annual-title-link" onClick={() => onSelect(item.id)}>{item.name}<small>{item.type}</small></button>, item.subject, <><Tag tone={item.priority === '高' ? 'red' : 'blue'}>{item.priority ?? '中'}优先级</Tag><small className="annual-block annual-muted">{item.source ?? '年度安排'}</small></>, `${item.start.slice(5)} — ${item.end.slice(5)}`, `${item.workdays} 人天`, <Tag tone={state === '待验收' ? 'amber' : state === '执行中' ? 'blue' : 'gray'}>{state}{count ? ` · ${count} 个项目` : ''}</Tag>, <Button icon={<ArrowUpRight size={14} />} onClick={() => onSelect(item.id)}>查看</Button>]
      })} /> : <div className="icm-empty-inline">{content.items.length ? '没有符合条件的项目，请调整筛选。' : '尚未纳入项目，可进入计划编制，评估风险并生成候选建议。'}</div>}
    </Card>
}
