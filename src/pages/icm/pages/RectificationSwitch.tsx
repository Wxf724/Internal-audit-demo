import { FileText, ListChecks } from 'lucide-react'
import { useProjectNavigate } from './projectScope'
import './rectification.css'

export function RectificationSwitch({ report = false }: { report?: boolean }) {
  const navigate = useProjectNavigate()
  return <nav className="rect-switch" aria-label="整改业务切换">
    <button type="button" aria-current={!report ? 'page' : undefined} className={!report ? 'active' : ''} onClick={() => navigate('/rectify')}><ListChecks size={16} />整改台账</button>
    <button type="button" aria-current={report ? 'page' : undefined} className={report ? 'active' : ''} onClick={() => navigate('/report')}><FileText size={16} />整改报告</button>
  </nav>
}
