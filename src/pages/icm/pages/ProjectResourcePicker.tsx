import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Input, Modal } from '@/components'
import { DataTable } from '../components/IcmPageKit'
import { useResourceStore } from '../store/resourceStore'
import { useAuditProjectStore } from '../store/auditProjectStore'
import { useIcmDemoRole } from '../AppShell'
import { currentVersion, resourceContent, usableResource, type ProjectResourceRef } from '../data/resourceModel'
import type { AuditProject } from '../data/auditProjects'

export function ProjectResourcePicker({ project, locked, onApply }: { project: AuditProject; locked: boolean; onApply: (refs: ProjectResourceRef[]) => void }) {
  const [open, setOpen] = useState(false)
  const [selection, setSelection] = useState<string[]>([])
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const assets = useResourceStore((s) => s.assets)
  const update = useAuditProjectStore((s) => s.updateProject)
  const { role } = useIcmDemoRole()
  const refs = project.resourceRefs ?? []
  const candidates = assets.filter((a) => a.category !== 'directory' && usableResource(a) && `${resourceContent(a).title}${a.id}${resourceContent(a).type}`.includes(query.trim()))
  const apply = () => {
    if (locked || !selection.length) return
    try {
      const selected = new Set<string>()
      const visit = (id: string) => {
        if (selected.has(id) || refs.some((r) => r.resourceId === id)) return
        const a = assets.find((a) => a.id === id)
        if (!a || !usableResource(a)) throw new Error(`关联资源 ${id} 尚不可选用，请先核对其发布状态和有效期。`)
        selected.add(id); currentVersion(a)!.snapshot.relatedIds.forEach(visit)
      }
      selection.forEach(visit)
      const added = [...selected].map((id) => { const version = currentVersion(assets.find((a) => a.id === id)!)!; return { resourceId: id, version: version.version, snapshot: structuredClone(version.snapshot), appliedAt: new Date().toISOString(), appliedBy: role.name } })
      update(project.id, { resourceRefs: [...refs, ...added] }); onApply(added); setOpen(false); setSelection([]); setError('')
    } catch (e) { setError((e as Error).message) }
  }
  return <div className="resource-reference-list"><div className="resource-actionbar"><strong>项目采用的资源版本</strong><span className="icm-toolbar-spacer" />{!locked && <Button onClick={() => setOpen(true)}>从资源库选用</Button>}</div>{refs.length ? <DataTable columns={['资源', '类型', '采用版本', '采用人']} rows={refs.map((r) => [<Link className="icm-link" to={`/audit-resources?resource=${r.resourceId}&version=${r.version}`}>{r.snapshot.title}</Link>, r.snapshot.type, `V${r.version}`, r.appliedBy])} /> : <p className="project-help">尚未选用资源。选用审计程序时，会将程序内容带入方案草稿，并固定关联依据的版本。</p>}
    {open && <Modal open title="选用项目资源" width="min(850px, 96vw)" onClose={() => setOpen(false)} footer={<><Button onClick={() => setOpen(false)}>取消</Button><Button type="primary" disabled={!selection.length} onClick={apply}>确认选用</Button></>}><Input search aria-label="搜索可选用资源" value={query} onChange={setQuery} placeholder="名称 / 编号 / 资源类型" /><p className="project-help">自动带入关联依据、模板和规则的发布版本；已选资源保持原版本。</p><div className="resource-related-picker">{candidates.map((a) => <label key={a.id}><input type="checkbox" disabled={refs.some((r) => r.resourceId === a.id)} checked={selection.includes(a.id) || refs.some((r) => r.resourceId === a.id)} onChange={(e) => setSelection((s) => e.target.checked ? [...s, a.id] : s.filter((id) => id !== a.id))} /><span>{resourceContent(a).title}<small>{a.id} · {resourceContent(a).type} · V{currentVersion(a)?.version}{refs.some((r) => r.resourceId === a.id) ? ' · 已采用' : ''}</small></span></label>)}</div>{error && <p role="alert" className="project-error">{error}</p>}</Modal>}
  </div>
}
