export type AgentId = 'AG01' | 'AG02' | 'AG03' | 'AG04' | 'AG05' | 'AG06'
export type AgentRunStatus = 'queued' | 'completed' | 'failed'
export type AgentArtifactStatus = 'pending' | 'draft'
export type PredictionKind = 'risk-priority' | 'project-delay' | 'rectification-overdue'

export interface AgentTarget {
  label: string
  route: string
  recordId?: string
  tab?: string
}

export interface AgentVersionRef {
  label: string
  version: string
  recordId?: string
}

export interface AgentArtifact {
  reviewEvidence?: { fileId: string; locator: string; excerpt: string; term: string }
  reviewDisposition?: '待核实' | '已排除' | '已转底稿'
  reviewOpinion?: string
  paperId?: string
  id: string
  title: string
  kind: 'risk-assessment' | 'analysis-clue' | 'evidence-index' | 'workpaper-draft' | 'quality-review' | 'report-draft' | 'rectification-plan' | 'todo'
  status: AgentArtifactStatus
  summary: string
  target: AgentTarget
  predictionKind?: PredictionKind
  acceptedBy?: string
  acceptedAt?: string
}

export interface AgentRun {
  reviewContext?: {
    taskId: string
    taskName: string
    sources: { fileId: string; name: string; digest: string; text: string }[]
    agent: { id: string; title: string; version: number; config: import('../data/reviewConfig').ReviewConfig }
    references: { id: string; title: string; version: number; content: string }[]
  }
  executionMode?: 'model' | 'demo'
  id: string
  agentId: AgentId
  projectId: string
  projectName: string
  status: AgentRunStatus
  startedAt: string
  completedAt?: string
  triggeredBy: string
  trigger: string
  currentStep: string
  inputs: AgentVersionRef[]
  outputs: AgentArtifact[]
  message?: string
}

export interface AgentDefinition {
  id: AgentId
  name: string
  purpose: string
  mode: 'demo'
  predictionKinds: PredictionKind[]
  outputKinds: AgentArtifact['kind'][]
}

export type AgentRole = '审计负责人' | '项目负责人（主审）' | '审计人员'

export interface AgentRunRequest {
  agentId: AgentId
  projectId: string
  projectName: string
  triggeredBy: AgentRole
  trigger?: string
}
