import type { AnnualProjectItem, PlanContent } from './model'
import type { PlanResource } from './conversationTypes'

export function DraftBasics({ content, onChange, disabled }: { content: PlanContent; onChange: (next: PlanContent) => void; disabled: boolean }) {
  const fields = [['name', '计划名称'], ['department', '编制部门'], ['objective', '年度审计目标'], ['basis', '编制依据与战略衔接'], ['followUp', '后续审计安排'], ['resourceStrategy', '专业能力、外部资源及缺口安排']] as const
  return <div className="annual-form plan-inline-form"><div className="annual-form-grid">{fields.map(([key, label]) => <label key={key}>{label}{['name', 'department'].includes(key) ? <input className="icm-input" disabled={disabled} value={content[key] ?? ''} onChange={(e) => onChange({ ...content, [key]: e.target.value })} /> : <textarea className="icm-input" disabled={disabled} rows={3} value={content[key] ?? ''} onChange={(e) => onChange({ ...content, [key]: e.target.value })} />}</label>)}<label>年度可用人天<input className="icm-input" disabled={disabled} type="number" min="1" value={content.capacity ?? ''} onChange={(e) => onChange({ ...content, capacity: Number(e.target.value) })} /></label></div></div>
}

export function DraftProjectFields({ item, resources, onChange, onPreview, year }: { item: AnnualProjectItem; resources: PlanResource[]; onChange: (next: AnnualProjectItem) => void; onPreview: (resource: PlanResource) => void; year: number }) {
  const update = (key: keyof AnnualProjectItem, value: string) => onChange({ ...item, [key]: value })
  const risks = resources.flatMap((r) => r.risk && item.basisRefs?.includes(r.id) ? [r.risk] : [])
  return <div className="annual-form plan-inline-project"><div className="annual-form-grid">
    {([['name', '项目名称'], ['subject', '审计对象'], ['period', '审计覆盖期间'], ['owner', '牵头部门 / 拟负责团队'], ['resourceNeeds', '项目资源需求'], ['risk', '风险主题']] as const).map(([key, label]) => <label key={key}>{label}<input className="icm-input" value={item[key] ?? ''} onChange={(e) => update(key, e.target.value)} /></label>)}
    <label>审计类型<select className="icm-select" value={item.type} onChange={(e) => update('type', e.target.value)}>{['财务审计', '工程审计', '经济责任审计'].map((s) => <option key={s}>{s}</option>)}</select></label>
    <label>项目来源<input className="icm-input" value={item.source ?? ''} onChange={(e) => update('source', e.target.value)} /></label>
    <label>开始日期<input className="icm-input" type="date" min={`${year}-01-01`} max={`${year}-12-31`} value={item.start} onChange={(e) => update('start', e.target.value)} /></label>
    <label>结束日期<input className="icm-input" type="date" min={`${year}-01-01`} max={`${year}-12-31`} value={item.end} onChange={(e) => update('end', e.target.value)} /></label>
  </div><label>审计目标与范围<textarea className="icm-input" rows={3} value={item.scope} onChange={(e) => update('scope', e.target.value)} /></label>
    <fieldset className="plan-source-picker"><legend>项目编制依据</legend>{resources.map((r) => <div key={r.id}><label className="annual-checkbox"><input type="checkbox" checked={item.basisRefs?.includes(r.id) ?? false} onChange={(e) => {
      const refs = e.target.checked ? [...(item.basisRefs ?? []), r.id] : (item.basisRefs ?? []).filter((id) => id !== r.id)
      const linked = resources.find((source) => refs.includes(source.id) && source.risk?.id === item.riskId)?.risk ?? resources.find((source) => refs.includes(source.id) && source.risk)?.risk
      onChange({ ...item, basisRefs: refs, riskId: linked?.id, risk: item.risk || linked?.title || '', subject: item.subject || r.subject || '' })
    }} />{r.name}</label><button type="button" className="plan-text-action" onClick={() => onPreview(r)}>查看原文</button></div>)}</fieldset>
    {risks.length > 0 && <label>对应风险<select className="icm-select" value={item.riskId ?? ''} onChange={(e) => update('riskId', e.target.value)}><option value="">选择风险</option>{[...new Map(risks.map((r) => [r.id, r])).values()].map((risk) => <option key={risk.id} value={risk.id}>{risk.title}</option>)}</select></label>}
    <label className="annual-checkbox"><input type="checkbox" checked={item.locked ?? false} onChange={(e) => onChange({ ...item, locked: e.target.checked })} />保持不变（后续 AI 调整保留此项目）</label>
  </div>
}
