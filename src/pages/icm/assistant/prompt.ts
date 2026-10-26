import type {
  AssistantChatMessage,
  AssistantIntent,
  AssistantModelMessage,
  AssistantSourceScope,
} from './types'

const SCOPE_LABELS: Record<AssistantSourceScope, string> = {
  knowledge: '审计基础知识与通用方法',
  law: '内控规范与法规依据',
  project: '当前授权审计项目材料',
}

const MAX_HISTORY_MESSAGES = 10
const MAX_CONTENT_CHARS = 2000
const SUGGESTION_BLOCK = /```(?:suggestion|json)?[ \t]*\r?\n([\s\S]*?)\r?\n?```\s*$/i

export interface AssistantContext {
  role?: string
  projectName?: string
  projectId?: string
  scopes: AssistantSourceScope[]
}

function buildSystemPrompt(context: AssistantContext) {
  const scopes = context.scopes.length
    ? context.scopes.map((scope) => SCOPE_LABELS[scope]).join('、')
    : '审计基础知识与通用方法'
  const project = context.projectName
    ? `${context.projectName}${context.projectId ? `（${context.projectId}）` : ''}`
    : '未绑定具体项目，仅回答通用问题'
  return [
    '你是“审计智能助手”，服务于央国企内部审计与内控检查平台，对接对象是审计负责人、项目负责人和审计人员。',
    '',
    '回答要求：',
    '1. 使用简体中文，先给结论，再列依据与办理要点，条目化表达，避免空话；单次回答控制在 600 字以内。',
    '2. 专业表述贴合《企业内部控制基本规范》及配套指引、《中国内部审计准则》《审计署关于内部审计工作的规定》等规范语境；不确定条款号、文号或页码时，须写明“条款号需人工核对原文”，严禁编造。',
    '3. 你的输出是专业参考，不替代人工复核、取证与审批：涉及问题定级、责任认定、金额调整、整改销号、报告签发和对外报送时，只能给出建议，不得替审计人员下结论。',
    '4. 本系统尚未接入本地知识库检索，项目台账、金额、人员、进度等具体数据只能依据对话中已给出的信息回答；信息不足时明确说明缺少哪些数据，并提示到对应台账页面核对。',
    '5. 不输出与审计业务无关的内容，不使用营销化、夸张化表达。',
    '',
    `本次回答侧重：${scopes}。`,
    `提问人岗位：${context.role || '审计人员'}；当前项目：${project}。`,
    '',
    '当且仅当本次回答涉及可执行的审计办理动作（例如生成底稿、登记问题、补充取证、派发整改、提请复核）时，在回答末尾追加一个建议动作代码块，供人工确认后执行：',
    '```suggestion',
    '{"title":"动作名称，不超过 20 字","summary":"动作说明，不超过 60 字","actionLabel":"确认按钮文案，不超过 6 字"}',
    '```',
    '其他情况不要输出该代码块。',
  ].join('\n')
}

function clip(content: string) {
  const text = content.trim()
  return text.length > MAX_CONTENT_CHARS ? `${text.slice(0, MAX_CONTENT_CHARS)}…` : text
}

/** 组装本轮请求的 messages：系统提示词 + 最近若干轮历史 + 本次问题 */
export function buildAssistantMessages(
  history: AssistantChatMessage[],
  question: string,
  context: AssistantContext
): AssistantModelMessage[] {
  const messages: AssistantModelMessage[] = [
    { role: 'system', content: buildSystemPrompt(context) },
  ]
  history
    .filter((message) => message.content.trim())
    .slice(-MAX_HISTORY_MESSAGES)
    .forEach((message) => {
      messages.push({ role: message.role, content: clip(message.content) })
    })
  messages.push({ role: 'user', content: clip(question) })
  return messages
}

/** 从答复尾部剥离建议动作代码块，返回正文与可确认的办理动作 */
export function splitAnswerSuggestion(answer: string): {
  content: string
  intent?: AssistantIntent
} {
  const match = answer.match(SUGGESTION_BLOCK)
  if (!match) return { content: answer.trim() }
  const content = answer.slice(0, match.index).trim()
  try {
    const payload = JSON.parse(match[1].trim())
    const title = typeof payload?.title === 'string' ? payload.title.trim() : ''
    if (!title) return { content: answer.trim() }
    const summary = typeof payload?.summary === 'string' ? payload.summary.trim() : ''
    const actionLabel =
      typeof payload?.actionLabel === 'string' && payload.actionLabel.trim()
        ? payload.actionLabel.trim()
        : '确认办理'
    return {
      content: content || answer.trim(),
      intent: {
        id: `INTENT-${title}-${content.length}`,
        title: title.slice(0, 40),
        summary: summary.slice(0, 120),
        actionLabel: actionLabel.slice(0, 12),
      },
    }
  } catch {
    return { content: answer.trim() }
  }
}
