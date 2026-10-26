import { Link, useSearchParams } from 'react-router-dom'
import { BookOpen, Bot, ClipboardList, ListFilter, Lightbulb, UsersRound } from 'lucide-react'
import { resourceCategories, resourceContent } from '../data/resourceModel'
import { useResourceStore } from '../store/resourceStore'

export function ResourceNavigation() {
  const [params] = useSearchParams()
  const assets = useResourceStore((s) => s.assets)
  const selected = assets.find((a) => a.id === params.get('resource'))
  const category = selected?.category ?? params.get('category') ?? 'basis'
  const agents = category === 'tools' && (selected ? resourceContent(selected).type === '智能体' : params.get('type') === '智能体')
  const icons = [BookOpen, ClipboardList, ListFilter, Lightbulb, UsersRound]
  return <nav className="icm-side-section" aria-label="审计资源分类">{resourceCategories.map((c, index) => { const Icon = icons[index]; const active = category === c.id && !agents; return <Link key={c.id} to={`/audit-resources?category=${c.id}`} className={`icm-side-link ${active ? 'active' : ''}`} aria-current={active ? 'page' : undefined} title={c.title}><Icon size={17} /><span>{c.title}</span></Link> })}<Link to="/audit-resources?category=tools&type=智能体" className={`icm-side-link ${agents ? 'active' : ''}`} aria-current={agents ? 'page' : undefined} title="智能体配置"><Bot size={17} /><span>智能体配置</span></Link></nav>
}
