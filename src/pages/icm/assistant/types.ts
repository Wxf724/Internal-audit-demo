/** 审计智能助手问答范围 */
export type AssistantSourceScope = 'knowledge' | 'law' | 'project'

/** 会话连接状态 */
export type AssistantStatus = 'ready' | 'unconfigured' | 'loading' | 'error'

/** 模型建议的办理动作，需人工确认后才落地 */
export interface AssistantIntent {
  id: string
  title: string
  summary: string
  actionLabel: string
}

export interface AssistantChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  intent?: AssistantIntent
}

/** 多轮对话中回传给模型的消息结构 */
export interface AssistantModelMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

/** 失败类型，用于区分前端提示与是否允许重试 */
export type AssistantErrorKind =
  | 'unconfigured'
  | 'auth'
  | 'balance'
  | 'rate'
  | 'timeout'
  | 'network'
  | 'server'
  | 'aborted'
  | 'unknown'

/** 面板对外接口，页面入口只传上下文，不承担请求逻辑 */
export interface AuditAssistantProps {
  /** 不传时按是否配置 DeepSeek 密钥自动判定 */
  configured?: boolean
  currentProjectId?: string
  currentProjectName?: string
  role?: string
  onIntentConfirmed?: (intent: AssistantIntent) => void
}
