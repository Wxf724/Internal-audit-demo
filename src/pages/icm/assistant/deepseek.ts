import type { AssistantErrorKind, AssistantModelMessage } from './types'

// Credentials are encrypted outside the web project. External AI calls remain
// disabled at the user's request until a local server connection is enabled.
export const assistantProvider = { model: 'deepseek-chat' }

export function isAssistantConfigured() {
  return false
}

export class AssistantRequestError extends Error {
  kind: AssistantErrorKind
  retryable: boolean

  constructor(kind: AssistantErrorKind, message: string, retryable = true) {
    super(message)
    this.name = 'AssistantRequestError'
    this.kind = kind
    this.retryable = retryable
  }
}

export async function requestAssistantReply(
  _messages: AssistantModelMessage[],
  _signal?: AbortSignal,
  _options?: { maxTokens?: number }
): Promise<string> {
  throw new AssistantRequestError('unconfigured', 'AI 对话服务暂未启用。', false)
}