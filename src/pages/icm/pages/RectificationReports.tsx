import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowLeft, Plus } from 'lucide-react'
import { Button, Input, Modal, Textarea } from '@/components'
import { PageFrame, Tag } from '../components/IcmPageKit'
import { useIcmDemoRole } from '../AppShell'
import { useWorkflowStore } from '../store/workflowStore'
import { useProjectRecords, useProjectNavigate, useProjectScope } from './projectScope'
import { ensureRectReportExample } from './rectificationReportExample'
import { createRectificationReport } from './rectificationActions'
import { updateRectReport } from './rectificationReportAssistant'
import { RectReportConversation } from './RectReportConversation'
import './rectification.css'

export default function RectificationReports() {
  const { reports, rectifications } = useProjectRecords()
  const { projectId } = useProjectScope()
  const store = useWorkflowStore()
  const { role } = useIcmDemoRole()
  const navigate = useProjectNavigate()
  const [params, setParams] = useSearchParams()
  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState('整改进展报告')
  const [kind, setKind] = useState<'整改进展报告' | '整改复核报告'>('整改进展报告')
  const [ids, setIds] = useState<string[]>([])
  const [notice, setNotice] = useState('')
  const [opinion, setOpinion] = useState('')
  const [exampleId, setExampleId] = useState('')
  useEffect(() => {
    let cancelled = false
    ensureRectReportExample(rectifications, role.name, projectId).then((id) => {
      if (cancelled) return
      setExampleId(id)
      setParams((p) => { if (!p.has('report')) p.set('report', id); return p }, { replace: true })
    }).catch((e) => { if (!cancelled) setNotice((e as Error).message) })
    return () => { cancelled = true }
  }, [rectifications, role.name, projectId, setParams])
  const selected = reports.find((r) => r.id === params.get('report'))
  const select = (id: string) => { setOpinion(''); setNotice(''); setParams((p) => { if (id) p.set('report', id); else p.delete('report'); return p }, { replace: true }) }
  const editable = selected && ['草稿', '审核不通过'].includes(selected.status)
  const pending = store.audits.find((a) => a.businessId === selected?.id && a.status === '待处理')
  const today = new Date().toLocaleDateString('sv-SE')
  const run = (fn: () => void, message: string) => { try { fn(); setNotice(message) } catch (e) { setNotice((e as Error).message) } }
  const patch = (content: string) => { if (selected && editable) run(() => updateRectReport(selected.id, { content }), '') }
  return <div className="rect-compact"><PageFrame title="整改报告" subtitle="" actions={<><Button icon={<ArrowLeft size={15} />} onClick={() => navigate('/rectify')}>返回整改台账</Button><Button type="primary" icon={<Plus size={15} />} onClick={() => { setIds([]); setCreating(true); setNotice('') }}>新建报告</Button></>}>
    <div className="rect-report-toolbar"><label>选择报告<select aria-label="选择整改报告" className="icm-select" value={selected?.id ?? ''} onChange={(e) => select(e.target.value)}><option value="">请选择报告</option>{reports.map((r) => <option key={r.id} value={r.id}>{r.title} · {r.status}</option>)}</select></label>{selected && <><Tag tone={selected.status === '已归档' || selected.status === '审核通过' ? 'green' : 'blue'}>{selected.status}</Tag><span className="icm-toolbar-spacer" /><span>截止 {selected.cutoff ?? '未留存'} · 编制 {selected.owner}</span></>}</div>
    {exampleId && selected?.id !== exampleId && <div className="rect-example-entry"><span>{selected && !selected.snapshot?.length ? '这份历史报告未保存截止日记录。已另备完整示例，可直接起草和修改。' : '编制示例已备好整改记录、对话和待确认附件。'}</span><Button size="sm" onClick={() => select(exampleId)}>打开编制示例</Button></div>}
    {selected ? <div className="rect-writing-layout">
      <RectReportConversation key={selected.id} report={selected} />
      <section className="rect-document" aria-label="报告正文工作区">
        <header><div><strong>{selected.title}</strong><small>{editable ? '采纳后可继续编辑，正文自动保存' : '报告正文及引用依据'}</small></div><Tag tone="gray">{selected.reportKind ?? '整改情况报告'}</Tag></header>
        <div className="rect-document-content">
          {editable ? <Textarea aria-label="报告正文" rows={18} placeholder="在左侧选择支撑资料并说明编制要求，采纳草稿后在这里继续编辑。" value={selected.content ?? ''} onChange={patch} /> : <article><p className="rect-citation-text">{selected.content || '历史报告未留存正文。'}</p></article>}
          <details className="rect-report-references"><summary>截止日数据 · {(selected.rectificationIds ?? [selected.rectificationId]).length} 项整改</summary>{(selected.snapshot ?? []).map((r) => <div className="icm-list-row" key={r.id}><span>{r.title} · {r.status}</span><button className="icm-link" onClick={() => navigate('/rectify?rect=' + r.id)}>查看当前进展</button></div>)}{!selected.snapshot && <p>历史报告未留存数据快照。</p>}</details>
          {selected.auditOpinion && <p className="rect-operation-note">审核意见：{selected.auditOpinion}</p>}
        </div>
        <footer className="rect-document-actions">
          {editable && <Button type="primary" onClick={() => run(() => {
            if (!selected.content?.trim()) throw new Error('请先填写报告正文。')
            store.generateReportLedger(selected.id); store.submitReportAudit(selected.id)
          }, '报告已提交审核')}>提交审核</Button>}
          {selected.status === '待审核' && <Button type="primary" onClick={() => store.submitReportAudit(selected.id)}>提交审核</Button>}
          {pending && <div className="rect-review-inline"><Textarea aria-label="报告审核意见" rows={2} value={opinion} placeholder="填写审核意见" onChange={setOpinion} /><div className="icm-actions"><Button onClick={() => { if (!opinion.trim()) return setNotice('请填写审核意见。'); store.returnAudit(pending.id, opinion, role.name) }}>退回修改</Button><Button type="primary" onClick={() => { if (!opinion.trim()) return setNotice('请填写审核意见。'); store.approveAudit(pending.id, opinion, role.name) }}>审核通过</Button></div></div>}
          {selected.status === '审核通过' && <Button type="primary" onClick={() => store.archiveReport(selected.id)}>归档报告</Button>}
          {selected.status === '已归档' && <span>已归档 · 正文与截止日记录已保留</span>}
        </footer>
      </section>
    </div> : <div className="rect-report-start">{params.get('report') ? <p>当前范围内未找到该报告。</p> : <><h3>选择报告，或开始一次新的编制</h3><p>选择整改范围 → 添加支撑资料 → 对话起草 → 核对正文并提交审核</p><div className="rect-existing-reports">{reports.map((r) => <button type="button" key={r.id} onClick={() => select(r.id)}><span>{r.title}</span><small>{r.status} · {r.cutoff ?? r.updatedAt.slice(0, 10)}</small></button>)}</div></>}</div>}
    <Modal open={creating} onClose={() => setCreating(false)} title="新建整改报告" footer={null} width={640}>
      <div className="rect-fields"><label className="rect-field">报告名称<Input aria-label="报告名称" value={title} onChange={setTitle} /></label><label className="rect-field">报告类型<select aria-label="报告类型" className="icm-select" value={kind} onChange={(e) => setKind(e.target.value as typeof kind)}><option>整改进展报告</option><option>整改复核报告</option></select></label></div>
      <p>数据截止日期：{today} · 按当前状态固定快照</p><p>选择报告范围（可包含未完成整改事项）</p>
      <div style={{ maxHeight: 300, overflow: 'auto' }}>{rectifications.map((r) => <label className="icm-list-row" key={r.id}><input type="checkbox" checked={ids.includes(r.id)} onChange={(e) => setIds(e.target.checked ? [...ids, r.id] : ids.filter((x) => x !== r.id))} /><span>{r.title} · {r.owner}</span></label>)}</div>
      <Button type="primary" onClick={() => run(() => { const id = createRectificationReport(ids, title, kind, today, role.name); setCreating(false); select(id) }, '报告已创建，可选择资料并开始对话')}>创建报告</Button>
      {notice && <p role="status">{notice}</p>}
    </Modal>
    {notice && !creating && <p role="status" className="rect-operation-note">{notice}</p>}
  </PageFrame></div>
}
