import type { WorkflowAudit } from '../store/workflowStore'
import { useAuditProjectStore } from '../store/auditProjectStore'
import { useWorkpaperStore } from '../store/workpaperStore'
import { useTaskDispatchStore } from '../store/taskDispatchStore'
import { workEvent } from '../data/projectWork'
import { programComplete, workProject } from './projectWorkActions'

export function decideProjectReview(audit: WorkflowAudit, pass: boolean, opinion: string, actor: string) {
  if (!audit.projectId || audit.status !== '待处理' || !opinion.trim()) throw new Error('请填写审核意见，且仅办理待处理记录。')
  const p = workProject(audit.projectId), update = useAuditProjectStore.getState().updateProject
  if (audit.projectObject === 'preparation') {
    const d = p.preparation
    if (!d || d.status !== '待审核' || (d.version ?? 1) !== audit.sourceVersion) throw new Error('方案版本已变化，请重新提交。')
    const next = { ...d, status: pass ? '已批准' as const : '草稿' as const, confirmedAt: pass ? new Date().toISOString() : undefined, history: [...(d.history ?? []), workEvent(pass ? '批准方案' : '退回方案', actor, opinion)] }
    update(p.id, { preparation: next, ...(pass ? { stage: p.stage === '准备中' ? '实施中' as const : p.stage, actualImplementation: p.actualImplementation ?? new Date().toISOString().slice(0, 10), preparationVersions: [...(p.preparationVersions ?? []), { version: d.version ?? 1, content: structuredClone(next), programs: structuredClone(p.programs ?? []), at: new Date().toISOString() }] } : {}) })
  } else if (audit.projectObject === 'paper') {
    const paper = useWorkpaperStore.getState().papers.find((r) => r.id === audit.businessId && r.projectId === p.id)
    if (!paper || paper.reviewState !== '待复核' || paper.version !== audit.sourceVersion) throw new Error('底稿版本已变化，请重新提交。')
    useWorkpaperStore.setState((s) => ({ papers: s.papers.map((r) => r.id !== paper.id ? r : { ...r, reviewState: pass ? '已复核' : '退回修改', status: pass ? '待归档' : '草稿', reviewChain: [{ node: '底稿复核', owner: actor, status: pass ? '通过' : '退回', opinion }], history: [...(r.history ?? []), workEvent(pass ? '底稿复核通过' : '退回底稿', actor, opinion)] }) }))
    if (pass) useTaskDispatchStore.setState((s) => ({ tasks: s.tasks.map((t) => t.projectId === p.id && t.programIds?.length && t.programIds.every((id) => programComplete(p.id, id)) ? { ...t, status: '已完成', progress: 100 } : t) }))
  } else if (audit.projectObject === 'report') {
    const r = p.auditReport
    if (!r || r.status !== '待复核' || r.version !== audit.sourceVersion) throw new Error('报告版本已变化，请重新提交。')
    update(p.id, { auditReport: { ...r, status: pass ? '已复核' : '草稿', history: [...r.history, workEvent(pass ? '报告复核通过' : '退回报告', actor, opinion)] } })
  } else if (audit.projectObject === 'archive') {
    if (!p.archivePending || p.archiveCandidate?.version !== audit.sourceVersion) throw new Error('归档版本已变化。')
    update(p.id, { archivePending: false, ...(pass ? { archivedAt: new Date().toISOString(), archiveSnapshot: { ...p.archiveCandidate, by: actor, at: new Date().toISOString() }, archiveCandidate: undefined, stage: '已归档' as const } : { archiveCandidate: undefined }) })
  }
}
