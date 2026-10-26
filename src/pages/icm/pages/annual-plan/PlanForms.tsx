import { useState } from 'react'

import { Button, Input, Modal, Textarea } from '@/components'

import { demoRoles } from '../../AppShell'
import type { AnnualPlan, AnnualProjectItem, PlanContent } from './model'
import { newId } from './model'

export function PlanBasics({ plan, onSave, onClose }: { plan: AnnualPlan; onSave: (value: PlanContent) => void; onClose: () => void }) {
  const [form, setForm] = useState(plan.content)
  const field = (key: 'name' | 'department' | 'basis' | 'objective', value: string) => setForm((current) => ({ ...current, [key]: value }))
  return <Modal className="annual-overlay" open title="编辑年度计划基本信息" onClose={onClose} footer={<><Button onClick={onClose}>取消</Button><Button type="primary" onClick={() => onSave(form)}>保存草稿</Button></>}>
    <div className="annual-form">
      <label>计划名称<Input value={form.name} onChange={(value) => field('name', value)} /></label>
      <label>编制部门<Input value={form.department} onChange={(value) => field('department', value)} /></label>
      <label>编制依据<Textarea value={form.basis} onChange={(value) => field('basis', value)} /></label>
      <label>总体目标<Textarea value={form.objective} onChange={(value) => field('objective', value)} /></label>
      <label>年度可用资源（人天）<input className="icm-input" type="number" min="1" value={form.capacity ?? 300} onChange={(event) => setForm((current) => ({ ...current, capacity: Number(event.target.value) }))} /></label>
      {!plan.recordingMode && (['reviewer', 'approver'] as const).map((key) => <label key={key}>{key === 'reviewer' ? '部门复核人' : '授权批准人'}<select className="icm-select" value={form[key].id} onChange={(event) => {
        const actor = demoRoles.find((role) => role.id === event.target.value)!
        setForm((current) => ({ ...current, [key]: { id: actor.id, name: actor.name } }))
      }}>{demoRoles.filter((role) => role.id !== plan.creator.id).map((role) => <option key={role.id} value={role.id}>{role.name} · {role.title}</option>)}</select></label>)}
      <p className="annual-muted">由内审机构统一编制，项目级审计程序和人员分工在实施前细化。</p>
    </div>
  </Modal>
}

export function ProjectItemForm({ year, item, onSave, onClose }: { year: number; item?: AnnualProjectItem; onSave: (value: AnnualProjectItem) => void; onClose: () => void }) {
  const [form, setForm] = useState<AnnualProjectItem>(item ?? { id: newId(), name: '', type: '财务审计', subject: '', period: '', start: `${year}-01-01`, end: `${year}-12-31`, owner: '', workdays: 20, scope: '', risk: '' })
  const [error, setError] = useState('')
  const textField = (key: 'name' | 'subject' | 'period' | 'start' | 'end' | 'owner' | 'scope' | 'risk', value: string) => setForm((current) => ({ ...current, [key]: value }))
  const save = () => {
    if (![form.name, form.subject, form.period, form.owner, form.scope, form.start, form.end].every((value) => value.trim()) || !Number.isFinite(form.workdays) || form.workdays <= 0) { setError('请补全项目名称、对象、审计期间、实施日期、负责人、范围及有效工时。'); return }
    if (form.start > form.end || !form.start.startsWith(`${year}-`) || !form.end.startsWith(`${year}-`)) { setError('实施时间须在计划年度内，开始日期不得晚于结束日期。'); return }
    onSave(form)
  }
  return <Modal className="annual-overlay" open title={item ? '编辑拟开展项目' : '添加拟开展项目'} onClose={onClose} footer={<><Button onClick={onClose}>取消</Button><Button type="primary" onClick={save}>保存项目</Button></>}>
    <div className="annual-form">
      {error && <p role="alert" className="annual-error">{error}</p>}
      <label>项目名称<Input value={form.name} onChange={(value) => textField('name', value)} /></label>
      <label>审计类型<select className="icm-select" value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as AnnualProjectItem['type'] }))}>{['财务审计', '工程审计', '经济责任审计'].map((type) => <option key={type}>{type}</option>)}</select></label>
      <label>审计对象<Input value={form.subject} onChange={(value) => textField('subject', value)} /></label>
      <label>审计期间<Input value={form.period} onChange={(value) => textField('period', value)} placeholder="例如：2025-01-01 至 2025-12-31" /></label>
      <div className="annual-form-grid">{(['start', 'end'] as const).map((key) => <label key={key}>{key === 'start' ? '计划开始日期' : '计划结束日期'}<input className="icm-input" type="date" min={`${year}-01-01`} max={`${year}-12-31`} value={form[key]} onChange={(event) => textField(key, event.target.value)} /></label>)}</div>
      <div className="annual-form-grid"><label>项目负责人<Input value={form.owner} onChange={(value) => textField('owner', value)} /></label><label>计划工时（人天）<input className="icm-input" type="number" min="1" step="1" value={form.workdays} onChange={(event) => setForm((current) => ({ ...current, workdays: Number(event.target.value) }))} /></label></div>
      <label>风险主题<Input value={form.risk} onChange={(value) => textField('risk', value)} /></label>
      <div className="annual-form-grid"><label>优先级<select className="icm-select" value={form.priority ?? '中'} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value as AnnualProjectItem['priority'] }))}>{['高', '中', '低'].map((value) => <option key={value}>{value}</option>)}</select></label><label>项目来源<select className="icm-select" value={form.source ?? '年度安排'} onChange={(event) => setForm((current) => ({ ...current, source: event.target.value }))}>{['年度安排', '风险评估', '必审事项', '上级交办', '临时追加', '整改后续'].map((value) => <option key={value}>{value}</option>)}</select></label></div>
      <label>审计目标与范围<Textarea value={form.scope} onChange={(value) => textField('scope', value)} /></label>
    </div>
  </Modal>
}
