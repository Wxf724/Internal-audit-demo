import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { adjustPlan, decidePlan, newId, now, saveContent, submitPlan } from '../pages/annual-plan/model'
import type { AnnualPlan, PlanActor, PlanContent, PlanningRun } from '../pages/annual-plan/model'
import { initialAnnualPlans, restoreAnnualPlans } from '../pages/annual-plan/seeds'
import { REVIEW_STAGES, DEFAULT_REVIEW_STAGES } from '../pages/annual-plan/planning'
import { planningEvidence } from '../data/annualPlanning'
import { useAuditProjectStore } from './auditProjectStore'
import type { PlanConversation, PlanMessage, PlanResource } from '../pages/annual-plan/conversationTypes'
import { contentFingerprint } from '../pages/annual-plan/conversationTypes'
import { canEditPlan } from '../pages/annual-plan/model'
import { attachDraftSources, draftIssues } from '../pages/annual-plan/draftRules'
import { usePlanningLibraryStore } from './planningLibraryStore'
import { activeChat, chatSessions, messageSession } from '../pages/annual-plan/chatSessions'
import { createEditableExample } from '../pages/annual-plan/planningExample'
import { detachRequestedProject } from './requestedProjectCleanup'

function conversationFor(plan: AnnualPlan): PlanConversation {
  return plan.conversation ?? { selectedResourceIds: [], messages: [], revisions: plan.content.items.length ? [{ version: 1, at: now(), content: structuredClone(plan.content), resources: [], reason: '现有草案' }] : [], riskLibrary: structuredClone(plan.content.risks ?? []), evidenceLibrary: structuredClone(plan.content.evidence ?? []), capacityLimit: plan.content.capacity ?? 300 }
}

interface AnnualPlanState {
  plans: AnnualPlan[]
  exampleWorkspace?: AnnualPlan
  ensureExampleWorkspace: () => void
  workspaceModes?: Record<string, boolean>
  setWorkspaceMode: (id: string, example: boolean) => void
  create: (year: number, actor: PlanActor, reviewer: PlanActor, approver: PlanActor) => string
  save: (id: string, content: PlanContent, actor: PlanActor) => void
  submit: (id: string, actor: PlanActor) => void
  decide: (id: string, actor: PlanActor, decision: '通过' | '退回', opinion: string, reference?: string) => void
  adjust: (id: string, actor: PlanActor, reason: string) => void
  addRun: (id: string, run: PlanningRun) => void
  decideSuggestion: (id: string, runId: string, suggestionId: string, accept: boolean, reason: string) => void
  selectResources: (id: string, ids: string[]) => void
  initializeResourceSelection: (id: string, ids: string[]) => void
  appendMessages: (id: string, messages: PlanMessage[]) => void
  newChatSession: (id: string) => void
  switchChatSession: (id: string, sessionId: string) => void
  saveChatInput: (id: string, input: string) => void
  acceptProposal: (id: string, messageId: string, actor: PlanActor, edited?: PlanContent, resources?: PlanResource[]) => void
  saveConversationDraft: (id: string, content: PlanContent, actor: PlanActor, resources: PlanResource[], reason: string) => void
  submitConversation: (id: string, actor: PlanActor, stages: string[], confirmed: boolean, governance?: { approvalAuthority: string; governanceBasis: string }) => void
}

