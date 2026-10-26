import { useEffect, useRef, useState } from 'react'
import { Search, FileText, ChevronRight, X } from 'lucide-react'
import { Button } from '@/components'
import type { PlanResource } from './conversationTypes'
import { RESOURCE_CATEGORIES, recommendedResourceIds } from './planResourceData'
import { ResourcePreview } from './ResourcePreview'
import { usePlanningLibraryStore } from '../../store/planningLibraryStore'

export function ConversationResources({ resources, selected, disabled, onSelect, onUpload, onClose }: { resources: PlanResource[]; selected: string[]; disabled: boolean; onSelect: (ids: string[]) => void; onUpload: () => void; onClose?: () => void }) {
  const [search, setSearch] = useState('')
  const [preview, setPreview] = useState<PlanResource | null>(null)
  const archive = usePlanningLibraryStore((s) => s.archive)
  const visible = resources.filter((item) => !item.archived && `${item.name}${item.subject ?? ''}${item.summary}`.includes(search.trim()))
  const recommended = new Set(recommendedResourceIds(resources.filter((r) => !r.archived)))
  const initialized = useRef(false)
  useEffect(() => {
    if (disabled || initialized.current) return
    initialized.current = true
    const ids = recommendedResourceIds(resources.filter((r) => !r.archived))
    if (ids.some((id) => !selected.includes(id))) onSelect([...new Set([...selected, ...ids])])
  }, [disabled, resources, selected, onSelect])
  const recommend = () => onSelect([...new Set([...selected, ...recommended])])
  const toggle = (id: string) => onSelect(selected.includes(id) ? selected.filter((value) => value !== id) : [...selected, id])
  return <aside className="plan-resource-library" aria-label="编制资源库">
    <div className="plan-library-heading"><strong>编制资料</strong><span>{resources.filter((r) => !r.archived).length}</span><div className="plan-library-heading-actions"><button className="plan-text-action" disabled={disabled} onClick={recommend}>AI推荐</button><button className="plan-text-action" disabled={disabled} onClick={onUpload}>添加资料</button></div>{onClose && <Button type="ghost" aria-label="关闭编制资料" icon={<X size={15} />} onClick={onClose} />}</div>
    <div className="plan-resource-search"><input className="icm-input" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索对象、风险或资料" aria-label="搜索编制资源" /></div>
    <div className="plan-resource-tree">{RESOURCE_CATEGORIES.map((category) => {
      const entries = visible.filter((item) => item.category === category)
      if (!entries.length && search.trim()) return null
      return <details key={`${category}-${Boolean(search)}`} open><summary><ChevronRight size={13} /><strong>{category}</strong><span>{entries.length}</span></summary>{entries.map((item) => <div className="plan-resource-entry" key={item.id}><input type="checkbox" disabled={disabled} checked={selected.includes(item.id)} onChange={() => toggle(item.id)} aria-label={`选择 ${item.name}`} /><button onClick={() => setPreview(item)}><span>{item.name}</span><small>{item.subject ?? item.version}</small></button>{recommended.has(item.id) && <span className="plan-resource-recommended" title="根据年度风险、关联审计对象、必审事项和资源预算匹配">AI 推荐</span>}{item.required && <i>必审</i>}</div>)}{!entries.length && <span className="plan-resource-empty">暂无匹配资源</span>}</details>
    })}</div>
    <div className="plan-library-footer"><FileText size={14} /><span>已选择 {selected.length} 项</span><button disabled={disabled || !selected.length} onClick={() => onSelect([])}>清空</button>{onClose && <Button type="primary" onClick={onClose}>完成选择</Button>}</div>
    {preview && <ResourcePreview resource={preview} onClose={() => setPreview(null)} footer={<>{preview.fileId && !preview.archived && <Button disabled={disabled} onClick={() => { archive(preview.id); onSelect(selected.filter((id) => id !== preview.id)); setPreview(null) }}>移入历史</Button>}<Button type="primary" disabled={disabled} onClick={() => { toggle(preview.id); setPreview(null) }}>{selected.includes(preview.id) ? '移出本轮引用' : '加入本轮引用'}</Button></>} />}
    {!visible.length && search && <div className="plan-search-empty"><Search size={15} />无匹配资源</div>}
  </aside>
}
