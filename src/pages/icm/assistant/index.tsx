import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Check, ChevronLeft, LoaderCircle, PanelRightClose, Plus, RotateCcw, Send, Square, X } from 'lucide-react'

import MessageContent from './MessageContent'
import RobotAvatar from './RobotAvatar'
import {
  AssistantRequestError,
  assistantProvider,
  isAssistantConfigured,
  requestAssistantReply,
} from './deepseek'
import { buildAssistantMessages, splitAnswerSuggestion } from './prompt'
import type {
  AssistantChatMessage,
  AssistantSourceScope,
  AssistantStatus,
  AuditAssistantProps,
} from './types'
import './assistant.css'

const SOURCE_OPTIONS: { value: AssistantSourceScope; label: string }[] = [
  { value: 'knowledge', label: '基础知识' },
  { value: 'law', label: '法规依据' },
  { value: 'project', label: '当前项目' },
]

const EXAMPLE_QUESTIONS = [
  '审计证据的充分性和适当性如何判断？',
  '审计底稿与审计证据有什么区别？',
  '检查阶段发现疑点后应如何补充取证？',
]

const STATUS_TEXT: Record<AssistantStatus, string> = {
  ready: '已连接',
  loading: '等待答复',
  error: '本次答复失败',
  unconfigured: '服务未启用',
}

