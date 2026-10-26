import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { buildDemoRun, DEMO_AGENT_RUNS } from './definitions'
import type { AgentArtifact, AgentId, AgentRole, AgentRun, AgentRunRequest } from './types'
import type { PlanningRun } from '../pages/annual-plan/model'
import type { PlanMessage } from '../pages/annual-plan/conversationTypes'

interface AgentRuntimeState {
  runs: AgentRun[]
  sequence: number
  runAgent: (request: AgentRunRequest) => string
  completeQueuedRun: (runId: string, role: AgentRole) => void
  acceptArtifact: (runId: string, artifactId: string, role: AgentRole) => void
  resetDemo: () => void
  recordPlanningRun: (planId: string, planName: string, analysis: PlanningRun) => void
  recordConversationRun: (planId: string, planName: string, message: PlanMessage) => void
}

function acceptedAt() {
  return new Date().toISOString().slice(0, 16).replace('T', ' ')
}

export const useAgentRuntimeStore = create<AgentRuntimeState>()(persist((set, get) => ({
  runs: DEMO_AGENT_RUNS,
  sequence: 10,
  recordConversationRun: (planId, planName, message) => set((state) => ({ runs: [{ id: `CHAT-${message.id}`, agentId: 'AG01', executionMode: 'model', projectId: planId, projectName: planName, status: 'completed', startedAt: message.at, completedAt: message.at, triggeredBy: '审计负责人', trigger: '年度计划对话编制', currentStep: message.proposal ? '已生成待确认草案' : '已完成编制问答', inputs: (message.resources ?? []).map((resource) => ({ label: resource.name, version: resource.version, recordId: resource.id })), outputs: [{ id: message.id, title: message.proposal ? '年度计划草案建议' : '年度计划编制答复', kind: 'risk-assessment', status: 'pending', summary: message.text, target: { label: '年度计划 / 对话编制', route: `/plan-workbench?annual=${planId}&tab=compose` } }] }, ...state.runs] })),
  recordPlanningRun: (planId, planName, analysis) => set((state) => ({
    runs: [...(['AG01', 'AG02', 'AG06', 'AG04'] as const).map((agentId): AgentRun => ({
      id: `${analysis.id}-${agentId}`, agentId, projectId: planId, projectName: planName,
      status: 'completed', startedAt: analysis.at, completedAt: analysis.at, triggeredBy: '审计负责人',
      trigger: '年度计划辅助编制（演示分析）', currentStep: '已形成待人工确认的编制建议',
      inputs: analysis.sources.map((source) => ({ label: source, version: analysis.at })),
      outputs: agentId === 'AG01' ? analysis.suggestions.map((item) => ({ id: item.id, title: item.item.name, kind: 'risk-assessment', status: 'pending', summary: item.reason, target: { label: '年度计划 / 风险与选项', route: `/plan-workbench?annual=${planId}&tab=risks` } })) : [{ id: `${analysis.id}-${agentId}-result`, title: agentId === 'AG02' ? '风险指标与资料覆盖检查' : agentId === 'AG06' ? '整改与后续审计需求' : '编制资料与资源检查', kind: 'quality-review', status: 'pending', summary: analysis.findings.join('；'), target: { label: '年度计划 / 编制依据', route: `/plan-workbench?annual=${planId}&tab=evidence` } }],
    })), ...state.runs],
  })),
  runAgent: (request) => {
    const nextSequence = get().sequence + 1
    const generated = buildDemoRun(request, nextSequence)
    set((state) => ({ runs: [generated, ...state.runs], sequence: nextSequence }))
    return generated.id
  },
  completeQueuedRun: (runId, role) => set((state) => ({
    runs: state.runs.map((run) => run.id !== runId || run.status !== 'queued' ? run : {
      ...run,
      status: 'completed',
      completedAt: acceptedAt(),
      triggeredBy: role,
      currentStep: `演示运行完成，生成 ${run.outputs.length} 项待确认结果`,
    }),
  })),
  acceptArtifact: (runId, artifactId, role) => set((state) => ({
    runs: state.runs.map((run) => run.id !== runId ? run : {
      ...run,
      outputs: run.outputs.map((artifact) => artifact.id !== artifactId || artifact.status !== 'pending' ? artifact : {
        ...artifact, status: 'draft', acceptedBy: role, acceptedAt: acceptedAt(),
      }),
    }),
  })),
  resetDemo: () => set({ runs: DEMO_AGENT_RUNS, sequence: 10 }),
}), {
  name: 'icm-audit-agent-runtime-v1',
  storage: createJSONStorage(() => localStorage),
  partialize: (state) => ({ runs: state.runs, sequence: state.sequence }) as AgentRuntimeState,
}))

export function selectAgentRuns(state: Pick<AgentRuntimeState, 'runs'>, options?: { projectId?: string; agentId?: AgentId }) {
  return state.runs.filter((run) => (!options?.projectId || run.projectId === options.projectId) && (!options?.agentId || run.agentId === options.agentId))
}

export function canAcceptAgentArtifact(role: AgentRole, artifact: AgentArtifact): boolean {
  if (artifact.kind === 'analysis-clue' || artifact.kind === 'evidence-index') return true
  if (artifact.kind === 'workpaper-draft') return role === '审计人员' || role === '项目负责人（主审）' || role === '审计负责人'
  return role === '项目负责人（主审）' || role === '审计负责人'
}

