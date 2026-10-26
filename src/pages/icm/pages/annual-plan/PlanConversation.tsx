import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, ArrowUp, FileText, Sparkles, Square, Check, RotateCcw, Paperclip, PanelLeft, SquarePen, FolderOpen, Pencil, ChevronDown } from 'lucide-react'
import { Button, Modal } from '@/components'
import { useIcmDemoRole } from '../../AppShell'
import { Tag } from '../../components/IcmPageKit'
import { useAnnualPlanStore } from '../../store/annualPlanStore'
import { useAuditProjectStore } from '../../store/auditProjectStore'
import { useWorkflowStore } from '../../store/workflowStore'
import { useAgentRuntimeStore } from '../../agents/store'
import { requestAssistantReply } from '../../assistant/deepseek'
import MessageContent from '../../assistant/MessageContent'
import { canEditPlan, newId, now } from './model'
import type { AnnualPlan, PlanContent } from './model'
import type { PlanResource } from './conversationTypes'
import { usePlanningLibraryStore } from '../../store/planningLibraryStore'
import { ResourceUpload } from './ResourceUpload'
import { ResourcePreview } from './ResourcePreview'
import { contentFingerprint } from './conversationTypes'
import { getPlanResources, recommendedResourceIds } from './planResourceData'
import { parsePlanningReply, planningMessages } from './conversationProtocol'
import { ConversationResources } from './ConversationResources'
import { ConversationDraft } from './ConversationDraft'
import { ConversationReview } from './ConversationReview'
import { ConversationHistory } from './ConversationHistory'
import { ApprovalRecords } from './ApprovalRecords'
import { activeChat, messageSession } from './chatSessions'
import { createEditableExample, EXAMPLE_QUESTIONS } from './planningExample'
import { exampleResources } from './conversationExampleData'
import './conversation.css'
import './conversation-workspace.css'

