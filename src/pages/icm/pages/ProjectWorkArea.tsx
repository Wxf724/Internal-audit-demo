import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { LayoutGrid, ListTodo } from 'lucide-react'
import { useIcmDemoRole } from '../AppShell'
import ProjectLedger from './ProjectLedger'
import MatterWorkbench from './MatterWorkbench'
import './resources.css'
import './work-area.css'

export default function ProjectWorkArea() {
  const [params] = useSearchParams()
  const { roleId } = useIcmDemoRole()
  const itemsOnly = roleId === 'auditor'
  const view = params.get('view') === 'items' ? 'items' : 'projects'
  const to = (value: string) => { const next = new URLSearchParams(params); next.set('view', value); return `/projects?${next}` }
  if (itemsOnly && params.get('view') !== 'items') return <Navigate to={to('items')} replace />
  const viewSwitch = <nav className="audit-view-switch" aria-label="审计工作区视图">{!itemsOnly && <Link aria-current={view === 'projects' ? 'page' : undefined} to={to('projects')}><LayoutGrid size={13} aria-hidden="true" />项目视图</Link>}<Link aria-current={view === 'items' ? 'page' : undefined} to={to('items')}><ListTodo size={14} aria-hidden="true" />事项视图</Link></nav>
  return <div className="audit-work-area">{view === 'projects' ? <ProjectLedger viewSwitch={viewSwitch} /> : <MatterWorkbench viewSwitch={viewSwitch} />}</div>
}
