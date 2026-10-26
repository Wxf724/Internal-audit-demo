import type { AnnualProjectItem, PlanContent, PlanningRisk, PlanningEvidence } from './model'

export type ResourceCategory = '审计对象库' | '年度风险评估结果' | '资源台账' | '监管日历' | '上年度结转' | '历史审计与整改' | '战略与经营重点'
export interface PlanResource {
  id: string
  category: ResourceCategory
  name: string
  source: string
  version: string
  summary: string
  subject?: string
  risk?: PlanningRisk
  capacity?: number
  required?: boolean
  project?: AnnualProjectItem
  fileId?: string
  locator?: string
  confirmedAt?: string
  year?: number
  archived?: boolean
  groupId?: string
  sourceRoute?: string
  documentName?: string
}
export interface PlanProposal {
  content: PlanContent
  resources: PlanResource[]
  baseFingerprint: string
  changes: string[]
  acceptedRevision?: number
  baseContent?: PlanContent
  suggestedContent?: PlanContent
}
export interface PlanMessage {
  id: string
  sessionId?: string
  role: 'user' | 'assistant'
  text: string
  at: string
  resources?: PlanResource[]
  proposal?: PlanProposal
  error?: boolean
  cancelled?: boolean
}
export interface PlanDraftRevision {
  version: number
  at: string
  content: PlanContent
  resources: PlanResource[]
  reason: string
}
export interface PlanConversation {
  activeSessionId?: string
  sessions?: PlanChatSession[]
  selectedResourceIds: string[]
  messages: PlanMessage[]
  revisions: PlanDraftRevision[]
  riskLibrary?: PlanningRisk[]
  evidenceLibrary?: PlanningEvidence[]
  capacityLimit?: number
  standardsVersion?: number
}
export interface PlanChatSession {
  resourceSelectionInitialized?: boolean
  id: string
  title: string
  createdAt: string
  updatedAt: string
  input: string
  selectedResourceIds: string[]
}
export const contentFingerprint = (content: PlanContent) => JSON.stringify(content)