export function PlanConversation({ plan: annualPlan, onBack }: { plan: AnnualPlan; onBack: () => void }) {
  const { role } = useIcmDemoRole()
  const exampleWorkspace = useAnnualPlanStore((state) => state.exampleWorkspace)
  const ensureExample = useAnnualPlanStore((state) => state.ensureExampleWorkspace)
  const mode = useAnnualPlanStore((state) => state.workspaceModes?.[annualPlan.id])
  const saveMode = useAnnualPlanStore((state) => state.setWorkspaceMode)
  const example = mode ?? (annualPlan.year === 2027 && !annualPlan.content.items.length && !annualPlan.conversation?.messages.length && !annualPlan.conversation?.sessions?.length)
  const setExample = (value: boolean) => saveMode(annualPlan.id, value)
  const initialExample = useMemo(createEditableExample, [])
  const plan = example ? (exampleWorkspace ?? initialExample) : annualPlan
  useEffect(() => { if (example) ensureExample() }, [example, ensureExample])
  const plans = useAnnualPlanStore((state) => state.plans)
  const projects = useAuditProjectStore((state) => state.projects)
  const rectifications = useWorkflowStore((state) => state.rectifications)
  const selectResources = useAnnualPlanStore((state) => state.selectResources)
  const initializeResources = useAnnualPlanStore((state) => state.initializeResourceSelection)
  const append = useAnnualPlanStore((state) => state.appendMessages)
  const accept = useAnnualPlanStore((state) => state.acceptProposal)
  const newSession = useAnnualPlanStore((state) => state.newChatSession)
  const switchSession = useAnnualPlanStore((state) => state.switchChatSession)
  const saveInput = useAnnualPlanStore((state) => state.saveChatInput)
  const recordRun = useAgentRuntimeStore((state) => state.recordConversationRun)
  const uploaded = usePlanningLibraryStore((state) => state.resources)
  const resources = useMemo(() => [...new Map([...getPlanResources(plan, plans, projects, rectifications), ...(example ? exampleResources : []), ...uploaded.filter((r) => r.planId === plan.id || (!example && r.planId !== 'EXAMPLE-ANNUAL-2027' && r.shared && r.year === plan.year))].map((r) => [r.id, r])).values()], [example, plan, plans, projects, rectifications, uploaded])
  const selectedIds = plan.conversation?.selectedResourceIds ?? []
  const selected = resources.filter((resource) => selectedIds.includes(resource.id))
  const session = activeChat(plan.conversation)
  useEffect(() => { initializeResources(plan.id, recommendedResourceIds(resources.filter((r) => !r.archived))) }, [initializeResources, plan.id, resources])
  const messages = (plan.conversation?.messages ?? []).filter((message) => messageSession(message.sessionId) === session.id)
  const editable = canEditPlan(plan, role)
  const input = session.input
  const setInput = (value: string) => saveInput(plan.id, value)
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [approvalOpen, setApprovalOpen] = useState(false)
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [editing, setEditing] = useState(false), [dirty, setDirty] = useState(false), [panelKey, setPanelKey] = useState(0)
  const [sourcePreview, setSourcePreview] = useState<PlanResource | null>(null)
  const controller = useRef<AbortController | null>(null)
  const mounted = useRef(true)
  const bottom = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; controller.current?.abort() } }, [])
  useEffect(() => { bottom.current?.scrollIntoView({ block: 'nearest', behavior: 'instant' }) }, [messages.length, loading, session.id, example])
  useEffect(() => {
    if (!dirty) return
    const guard = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', guard)
    return () => window.removeEventListener('beforeunload', guard)
  }, [dirty])
  const resetPanel = () => { setPreview(null); setEditing(false); setPanelKey((value) => value + 1); setNotice('') }
  const showPreview = (id: string | null) => { if (dirty) { setNotice('请先保存或取消右侧草案修改。'); return }; setPreview(id); setEditing(false); setPanelKey((value) => value + 1) }
  const startSession = () => { if (loading || dirty) return; newSession(plan.id); setHistoryOpen(false); resetPanel() }
  const chooseSession = (id: string) => { if (loading || dirty) return; switchSession(plan.id, id); setHistoryOpen(false); resetPanel() }
  const showExample = () => { if (loading || dirty) return; ensureExample(); setExample(true); setHistoryOpen(false); resetPanel() }
  const returnToAnnual = () => { if (loading || dirty) return; if (!annualPlan.conversation?.sessions?.length) newSession(annualPlan.id); setExample(false); setHistoryOpen(false); resetPanel() }
  const send = async (retryText?: string) => {
    const text = (retryText ?? input).trim()
    if (!text || controller.current || dirty) return
    if (!selected.length) { setNotice('请勾选本轮需要引用的编制资料。'); setLibraryOpen(true); return }
    const current = new AbortController()
    controller.current = current; setLoading(true); setNotice(''); setInput(''); setHistoryOpen(false)
    const snapshot = structuredClone(selected)
    const modelMessages = planningMessages(plan, snapshot, text, messages)
    append(plan.id, [{ id: newId(), sessionId: session.id, role: 'user', text, at: now(), resources: snapshot }])
    try {
      const answer = await requestAssistantReply(modelMessages, current.signal, { maxTokens: 6000 })
      if (current.signal.aborted || !mounted.current) return
      const result = parsePlanningReply(answer, plan, snapshot)
      if (!editable) result.proposal = undefined
      const message = { id: newId(), sessionId: session.id, role: 'assistant' as const, text: result.text, at: now(), resources: snapshot, proposal: result.proposal }
      append(plan.id, [message]); recordRun(plan.id, plan.content.name, message)
      if (result.proposal) { setPreview(message.id); setEditing(false); setPanelKey((value) => value + 1) }
    } catch (error) {
      if (mounted.current) append(plan.id, [{ id: newId(), sessionId: session.id, role: 'assistant', text: current.signal.aborted ? '已停止本次生成。' : (error as Error).message, at: now(), error: !current.signal.aborted, cancelled: current.signal.aborted }])
    } finally { controller.current = null; if (mounted.current) { setLoading(false); inputRef.current?.focus() } }
  }
  const handleAccept = (id: string, content?: PlanContent, sources?: PlanResource[]) => {
    try { accept(plan.id, id, role, content, sources); useAgentRuntimeStore.getState().acceptArtifact(`CHAT-${id}`, id, '审计负责人'); resetPanel() }
    catch (error) { setNotice((error as Error).message) }
  }
  const lastUser = [...messages].reverse().find((message) => message.role === 'user')
  const last = messages.at(-1)
  const uncompleted = !loading && last?.role === 'user'
  const displayPlan = plan
  const displayResources = resources
  const proposalMessage = preview ? messages.find((message) => message.id === preview) : undefined
  const library = <ConversationResources resources={displayResources} selected={selectedIds} disabled={loading} onClose={() => setLibraryOpen(false)} onUpload={() => { if (editable) { setLibraryOpen(false); setUploadOpen(true) } else setNotice('当前为送审版本，新增资料请在退回或发起调整后办理。') }} onSelect={(ids) => { selectResources(plan.id, ids); setNotice('') }} />
  const draftVersion = displayPlan.conversation?.revisions.length ?? 0
  const newerSources = (plan.conversation?.revisions.at(-1)?.resources ?? []).flatMap((old) => {
    const newer = old.groupId ? resources.find((r) => r.groupId === old.groupId && r.id !== old.id && !r.archived && r.version !== old.version) : undefined
    return newer ? [newer] : []
  })
  const includeSources = (ids: string[]) => {
    const additions = usePlanningLibraryStore.getState().resources.filter((r) => ids.includes(r.id))
    const groups = new Set(additions.map((r) => r.groupId).filter(Boolean))
    const retained = selectedIds.filter((id) => { const r = resources.find((entry) => entry.id === id); return !r?.groupId || !groups.has(r.groupId) })
    selectResources(plan.id, [...new Set([...retained, ...ids])])
    if (additions.length) append(plan.id, [{ id: newId(), sessionId: session.id, role: 'assistant', at: now(), text: `已加入编制资料：${additions.map((resource) => resource.name).join('、')}。`, resources: structuredClone(additions) }])
  }
  return <section className="plan-conversation plan-split-workspace" aria-label="年度计划对话编制">
    <header className="plan-conversation-header"><div className="plan-conversation-title"><Button disabled={dirty || loading} icon={<ArrowLeft size={14} />} onClick={onBack}>返回</Button><h1>{plan.year} 年度计划编制</h1><Tag tone={example || editable ? 'blue' : 'green'}>{example ? '示例会话' : plan.status}</Tag></div><div className="annual-actions">{example ? <Button disabled={loading || dirty} onClick={returnToAnnual}>返回年度计划</Button> : <>{plan.submissions.length > 0 && <Button onClick={() => setApprovalOpen(true)}>审议记录</Button>}<Button type="primary" disabled={!editable || loading || dirty || !plan.content.items.length} onClick={() => setReviewOpen(true)}>提交审议</Button></>}</div></header>
    <div className="plan-conversation-body"><main className="plan-conversation-main">
      <nav className="plan-chat-rail" aria-label="会话导航"><Button type="ghost" aria-label="会话历史" title="会话历史" aria-expanded={historyOpen} aria-controls="plan-session-sidebar" disabled={loading || dirty} icon={<PanelLeft size={18} />} onClick={() => { setHistoryOpen(!historyOpen); setLibraryOpen(false) }} /><Button type="ghost" aria-label="新会话" title="新会话" disabled={loading || dirty} icon={<SquarePen size={18} />} onClick={startSession} /></nav>
      {historyOpen && <button className="plan-history-dismiss" aria-label="收起会话栏" onClick={() => setHistoryOpen(false)} />}
      {historyOpen && <ConversationHistory chat={plan.conversation} example={example} exampleChat={exampleWorkspace?.conversation} onSelect={chooseSession} onExample={showExample} onNew={startSession} onClose={() => setHistoryOpen(false)} />}
      <div className="plan-chat-content">
      <div className="plan-chat-heading"><Sparkles size={16} /><strong title={session.title}>{session.title}</strong></div>
      {libraryOpen && <div className="plan-inline-library" role="region" aria-label="编制资料" onKeyDown={(event) => { if (event.key === 'Escape') setLibraryOpen(false) }}>{library}</div>}
      <div className="plan-chat-scroll" role="log" aria-label="计划编制对话" aria-live="polite">
        {!messages.length && <div className="plan-chat-welcome"><div className="plan-chat-avatar"><Sparkles size={21} /></div><h2>编制 {plan.year} 年度计划</h2><p>选择资料，说明年度重点与资源约束。</p><div className="plan-prompt-options">{[`根据已选资源编制 ${plan.year} 年度计划，优先安排高风险和必审事项。`, '检查已选资料是否充分，列出编制前需要确认的问题。', '在可用人天内安排项目，说明纳入与暂缓的理由。'].map((prompt) => <button key={prompt} onClick={() => { setInput(prompt); inputRef.current?.focus() }}>{prompt}<ArrowUp size={14} /></button>)}</div><button className="plan-text-action" onClick={showExample}>查看示例会话</button></div>}
        {messages.map((message) => <article className={`plan-chat-message ${message.role}${message.error ? ' failed' : ''}`} key={message.id}><div className="plan-message-meta">{message.role === 'user' ? '内审机构' : <><Sparkles size={13} />编制助手</>}<time>{message.at.slice(11, 16)}</time></div><div className="plan-message-text"><MessageContent content={message.text} /></div>
          {message.resources?.length ? <details className="plan-message-resources"><summary>引用 {message.resources.length} 项资源</summary>{message.resources.map((resource) => <div key={resource.id}><button className="plan-text-action" onClick={() => setSourcePreview(resource)}>{resource.name}</button><span>{resource.source} · {resource.version}</span></div>)}</details> : null}
          {message.proposal && <div className="plan-proposal-card"><div><FileText size={20} /><div><strong>{message.proposal.acceptedRevision ? `已采用为草案 V${message.proposal.acceptedRevision}` : '待确认的计划草案'}</strong><span>{message.proposal.content.items.length} 个项目 · {message.proposal.content.items.reduce((sum, item) => sum + item.workdays, 0)} 人天</span></div>{message.proposal.acceptedRevision && <Check size={16} />}</div><div className="annual-actions"><Button disabled={dirty} onClick={() => showPreview(message.id)}>{message.proposal.baseContent?.items.length ? '查看变更' : '预览建议'}</Button>{!message.proposal.acceptedRevision && <Button type="primary" disabled={loading || dirty || !editable || message.proposal.baseFingerprint !== contentFingerprint(plan.content)} onClick={() => handleAccept(message.id)}>{message.proposal.baseFingerprint !== contentFingerprint(plan.content) ? '已有更新草案' : '确认采用'}</Button>}</div></div>}
          {(message.error || message.cancelled) && editable && message.id === last?.id && lastUser && <Button icon={<RotateCcw size={13} />} disabled={loading || dirty} onClick={() => void send(lastUser.text)}>重新发送</Button>}
        </article>)}
        {loading && <div className="plan-chat-loading" role="status"><span /><span /><span />正在分析 {selected.length} 项资源<Button icon={<Square size={12} />} onClick={() => controller.current?.abort()}>停止</Button></div>}
        {uncompleted && <div className="plan-chat-interrupted"><span>上次请求尚未完成</span><Button disabled={dirty} onClick={() => void send(lastUser?.text)}>重新发送</Button></div>}
        <div ref={bottom} />
      </div>
      <div className="plan-chat-composer">{notice && <p role="alert" className="annual-error">{notice}</p>}{editable && newerSources.length > 0 && <button className="plan-source-update" disabled={dirty} onClick={() => { includeSources(newerSources.map((r) => r.id)); setInput('请根据新版资料检查当前草案，列出受影响项目和调整建议。') }}>{newerSources.length} 项依据有新版 · 重新评估</button>}
        {example && <div className="plan-followup-prompts" aria-label="预制问题">{EXAMPLE_QUESTIONS.map((question) => <button key={question.label} disabled={loading || dirty} title={question.text} onClick={() => { setInput(question.text); inputRef.current?.focus() }}>{question.label}</button>)}</div>}
        <div className="plan-compose-box"><div className="plan-reference-strip"><Button type="ghost" className="plan-reference-trigger" icon={<FolderOpen size={14} />} rightIcon={<ChevronDown size={12} />} aria-label={`编制资料 · ${selected.length}`} aria-expanded={libraryOpen} disabled={loading} onClick={() => { setLibraryOpen(!libraryOpen); setHistoryOpen(false) }}>引用资料 <span>{selected.length}</span></Button>{selected.length > 0 && <span className="plan-reference-names" title={selected.map((r) => r.name).join('、')}>{selected.slice(0, 2).map((r) => r.name).join('、')}</span>}</div>
        <textarea className="icm-input plan-chat-input" ref={inputRef} value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void send() } }} disabled={loading} aria-label="编制要求" placeholder={editable ? '描述编制要求，或说明要修改哪个项目…' : '询问送审计划或引用依据…'} rows={3} maxLength={8000} /><div className="plan-send-row"><div className="plan-compose-actions">{editable && <Button type="ghost" disabled={loading || dirty} icon={<Paperclip size={16} />} aria-label="上传文件" title="上传文件" onClick={() => setUploadOpen(true)} />}<span>{dirty ? '右侧有未保存修改' : editable ? 'DeepSeek' : '送审版本已锁定'}</span></div><Button type="primary" icon={<ArrowUp size={14} />} disabled={loading || dirty || !input.trim()} onClick={() => void send()}>发送</Button></div></div>
      </div>
    </div></main><aside className="plan-draft-pane" aria-label="草案工作区"><header className="plan-draft-pane-heading"><strong>{proposalMessage ? (proposalMessage.proposal?.acceptedRevision ? `草案 V${proposalMessage.proposal.acceptedRevision}` : '待确认建议') : `当前草案${draftVersion ? ` · V${draftVersion}` : ''}`}{example && <span>示例</span>}</strong><div className="annual-actions">{preview && <Button disabled={dirty} onClick={() => showPreview(null)}>当前草案</Button>}{editable && !editing && !preview && <Button icon={<Pencil size={14} />} disabled={loading} onClick={() => { setEditing(true); setPanelKey((value) => value + 1) }}>{plan.content.items.length ? '编辑草案' : '创建草案'}</Button>}</div></header>
      <ConversationDraft key={`${example ? 'example' : plan.id}-${preview ?? 'current'}-${draftVersion}-${panelKey}`} embedded plan={displayPlan} message={proposalMessage} availableResources={displayResources} editable={editable && !loading && (editing || Boolean(proposalMessage && !proposalMessage.proposal?.acceptedRevision))} closeLabel={preview ? '返回当前草案' : '取消编辑'} onDirtyChange={setDirty} onClose={resetPanel} onAccept={handleAccept} onAsk={(text) => { setInput(text); inputRef.current?.focus() }} />
    </aside></div>
    {reviewOpen && <ConversationReview plan={plan} onClose={() => setReviewOpen(false)} onEdit={() => { setReviewOpen(false); setPreview(null); setEditing(true); setPanelKey((value) => value + 1) }} />}
    {uploadOpen && <ResourceUpload plan={plan} onClose={() => setUploadOpen(false)} onAdded={includeSources} />}
    {sourcePreview && <ResourcePreview resource={sourcePreview} onClose={() => setSourcePreview(null)} />}
    <Modal className="annual-overlay" open={approvalOpen} drawer width="min(850px, 100vw)" title="年度计划审议" onClose={() => setApprovalOpen(false)} footer={<Button onClick={() => setApprovalOpen(false)}>返回对话</Button>}><ApprovalRecords plan={plan} /></Modal>
  </section>
}