const newId = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`

export default function AuditAssistant({
  configured,
  currentProjectId,
  currentProjectName,
  role = '审计人员',
  onIntentConfirmed,
}: AuditAssistantProps) {
  const titleId = useId()
  const launcherRef = useRef<HTMLButtonElement>(null)
  const composerRef = useRef<HTMLTextAreaElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const requestRef = useRef<AbortController | null>(null)
  const lastPromptRef = useRef('')
  const ready = configured ?? isAssistantConfigured()
  const canQueryProject = Boolean(currentProjectId)
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<AssistantStatus>(ready ? 'ready' : 'unconfigured')
  const [messages, setMessages] = useState<AssistantChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sourceScopes, setSourceScopes] = useState<AssistantSourceScope[]>(() =>
    canQueryProject ? ['knowledge', 'law', 'project'] : ['knowledge', 'law']
  )
  const [errorMessage, setErrorMessage] = useState('')
  const [errorRetryable, setErrorRetryable] = useState(true)
  const [confirmedIntents, setConfirmedIntents] = useState<string[]>([])

  useEffect(() => {
    setStatus((current) => (current === 'loading' ? current : ready ? 'ready' : 'unconfigured'))
  }, [ready])

  useEffect(() => {
    if (open) {
      composerRef.current?.focus()
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
    }
  }, [open, messages.length])

  useEffect(() => () => requestRef.current?.abort(), [])

  useEffect(() => {
    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape' && open) {
        event.preventDefault()
        setOpen(false)
        launcherRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  const toggleScope = (scope: AssistantSourceScope) => {
    setSourceScopes((selected) =>
      selected.includes(scope) ? selected.filter((item) => item !== scope) : [...selected, scope]
    )
  }

  function startNewChat() {
    requestRef.current?.abort()
    setMessages([])
    setInput('')
    setErrorMessage('')
    setStatus(ready ? 'ready' : 'unconfigured')
    setConfirmedIntents([])
    lastPromptRef.current = ''
    composerRef.current?.focus()
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      void submitMessage()
    }
  }

  async function submitMessage(event?: FormEvent, retry = false) {
    event?.preventDefault()
    if (status === 'loading' || !ready) return
    const prompt = retry ? lastPromptRef.current : input.trim()
    if (!prompt) return
    if (!retry) {
      lastPromptRef.current = prompt
      setInput('')
      setMessages((items) => [...items, { id: newId(), role: 'user', content: prompt }])
    }
    const controller = new AbortController()
    requestRef.current = controller
    setStatus('loading')
    setErrorMessage('')
    try {
      const history =
        retry && messages.at(-1)?.role === 'user' && messages.at(-1)?.content === prompt
          ? messages.slice(0, -1)
          : messages
      const scopes = sourceScopes.filter((scope) => scope !== 'project' || canQueryProject)
      const requestMessages = buildAssistantMessages(history, prompt, {
        role,
        projectName: currentProjectName,
        projectId: currentProjectId,
        scopes,
      })
      const answer = await requestAssistantReply(requestMessages, controller.signal)
      const { content, intent } = splitAnswerSuggestion(answer)
      setMessages((items) => [...items, { id: newId(), role: 'assistant', content, intent }])
      setStatus('ready')
    } catch (error) {
      const failure = error instanceof AssistantRequestError ? error : null
      if (failure?.kind === 'aborted') {
        setStatus(ready ? 'ready' : 'unconfigured')
        return
      }
      setErrorMessage(
        failure?.message || (error instanceof Error ? error.message : '连接模型失败，请稍后重试。')
      )
      setErrorRetryable(failure ? failure.retryable : true)
      setStatus(failure?.kind === 'unconfigured' ? 'unconfigured' : 'error')
    } finally {
      if (requestRef.current === controller) requestRef.current = null
    }
  }

  return (
    <div className="icm-assistant-root">
      {open ? (
        <section
          id={`${titleId}-panel`}
          aria-labelledby={titleId}
          aria-modal="false"
          className="icm-assistant-panel"
          role="dialog"
        >
          <header className="icm-assistant-header">
            <div className="icm-assistant-heading">
              <span className="icm-assistant-mark">
                <RobotAvatar size={36} />
              </span>
              <div>
                <h2 id={titleId}>审计智能助手</h2>
                <span>
                  {assistantProvider.model} · {STATUS_TEXT[status]}
                </span>
              </div>
            </div>
            <div className="icm-assistant-header-actions">
              <button
                aria-label="新建对话"
                className="icm-assistant-icon-button"
                onClick={startNewChat}
                title="新建对话"
                type="button"
              >
                <Plus size={17} />
              </button>
              <button
                aria-label="收起助手到右侧"
                className="icm-assistant-icon-button"
                onClick={() => {
                  setOpen(false)
                  launcherRef.current?.focus()
                }}
                title="收起到右侧，保留对话"
                type="button"
              >
                <PanelRightClose size={17} />
              </button>
            </div>
          </header>

          <div aria-label="回答重点与上下文" className="icm-assistant-sources">
            <div className="icm-assistant-source-row">
              <span className="icm-assistant-source-label">回答重点</span>
              {SOURCE_OPTIONS.map((option) => {
                const unavailable = option.value === 'project' && !canQueryProject
                return (
                  <label
                    className={`icm-assistant-source ${unavailable ? 'disabled' : ''}`}
                    key={option.value}
                    title={unavailable ? '进入具体项目后可纳入项目上下文' : undefined}
                  >
                    <input
                      checked={sourceScopes.includes(option.value) && !unavailable}
                      disabled={unavailable}
                      onChange={() => toggleScope(option.value)}
                      type="checkbox"
                    />
                    <span>{option.label}</span>
                  </label>
                )
              })}
            </div>
            <div className="icm-assistant-context">
              <span title={currentProjectName || currentProjectId || '当前未进入具体项目'}>
                {currentProjectName || currentProjectId || '当前未进入具体项目'}
              </span>
              <span>{role}</span>
            </div>
          </div>

          <div
            aria-live="polite"
            aria-relevant="additions text"
            className="icm-assistant-messages"
            ref={scrollRef}
          >
            {messages.length === 0 ? (
              <div className="icm-assistant-empty">
                <RobotAvatar className="icm-assistant-empty-avatar" size={56} />
                <strong>需要核对哪项审计事项？</strong>
                <p>可询问审计程序、证据与底稿要求、法规依据，或当前项目的核查重点。</p>
                <div className="icm-assistant-examples">
                  {EXAMPLE_QUESTIONS.map((question) => (
                    <button
                      key={question}
                      onClick={() => {
                        setInput(question)
                        composerRef.current?.focus()
                      }}
                      type="button"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <article className={`icm-assistant-message ${message.role}`} key={message.id}>
                  {message.role === 'assistant' ? (
                    <span className="icm-assistant-message-avatar">
                      <RobotAvatar size={28} />
                    </span>
                  ) : null}
                  <div className="icm-assistant-message-body">
                    <div className="icm-assistant-message-label">
                      {message.role === 'user' ? '我' : '审计智能助手'}
                    </div>
                    {message.role === 'assistant' ? (
                      <MessageContent content={message.content} />
                    ) : (
                      <p>{message.content}</p>
                    )}
                    {message.intent ? (
                      <section aria-label="待确认办理动作" className="icm-assistant-intent">
                        <div>
                          <span>建议办理动作 · 待人工确认</span>
                          <strong>{message.intent.title}</strong>
                          {message.intent.summary ? <p>{message.intent.summary}</p> : null}
                        </div>
                        {confirmedIntents.includes(message.intent.id) ? (
                          <span className="icm-assistant-confirmed">
                            <Check size={14} />
                            已提交确认
                          </span>
                        ) : (
                          <button
                            className="icm-assistant-confirm"
                            onClick={() => {
                              const intent = message.intent
                              if (!intent) return
                              onIntentConfirmed?.(intent)
                              setConfirmedIntents((items) => [...items, intent.id])
                            }}
                            type="button"
                          >
                            {message.intent.actionLabel}
                          </button>
                        )}
                      </section>
                    ) : null}
                  </div>
                </article>
              ))
            )}
            {status === 'loading' ? (
              <div className="icm-assistant-loading" role="status">
                <LoaderCircle className="icm-assistant-spin" size={15} />
                <span>正在等待模型答复…</span>
                <button onClick={() => requestRef.current?.abort()} type="button">
                  <Square size={12} />
                  停止
                </button>
              </div>
            ) : null}
          </div>

          {status === 'unconfigured' ? (
            <div className="icm-assistant-status warning" role="status">
              {errorMessage || 'AI 对话服务暂未启用。'}
            </div>
          ) : null}
          {status === 'error' ? (
            <div className="icm-assistant-status error" role="alert">
              <span>{errorMessage || '连接模型失败，请重试。'}</span>
              {errorRetryable ? (
                <button onClick={() => void submitMessage(undefined, true)} type="button">
                  <RotateCcw size={13} />
                  重试
                </button>
              ) : null}
            </div>
          ) : null}

          <form className="icm-assistant-composer" onSubmit={(event) => void submitMessage(event)}>
            <label className="icm-assistant-sr-only" htmlFor="icm-assistant-input">
              输入审计问题
            </label>
            <textarea
              disabled={!ready || status === 'loading'}
              id="icm-assistant-input"
              maxLength={2000}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleComposerKeyDown}
              placeholder={ready ? '输入问题，Enter 发送，Shift+Enter 换行' : 'AI 对话服务暂未启用'}
              ref={composerRef}
              rows={2}
              value={input}
            />
            <div className="icm-assistant-composer-foot">
              <span>{currentProjectName ? `${role} · ${currentProjectName}` : role}</span>
              <button
                aria-label="发送问题"
                disabled={!ready || status === 'loading' || !input.trim()}
                type="submit"
              >
                <Send size={16} />
                发送
              </button>
            </div>
          </form>
        </section>
      ) : null}
      <button
        ref={launcherRef}
        aria-expanded={open}
        aria-controls={open ? `${titleId}-panel` : undefined}
        aria-label={open ? '收起助手到右侧' : '展开审计智能助手'}
        className={`icm-assistant-fab ${open ? 'open' : 'docked'}`}
        onClick={() => {
          setOpen((value) => !value)
        }}
        title={open ? '收起到右侧，保留对话' : '点击展开审计智能助手'}
        type="button"
      >
        <RobotAvatar className="icm-assistant-fab-avatar" size={open ? 34 : 28} />
        {!open && <ChevronLeft className="icm-assistant-dock-arrow" size={14} aria-hidden="true" />}
        <span aria-hidden="true" className="icm-assistant-fab-tip">
          {open ? '收起到右侧' : '点击展开助手'}
        </span>
        {open && <span aria-hidden="true" className="icm-assistant-fab-state open"><X size={12} /></span>}
      </button>
    </div>
  )
}
