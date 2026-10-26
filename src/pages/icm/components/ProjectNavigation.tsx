/* eslint-disable react-refresh/only-export-components */
import { Link, useLocation } from 'react-router-dom'
import { Archive, ClipboardList, FileCheck2, FileText, FolderOpen, ListChecks, MessagesSquare, RotateCcw } from 'lucide-react'
import { canSeeProjectPage } from '../pageVisibility'
import type { AuditProject } from '../data/auditProjects'
import '../pages/project-planning.css'

export const projectSections = [
  { id: 'overview', label: '项目总览', icon: ClipboardList },
  { id: 'preparation', label: '方案与分工', icon: ListChecks },
  { id: 'execution', label: '实施与取证', icon: FileCheck2 },
  { id: 'findings', label: '发现与沟通', icon: MessagesSquare },
  { id: 'report', label: '报告与签发', icon: FileText },
  { id: 'rectification', label: '整改与验证', icon: RotateCcw },
  { id: 'archive', label: '结项与归档', icon: Archive },
]
export function ProjectNavigation({ project, roleId }: { project?: AuditProject; roleId: string }) {
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const tab = params.get('tab') ?? 'overview'
  const active = location.pathname.startsWith('/projects/') ? tab === 'materials' ? 'execution' : tab
    : location.pathname === '/issues' ? 'findings' : ['/rectify', '/report'].includes(location.pathname) ? 'rectification' : 'execution'
  const href = (id: string) => { const next = new URLSearchParams(); next.set('tab', id); for (const key of ['returnTo', 'matter']) { const value = params.get(key); if (value) next.set(key, value) }; return `/projects/${project?.id}?${next}` }
  if (!project) return null
  return <><Link className="project-ledger-entry" to="/projects" aria-label="返回项目台账" title="返回项目台账"><FolderOpen size={17} /><span>项目台账<small>查看全部项目</small></span></Link><div className="project-side-heading"><strong>{project.name}</strong><small>{project.id}</small></div><nav className="icm-side-section" aria-label="项目环节">{projectSections.filter((section) => canSeeProjectPage(roleId, section.id)).map(({ id, label, icon: Icon }) => <Link key={id} to={href(id)} className={`icm-side-link ${active === id ? 'active' : ''}`} aria-current={active === id ? 'page' : undefined} aria-label={label} title={label}><Icon size={17} /><span>{label}</span></Link>)}</nav></>
}
