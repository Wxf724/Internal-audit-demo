import { useState } from 'react'
import { Button, Textarea } from '@/components'
import { Card, DataTable, Tag } from '../components/IcmPageKit'
import type { AuditProject } from '../data/auditProjects'
import { useIcmDemoRole } from '../AppShell'
import { useProjectDocumentStore } from '../store/projectDocumentStore'
import { useWorkpaperStore } from '../store/workpaperStore'
import { useWorkflowStore } from '../store/workflowStore'
import { archiveChecklist, requestArchive } from './projectArchiveActions'
import { ProjectReviewActions } from './ProjectReviewActions'
import { downloadProjectFile } from './projectFileStorage'
export function ProjectArchive({ project }: { project: AuditProject }) {
 const {role} = useIcmDemoRole(), files = useProjectDocumentStore((s) => s.files)
 useWorkpaperStore((s) => s.papers); useWorkflowStore((s) => s.issues)
 const [note,setNote] = useState(project.archiveNote ?? ''), [notice,setNotice] = useState('')
 const snapshot = project.archiveSnapshot
 const exportSnapshot = () => { if (!snapshot) return; const url=URL.createObjectURL(new Blob([snapshot.content],{type:'application/json'})); const a=document.createElement('a'); a.href=url; a.download=project.id+'-归档V'+snapshot.version+'.json'; a.click(); URL.revokeObjectURL(url) }
 return <><Card title="档案完整性核对" note="归档固定审计成果；未销号整改继续在整改跟踪办理。" action={<Tag tone={snapshot ? 'green':'blue'}>{snapshot ? '已归档 · V'+snapshot.version : project.archivePending ? '待审核' : '待归档'}</Tag>}>
 <div className="project-checklist">{archiveChecklist(project.id).map((c) => <div key={c.title}><span>{c.title}</span><Tag tone={c.pass ? 'green':'amber'}>{c.pass ? '已具备':'待补齐'}</Tag></div>)}</div>
 {!project.archivedAt && !project.archivePending && <><Textarea aria-label="归档说明" value={note} onChange={setNote} placeholder="完整性核对结果，以及未完成整改的责任与跟踪安排" /><div className="project-form-actions"><Button type="primary" onClick={() => { try { requestArchive(project.id,note,role.name); setNotice('已提交归档审核。') } catch(e) { setNotice((e as Error).message) } }}>提交归档审核</Button></div></>}
 {notice && <p role="status">{notice}</p>}<ProjectReviewActions projectId={project.id} object="archive" businessId={project.id} />
 </Card>{snapshot && <Card title="冻结档案清单" note={snapshot.note} action={<Button onClick={exportSnapshot}>导出档案快照</Button>}><DataTable columns={['类别','档案名称','索引']} rows={snapshot.manifest.map((r) => [r.type,r.title,r.id])} /><p className="project-help">快照含业务内容、文件清单及校验摘要；原始文件在下方分别下载。</p></Card>}
 <Card title="原始文件">{files.filter((f) => f.projectId === project.id).map((f) => <div className="icm-list-row" key={f.id}><span>{f.name} · {Math.ceil(f.size/1024)} KB</span><Button onClick={() => downloadProjectFile(f).catch((e) => setNotice(e.message))}>下载</Button></div>)}</Card></>
}

