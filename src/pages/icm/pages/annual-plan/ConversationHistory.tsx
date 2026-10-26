import { useState } from 'react'
import { MessageSquare, Plus, X } from 'lucide-react'
import { Button } from '@/components'
import type { PlanConversation } from './conversationTypes'
import { activeChat, chatSessions, messageSession } from './chatSessions'

export function ConversationHistory({ chat, example, exampleChat, onSelect, onExample, onNew, onClose }: {
  chat?: PlanConversation; example: boolean; exampleChat?: PlanConversation; onSelect: (id: string) => void; onExample: () => void; onNew: () => void; onClose: () => void
}) {
  const [search, setSearch] = useState('')
  const sessions = [...chatSessions(chat)].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).filter((session) => `${session.title} ${(chat?.messages ?? []).filter((m) => messageSession(m.sessionId) === session.id).map((m) => m.text).join(' ')}`.includes(search.trim()))
  const showExample = !example && `2027年度计划编制 示例 采购调整 ${(exampleChat?.messages ?? []).map((m) => m.text).join(' ')}`.includes(search.trim())
  return <aside id="plan-session-sidebar" className="plan-session-history" aria-label="会话历史" onKeyDown={(event) => { if (event.key === 'Escape') onClose() }}>
    <header><strong>会话历史</strong><button aria-label="关闭会话历史" onClick={onClose}><X size={16} /></button></header>
    <input autoFocus className="icm-input" type="search" aria-label="搜索会话" placeholder="搜索标题或对话内容" value={search} onChange={(event) => setSearch(event.target.value)} />
    <Button type="ghost" icon={<Plus size={14} />} onClick={onNew}>新建会话</Button>
    <div className="plan-session-list">{sessions.map((session) => <button key={session.id} className={session.id === 'example' ? 'plan-session-example' : undefined} aria-current={session.id === activeChat(chat).id ? 'true' : undefined} onClick={() => onSelect(session.id)}><MessageSquare size={15} /><span><strong>{session.title}</strong><small>{session.updatedAt || '尚未开始'} · {(chat?.messages ?? []).filter((message) => messageSession(message.sessionId) === session.id).length} 条记录</small></span></button>)}
      {showExample && <button className="plan-session-example" onClick={onExample}><MessageSquare size={15} /><span><strong>2027 年度计划编制 <i>示例</i></strong><small>继续编制 · {exampleChat?.messages.length ?? 7} 条记录</small></span></button>}
      {!sessions.length && !showExample && <p className="icm-empty-inline">没有匹配的会话</p>}
    </div>
  </aside>
}
