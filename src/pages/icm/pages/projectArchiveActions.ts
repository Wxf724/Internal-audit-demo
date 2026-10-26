import { useAuditProjectStore } from '../store/auditProjectStore'
import { useProjectDocumentStore } from '../store/projectDocumentStore'
import { useWorkflowStore } from '../store/workflowStore'
import { workId } from '../data/projectWork'
import { issueProjectId } from './projectScope'
import { isPaperApproved, workProject, workProjectPapers } from './projectWorkActions'

export function archiveChecklist(id: string) {
  const p = workProject(id), papers = workProjectPapers(id), docs = useProjectDocumentStore.getState()
  return [
    { title: '批准方案及采用资源版本', pass: Boolean(p.preparation?.confirmedAt && p.preparationVersions?.length) },
    { title: '通知文号与送达记录', pass: Boolean(p.preparation?.notificationNo && p.preparation.deliveredAt) },
    { title: '审计底稿复核完成', pass: papers.length > 0 && papers.every(isPaperApproved) },
    { title: '引用证据可追溯', pass: papers.every((r) => r.evidenceIds?.length && r.evidenceIds.every((eid) => docs.evidences.some((e) => e.id === eid && e.projectId === id))) },
    { title: '报告已签发并保存固定版本', pass: p.auditReport?.status === '已签发' && Boolean(p.auditReport.versions?.length) },
    { title: '征求意见处理完成', pass: Boolean(p.auditReport?.communications?.length) && p.auditReport!.communications!.every((c) => c.resolvedAt) },
  ]
}
export function requestArchive(id: string, note: string, actor: string) {
  const p = workProject(id)
  if (p.archivedAt || p.archivePending) throw new Error('项目已归档或正在审核。')
  if (!note.trim() || archiveChecklist(id).some((c) => !c.pass)) throw new Error('请完成档案核对，并说明未销号整改的跟踪责任。')
  const docs = useProjectDocumentStore.getState(), papers = workProjectPapers(id)
  const issues = useWorkflowStore.getState().issues.filter((i) => issueProjectId(i) === id)
  const evidences = docs.evidences.filter((e) => e.projectId === id), files = docs.files.filter((f) => f.projectId === id)
  const manifest = [{ id: id + '-PREP', title: '批准的项目审计方案', type: '方案' }, { id: id + '-NOTICE', title: p.preparation!.notificationNo!, type: '通知' }, ...papers.map((r) => ({ id: r.id, title: r.title, type: '底稿' })), ...evidences.map((e) => ({ id: e.id, title: e.title, type: '证据' })), ...files.map((f) => ({ id: f.id, title: f.name, type: '原始文件' })), ...issues.map((i) => ({ id: i.id, title: i.title, type: '发现' })), { id: id + '-RPT', title: p.auditReport!.title, type: '签发报告' }]
  const candidate = { version: (p.archiveSnapshot?.version ?? 0) + 1, at: new Date().toISOString(), by: actor, note, manifest, content: JSON.stringify({ project: { ...p, archiveSnapshot: undefined, archiveCandidate: undefined }, papers, issues, evidences, files }, null, 2) }
  useAuditProjectStore.getState().updateProject(id, { archivePending: true, archiveCandidate: candidate, archiveNote: note })
  useWorkflowStore.setState((s) => ({ audits: [...s.audits, { id: workId('APR'), projectId: id, projectObject: 'archive', sourceVersion: candidate.version, type: '项目归档审核', title: `${p.name} · 项目归档`, businessId: id, route: `/projects/${id}?tab=archive`, applicant: actor, status: '待处理', node: '项目归档审核', submittedAt: new Date().toISOString() }] }))
}
