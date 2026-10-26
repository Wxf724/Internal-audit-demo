import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Input } from '@/components'
import { Card, DataTable, Tag, Toolbar } from '../components/IcmPageKit'
import { useAuditProjectStore } from '../store/auditProjectStore'
import { useTaskDispatchStore } from '../store/taskDispatchStore'
import { resourceContent, type ResourceAsset } from '../data/resourceModel'

export function ResourceDirectory({ assets, onSelect }: { assets: ResourceAsset[]; onSelect: (asset: ResourceAsset) => void }) {
  const projects = useAuditProjectStore((s) => s.projects)
  const tasks = useTaskDispatchStore((s) => s.tasks)
  const [tab, setTab] = useState('审计对象')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState('')
  const manual = assets.filter((a) => a.category === 'directory' && resourceContent(a).type === tab)
  const names = [...new Set([...(tab === '审计对象' ? projects.map((p) => p.subject) : [...projects.map((p) => p.owner), ...tasks.flatMap((t) => [t.owner, t.reviewer])]), ...manual.map((a) => resourceContent(a).title)])].filter((name) => name && !['待分配', '待指定', '内审机构统筹', '-'].includes(name) && name.includes(query.trim()))
  const related = (name: string) => projects.filter((p) => tab === '审计对象' ? p.subject === name : p.owner === name || tasks.some((t) => (t.projectId === p.id || p.taskIds.includes(t.id)) && [t.owner, t.reviewer].includes(name)))
  const targetProjects = selected ? related(selected) : []
  return <><nav className="project-subnav" aria-label="基础资源分类">{['审计对象', '人员目录'].map((name) => <button className={tab === name ? 'active' : ''} key={name} onClick={() => { setTab(name); setSelected('') }}>{name}</button>)}</nav><Toolbar><Input aria-label="搜索对象或人员" search value={query} onChange={setQuery} placeholder="搜索对象或人员" /><Tag tone="blue">{names.length} 条</Tag></Toolbar><Card title={tab} note={tab === '审计对象' ? '关联历年项目和覆盖期间；同名对象待统一主数据后进一步核验。' : '根据项目主审与任务人员关联；可补充专业能力、资格和回避事项。'}><DataTable columns={[tab === '审计对象' ? '审计对象' : '姓名', '关联项目', '正在执行的任务', '补充档案', '']} rows={names.map((name) => { const record = manual.find((a) => resourceContent(a).title === name); const linked = related(name); const activeTasks = tasks.filter((t) => linked.some((p) => p.taskIds.includes(t.id) || t.projectId === p.id) && !['已完成', '已归档'].includes(t.status) && (tab === '审计对象' || [t.owner, t.reviewer].includes(name))); return [name, linked.length, activeTasks.length, record ? <button className="icm-link" onClick={() => onSelect(record)}>{resourceContent(record).summary}</button> : '尚未补充', <button className="icm-link" onClick={() => setSelected(name)}>查看关联项目</button>] })} /></Card>{selected && <Card title={`${selected} · 关联项目`}>{targetProjects.length ? <DataTable columns={['项目', '审计覆盖期间', '主审', '阶段']} rows={targetProjects.map((p) => [<Link className="icm-link" to={`/projects/${p.id}`}>{p.name}</Link>, p.period, p.owner, p.stage])} /> : <p className="project-help">尚无关联项目。</p>}</Card>}</>
}
