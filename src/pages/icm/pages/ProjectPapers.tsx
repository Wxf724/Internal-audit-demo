import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button, Input, Textarea } from '@/components'
import { Card, Tag } from '../components/IcmPageKit'
import type { AuditProject } from '../data/auditProjects'
import type { WorkpaperCase } from '../data/workpaperCases'
import { useWorkpaperStore } from '../store/workpaperStore'
import { useProjectDocumentStore } from '../store/projectDocumentStore'
import { useIcmDemoRole } from '../AppShell'
import { legacyPaperOwners } from './projectScope'
import { findingFromPaper, isPaperApproved, submitPaper } from './projectWorkActions'
import { ProjectReviewActions } from './ProjectReviewActions'
import type { ProjectAssistProps } from './projectAssistTypes'
export function ProjectPapers({ project, onAssist }: { project: AuditProject } & ProjectAssistProps) {
 const papers=useWorkpaperStore((s) => s.papers).filter((p) => (p.projectId ?? legacyPaperOwners[p.id])===project.id)
 const [params,setParams]=useSearchParams(), selected=papers.find((p) => p.id===params.get('paper')) ?? papers[0]
 return <div className="project-master-detail"><aside className="project-record-list"><strong>审计底稿 · {papers.length}</strong>{papers.map((p) => <button key={p.id} aria-current={p.id===selected?.id?'true':undefined} onClick={() => setParams((s) => {s.set('paper',p.id);return s})}><strong>{p.title}</strong><small>{p.reviewState ?? p.status} · {p.owner}</small></button>)}{!papers.length && <p>先到“资料与分析”导入资料、登记证据，再生成底稿草稿。</p>}</aside>{selected ? <PaperEditor key={selected.id+':'+selected.reviewState} project={project} paper={selected} onAssist={onAssist} />:<Card title="底稿与证据"><p>每份底稿应记录检查方法并关联证据；无异常结论也需保留实际测试过程。</p></Card>}</div>
}
function PaperEditor({project,paper,onAssist}:{project:AuditProject;paper:WorkpaperCase} & ProjectAssistProps) {
 const {role}=useIcmDemoRole(),[params,setParams]=useSearchParams()
 const evidence=useProjectDocumentStore((s) => s.evidences).filter((e) => e.projectId===project.id)
 const [form,setForm]=useState({title:paper.title,type:paper.type,body:paper.body,evidenceIds:paper.evidenceIds ?? []}),[notice,setNotice]=useState('')
 const editable=Boolean(paper.projectId) && !project.archivedAt && project.auditReport?.status!=='已签发' && ['草稿','退回修改'].includes(paper.reviewState ?? '')
 const act=(fn:()=>void) => {try{fn();setNotice('操作已保存。')}catch(e){setNotice((e as Error).message)}}
 return <Card title="执行记录与结论" action={<Tag tone={isPaperApproved(paper)?'green':'blue'}>{paper.reviewState ?? paper.status} · V{paper.version ?? 1}</Tag>}>
 {editable && <p className="project-assist-hint">各字段可单独生成、检查或修改。点击 AI 入口会先保存当前编辑；事实和结论需核实证据后采纳。</p>}
 <div className="project-form-grid"><label>底稿名称<Input aria-label="底稿名称" disabled={!editable} value={form.title} onChange={(title) => setForm({...form,title})} /></label><label>结论类型<select className="icm-select" aria-label="底稿结论类型" disabled={!editable} value={form.type} onChange={(e) => setForm({...form,type:e.target.value as WorkpaperCase['type']})}><option>待判定</option><option>合规底稿</option><option>问题底稿</option></select></label></div>
 {([['procedure','执行程序与抽样'],['facts','审计事实'],['conclusion','审计结论'],['next','建议及后续处理']] as const).map(([k,l]) => <div className="project-editor-field" key={k}><div className="project-report-section-heading"><span>{l}</span>{editable && <Button type="ghost" aria-label={'AI 辅助：'+l} onClick={() => act(() => {useWorkpaperStore.getState().savePaper(paper.id,form,role.name);onAssist?.({kind:'paper',target:paper.id,field:k})})}>AI 生成 / 建议 / 修改</Button>}</div>{editable ? <Textarea aria-label={l} rows={4} value={form.body[k]} onChange={(value) => setForm({...form,body:{...form.body,[k]:value}})} />:<div className="project-document">{form.body[k] || '未登记'}</div>}</div>)}
 <div className="project-choice-list"><strong>证据引用</strong>{evidence.map((e) => <label key={e.id}><input type="checkbox" disabled={!editable} checked={form.evidenceIds.includes(e.id)} onChange={(event) => setForm({...form,evidenceIds:event.target.checked?[...form.evidenceIds,e.id]:form.evidenceIds.filter((id) => id!==e.id)})} />{e.title}<small>{e.description}</small></label>)}</div>
 {editable && <div className="project-form-actions"><Button onClick={() => act(() => useWorkpaperStore.getState().savePaper(paper.id,form,role.name))}>保存底稿</Button><Button type="primary" onClick={() => act(() => {useWorkpaperStore.getState().savePaper(paper.id,form,role.name);submitPaper(paper.id,role.name)})}>提交底稿复核</Button></div>}
 {isPaperApproved(paper) && paper.type==='问题底稿' && !project.archivedAt && project.auditReport?.status!=='已签发' && <Button onClick={() => act(() => {const id=findingFromPaper(paper.id,role.name);const next=new URLSearchParams(params);next.set('tab','findings');next.set('issue',id);setParams(next)})}>形成审计发现</Button>}
 {!paper.projectId && <p className="project-help">历史底稿保留原始记录；新增审计工作请从结构化程序编制底稿。</p>}
 <ProjectReviewActions projectId={project.id} object="paper" businessId={paper.id} />
 {notice && <p role="status">{notice}</p>}<details><summary>办理轨迹</summary>{paper.history?.map((h,i) => <p key={i}>{h.action} · {h.by} · {h.opinion}</p>)}</details></Card>
}

