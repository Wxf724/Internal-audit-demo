import { useEffect, useRef, useState } from 'react'
import { Bot, Paperclip, Send } from 'lucide-react'
import { Button, Modal, Textarea } from '@/components'
import { useWorkflowStore, type WorkflowReport } from '../store/workflowStore'
import { RectReportMaterials } from './RectReportMaterials'
import { reportMaterials, replyToReport, updateRectReport } from './rectificationReportAssistant'
import type { RectReportCitation, RectReportMessage } from './rectificationReportTypes'
import { reportExamplePrompts } from './rectificationReportExample'

export function RectReportConversation({ report }: { report: WorkflowReport }) {
  const [prompt, setPrompt] = useState(report.example ? reportExamplePrompts[1].text : '')
  const [showMaterials, setShowMaterials] = useState(false)
  const [citation, setCitation] = useState<RectReportCitation>()
  const [replace, setReplace] = useState<RectReportMessage>()
  const [notice, setNotice] = useState('')
  const end = useRef<HTMLDivElement>(null)
  const editable = ['草稿', '审核不通过'].includes(report.status)
  const materials = reportMaterials(report)
  const selectedCount = materials.filter((m) => m.kind === '整改记录' || (m.selected && m.text.trim())).length
  const messages = report.conversation ?? []
  useEffect(() => { end.current?.scrollIntoView({ block: 'nearest' }) }, [messages.length])
  const send = (value = prompt) => {
    if (!value.trim()) return
    try {
      const current = useWorkflowStore.getState().reports.find((r) => r.id === report.id)!
      const answer = replyToReport(current, value.trim())
      updateRectReport(report.id, { conversation: [...(current.conversation ?? []), { id: crypto.randomUUID(), role: 'user', content: value.trim(), at: new Date().toISOString() }, answer] })
      setPrompt(''); setNotice('')
    } catch (e) { setNotice((e as Error).message) }
  }
  const adopt = (message: RectReportMessage, confirmed = false) => {
    try {
      const current = useWorkflowStore.getState().reports.find((r) => r.id === report.id)!
      if (!message.draft) return
      if (!confirmed && current.content?.trim() && current.content !== message.basedOnContent) { setReplace(message); return }
      updateRectReport(report.id, { content: message.draft, adoptedCitationIds: message.citations?.map((c) => c.id), conversation: (current.conversation ?? []).map((m) => m.id === message.id ? { ...m, adoptedAt: new Date().toISOString() } : m) })
      setReplace(undefined); setNotice('草稿已写入右侧正文，可继续编辑。')
    } catch (e) { setNotice((e as Error).message) }
  }
  return <section className="rect-chat" aria-label="整改报告对话">
    <header className="rect-chat-heading"><strong><Bot size={17} /> 报告助手{report.example && <small className="rect-example-tag">本地示例</small>}</strong><Button size="sm" icon={<Paperclip size={14} />} onClick={() => setShowMaterials(true)}>支撑资料 {selectedCount}</Button></header>
    <div className="rect-chat-source-line">{selectedCount ? `已引用 ${selectedCount} 份资料` : '尚未引用资料'}{materials.some((m) => m.prepared) && <button className="icm-link" onClick={() => setShowMaterials(true)}>确认示例附件 {materials.filter((m) => m.prepared).length}</button>}</div>
    <div className="rect-chat-messages" aria-label="对话记录">
      {!messages.length && <div className="rect-chat-welcome"><Bot size={28} /><h3>结合资料，逐步完成报告</h3><p>可引用整改记录、佐证附件，或上传补充资料。说明想写什么，先预览再采纳。</p></div>}
      {messages.map((m) => <article className={`rect-message ${m.role}`} key={m.id}><small>{m.role === 'user' ? '我' : '报告助手'} · {new Date(m.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small><p>{m.content}</p>
        {m.draft && <><details className="rect-chat-draft"><summary>预览报告草稿</summary><pre>{m.draft}</pre></details><Button size="sm" type="primary-soft" disabled={!editable || Boolean(m.adoptedAt)} onClick={() => adopt(m)}>{m.adoptedAt ? '已采纳' : '采纳到正文'}</Button></>}
        {!!m.citations?.length && <details className="rect-chat-citations"><summary>引用依据 · {m.citations.length} 份</summary>{m.citations.map((c, i) => <button type="button" key={c.id} onClick={() => setCitation(c)}>资料{i + 1} · {c.title}</button>)}</details>}
      </article>)}<div ref={end} />
    </div>
    {editable && <div className="rect-chat-compose"><div className="rect-chat-prompts">{reportExamplePrompts.map((p) => <button type="button" key={p.label} title={p.text} onClick={() => setPrompt(p.text)}>{p.label}</button>)}</div><Textarea aria-label="报告对话输入" rows={3} maxLength={1500} placeholder="选择上方问题，或填写本轮编制要求…" value={prompt} onChange={setPrompt} /><div className="rect-chat-send"><span>生成后由你确认采纳</span><Button type="primary" icon={<Send size={14} />} disabled={!prompt.trim()} onClick={() => send()}>发送</Button></div></div>}
    {notice && <p role="status" className="rect-operation-note">{notice}</p>}
    {showMaterials && <RectReportMaterials report={report} onClose={() => setShowMaterials(false)} />}
    {citation && <Modal open title={citation.title} onClose={() => setCitation(undefined)} footer={<Button onClick={() => setCitation(undefined)}>关闭</Button>}><p>{citation.locator}</p><pre className="rect-citation-text">{citation.excerpt}</pre></Modal>}
    {replace && <Modal open title="更新报告正文" onClose={() => setReplace(undefined)} footer={<><Button onClick={() => setReplace(undefined)}>保留当前正文</Button><Button type="primary" onClick={() => adopt(replace, true)}>使用这版草稿</Button></>}><p>正文在本轮生成后有过修改。确认后将用这版草稿替换当前正文。</p></Modal>}
  </section>
}
