import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button, Modal } from '@/components'
import type { AuditProject } from '../data/auditProjects'
import { useIcmDemoRole } from '../AppShell'
import { deleteDraftProject, projectDeletionBlockers } from './projectDeletion'

export function ProjectDeleteButton({ project, onDeleted }: { project: AuditProject; onDeleted?: () => void }) {
  const { role } = useIcmDemoRole()
  const [open, setOpen] = useState(false), [error, setError] = useState('')
  const reasons = open ? projectDeletionBlockers(project.id) : []
  const remove = () => {
    try { deleteDraftProject(project.id, role); setOpen(false); onDeleted?.() }
    catch (e) { setError((e as Error).message) }
  }
  return <><Button type="ghost" icon={<Trash2 size={14}/>} onClick={() => { setError(''); setOpen(true) }}>删除项目</Button>
    {open && <Modal open title={reasons.length ? '此项目不可直接删除' : '删除项目'} width="min(480px, 94vw)" onClose={() => setOpen(false)} footer={<><Button type="default" onClick={() => setOpen(false)}>{reasons.length ? '关闭' : '取消'}</Button>{!reasons.length && <Button type="danger" onClick={remove}>确认删除</Button>}</>}>
      <p><strong>{project.name}</strong></p><p className="project-help">{project.id}</p>
      {reasons.length ? <><p>仅准备中、尚无审核和实施记录的项目支持删除。</p><ul>{reasons.map(reason => <li key={reason}>{reason}</li>)}</ul></> : <p>删除后，该项目及方案草稿将从台账和统计中移除，解除项目执行关联；原年度计划、计划项与资源库内容保留。确定删除？</p>}
      {error && <p role="alert" className="project-error">{error}</p>}
    </Modal>}
  </>
}
