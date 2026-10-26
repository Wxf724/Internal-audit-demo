import { type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Button, Input, SearchableSelect, Tabs } from '@/components'
import { DataTable, PageFrame, Tag, Toolbar } from '../components/IcmPageKit'
import { useIcmDemoRole } from '../AppShell'
import { filterMatters, matterHref, matterKinds, useMatterData } from './matterData'
import { projectYear } from './projectRelations'

export default function MatterWorkbench({ viewSwitch }: { viewSwitch?: ReactNode }) {
  const [params, setParams] = useSearchParams()
  const { role } = useIcmDemoRole()
  const { rows, projects } = useMatterData()
  const kind = matterKinds.find((k) => k.id === params.get('kind')) ?? matterKinds[0]
  const scope = ['mine', 'participating', 'pending'].includes(params.get('scope') ?? '') ? params.get('scope')! : 'participating'
  const filters = new URLSearchParams(params); filters.set('scope', scope)
  const visible = filterMatters(rows, projects, filters, role)
  const selected = (params.get('projectIds') ?? '').split(',').filter(Boolean)
  const set = (key: string, value: string) => setParams((p) => { p.set('view', 'items'); p.set(key, value); return p })
  const available = projects.filter((p) => role.id === 'audit-lead' || p.owner === role.name || rows.some((r) => r.projectId === p.id && r.participants.includes(role.name)))
  const years = [...new Set(projects.map(projectYear))].filter(Number.isFinite).sort((a, b) => b - a)
  const statuses = [...new Set(rows.filter((r) => r.kind === kind.id).map((r) => r.status))]
  const returnTo = `/projects?${params.toString()}`
  return <PageFrame title="事项工作区" titleAccessory={viewSwitch} subtitle="按项目与责任范围筛选，集中处理审计事项。">
    <section className="matter-panel" aria-label="事项清单">
      <Tabs className="matter-type-tabs" ariaLabel="事项类型" size="sm" activeKey={kind.id} showPanels={false} items={matterKinds.map((k) => ({ key: k.id, label: k.label }))} onChange={(key) => setParams((p) => { p.set('view', 'items'); p.set('kind', key); p.delete('status'); return p })} />
    <div className="matter-search-row"><Toolbar><select className="icm-select" aria-label="办理范围" value={scope} onChange={(e) => set('scope', e.target.value)}>{[['pending', '待处理'], ['mine', '我负责的'], ['participating', '参与']].map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select><Input search aria-label="搜索事项" value={params.get('q') ?? ''} onChange={(q) => set('q', q)} placeholder="事项 / 编号 / 项目 / 审计对象" /><select className="icm-select" aria-label="事项管理年度" value={params.get('year') ?? 'all'} onChange={(e) => set('year', e.target.value)}><option value="all">全部管理年度</option>{years.map((y) => <option value={y} key={y}>{y} 年</option>)}</select><SearchableSelect className="matter-project-filter" multiple showSearch value={selected} placeholder="全部项目" searchPlaceholder="搜索项目名称 / 编号 / 审计对象" dropdownMatchSelectWidth={false} listMaxHeight={340} emptyText="未找到匹配项目" options={available.map((p) => ({ value: p.id, label: `${p.name} · ${projectYear(p)} 年 · ${p.subject}` }))} onChange={(value) => set('projectIds', Array.isArray(value) ? value.join(',') : '')} /><select className="icm-select" aria-label="事项办理状态" value={params.get('status') ?? 'all'} onChange={(e) => set('status', e.target.value)}><option value="all">全部状态</option>{statuses.map((s) => <option key={s}>{s}</option>)}</select><Button type="ghost" onClick={() => setParams({ view: 'items', kind: kind.id })}>重置筛选</Button><span className="icm-toolbar-spacer" /><span className="matter-result-count">共 <b>{visible.length}</b> 项</span></Toolbar></div>
      {selected.length > 0 && <div className="matter-selected-projects" aria-label="已选项目范围"><span>项目范围</span>{selected.map((id) => <button type="button" key={id} aria-label={`移除项目筛选：${projects.find((p) => p.id === id)?.name ?? id}`} onClick={() => set('projectIds', selected.filter((p) => p !== id).join(','))}>{projects.find((p) => p.id === id)?.name ?? id}<span aria-hidden="true">×</span></button>)}</div>}
      <div className="matter-results">{visible.length ? <DataTable columns={['事项 / 类型', '所属项目', '审计对象', '责任人', '办理状态', '日期 / 期限', '']} rows={visible.map((r) => { const p = projects.find((p) => p.id === r.projectId); return [<Link className="icm-link project-table-title" to={matterHref(r, returnTo)}><strong>{r.title}</strong><small>{r.id} · {r.subtype}</small></Link>, p ? <Link className="icm-link" to={`/projects/${p.id}`}>{p.name}</Link> : <Tag tone="amber">待关联项目</Tag>, p?.subject ?? '待核对归属', r.owner, <Tag tone={['已完成', '已归档', '已签发', '已关闭', '已采集'].includes(r.status) ? 'green' : 'blue'}>{r.status}</Tag>, r.date || '未登记', <Link className="icm-link" to={matterHref(r, returnTo)}>打开</Link>] })} /> : <div className="icm-empty-inline">当前范围没有符合条件的事项，请调整项目、年度或办理状态。</div>}</div>
      {kind.id === 'reports' && <p className="matter-table-note">项目审计报告在此汇总；整改报告在审计整改中办理。</p>}
    </section>
  </PageFrame>
}
