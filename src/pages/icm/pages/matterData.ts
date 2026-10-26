import { useMemo } from 'react'
import { useAuditProjectStore } from '../store/auditProjectStore'
import { useTaskDispatchStore } from '../store/taskDispatchStore'
import { useWorkflowStore } from '../store/workflowStore'
import { useWorkpaperStore } from '../store/workpaperStore'
import { useProjectDocumentStore } from '../store/projectDocumentStore'
import { issueProjectId, legacyPaperOwners } from './projectScope'
import { projectYear } from './projectRelations'
import type { AuditProject } from '../data/auditProjects'

export const matterKinds = [{ id: 'tasks', label: '执行任务' }, { id: 'data', label: '资料需求' }, { id: 'papers', label: '底稿与证据' }, { id: 'findings', label: '审计发现' }, { id: 'reports', label: '审计报告' }] as const
export type MatterKind = (typeof matterKinds)[number]['id']
export interface Matter { key: string; id: string; kind: MatterKind; title: string; projectId?: string; owner: string; participants: string[]; pendingFor: string[]; status: string; date: string; href: string; subtype?: string }
const evidenceOwners: Record<string, string> = { 'EV-0312': 'AUD-PL-2026-001', 'EV-0316': 'AUD-PL-2026-001', 'EV-0321': 'AUD-PL-2026-001', 'EV-0318': 'AUD-PL-2026-021' }
export function useMatterData() {
  const projectDemands = useProjectDocumentStore((s) => s.demands)
  const evidences = useProjectDocumentStore((s) => s.evidences)
  const projects = useAuditProjectStore((s) => s.projects)
  const tasks = useTaskDispatchStore((s) => s.tasks)
  const issues = useWorkflowStore((s) => s.issues)
  const seedCases = useWorkpaperStore((s) => s.papers)
  const rows = useMemo((): Matter[] => [
    ...tasks.map((t): Matter => ({ key: `tasks:${t.id}`, id: t.id, kind: 'tasks', title: t.name, projectId: t.projectId ?? projects.find((p) => p.taskIds.includes(t.id))?.id, owner: t.owner, participants: [t.owner, t.reviewer], pendingFor: ['已完成', '已归档'].includes(t.status) ? [] : t.status === '待复核' ? [t.reviewer] : [t.owner], status: t.status, date: t.end, href: `/task-center?task=${t.id}`, subtype: t.type })),
    ...projectDemands.map((d): Matter => ({ key: `data:${d.id}`, id: d.id, kind: 'data', title: d.name, projectId: d.projectId, owner: d.owner, participants: [d.owner], pendingFor: d.status === '已采集' ? [] : [d.owner], status: d.status, date: d.due, href: `/projects/${d.projectId}?tab=execution&section=data&demand=${d.id}`, subtype: '资料需求' })),
    ...seedCases.map((p): Matter => ({ key: `papers:${p.id}`, id: p.id, kind: 'papers', title: p.title, projectId: p.projectId ?? legacyPaperOwners[p.id], owner: p.owner, participants: [p.owner, ...p.reviewChain.map((r) => r.owner)], pendingFor: ['草稿', '取证中'].includes(p.status) ? [p.owner] : p.reviewChain.filter((r) => r.status === '处理中' || r.status === '待审批').map((r) => r.owner), status: p.status, date: p.createdAt, href: p.projectId ? `/projects/${p.projectId}?tab=execution&section=papers&paper=${p.id}` : `/workpaper?paper=${p.id}`, subtype: p.type })),
    ...evidences.map((e): Matter => ({ key: `papers:${e.id}`, id: e.id, kind: 'papers', title: e.title, projectId: e.projectId ?? evidenceOwners[e.id], owner: e.owner, participants: [e.owner], pendingFor: [], status: e.status, date: e.capturedAt ?? '', href: e.projectId ? `/projects/${e.projectId}?tab=execution&section=data&evidence=${e.id}` : `/evidence?evidence=${e.id}`, subtype: '取证记录' })),
    ...issues.filter((i) => !i.mergedIntoId).map((i): Matter => ({ key: `findings:${i.id}`, id: i.id, kind: 'findings', title: i.title, projectId: issueProjectId(i), owner: i.creator, participants: [i.creator, i.owner, i.gradingAuditor ?? ''], pendingFor: i.status === '待确认' ? [i.creator] : i.status === '待分级审核' ? [i.gradingAuditor ?? ''] : [], status: i.status, date: i.deadline, href: `/issues?issue=${i.id}`, subtype: i.level })),
    ...projects.filter((p) => p.auditReport).map((p): Matter => ({ key: `reports:${p.id}`, id: p.id, kind: 'reports', title: p.auditReport!.title, projectId: p.id, owner: p.owner, participants: [p.owner], pendingFor: p.auditReport!.status === '草稿' ? [p.owner] : [], status: p.auditReport!.status, date: p.auditReport!.history.at(-1)?.at.slice(0, 10) ?? '', href: `/projects/${p.id}?tab=report`, subtype: '项目审计报告' })),
  ], [projects, tasks, issues, seedCases, projectDemands, evidences])
  return { rows, projects }
}
export function filterMatters(rows: Matter[], projects: AuditProject[], params: URLSearchParams, role: { id: string; name: string }) {
  const kind = params.get('kind') ?? 'tasks', year = params.get('year') ?? 'all', q = params.get('q') ?? '', scope = params.get('scope') ?? 'all', status = params.get('status') ?? 'all'
  const chosen = (params.get('projectIds') ?? '').split(',').filter(Boolean)
  return rows.filter((r) => {
    const p = projects.find((p) => p.id === r.projectId)
    const involved = r.participants.includes(role.name) || p?.owner === role.name
    return r.kind === kind && (role.id === 'audit-lead' || involved) && (year === 'all' || p && projectYear(p) === Number(year)) && (!chosen.length || chosen.includes(r.projectId ?? '')) && (status === 'all' || r.status === status) && `${r.title}${r.id}${p?.name ?? ''}${p?.subject ?? ''}${r.owner}`.includes(q.trim()) && (scope === 'all' || scope === 'mine' && (r.owner === role.name || p?.owner === role.name) || scope === 'participating' && involved || scope === 'pending' && r.pendingFor.includes(role.name))
  })
}
export function matterHref(row: Matter, returnTo: string) {
  const [path, query = ''] = row.href.split('?')
  const params = new URLSearchParams(query)
  if (row.projectId && !path.startsWith('/projects/')) params.set('project', row.projectId)
  params.set('returnTo', returnTo); params.set('matter', row.key)
  return `${path}?${params}`
}
export function safeMatterReturn(value: string | null) {
  if (!value?.startsWith('/projects?')) return undefined
  return new URLSearchParams(value.split('?')[1]).get('view') === 'items' ? value : undefined
}
