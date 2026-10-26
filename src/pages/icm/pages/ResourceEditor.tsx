import { useState } from 'react'
import { Button, Input, Modal, Textarea } from '@/components'
import { useResourceStore } from '../store/resourceStore'
import { currentVersion, resourceCategories, resourceContent, type ResourceAsset, type ResourceCategory, type ResourceContent } from '../data/resourceModel'
import { defaultReviewConfig } from '../data/reviewConfig'

export function ResourceEditor({ category, asset, actor, initialType, onClose, onSaved }: { category: ResourceCategory; asset?: ResourceAsset; actor: string; initialType?: string; onClose: () => void; onSaved: (id: string) => void }) {
  const assets = useResourceStore((s) => s.assets)
  const save = useResourceStore((s) => s.saveDraft)
  const group = resourceCategories.find((c) => c.id === category)!
  const [form, setForm] = useState<ResourceContent>(structuredClone(asset?.draft?.content ?? (asset ? resourceContent(asset) : { title: '', type: initialType ?? group.types[0], domain: '通用', owner: actor, source: '', summary: '', content: '', effectiveFrom: '', effectiveTo: '', relatedIds: [] })))
  const [reviewTerms, setReviewTerms] = useState((form.reviewConfig ?? defaultReviewConfig).terms.join('、'))
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const related = assets.filter((a) => a.id !== asset?.id && a.enabled && currentVersion(a) && `${a.id}${resourceContent(a).title}`.includes(search.trim()))
  const submit = () => { try { const savedForm = asset?.id === 'AG02' ? { ...form, reviewConfig: { ...(form.reviewConfig ?? defaultReviewConfig), terms: reviewTerms.split(/[、,，\n]/).map((t) => t.trim()).filter(Boolean) } } : form; const id = save(asset?.id, category, savedForm, actor); onSaved(id) } catch (e) { setError((e as Error).message) } }
  return <Modal open title={asset ? '修订资源' : '新增资源'} width="min(920px, 96vw)" onClose={onClose} footer={<><Button onClick={onClose}>取消</Button><Button type="primary" onClick={submit}>保存草稿</Button></>}><div className="resource-editor project-form-grid">
    <label>资源名称<Input aria-label="资源名称" value={form.title} onChange={(title) => setForm({ ...form, title })} /></label>
    <label>资源类型<select aria-label="资源类型" className="icm-select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>{group.types.filter((t) => t !== '智能体' || form.type === '智能体').map((t) => <option key={t}>{t}</option>)}</select></label>
    <label>业务领域<Input aria-label="业务领域" value={form.domain} onChange={(domain) => setForm({ ...form, domain })} /></label>
    <label>维护人<Input aria-label="资源维护人" value={form.owner} onChange={(owner) => setForm({ ...form, owner })} /></label>
    <label className="project-span-full">来源与适用范围<Input aria-label="资源来源" value={form.source} onChange={(source) => setForm({ ...form, source })} placeholder="制度文号、适用单位、原案例来源或维护依据" /></label>
    <label>生效日期<input className="icm-input" aria-label="资源生效日期" type="date" value={form.effectiveFrom} onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })} /></label>
    <label>失效日期<input className="icm-input" aria-label="资源失效日期" type="date" value={form.effectiveTo} onChange={(e) => setForm({ ...form, effectiveTo: e.target.value })} /></label>
    <label className="project-span-full">摘要<Textarea aria-label="资源摘要" value={form.summary} onChange={(summary) => setForm({ ...form, summary })} rows={2} /></label>
    <label className="project-span-full">资源正文<Textarea aria-label="资源正文" value={form.content} onChange={(content) => setForm({ ...form, content })} rows={8} placeholder="写明适用情形、评价要求、执行步骤、证据要求或使用边界" /></label>
    {asset?.id === 'AG02' && <><label>审查关注词<Input aria-label="审查关注词" value={reviewTerms} onChange={setReviewTerms} /><small>以顿号分隔，匹配资料中的待核实表述。</small></label><label>单次线索上限<Input aria-label="单次线索上限" type="number" min={1} max={100} value={String((form.reviewConfig ?? defaultReviewConfig).maxClues)} onChange={(value) => setForm({ ...form, reviewConfig: { ...(form.reviewConfig ?? defaultReviewConfig), maxClues: Number(value) } })} /></label></>}
    <fieldset className="resource-related-picker project-span-full"><legend>关联依据、程序、模板或检测规则</legend><Input aria-label="查找关联资源" search value={search} onChange={setSearch} placeholder="按编号或名称查找" /><div>{related.map((a) => <label key={a.id}><input type="checkbox" checked={form.relatedIds.includes(a.id)} onChange={(e) => setForm({ ...form, relatedIds: e.target.checked ? [...form.relatedIds, a.id] : form.relatedIds.filter((id) => id !== a.id) })} /><span>{resourceContent(a).title}<small>{a.id} · V{currentVersion(a)?.version}</small></span></label>)}</div></fieldset>
    {error && <p role="alert" className="project-error project-span-full">{error}</p>}
  </div></Modal>
}
