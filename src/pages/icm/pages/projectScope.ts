import { useMemo } from 'react'
import { useLocation, useNavigate, type NavigateOptions } from 'react-router-dom'
import { useAuditProjectStore } from '../store/auditProjectStore'
import { useWorkflowStore, type WorkflowIssue } from '../store/workflowStore'

// Explicit ownership of legacy records; unknown records remain unassigned.
const issueOwners: Record<string, string> = {
  'ISS-2026-001': 'AUD-PL-2026-001', 'ISS-2026-002': 'AUD-PL-2026-001',
  'ISS-2026-004': 'AUD-PL-2026-021', 'ISS-2026-007': 'AUD-PL-2026-058',
}
export const legacyPaperOwners: Record<string, string> = {
  'WP-CG-2026-0451': 'AUD-PL-2026-001', 'WP-SUP-2026-0456': 'AUD-PL-2026-001', 'WP-PAY-2026-0455': 'AUD-PL-2026-021',
}
export function issueProjectId(issue: WorkflowIssue) { return issue.projectId ?? issueOwners[issue.id] }
export function useProjectScope() {
  const location = useLocation()
  const projectId = location.pathname.match(/^\/projects\/([^/]+)$/)?.[1] ?? new URLSearchParams(location.search).get('project') ?? undefined
  const project = useAuditProjectStore((s) => s.projects.find((p) => p.id === projectId))
  return { projectId, project }
}
export function useProjectRecords() {
  const { projectId } = useProjectScope()
  const allIssues = useWorkflowStore((s) => s.issues)
  const allRects = useWorkflowStore((s) => s.rectifications)
  const allReports = useWorkflowStore((s) => s.reports)
  return useMemo(() => {
    const issues = projectId ? allIssues.filter((i) => issueProjectId(i) === projectId) : allIssues
    const rectifications = projectId ? allRects.filter((r) => issues.some((i) => i.id === r.issueId)) : allRects
    const reports = projectId ? allReports.filter((r) => (r.rectificationIds ?? [r.rectificationId]).every((id) => rectifications.some((rect) => rect.id === id))) : allReports
    return { issues, rectifications, reports }
  }, [projectId, allIssues, allRects, allReports])
}
const scopedPaths = ['/task-center', '/dispatch-center', '/data-collect', '/review-workbench', '/walkthrough-workbench', '/workpaper', '/evidence', '/issues', '/rectify', '/report']
export function projectHref(path: string, projectId?: string) {
  const [pathname, query = ''] = path.split('?')
  if (!projectId || !scopedPaths.includes(pathname)) return path
  const params = new URLSearchParams(query)
  params.set('project', projectId)
  return `${pathname}?${params}`
}
export function useProjectNavigate() {
  const navigate = useNavigate()
  const location = useLocation()
  const { projectId } = useProjectScope()
  return (path: string, options?: NavigateOptions) => {
    const scoped = projectHref(path, projectId)
    const current = new URLSearchParams(location.search)
    const returnTo = current.get('returnTo')
    if (!returnTo?.startsWith('/projects?') || new URLSearchParams(returnTo.split('?')[1]).get('view') !== 'items') return navigate(scoped, options)
    const [pathname, query = ''] = scoped.split('?')
    if (!scopedPaths.includes(pathname)) return navigate(scoped, options)
    const params = new URLSearchParams(query)
    params.set('returnTo', returnTo)
    params.set('matter', current.get('matter') ?? '')
    return navigate(`${pathname}?${params}`, options)
  }
}
