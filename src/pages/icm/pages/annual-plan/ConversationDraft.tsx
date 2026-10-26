import { Fragment, useEffect, useState } from 'react'
import { Button, Modal } from '@/components'
import { useIcmDemoRole } from '../../AppShell'
import { useAnnualPlanStore } from '../../store/annualPlanStore'
import { useAuditProjectStore } from '../../store/auditProjectStore'
import { AnnualTimeline } from './AnnualTimeline'
import { PlanViewSwitch } from './PlanViewSwitch'
import type { AnnualPlan, AnnualProjectItem, PlanContent } from './model'
import { newId } from './model'
import type { PlanMessage, PlanResource } from './conversationTypes'
import { contentFingerprint } from './conversationTypes'
import { DraftBasics, DraftProjectFields } from './DraftFields'
import { ResourcePreview } from './ResourcePreview'
import { detailedChanges, draftIssues } from './draftRules'
import { exportPlan } from './planExport'
import { DraftSurface } from './DraftSurface'

export function ConversationDraft({ plan, message, availableResources, editable, onClose, onAccept, onAsk, title, closeLabel = '返回对话', embedded, onDirtyChange }: {
  plan: AnnualPlan; message?: PlanMessage; availableResources: PlanResource[]; editable: boolean; onClose: () => void
  onAccept: (id: string, content?: PlanContent, resources?: PlanResource[]) => void
  onAsk: (text: string) => void
  title?: string; closeLabel?: string
  embedded?: boolean; onDirtyChange?: (dirty: boolean) => void
}) {
  const { role } = useIcmDemoRole()
  const save = useAnnualPlanStore((s) => s.saveConversationDraft)
  const projects = useAuditProjectStore((s) => s.projects)
  const initial = message?.proposal?.content ?? plan.content
  const [working, setWorking] = useState<PlanContent>(() => structuredClone(initial))
  const [baseFingerprint] = useState(contentFingerprint(plan.content))
  const [version, setVersion] = useState('current'), [view, setView] = useState('list')
  const [editing, setEditing] = useState(''), [basic, setBasic] = useState(false), [error, setError] = useState('')
  const [discard, setDiscard] = useState(false), [removing, setRemoving] = useState(''), [reason, setReason] = useState('')
  const [sourcePreview, setSourcePreview] = useState<PlanResource | null>(null), [exporting, setExporting] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [restoredSources, setRestoredSources] = useState<PlanResource[] | null>(null)
  const revision = plan.conversation?.revisions.find((entry) => String(entry.version) === version)
  const content = revision?.content ?? working
  const sourceSnapshot = message?.proposal?.resources ?? revision?.resources ?? restoredSources ?? plan.conversation?.revisions.at(-1)?.resources ?? []
  const resources = [...new Map([...sourceSnapshot, ...(!revision ? availableResources.filter((r) => !r.archived) : [])].map((r) => [r.id, r])).values()]
  const dirty = contentFingerprint(working) !== contentFingerprint(initial)
  useEffect(() => { onDirtyChange?.(dirty); return () => onDirtyChange?.(false) }, [dirty, onDirtyChange])
  const stale = Boolean(message?.proposal && message.proposal.baseFingerprint !== contentFingerprint(plan.content))
  const canEdit = editable && !message?.proposal?.acceptedRevision && version === 'current' && !stale
  const issues = draftIssues(plan, content, resources)
  const previousRevision = plan.conversation?.revisions.find((entry) => entry.version === (revision?.version ?? plan.conversation!.revisions.length) - 1)
  const changes = detailedChanges(message?.proposal?.baseContent ?? (dirty ? plan.content : previousRevision?.content) ?? plan.content, content)
  const updateItem = (item: AnnualProjectItem) => setWorking((c) => ({ ...c, items: c.items.map((entry) => entry.id === item.id ? item : entry) }))
  const referenced = () => resources.filter((r) => content.items.some((item) => item.basisRefs?.includes(r.id)) || sourceSnapshot.some((source) => source.id === r.id) || plan.conversation?.selectedResourceIds.includes(r.id))
  const close = () => dirty ? setDiscard(true) : onClose()
  const commit = () => {
    try {
      if (contentFingerprint(plan.content) !== baseFingerprint) throw new Error('草案已被更新，请关闭后重新打开。')
      if (message) { onAccept(message.id, working, referenced()); return }
      save(plan.id, working, role, referenced(), '保存人工修改')
      onClose()
    } catch (e) { setError((e as Error).message) }
  }
  const remove = () => {
    if (!reason.trim()) { setError('请填写移出原因。'); return }
    const item = working.items.find((i) => i.id === removing)
    setWorking((c) => ({ ...c, items: c.items.filter((i) => i.id !== removing), deferred: item?.riskId ? [...(c.deferred ?? []).filter((d) => d.riskId !== item.riskId), { riskId: item.riskId, reason: reason.trim() }] : c.deferred }))
    setRemoving(''); setReason(''); setError('')
  }
  const exportCurrent = async (format: 'xlsx' | 'docx') => { setExporting(true); try { await exportPlan(plan, content, referenced(), format); setExportOpen(false) } catch (e) { setError((e as Error).message); setExportOpen(false) } finally { setExporting(false) } }
  const universe = [...new Map([...(plan.conversation?.riskLibrary ?? []), ...resources.flatMap((r) => r.risk ? [r.risk] : [])].map((r) => [r.id, r])).values()]
  const deferred = universe.filter((r) => !content.items.some((item) => item.riskId === r.id))
  return <>
    <DraftSurface embedded={embedded} className="annual-overlay plan-draft-overlay" open drawer width="min(1160px, 100vw)" title={title ?? (message ? (message.proposal?.acceptedRevision ? `已采用建议 · V${message.proposal.acceptedRevision}` : '计划建议') : '当前草案')} onClose={close} footer={embedded && !editable && !message ? null : <><Button onClick={close}>{closeLabel}</Button>{canEdit && <Button type="primary" onClick={commit}>{message ? '采用为当前草案' : '保存修改'}</Button>}{stale && !message?.proposal?.acceptedRevision && <Button disabled>已有更新草案</Button>}</>}>
      <div className="plan-draft-toolbar"><strong>{content.name}</strong>{!message && <select className="icm-select" aria-label="草案版本" disabled={dirty} value={version} onChange={(e) => { setVersion(e.target.value); setEditing('') }}><option value="current">当前草案 · V{plan.conversation?.revisions.length ?? 0}</option>{[...(plan.conversation?.revisions ?? [])].reverse().map((entry) => <option key={entry.version} value={entry.version}>V{entry.version} · {entry.reason}</option>)}</select>}<PlanViewSwitch value={view} onChange={setView} /></div>
      <div className="plan-draft-summary"><span>{content.items.length} 个项目</span><span>{content.items.reduce((sum, item) => sum + item.workdays, 0)} / {content.capacity ?? 0} 人天</span>{dirty && <span className="plan-unsaved">未保存修改</span>}<Button onClick={() => setBasic(!basic)}>计划信息</Button>{canEdit && <Button onClick={() => { const id = newId(); setWorking((c) => ({ ...c, items: [...c.items, { id, name: '', subject: '', type: '财务审计', period: '', start: `${plan.year}-01-01`, end: `${plan.year}-12-31`, owner: '内审机构统筹', workdays: 20, scope: '', risk: '', basisRefs: [] }] })); setEditing(id); setView('list') }}>添加项目</Button>}<Button disabled={exporting} onClick={() => setExportOpen(true)}>导出</Button>{revision && editable && <Button onClick={() => { setWorking(structuredClone(revision.content)); setRestoredSources(revision.resources); setVersion('current'); setBasic(true) }}>基于此版本编辑</Button>}</div>
      {error && <p role="alert" className="annual-error">{error}</p>}
      {basic && <DraftBasics content={content} disabled={!canEdit} onChange={setWorking} />}
      {changes.length > 0 && <details className="plan-change-list" open={Boolean(message)}><summary>{message || dirty ? '本次变更' : `版本变更 · V${previousRevision?.version} → V${revision?.version ?? plan.conversation?.revisions.length}`} · {changes.length} 项</summary><table><thead><tr><th>项目 / 字段</th><th>修改前</th><th>修改后</th></tr></thead><tbody>{changes.map((r, i) => <tr key={i}><td>{r.name}<small>{r.field}</small></td><td>{r.before}</td><td>{r.after}</td></tr>)}</tbody></table></details>}
      {view === 'gantt' ? <AnnualTimeline plan={{ ...plan, content, approved: undefined }} items={content.items} projects={projects} onSelect={(id) => { setEditing(id); setView('list') }} /> : <div className="plan-edit-table-scroll"><table className="plan-edit-table"><thead><tr><th>项目 / 单位</th><th>实施窗口</th><th>人天</th><th>优先级</th><th>依据</th><th>操作</th></tr></thead><tbody>{content.items.map((item) => <Fragment key={item.id}><tr>
        <td><button className="plan-text-action" onClick={() => setEditing(editing === item.id ? '' : item.id)}>{item.name || '未命名项目'}</button><small>{item.subject || '待填写'}{item.locked ? ' · 保持不变' : ''}</small></td>
        <td>{canEdit ? <div className="plan-date-cell"><input aria-label={`${item.name}开始日期`} type="date" value={item.start} onChange={(e) => updateItem({ ...item, start: e.target.value })} /><input aria-label={`${item.name}结束日期`} type="date" value={item.end} onChange={(e) => updateItem({ ...item, end: e.target.value })} /></div> : `${item.start} — ${item.end}`}</td>
        <td>{canEdit ? <input className="plan-days-input" aria-label={`${item.name}计划人天`} type="number" min="1" value={item.workdays} onChange={(e) => updateItem({ ...item, workdays: Number(e.target.value) })} /> : item.workdays}</td>
        <td>{canEdit ? <select aria-label={`${item.name}优先级`} value={item.priority ?? '中'} onChange={(e) => updateItem({ ...item, priority: e.target.value as AnnualProjectItem['priority'] })}>{['高', '中', '低'].map((p) => <option key={p}>{p}</option>)}</select> : item.priority}</td>
        <td>{item.basisRefs?.map((id) => { const r = resources.find((entry) => entry.id === id); return <button className="plan-reference-link" key={id} onClick={() => r && setSourcePreview(r)}>{r?.name ?? '历史引用'}</button> })}</td>
        <td><div className="plan-row-actions"><button className="plan-text-action" onClick={() => setEditing(editing === item.id ? '' : item.id)}>{canEdit ? '编辑' : '详情'}</button>{canEdit && <><button className="plan-text-action" disabled={dirty} title={dirty ? '请先保存修改' : ''} onClick={() => { onAsk(`请调整项目“${item.name}”（编号 ${item.id}），其他项目保持不变。调整要求：`); onClose() }}>让 AI 调整</button><button className="plan-text-action" onClick={() => { setRemoving(item.id); setReason('') }}>移出</button></>}</div></td>
      </tr>{editing === item.id && <tr><td colSpan={6}>{canEdit ? <DraftProjectFields item={item} year={plan.year} resources={resources} onChange={updateItem} onPreview={setSourcePreview} /> : <div className="plan-inline-project"><p>{item.scope}</p><p>覆盖期间：{item.period} · 资源需求：{item.resourceNeeds || '待补充'}</p><p>{item.risk}</p></div>}</td></tr>}</Fragment>)}</tbody></table>{!content.items.length && <div className="icm-empty-inline">添加项目，或返回对话生成计划建议</div>}</div>}
      {removing && <div className="plan-remove-inline"><strong>移出：{content.items.find((i) => i.id === removing)?.name}</strong><label>移出原因<input className="icm-input" value={reason} onChange={(e) => setReason(e.target.value)} /></label><Button onClick={() => setRemoving('')}>取消</Button><Button onClick={remove}>确认移出</Button></div>}
      {deferred.length > 0 && <details className="plan-draft-sources"><summary>未纳入事项 · {deferred.length} 项</summary>{deferred.map((r) => <label className="plan-deferred-row" key={r.id}>{r.recommendation}{r.required && <strong>必审事项，需纳入</strong>}<input className="icm-input" disabled={!canEdit || r.required} aria-label={`${r.recommendation}暂缓理由`} placeholder="暂缓理由" value={content.deferred?.find((d) => d.riskId === r.id)?.reason ?? ''} onChange={(e) => setWorking((c) => ({ ...c, deferred: [...(c.deferred ?? []).filter((d) => d.riskId !== r.id), { riskId: r.id, reason: e.target.value }] }))} /></label>)}</details>}
      <details className="plan-draft-sources"><summary>编制核对 · {issues.length ? `${issues.length} 项待完善` : '内容完整'}</summary>{issues.map((issue, i) => <button key={i} className="plan-check-issue" onClick={() => { if (issue.itemId) { setEditing(issue.itemId); setView('list') } else setBasic(true) }}>{issue.message}</button>)}</details>
      <details className="plan-draft-sources"><summary>引用资源 · {referenced().length} 项</summary>{referenced().map((r) => <button key={r.id} className="plan-reference-link" onClick={() => setSourcePreview(r)}>{r.name} · {r.version} · {r.locator ?? r.source}</button>)}</details>
    </DraftSurface>
    {sourcePreview && <ResourcePreview resource={sourcePreview} onClose={() => setSourcePreview(null)} />}
    <Modal className="annual-overlay" open={exportOpen} title="导出草案" width={360} onClose={() => { if (!exporting) setExportOpen(false) }} footer={null}>
      <div className="plan-export-formats"><Button disabled={exporting} onClick={() => void exportCurrent('xlsx')}>Excel</Button><Button disabled={exporting} onClick={() => void exportCurrent('docx')}>Word</Button></div>
      {exporting && <p role="status">正在导出…</p>}
    </Modal>
    <Modal className="annual-overlay" open={discard} title="尚有未保存修改" onClose={() => setDiscard(false)} footer={<><Button onClick={() => setDiscard(false)}>继续编辑</Button><Button onClick={onClose}>放弃修改并返回</Button></>}><p>当前修改尚未写入草案。</p></Modal>
  </>
}
