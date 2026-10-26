import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input, Modal, Textarea } from '@/components'
import { DataTable, Tag } from '../components/IcmPageKit'
import type { AuditProject } from '../data/auditProjects'
import type { AuditProgram } from '../data/projectWork'
import { useTaskDispatchStore } from '../store/taskDispatchStore'
import { useWorkpaperStore } from '../store/workpaperStore'
import { arrangeProgramTask, programComplete, saveProgram } from './projectWorkActions'

export function ProjectPrograms({ project, configure = false }: { project: AuditProject; configure?: boolean }) {
  const navigate = useNavigate(), tasks = useTaskDispatchStore((s) => s.tasks)
  useWorkpaperStore((s) => s.papers)
  const [editor, setEditor] = useState<{ row?: AuditProgram }>(), [notice, setNotice] = useState('')
  const [selected, setSelected] = useState<string[]>([]), [linkTask, setLinkTask] = useState(false), [taskId, setTaskId] = useState('')
  const locked = Boolean(project.archivedAt || project.auditReport?.status === '已签发')
  const editable = configure && !locked && !project.preparation?.confirmedAt && project.preparation?.status !== '待审核'
  const rows = project.programs ?? []
  const attempt = (fn: () => void) => { try { fn(); setNotice('操作已保存。') } catch (e) { setNotice((e as Error).message) } }
  return <section className="project-section"><div className="project-section-heading"><div><strong>审计程序</strong><small>{rows.length} 项 · 风险、控制、评价标准与执行工作关联</small></div><div className="icm-actions">{editable && <Button type="primary" onClick={() => setEditor({})}>新增程序</Button>}{!configure && !locked && <><Button type="default" disabled={!selected.length || !project.preparation?.confirmedAt} onClick={() => setLinkTask(true)}>安排执行任务</Button><Button type="primary" disabled={!selected.length || !project.preparation?.confirmedAt} onClick={() => attempt(() => { const id = useWorkpaperStore.getState().createPaper(project.id, selected, project.owner); navigate(`/projects/${project.id}?tab=execution&section=papers&paper=${id}`) })}>编制底稿</Button></>}</div></div>
    {notice && <p role="status" className="project-operation-note">{notice}</p>}
    {rows.length ? <DataTable columns={['', '审计程序 / 风险', '控制与评价标准', '方法', '人员 / 期限', '执行情况', '']} rows={rows.map((r) => [<input type="checkbox" aria-label={`选择程序：${r.title}`} checked={selected.includes(r.id)} onChange={(e) => setSelected(e.target.checked ? [...selected, r.id] : selected.filter((id) => id !== r.id))} />, <><strong>{r.title}</strong><small className="project-block">{r.risk}</small></>, <>{r.control}<small className="project-block">{r.criteria}</small></>, r.method, <>{r.owner} / 复核：{r.reviewer}<small className="project-block">{r.deadline}</small></>, <><Tag tone={programComplete(project.id, r.id) ? 'green' : 'blue'}>{programComplete(project.id, r.id) ? '已完成复核' : r.taskIds.length ? '执行中' : '待安排'}</Tag><small className="project-block">{r.taskIds.length} 个任务</small></>, editable ? <button className="icm-link" onClick={() => setEditor({ row: r })}>编辑</button> : r.taskIds.length ? <button className="icm-link" onClick={() => navigate(`/task-center?project=${project.id}&task=${r.taskIds[0]}`)}>查看任务</button> : '—'])} /> : <div className="icm-empty-inline">尚未建立审计程序，请在审计准备中新增，并补全风险、方法和人员。</div>}
    {editor && <ProgramEditor project={project} row={editor.row} onClose={() => setEditor(undefined)} />}
    {linkTask && <Modal open title="安排程序执行" onClose={() => setLinkTask(false)} footer={<Button type="primary" onClick={() => attempt(() => { arrangeProgramTask(project.id, selected, taskId || undefined); setLinkTask(false) })}>确认安排</Button>}><p>已选 {selected.length} 项程序，可合并安排任务；一项程序也可按批次拆成多个任务。</p><select className="icm-select" aria-label="程序关联任务" value={taskId} onChange={(e) => setTaskId(e.target.value)}><option value="">新建执行任务</option>{tasks.filter((t) => t.projectId === project.id || project.taskIds.includes(t.id)).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></Modal>}
  </section>
}
function ProgramEditor({ project, row, onClose }: { project: AuditProject; row?: AuditProgram; onClose: () => void }) {
  const [form, setForm] = useState({ title: row?.title ?? '', risk: row?.risk ?? project.risk, control: row?.control ?? '', criteria: row?.criteria ?? '', method: row?.method ?? '', owner: row?.owner ?? project.owner, reviewer: row?.reviewer ?? project.preparation?.reviewer ?? '', deadline: row?.deadline ?? '' })
  const [error, setError] = useState('')
  return <Modal open title={row ? '编辑审计程序' : '新增审计程序'} width="min(860px, 95vw)" onClose={onClose} footer={<><Button type="default" onClick={onClose}>取消</Button><Button type="primary" onClick={() => { try { saveProgram(project.id, form, row?.id); onClose() } catch (e) { setError((e as Error).message) } }}>保存程序</Button></>}><div className="project-form-grid">{([['title', '程序名称'], ['risk', '风险点'], ['control', '控制要求'], ['criteria', '评价标准'], ['method', '审计方法'], ['owner', '程序负责人'], ['reviewer', '程序复核人']] as const).map(([key, label]) => <label key={key}>{label}{['criteria', 'method'].includes(key) ? <Textarea aria-label={label} value={form[key]} onChange={(value) => setForm({ ...form, [key]: value })} /> : <Input aria-label={label} value={form[key]} onChange={(value) => setForm({ ...form, [key]: value })} />}</label>)}<label>执行期限<input className="icm-input" aria-label="程序执行期限" type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} /></label></div>{error && <p role="alert" className="project-error">{error}</p>}</Modal>
}
