import type { PlanChatSession, PlanConversation } from './conversationTypes'

export const LEGACY_SESSION = 'initial'
export const messageSession = (sessionId?: string) => sessionId ?? LEGACY_SESSION
export function chatSessions(chat?: PlanConversation): PlanChatSession[] {
  if (chat?.sessions?.length) return chat.sessions
  const first = chat?.messages[0], last = chat?.messages.at(-1)
  return [{ id: LEGACY_SESSION, title: first?.text.slice(0, 24) || '年度计划编制', createdAt: first?.at ?? '', updatedAt: last?.at ?? '', input: '', selectedResourceIds: chat?.selectedResourceIds ?? [] }]
}

export function activeChat(chat?: PlanConversation) {
  return chatSessions(chat).find((session) => session.id === (chat?.activeSessionId ?? LEGACY_SESSION)) ?? chatSessions(chat)[0]
}
