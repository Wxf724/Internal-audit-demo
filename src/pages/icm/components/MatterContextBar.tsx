import { Link, useLocation } from 'react-router-dom'
import { filterMatters, matterHref, safeMatterReturn, useMatterData } from '../pages/matterData'

export function MatterContextBar({ role }: { role: { id: string; name: string } }) {
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const returnTo = safeMatterReturn(params.get('returnTo'))
  const { rows, projects } = useMatterData()
  if (!returnTo) return null
  const visible = filterMatters(rows, projects, new URLSearchParams(returnTo.split('?')[1]), role)
  const index = visible.findIndex((r) => r.key === params.get('matter'))
  return <div className="matter-context"><Link to={returnTo}>← 返回事项清单</Link><strong>{index >= 0 ? `当前筛选范围 · 第 ${index + 1} / ${visible.length} 条` : '该事项已不在当前筛选范围内'}</strong>{index > 0 && <Link to={matterHref(visible[index - 1], returnTo)}>上一条</Link>}{index >= 0 && index < visible.length - 1 && <Link to={matterHref(visible[index + 1], returnTo)}>下一条</Link>}</div>
}
