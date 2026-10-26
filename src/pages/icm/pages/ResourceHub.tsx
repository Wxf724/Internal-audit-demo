import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button, Input } from '@/components'
import { Card, DataTable, PageFrame, Tag, Toolbar } from '../components/IcmPageKit'
import { useIcmDemoRole } from '../AppShell'
import { useResourceStore } from '../store/resourceStore'
import { currentVersion, resourceCategories, resourceContent, resourceStatus, usableResource, type ResourceAsset } from '../data/resourceModel'
import { ResourceEditor } from './ResourceEditor'
import { ResourceDetail } from './ResourceDetail'
import { ResourceDirectory } from './ResourceDirectory'
import './project-planning.css'
import './resources.css'

export default function ResourceHub() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const { role } = useIcmDemoRole()
  const assets = useResourceStore((s) => s.assets)
  const group = resourceCategories.find((c) => c.id === (assets.find((a) => a.id === params.get('resource'))?.category ?? params.get('category'))) ?? resourceCategories[0]
  const [editor, setEditor] = useState<{ asset?: ResourceAsset }>()
  const [notice, setNotice] = useState('')
  const query = params.get('q') ?? ''
  const type = params.get('type') ?? 'all'
  const status = params.get('status') ?? 'all'
  const agentMode = group.id === 'tools' && type === '智能体'
  const availableTypes = group.types.filter((t) => agentMode || t !== '智能体')
  const selected = assets.find((a) => a.id === params.get('resource'))
  const setFilter = (name: string, value: string) => setParams((p) => { p.set(name, value); p.delete('resource'); return p })
  const select = (a: ResourceAsset) => setParams((p) => { p.set('category', a.category); p.set('resource', a.id); p.delete('version'); return p })
  const rows = assets.filter((a) => { const c = resourceContent(a); return a.category === group.id && (agentMode || c.type !== '智能体') && (type === 'all' || c.type === type) && (status === 'all' || resourceStatus(a) === status || status === '可选用' && usableResource(a)) && `${a.id}${c.title}${c.domain}${c.summary}${c.owner}`.includes(query.trim()) })
  const reviewReturn = params.get('reviewReturn')
  return <PageFrame title={group.id === 'tools' && type === '智能体' && !selected ? '智能体配置' : group.title} subtitle={group.description} actions={<>{reviewReturn?.startsWith('/review-workbench?') && <Button onClick={() => navigate(reviewReturn)}>返回智能审查</Button>}{!selected && <Button type="primary" onClick={() => setEditor({})}>{group.id === 'directory' ? '补充对象或人员档案' : agentMode ? '新增智能体' : '新增资源'}</Button>}</>}>
    {notice && <p className="project-operation-note" role="status">{notice}</p>}
    {params.has('resource') && !selected ? <div className="icm-empty-inline">未找到该资源，请返回资源清单。</div> : selected ? <ResourceDetail key={`${selected.id}:${params.get('version') ?? ''}:${selected.draft?.at ?? ''}`} asset={selected} actor={role.name} version={params.has('version') ? Number(params.get('version')) : undefined} onBack={() => setParams((p) => { p.delete('resource'); p.delete('version'); return p })} onEdit={() => setEditor({ asset: selected })} onSelect={select} /> : group.id === 'directory' ? <ResourceDirectory assets={assets} onSelect={select} /> : <>
      <Toolbar><Input aria-label="搜索审计资源" search value={query} onChange={(value) => setFilter('q', value)} placeholder="名称 / 编号 / 领域 / 维护人" /><select aria-label="按资源类型筛选" className="icm-select" value={type} onChange={(e) => setFilter('type', e.target.value)}><option value="all">全部类型</option>{availableTypes.map((t) => <option key={t}>{t}</option>)}</select><select aria-label="按资源状态筛选" className="icm-select" value={status} onChange={(e) => setFilter('status', e.target.value)}><option value="all">全部状态</option>{['可选用', '草稿', '待审核', '已发布', '修订中', '已停用'].map((s) => <option key={s}>{s}</option>)}</select><span className="icm-toolbar-spacer" /><Tag tone="blue">{rows.length} 项资源</Tag></Toolbar>
      <Card title="资源清单" note="项目选用已发布且在有效期内的版本；修订草稿不覆盖原发布版本。">{rows.length ? <DataTable columns={['资源名称 / 类型', '业务领域', '发布版本', '状态', '维护人', '关联资源', '']} rows={rows.map((a) => { const c = resourceContent(a); return [<button className="icm-link project-table-title" onClick={() => select(a)}><strong>{c.title}</strong><small>{a.id} · {c.type}</small></button>, c.domain, currentVersion(a) ? `V${currentVersion(a)?.version}` : '尚未发布', <Tag tone={usableResource(a) ? 'green' : a.enabled ? 'amber' : 'gray'}>{resourceStatus(a)}{a.versions.length > 0 && a.enabled && !usableResource(a) ? ' · 非有效期' : ''}</Tag>, c.owner, `${c.relatedIds.length} 项`, <button className="icm-link" onClick={() => select(a)}>查看</button>] })} /> : <div className="icm-empty-inline">当前条件下暂无资源。</div>}</Card>
    </>}
    {editor && <ResourceEditor initialType={agentMode ? '智能体' : undefined} key={editor.asset?.id ?? group.id} category={editor.asset?.category ?? group.id} asset={editor.asset} actor={role.name} onClose={() => setEditor(undefined)} onSaved={(id) => { setEditor(undefined); setNotice('草稿已保存，可继续编辑或提交审核。'); setParams((p) => { p.set('category', editor.asset?.category ?? group.id); p.set('resource', id); return p }) }} />}
  </PageFrame>
}