export const useAnnualPlanStore = create<AnnualPlanState>()(persist((set, get) => {
  const update = (id: string, operation: (plan: AnnualPlan) => AnnualPlan) => {
    const plan = get().exampleWorkspace?.id === id ? get().exampleWorkspace : get().plans.find((item) => item.id === id)
    if (!plan) throw new Error('年度计划不存在。')
    const next = operation(plan)
    set((state) => state.exampleWorkspace?.id === id ? { exampleWorkspace: next } : { plans: state.plans.map((item) => item.id === id ? next : item) })
  }
  return {
    plans: initialAnnualPlans,
    ensureExampleWorkspace: () => { if (!get().exampleWorkspace) set({ exampleWorkspace: createEditableExample() }) },
    setWorkspaceMode: (id, example) => set((state) => ({ workspaceModes: { ...state.workspaceModes, [id]: example } })),
    newChatSession: (id) => update(id, (plan) => {
      const chat = conversationFor(plan), current = activeChat(chat), sessionId = newId(), at = now()
      const sessions = chatSessions(chat).map((session) => session.id === current.id ? { ...session, selectedResourceIds: [...chat.selectedResourceIds] } : session)
      if (!chat.messages.some((message) => messageSession(message.sessionId) === current.id) && !current.input.trim()) return { ...plan, conversation: { ...chat, activeSessionId: current.id, sessions: sessions.map((session) => session.id === current.id ? { ...session, title: '新会话', createdAt: session.createdAt || at, updatedAt: at } : session) } }
      return { ...plan, conversation: { ...chat, activeSessionId: sessionId, selectedResourceIds: [...chat.selectedResourceIds], sessions: [...sessions, { id: sessionId, title: '新会话', createdAt: at, updatedAt: at, input: '', selectedResourceIds: [...chat.selectedResourceIds], resourceSelectionInitialized: current.resourceSelectionInitialized }] } }
    }),
    switchChatSession: (id, sessionId) => update(id, (plan) => {
      const chat = conversationFor(plan), current = activeChat(chat)
      const sessions = chatSessions(chat).map((session) => session.id === current.id ? { ...session, selectedResourceIds: [...chat.selectedResourceIds] } : session)
      const target = sessions.find((session) => session.id === sessionId)
      if (!target) throw new Error('会话不存在。')
      return { ...plan, conversation: { ...chat, sessions, activeSessionId: target.id, selectedResourceIds: [...target.selectedResourceIds] } }
    }),
    saveChatInput: (id, input) => update(id, (plan) => {
      const chat = conversationFor(plan), current = activeChat(chat)
      return { ...plan, conversation: { ...chat, sessions: chatSessions(chat).map((session) => session.id === current.id ? { ...session, input } : session) } }
    }),
    initializeResourceSelection: (id, ids) => {
      const plan = get().exampleWorkspace?.id === id ? get().exampleWorkspace : get().plans.find((p) => p.id === id)
      if (!plan) return
      const chat = conversationFor(plan), current = activeChat(chat)
      if (current.resourceSelectionInitialized) return
      // Preserve saved selections and legacy conversations, including deliberate empty selections.
      const initialized = chat.selectedResourceIds.length > 0 || chat.messages.length > 0
      get().selectResources(id, initialized ? chat.selectedResourceIds : ids)
    },
    selectResources: (id, ids) => update(id, (plan) => {
      const chat = conversationFor(plan)
      const added = usePlanningLibraryStore.getState().resources.filter((r) => ids.includes(r.id)).flatMap((r) => r.risk ? [r.risk] : [])
      const current = activeChat(chat)
      return { ...plan, conversation: { ...chat, sessions: chatSessions(chat).map((session) => session.id === current.id ? { ...session, resourceSelectionInitialized: true, selectedResourceIds: [...new Set(ids)] } : session), selectedResourceIds: [...new Set(ids)], riskLibrary: [...new Map([...(chat.riskLibrary ?? []), ...added].map((r) => [r.id, r])).values()] } }
    }),
    appendMessages: (id, messages) => update(id, (plan) => {
      const chat = conversationFor(plan), current = activeChat(chat)
      const added = structuredClone(messages).map((message) => ({ ...message, sessionId: message.sessionId ?? current.id }))
      const firstUser = added.find((message) => message.role === 'user')
      return { ...plan, conversation: { ...chat, activeSessionId: current.id, sessions: chatSessions(chat).map((session) => session.id === current.id ? { ...session, updatedAt: now(), title: ['新会话', '年度计划编制'].includes(session.title) && firstUser ? firstUser.text.slice(0, 24) : session.title } : session), messages: [...chat.messages, ...added] } }
    }),
    acceptProposal: (id, messageId, actor, edited, resources) => update(id, (plan) => {
      const chat = conversationFor(plan), proposal = chat.messages.find((entry) => entry.id === messageId)?.proposal
      if (!proposal || proposal.acceptedRevision) throw new Error('该建议不存在或已确认。')
      if (contentFingerprint(plan.content) !== proposal.baseFingerprint) throw new Error('当前草案已更新，请基于最新草案重新生成建议。')
      const next = saveContent(plan, attachDraftSources(edited ?? proposal.content, resources ?? proposal.resources), actor)
      const version = chat.revisions.length + 1
      return { ...next, conversation: { ...chat, standardsVersion: 2, revisions: [...chat.revisions, { version, at: now(), content: structuredClone(next.content), resources: structuredClone(resources ?? proposal.resources), reason: edited ? '编辑并采用建议' : '确认对话生成的草案' }], messages: chat.messages.map((message) => message.id !== messageId ? message : { ...message, proposal: { ...proposal, suggestedContent: proposal.content, content: structuredClone(next.content), resources: structuredClone(resources ?? proposal.resources), acceptedRevision: version } }) } }
    }),
    saveConversationDraft: (id, content, actor, resources, reason) => update(id, (plan) => {
      const next = saveContent(plan, attachDraftSources(content, resources), actor), chat = conversationFor(plan)
      const version = chat.revisions.length + 1, current = activeChat(chat), at = now()
      return { ...next, conversation: { ...chat, standardsVersion: 2, sessions: chatSessions(chat).map((session) => session.id === current.id ? { ...session, updatedAt: at } : session), revisions: [...chat.revisions, { version, at, content: structuredClone(next.content), resources: structuredClone(resources), reason }], messages: [...chat.messages, { id: newId(), sessionId: current.id, role: 'assistant', at, text: `人工修改已保存为草案 V${version}，共 ${next.content.items.length} 个项目、${next.content.items.reduce((sum, item) => sum + item.workdays, 0)} 人天。` }] } }
    }),
    submitConversation: (id, actor, stages, confirmed, governance) => update(id, (plan) => {
      if (!confirmed || !canEditPlan(plan, actor)) throw new Error('请先核对当前草案和引用资料。')
      if (stages.at(-1) !== '有权机构批准' || new Set(stages).size !== stages.length || stages.some((stage) => !REVIEW_STAGES.includes(stage))) throw new Error('审议环节无效，最终批准须位于最后。')
      const issues = draftIssues(plan, plan.content, plan.conversation?.revisions.at(-1)?.resources ?? [])
      if (issues.length) throw new Error(issues[0].message)
      const content = { ...plan.content, ...governance, reviewStages: [...stages], evidence: plan.content.evidence?.map((entry) => ({ ...entry, status: '已确认' as const, confirmedAt: now() })) }
      const next = submitPlan(saveContent(plan, content, actor), actor), chat = conversationFor(plan)
      return { ...next, conversation: { ...chat, revisions: [...chat.revisions, { version: chat.revisions.length + 1, at: now(), content: structuredClone(content), resources: structuredClone(chat.revisions.at(-1)?.resources ?? []), reason: '确认并提交审议' }], messages: [...chat.messages, { id: newId(), sessionId: activeChat(chat).id, role: 'assistant', text: `已提交审议。送审版本 V${next.submissions.at(-1)?.version}，当前环节：${stages[0]}。`, at: now() }] } }
    }),
    create: (year, actor, reviewer, approver) => {
      if (!Number.isInteger(year) || year < 2000 || year > 2100) throw new Error('请输入2000至2100之间的计划年度。')
      if (get().plans.some((plan) => plan.year === year)) throw new Error('该年度已有计划，请维护原计划或发起调整。')
      const id = `AP-${year}-${newId().slice(0, 8)}`
      const plan: AnnualPlan = {
        id, year, status: '编制中', creator: actor, submissions: [], adjustmentReason: '', updatedAt: now(), recordingMode: true,
        content: { name: `${year}年度审计计划`, department: '审计部', basis: '', objective: '', reviewer, approver, items: [], reviewStages: [...DEFAULT_REVIEW_STAGES], evidence: planningEvidence(year), risks: [], capacity: 300 },
      }
      set((state) => ({ plans: [plan, ...state.plans] }))
      return id
    },
    save: (id, content, actor) => update(id, (plan) => saveContent(plan, content, actor)),
    submit: (id, actor) => update(id, (plan) => submitPlan(plan, actor)),
    decide: (id, actor, decision, opinion, reference) => {
      update(id, (plan) => decidePlan(plan, actor, decision, opinion, reference))
      const plan = get().plans.find((entry) => entry.id === id)!
      if (plan.status === '已批准' && plan.approved) {
        const projectStore = useAuditProjectStore.getState()
        for (const item of plan.approved.content.items) {
          const project = projectStore.projects.find((entry) => entry.id === item.projectId || entry.planId === `${plan.id}/${item.id}`)
          const plannedImplementation = `${item.start} 至 ${item.end}`
          if (project && project.plannedImplementation !== plannedImplementation) projectStore.updateProject(project.id, { plannedImplementation })
        }
      }
    },
    adjust: (id, actor, reason) => update(id, (plan) => adjustPlan(plan, actor, reason)),
    addRun: (id, run) => update(id, (plan) => {
      if (!['编制中', '已退回'].includes(plan.status)) throw new Error('请在编制或调整状态运行辅助分析。')
      return { ...plan, aiRuns: [...(plan.aiRuns ?? []), run], updatedAt: now() }
    }),
    decideSuggestion: (id, runId, suggestionId, accept, reason) => update(id, (plan) => {
      if (!['编制中', '已退回'].includes(plan.status)) throw new Error('当前计划不可修改。')
      const suggestion = plan.aiRuns?.find((run) => run.id === runId)?.suggestions.find((item) => item.id === suggestionId)
      if (!suggestion || suggestion.status !== '待确认') throw new Error('建议已处理或不存在。')
      if (!accept && !reason.trim()) throw new Error('请记录暂不纳入的理由。')
      if (accept && plan.content.items.some((item) => item.riskId === suggestion.riskId)) throw new Error('该风险对应项目已纳入草案，请编辑已有项目。')
      return { ...plan, content: { ...plan.content, items: accept ? [...plan.content.items, suggestion.item] : plan.content.items }, aiRuns: plan.aiRuns?.map((run) => run.id !== runId ? run : { ...run, suggestions: run.suggestions.map((item) => item.id !== suggestionId ? item : { ...item, status: accept ? '已采纳' : '暂不纳入', decisionReason: reason.trim() || '内审机构确认纳入草案。' }) }), updatedAt: now() }
    }),
  }
}, { name: 'internal-audit-annual-plans-v1', storage: createJSONStorage(() => localStorage), version: 1,
  migrate: (persisted) => {
    const saved = persisted as Partial<AnnualPlanState>
    return { ...saved, plans: detachRequestedProject(saved.plans, useAuditProjectStore.getState().deletedProjects) }
  },
  merge: (persisted, current) => {
  const saved = persisted as Partial<AnnualPlanState> | undefined
  return { ...current, plans: restoreAnnualPlans(saved?.plans), exampleWorkspace: saved?.exampleWorkspace, workspaceModes: saved?.workspaceModes }
} }))
