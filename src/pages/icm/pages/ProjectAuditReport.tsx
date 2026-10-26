import { useState } from 'react'
import { Button, Input, Textarea } from '@/components'
import { Card, Tag } from '../components/IcmPageKit'
import type { AuditProject } from '../data/auditProjects'
import { reportSections } from '../data/projectWork'
import { useAuditProjectStore } from '../store/auditProjectStore'
import { useIcmDemoRole } from '../AppShell'
import { useProjectRecords } from './projectScope'
import { ProjectReviewActions } from './ProjectReviewActions'
import { ProjectCommunication } from './ProjectCommunication'
import { ProjectReportConversation, ReportChangePreview } from './ProjectReportConversation'
import { useReportConversation } from './useReportConversation'
import './report-conversation.css'
import { reportBlockers, saveProjectReport, submitReport, signReport } from './projectWorkActions'
export function ProjectAuditReport({ project }: { project: AuditProject }) {
 const { role } = useIcmDemoRole(), { issues } = useProjectRecords()
 const report = project.auditReport
 const [title,setTitle] = useState(report?.title ?? project.name + '报告')
 const [sections,setSections] = useState(report?.sections ?? reportSections.map((s,i) => ({...s,content:i === 0 ? report?.content ?? '' : ''})))
 const [active,setActive]=useState('scope')
 const [opinion,setOpinion] = useState(''), [notice,setNotice] = useState('')
 const editable = !project.archivedAt && (!report || report.status === '草稿')
 const act = (fn:() => void) => { try { fn(); setNotice('办理结果已保存。') } catch(e) { setNotice((e as Error).message) } }
 const blockers = reportBlockers(project.id)
 const conversation=useReportConversation({project,title,sections,active,editable,onSelect:setActive,onApply:(next)=>{saveProjectReport(project.id,title,next,role.name);setSections(next)}})
 return <><Card title="项目审计报告" note="按章节编制、征求意见、复核和签发；报告引用本项目发现。" action={<Tag tone={report?.status === '已签发' ? 'green':'blue'}>V{report?.version ?? 1} · {report?.status ?? '草稿'}</Tag>}>
 <div className="project-report-editor report-editor-v2"><ProjectReportConversation project={project} sections={sections} active={active} editable={editable} controller={conversation}/>
 <section className="project-report-document"><div className="report-document-toolbar"><b>报告草稿</b><div><button aria-pressed={conversation.view==='draft'} onClick={()=>conversation.setView('draft')}>正文编辑</button><button disabled={!conversation.chat.proposal} aria-pressed={conversation.view==='proposal'} onClick={()=>conversation.setView('proposal')}>修改预览{conversation.chat.proposal?' · '+conversation.chat.proposal.sections.length:''}</button></div></div><label>报告名称<Input aria-label="项目报告名称" disabled={!editable} value={title} onChange={setTitle}/></label>
 <nav className="project-report-chapters" aria-label="报告章节">{sections.map((s,i)=><button key={s.id} aria-current={active===s.id?'page':undefined} onClick={()=>setActive(s.id)}>{i+1}. {s.title}</button>)}</nav>
 {conversation.view==='proposal' && conversation.chat.proposal?<ReportChangePreview sections={sections} active={active} editable={editable} controller={conversation}/>:sections.filter((s)=>s.id===active).map((s)=><section key={s.id}><h3>{s.title}</h3>{editable?<Textarea aria-label={s.title} rows={14} value={s.content} onChange={(value)=>setSections(sections.map((r)=>r.id===s.id?{...r,content:value}:r))} placeholder="在左侧描述编制要求，预览修改后再采纳；也可直接编辑本章。"/>:<div className="project-document">{s.content || '未登记'}</div>}</section>)}
 <p className="project-help">来源范围：本项目已复核底稿、已确认定级发现、报告沟通记录。提案采纳前不会改变正文。</p>
 </section></div>
 <details><summary>关联发现（{issues.filter((i) => !i.mergedIntoId).length} 项）</summary>{issues.filter((i) => !i.mergedIntoId).map((i) => <p key={i.id}><a className="icm-link" href={'/projects/' + project.id + '?tab=findings&issue=' + i.id}>{i.title}</a> · {i.level} · {i.status}</p>)}</details>
 {editable && <div className="project-form-actions"><Button onClick={() => act(() => saveProjectReport(project.id,title,sections,role.name))}>保存报告草稿</Button><Button type="primary" onClick={() => act(() => { saveProjectReport(project.id,title,sections,role.name); submitReport(project.id,role.name) })}>提交报告复核</Button></div>}
 {report?.status === '已复核' && <><Textarea aria-label="签发意见" value={opinion} onChange={setOpinion} placeholder="填写签发意见" /><div className="project-form-actions"><Button type="primary" onClick={() => act(() => signReport(project.id,opinion,role.name))}>签发报告</Button></div></>}
 {notice && <p role="status" className="project-operation-note">{notice}</p>}
 {editable && blockers.length > 0 && <details><summary>提交前待完成（{blockers.length}）</summary><ul>{blockers.map((s) => <li key={s}>{s}</li>)}</ul></details>}
 <ProjectReviewActions projectId={project.id} object="report" businessId={project.id} />
 </Card><ProjectCommunication actor={role.name} locked={!editable} records={report?.communications ?? []} onSave={(communications) => { saveProjectReport(project.id,title,sections,role.name); const p = useAuditProjectStore.getState().projects.find((p) => p.id === project.id)!; useAuditProjectStore.getState().updateProject(project.id,{auditReport:{...p.auditReport!,communications}}) }} />
 <details className="project-section"><summary>报告版本与办理记录</summary>{report?.history.map((h,i) => <p key={i}>{h.action} · {h.by} · {h.at} {'opinion' in h ? String(h.opinion ?? '') : ''}</p>)}{report?.versions?.map((v) => <details key={v.version}><summary>签发版本 V{v.version} · {v.by}</summary><div className="project-document">{v.content}</div></details>)}</details></>
}
