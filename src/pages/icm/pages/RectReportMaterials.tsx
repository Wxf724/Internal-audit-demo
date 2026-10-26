import { useRef, useState } from 'react'
import { FileUp } from 'lucide-react'
import { Button, Modal, Textarea } from '@/components'
import type { WorkflowReport } from '../store/workflowStore'
import { useIcmDemoRole } from '../AppShell'
import { parsePlanFile } from './annual-plan/planFiles'
import { saveProjectFile, readProjectFile, downloadProjectFile } from './projectFileStorage'
import { reportMaterials, updateRectReport } from './rectificationReportAssistant'
import { useWorkflowStore } from '../store/workflowStore'
import type { RectReportMaterial } from './rectificationReportTypes'

export function RectReportMaterials({ report, onClose }: { report: WorkflowReport; onClose: () => void }) {
  const materials = reportMaterials(report)
  const editable = ['草稿', '审核不通过'].includes(report.status)
  const { role } = useIcmDemoRole()
  const input = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File>()
  const [existing, setExisting] = useState<RectReportMaterial>()
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [view, setView] = useState<RectReportMaterial>()
  const prepared = materials.filter((m) => m.prepared)
  const confirmPrepared = () => {
    try {
      const current = useWorkflowStore.getState().reports.find((r) => r.id === report.id)!
      const ready = reportMaterials(current).filter((m) => m.prepared)
      if (!ready.length) return
      const at = new Date().toISOString()
      updateRectReport(report.id, { supportingMaterials: reportMaterials(current).map((m) => m.prepared ? { ...m, prepared: false, selected: true, locator: '已确认的示例文件内容' } : m), conversation: [...(current.conversation ?? []),
        { id: crypto.randomUUID(), role: 'user', at, content: `确认引用示例资料：${ready.map((m) => m.title).join('、')}。` },
        { id: crypto.randomUUID(), role: 'assistant', at, content: `已加入 ${ready.length} 份资料。可以发送“起草完整报告”或“补充后续安排”；附件不会自动改变台账中的整改状态。` },
      ] })
      setNotice('示例资料已确认，可发送起草或修改要求。')
    } catch (e) { setNotice((e as Error).message) }
  }
  const ingest = async (picked: File, source?: RectReportMaterial) => {
    setFile(picked); setExisting(source); setText(''); setConfirmed(false); setBusy(true)
    try {
      const result = await parsePlanFile(picked, setNotice)
      const extracted = result.passages.map((p) => `【${p.locator}】${p.text}`).join('\n')
      setText(extracted.slice(0, 30000))
      setNotice(extracted.length > 30000 ? '引用内容已截取前 30,000 字，请核对所需范围；原文件完整保留。' : extracted.trim() ? '已提取文字，请核对引用内容。' : '未读取到文字，请核对原件并填写需要引用的内容。')
    } catch (e) { setNotice(`${(e as Error).message} 可核对原件后手动填写引用内容。`) } finally { setBusy(false) }
  }
  const importExisting = async (source: RectReportMaterial) => {
    if (!source.file) return
    try { const blob = await readProjectFile(source.file); await ingest(new File([blob], source.file.name, { type: source.file.mime }), source) } catch (e) { setNotice((e as Error).message) }
  }
  const add = async () => {
    if (!file || !confirmed || !text.trim() || busy) return
    setBusy(true)
    try {
      const meta = existing?.file ?? await saveProjectFile(file, `report:${report.id}`, role.name)
      const material: RectReportMaterial = { id: existing?.id ?? meta.id, title: file.name, kind: existing?.kind ?? '补充资料', text: text.trim(), locator: '已核对的文件摘录', at: new Date().toISOString(), selected: true, file: meta }
      updateRectReport(report.id, { supportingMaterials: [...materials.filter((m) => m.id !== material.id), material] })
      setFile(undefined); setExisting(undefined); setText(''); setNotice('资料已加入，可在对话中引用。')
    } catch (e) { setNotice((e as Error).message) } finally { setBusy(false) }
  }
  return <Modal open title="报告支撑资料" width={760} onClose={onClose} footer={<Button onClick={onClose}>完成</Button>}>
    <div className="icm-actions"><span>整改记录固定统计范围；附件按需选择引用。</span><span className="icm-toolbar-spacer" />{editable && <Button icon={<FileUp size={14} />} disabled={busy} onClick={() => input.current?.click()}>上传资料</Button>}</div>
    <input type="file" hidden ref={input} aria-label="上传报告支撑资料" accept=".txt,.md,.docx,.pdf,.xlsx,.xls,.csv" onChange={(e) => { if (e.target.files?.[0]) void ingest(e.target.files[0]); e.target.value = '' }} />
    <div className="rect-material-list">{materials.map((m) => <div className="rect-material-row" key={m.id}><label><input type="checkbox" aria-label={`引用：${m.title}`} checked={m.kind === '整改记录' || m.selected} disabled={!editable || m.kind === '整改记录' || !m.text || m.prepared} onChange={(e) => { try { updateRectReport(report.id, { supportingMaterials: materials.map((x) => x.id === m.id ? { ...x, selected: e.target.checked } : x) }) } catch (err) { setNotice((err as Error).message) } }} /><span>{m.title}<small>{m.kind} · {m.kind === '整改记录' ? '截止日记录' : m.prepared ? '示例文件 · 待确认' : m.text ? '已核对内容' : '待读取内容'}</small></span></label><div className="icm-actions">{m.text && <button className="icm-link" onClick={() => setView(m)}>查看内容</button>}{editable && m.file && !m.text && <button className="icm-link" disabled={busy} onClick={() => void importExisting(m)}>读取资料</button>}{m.file && <button className="icm-link" onClick={() => downloadProjectFile(m.file!).catch((e) => setNotice(e.message))}>下载</button>}</div></div>)}{!materials.length && <p>暂无支撑资料，请上传文件。</p>}</div>
    {editable && prepared.length > 0 && <div className="rect-prepared-materials">{prepared.map((m) => <details key={m.id}><summary>{m.title}</summary><pre className="rect-citation-text">{m.text}</pre></details>)}<Button type="primary" onClick={confirmPrepared}>确认并引用 {prepared.length} 份示例资料</Button></div>}
    {view && <div className="rect-material-preview"><strong>{view.title}</strong><pre>{view.text}</pre><Button onClick={() => setView(undefined)}>收起内容</Button></div>}
    {file && <div className="rect-material-preview"><strong>核对资料 · {file.name}</strong><Textarea aria-label="资料引用内容" rows={7} value={text} maxLength={30000} disabled={busy} onChange={(v) => { setText(v); setConfirmed(false) }} /><label className="rect-confirm"><input type="checkbox" checked={confirmed} disabled={busy} onChange={(e) => setConfirmed(e.target.checked)} />已核对上述内容，可用于报告引用</label><Button type="primary" loading={busy} disabled={!confirmed || !text.trim()} onClick={() => void add()}>加入支撑资料</Button></div>}
    {notice && <p role="status" className="rect-operation-note">{notice}</p>}
  </Modal>
}
