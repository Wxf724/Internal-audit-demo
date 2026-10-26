import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input, Modal, Textarea } from '@/components'
import { useIcmDemoRole } from '../AppShell'
import { useAnnualPlanStore } from '../store/annualPlanStore'
import { useAuditProjectStore } from '../store/auditProjectStore'
import type { AuditProjectType } from '../data/auditProjects'
import { linkedProjects } from './projectRelations'
import { canViewProject } from './workplaceMetrics'
import './project-planning.css'

interface Props { onClose: () => void; annualId?: string; itemId?: string; projectId?: string; adhoc?: boolean }
type Allocation = { key: string; name: string; projectId: string; scope: string; deliverable: string }
const blankRow = (): Allocation => ({ key: crypto.randomUUID(), name: '', projectId: '', scope: '', deliverable: '审计报告及对应底稿、证据与发现清单' })

export function ExecutionArrangement({ onClose, annualId, itemId, projectId, adhoc = false }: Props) {
  const navigate = useNavigate()
  const { role } = useIcmDemoRole()
  const plans = useAnnualPlanStore((s) => s.plans)
  const projects = useAuditProjectStore((s) => s.projects)
  const arrange = useAuditProjectStore((s) => s.arrangeExecution)
  const initialPlan = plans.find((p) => p.id === annualId)
  const initial = initialPlan?.approved?.content.items.find((i) => i.id === itemId)
  const [mode, setMode] = useState<'new' | 'split' | 'existing'>(projectId ? 'existing' : 'new')
  const [selection, setSelection] = useState<string[]>(initial ? [`${annualId}/${itemId}`] : [])
  const [rows, setRows] = useState<Allocation[]>([{ ...blankRow(), name: initial?.name ?? '', scope: initial?.scope ?? '', projectId: projectId ?? '' }])
  const [form, setForm] = useState({ subject: initial?.subject ?? '', owner: initial?.owner ?? role.name, type: initial?.type ?? '财务审计' as AuditProjectType, year: new Date().getFullYear(), period: initial?.period ?? '', start: initial?.start ?? '', end: initial?.end ?? '', authorization: '' })
  const [error, setError] = useState('')
  const choices = plans.filter((p) => p.approved).flatMap((plan) => plan.approved!.content.items.map((item) => ({ key: `${plan.id}/${item.id}`, plan, item })))
  const selected = choices.filter((c) => selection.includes(c.key))
  const updateRow = (key: string, patch: Partial<Allocation>) => setRows((value) => value.map((r) => r.key === key ? { ...r, ...patch } : r))
  const changeMode = (value: typeof mode) => { setMode(value); setError(''); setRows((current) => value === 'split' ? current.length > 1 ? current : [...current, blankRow()] : [current[0]]) }
  const submit = () => {
    setError('')
    if (!Number.isInteger(form.year) || form.year < 2000 || form.year > 2100) { setError('项目管理年度应在 2000 至 2100 年之间。'); return }
    if (!adhoc && !selected.length) { setError('至少选择一个已批准的计划项。'); return }
    if (adhoc && !form.authorization.trim()) { setError('请登记临时项目的立项授权依据。'); return }
    if (mode !== 'existing' && (!form.subject.trim() || !form.period.trim() || !form.owner.trim() || !form.start || !form.end || form.end < form.start)) { setError('请补全审计对象、主审、审计期间及有效实施起止日期。'); return }
    if (rows.some((row) => !row.scope.trim() || !row.deliverable.trim() || (mode === 'existing' ? !row.projectId : !row.name.trim()))) { setError('请补全每个执行项目及其承担范围、交付成果。'); return }
    try {
      const ids = arrange(rows.map((row) => {
        const existing = mode === 'existing' ? projects.find((p) => p.id === row.projectId) : undefined
        if (existing && selected.some(({ plan, item }) => linkedProjects(plan, item, projects).some((p) => p.id === existing.id))) throw new Error('所选计划项已关联此项目，请选择其他项目或计划项。')
        return {
          projectId: existing?.id,
          input: existing ?? { name: row.name.trim(), type: form.type, subject: form.subject.trim(), owner: form.owner.trim(), period: form.period.trim(), plannedImplementation: `${form.start} 至 ${form.end}`, scope: row.scope.trim(), risk: selected.map((c) => c.item.risk).join('；'), managementYear: form.year, sourceType: adhoc ? '临时授权' as const : '年度计划' as const, authorization: adhoc ? form.authorization.trim() : undefined },
          links: selected.map(({ plan, item }) => ({ id: crypto.randomUUID(), annualPlanId: plan.id, itemId: item.id, year: plan.year, version: plan.approved!.version, itemName: item.name, sourceSnapshot: { name: item.name, subject: item.subject, scope: item.scope, period: item.period, start: item.start, end: item.end, workdays: item.workdays }, scope: row.scope.trim(), deliverable: row.deliverable.trim(), owner: existing?.owner ?? form.owner, linkedAt: new Date().toISOString(), linkedBy: role.name })),
        }
      }))
      onClose()
      navigate(ids.length === 1 ? `/projects/${ids[0]}?tab=preparation` : '/projects?year=all')
    } catch (e) { setError((e as Error).message) }
  }
  return <Modal open className="project-arrangement-overlay" title={adhoc ? '临时授权立项' : '安排计划执行'} width="min(980px, 96vw)" onClose={onClose} footer={<><Button onClick={onClose}>取消</Button><Button type="primary" onClick={submit}>确认安排{rows.length > 1 ? ` ${rows.length} 个项目` : ''}</Button></>}>
    <div className="project-arrangement">
      {!adhoc && <>
        <div className="project-choice-modes" aria-label="执行方式">{([['new', '新建 / 联合执行', '多个计划项可共同安排给一个项目'], ['split', '拆分执行', '按单位、区域或批次拆成多个项目'], ['existing', '关联已有项目', '追加覆盖范围或跨年结转']] as const).map(([key, title, note]) => <button type="button" key={key} aria-label={title} aria-pressed={mode === key} className={mode === key ? 'active' : ''} onClick={() => changeMode(key)}><strong>{title}</strong><small>{note}</small></button>)}</div>
        <fieldset className="project-plan-picker"><legend>计划来源 · 可多选已批准计划项</legend>{choices.length ? choices.map(({ key, plan, item }) => <label key={key}><input type="checkbox" checked={selection.includes(key)} onChange={(e) => setSelection((value) => e.target.checked ? [...value, key] : value.filter((id) => id !== key))} /><span><strong>{item.name}</strong><small>{plan.year} 年 · V{plan.approved!.version} · {item.subject} · 已关联 {linkedProjects(plan, item, projects).length} 个项目</small></span></label>) : <p>暂无已批准计划，请先完成年度计划审议。</p>}</fieldset>
        <p className="project-help">已选 {selected.length} 项。执行关联分别保留批准版本、承担范围和成果要求；项目完成后仍需核验计划覆盖情况。</p>
      </>}
      {mode !== 'existing' && <div className="project-form-grid">
        <label>审计类型<select className="icm-select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as AuditProjectType })}>{['财务审计', '工程审计', '经济责任审计'].map((t) => <option key={t}>{t}</option>)}</select></label>
        <label>项目管理年度<input className="icm-input" type="number" min="2000" max="2100" value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} /></label>
        <label>审计对象<Input aria-label="审计对象" value={form.subject} onChange={(value) => setForm({ ...form, subject: value })} /></label>
        <label>主审<Input aria-label="主审" value={form.owner} onChange={(value) => setForm({ ...form, owner: value })} /></label>
        <label>审计覆盖期间<Input aria-label="审计覆盖期间" value={form.period} onChange={(value) => setForm({ ...form, period: value })} placeholder="例如：2025-01-01 至 2025-12-31" /></label>
        <label>计划实施窗口<div className="project-date-range"><input aria-label="实施开始日期" className="icm-input" type="date" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} /><span>至</span><input aria-label="实施结束日期" className="icm-input" type="date" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} /></div></label>
        {adhoc && <label className="project-span-full">立项授权依据<Input aria-label="立项授权依据" value={form.authorization} onChange={(value) => setForm({ ...form, authorization: value })} placeholder="交办文号 / 批准人及日期 / 授权事项" /></label>}
      </div>}
      {rows.map((row, i) => <fieldset key={row.key} className="project-allocation"><legend>执行项目 {i + 1}</legend><div className="project-form-grid">
        {mode === 'existing' ? <label className="project-span-full">目标项目<select aria-label="目标项目" className="icm-select" value={row.projectId} onChange={(e) => updateRow(row.key, { projectId: e.target.value })}><option value="">请选择未归档项目</option>{projects.filter((p) => p.stage !== '已归档' && !p.archivedAt && canViewProject(p, role)).map((p) => <option key={p.id} value={p.id}>{p.name} · {p.id}</option>)}</select></label> : <label className="project-span-full">项目名称<Input aria-label={`执行项目${i + 1}名称`} value={row.name} onChange={(value) => updateRow(row.key, { name: value })} /></label>}
        <label>本项目承担范围<Textarea aria-label={`执行项目${i + 1}承担范围`} value={row.scope} onChange={(value) => updateRow(row.key, { scope: value })} placeholder="明确覆盖单位、业务与批次；拆分时区分边界" /></label>
        <label>交付成果与验收要求<Textarea aria-label={`执行项目${i + 1}交付成果`} value={row.deliverable} onChange={(value) => updateRow(row.key, { deliverable: value })} /></label>
      </div>{mode === 'split' && rows.length > 2 && <Button onClick={() => setRows((value) => value.filter((r) => r.key !== row.key))}>移除此安排</Button>}</fieldset>)}
      {mode === 'split' && <Button onClick={() => setRows((value) => [...value, blankRow()])}>增加执行项目</Button>}
      {error && <p className="project-error" role="alert">{error}</p>}
    </div>
  </Modal>
}
