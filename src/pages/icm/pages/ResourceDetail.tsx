import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Textarea } from '@/components'
import { Card, DataTable, DetailLine, Tag } from '../components/IcmPageKit'
import { currentVersion, resourceContent, resourceStatus, type ResourceAsset } from '../data/resourceModel'
import { useResourceStore } from '../store/resourceStore'
import { useAuditProjectStore } from '../store/auditProjectStore'
import { useAgentRuntimeStore } from '../agents/store'
import { defaultReviewConfig } from '../data/reviewConfig'

export function ResourceDetail({ asset, actor, version, onBack, onEdit, onSelect }: { asset: ResourceAsset; actor: string; version?: number; onBack: () => void; onEdit: () => void; onSelect: (asset: ResourceAsset) => void }) {
  const assets = useResourceStore((s) => s.assets)
  const submit = useResourceStore((s) => s.submit)
  const review = useResourceStore((s) => s.review)
  const setEnabled = useResourceStore((s) => s.setEnabled)
  const projects = useAuditProjectStore((s) => s.projects)
  const reviewRuns = useAgentRuntimeStore((s) => s.runs).filter((r) => r.reviewContext && (r.reviewContext.agent.id === asset.id || r.reviewContext.references.some((ref) => ref.id === asset.id)))
  const [selectedVersion, setSelectedVersion] = useState(version ?? currentVersion(asset)?.version ?? 0)
  const [draftView, setDraftView] = useState(version === undefined && !!asset.draft)
  const [opinion, setOpinion] = useState('')
  const [message, setMessage] = useState('')
  const selected = asset.versions.find((v) => v.version === selectedVersion) ?? currentVersion(asset)
  const draft = draftView ? asset.draft : undefined
  const content = draft?.content ?? selected?.snapshot ?? resourceContent(asset)
  const references = projects.flatMap((p) => (p.resourceRefs ?? []).filter((r) => r.resourceId === asset.id).map((r) => ({ project: p, ref: r })))
  const attempt = (action: () => void, message: string) => { try { action(); setMessage(message) } catch (e) { setMessage((e as Error).message) } }
  return <div className="resource-detail">
    <div className="resource-actionbar"><Button onClick={onBack}>返回资源清单</Button><Tag tone="blue">{resourceStatus(asset)}</Tag><span className="icm-toolbar-spacer" />{asset.draft?.state !== '待审核' && <Button onClick={onEdit}>{currentVersion(asset) ? '修订新版本' : '编辑草稿'}</Button>}{asset.draft?.state === '草稿' && <Button type="primary" onClick={() => attempt(() => submit(asset.id, actor), '草稿已提交审核，原发布版本继续有效。')}>提交审核</Button>}</div>
    <div className="resource-versionbar"><button className={!draftView ? 'active' : ''} disabled={!currentVersion(asset)} onClick={() => setDraftView(false)}>已发布版本</button>{asset.draft && <button className={draftView ? 'active' : ''} onClick={() => setDraftView(true)}>修订草稿 · {asset.draft.state}</button>}{!draftView && <select aria-label="资源历史版本" className="icm-select" value={selected?.version ?? ''} onChange={(e) => setSelectedVersion(Number(e.target.value))}>{[...asset.versions].reverse().map((v) => <option value={v.version} key={v.version}>V{v.version} · {v.at.slice(0, 10)}</option>)}</select>}</div>
    {message && <p className="project-operation-note" role="status">{message}</p>}
    <div className="resource-detail-grid"><Card title={content.title} note={`${asset.id} · ${draft ? '修订草稿' : `V${selected?.version}`}`}><p className="resource-summary">{content.summary}</p><div className="project-document">{content.content}</div></Card><Card title="适用信息"><DetailLine label="资源类型" value={content.type} /><DetailLine label="业务领域" value={content.domain} /><DetailLine label="维护人" value={content.owner} /><DetailLine label="来源与范围" value={content.source} /><DetailLine label="有效期" value={`${content.effectiveFrom || '未限定'} 至 ${content.effectiveTo || '未限定'}`} /><DetailLine label="发布记录" value={selected ? `${selected.by} · ${selected.at.slice(0, 10)}` : '尚未发布'} /><DetailLine label="项目引用" value={`${references.length} 条版本引用`} /></Card></div>
    {content.relatedIds.length > 0 && <Card title="关联资源"><div className="resource-link-list">{content.relatedIds.map((id) => { const related = assets.find((a) => a.id === id); return related ? <button key={id} className="icm-link" onClick={() => onSelect(related)}>{resourceContent(related).title} · {id}</button> : <span key={id}>{id} · 待补录关联资源</span> })}</div></Card>}
    {asset.id === 'AG02' && <Card title="审查配置"><DetailLine label="关注词" value={(content.reviewConfig ?? defaultReviewConfig).terms.join('、')} /><DetailLine label="单次线索上限" value={(content.reviewConfig ?? defaultReviewConfig).maxClues} /><p className="project-help">定位资料中的待核实表述；关联依据供人工核验。本次发布版本用于后续审查，历史运行保留原版本。</p></Card>}
    {reviewRuns.length > 0 && <Card title="审查运行引用"><DataTable columns={['项目与任务', '采用版本', '运行时间', '']} rows={reviewRuns.map((r) => [r.projectName + ' / ' + r.reviewContext!.taskName, `V${r.reviewContext!.agent.id === asset.id ? r.reviewContext!.agent.version : r.reviewContext!.references.find((ref) => ref.id === asset.id)?.version}`, new Date(r.startedAt).toLocaleString(), <Link className="icm-link" to={`/review-workbench?project=${r.projectId}&task=${r.reviewContext!.taskId}&run=${r.id}`}>查看结果</Link>])} /></Card>}
    {(asset.draft?.state === '待审核' || currentVersion(asset)) && <Card title={asset.draft?.state === '待审核' ? '资源审核' : '适用性管理'} note={asset.draft?.state === '待审核' ? '请切换到修订草稿核对内容，填写意见后发布或退回。' : '停用后不再供新项目选用，既有引用仍保留历史版本。'}><Textarea aria-label="资源办理意见" value={opinion} onChange={setOpinion} placeholder="填写审核意见或启停原因" /><div className="project-form-actions">{asset.draft?.state === '待审核' ? <><Button disabled={!opinion.trim()} onClick={() => attempt(() => review(asset.id, false, opinion, actor), '草稿已退回。')}>退回修改</Button><Button type="primary" disabled={!opinion.trim() || !draftView} onClick={() => attempt(() => { review(asset.id, true, opinion, actor); setDraftView(false); setSelectedVersion((currentVersion(asset)?.version ?? 0) + 1); setOpinion('') }, '新版本已发布；项目既有引用保持原版本。')}>审核通过并发布</Button></> : <Button disabled={!opinion.trim()} onClick={() => attempt(() => { setEnabled(asset.id, !asset.enabled, opinion, actor); setOpinion('') }, asset.enabled ? '资源已停用。' : '资源已恢复使用。')}>{asset.enabled ? '停用资源' : '恢复使用'}</Button>}</div></Card>}
    <Card title="被引用项目">{references.length ? <DataTable columns={['项目', '采用版本', '采用人', '采用时间']} rows={references.map(({ project, ref }) => [<Link className="icm-link" to={`/projects/${project.id}?tab=preparation`}>{project.name}</Link>, `V${ref.version}`, ref.appliedBy, ref.appliedAt.slice(0, 10)])} /> : <p className="project-help">尚无项目选用此资源。</p>}</Card>
    <Card title="版本与办理记录"><ul className="project-history">{asset.versions.map((v) => <li key={v.version}>V{v.version} · {v.by} · {v.at.slice(0, 10)} · {v.opinion}</li>)}{asset.history.map((h, i) => <li key={i}>{h.at.slice(0, 16).replace('T', ' ')} · {h.by} · {h.action}</li>)}</ul></Card>
  </div>
}
