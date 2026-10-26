import { useEffect, useRef, useState } from 'react'
import { ArrowUp, Check, FileText, Sparkles, Undo2 } from 'lucide-react'
import { Button, Textarea } from '@/components'
import type { AuditProject } from '../data/auditProjects'
import type { ReportSection } from '../data/projectWork'
import { useWorkpaperStore } from '../store/workpaperStore'
import { useWorkflowStore } from '../store/workflowStore'
import { isPaperApproved } from './projectWorkActions'
import { issueProjectId, legacyPaperOwners } from './projectScope'
import type { ReportConversationController } from './useReportConversation'

const statuses={pending:'待确认',partial:'部分已处理',accepted:'已采纳',discarded:'已放弃',undone:'已撤销',superseded:'已更新为后续提案'}
export function ProjectReportConversation({project,sections,active,editable,controller:c}:{project:AuditProject;sections:ReportSection[];active:string;editable:boolean;controller:ReportConversationController}){
 const [input,setInput]=useState(''),box=useRef<HTMLDivElement>(null)
 const papers=useWorkpaperStore((s)=>s.papers).filter((p)=>(p.projectId ?? legacyPaperOwners[p.id])===project.id && isPaperApproved(p))
 const issues=useWorkflowStore((s)=>s.issues).filter((i)=>issueProjectId(i)===project.id && !i.mergedIntoId && !['待确认','待分级审核','分级审核不通过','异议中'].includes(i.status))
 const current=sections.find((s)=>s.id===active)!
 useEffect(()=>{if(box.current)box.current.scrollTop=box.current.scrollHeight},[c.chat.messages])
 const send=()=>{if(input.trim()){c.send(input);setInput('')}}
 return <aside className="report-assistant-panel">
 <header className="report-assistant-heading"><span className="report-assistant-symbol"><Sparkles size={18}/></span><div><b>AI 报告助手</b><small>围绕当前项目编制与修订</small></div><span className="report-demo-badge" title="模板编制、规则检查与文字处理，不调用模型或外发资料">本地演示</span></header>
 <details className="report-reference-context"><summary><FileText size={14}/>项目资料 <span>{papers.length} 份复核底稿 · {issues.length} 项确认发现</span></summary><p>{project.name}</p><ul><li>项目范围、覆盖期间与已引用依据</li>{papers.map((p)=><li key={p.id}>{p.title} · 已复核</li>)}{issues.map((i)=><li key={i.id}>{i.title} · {i.level}</li>)}<li>报告沟通记录 {project.auditReport?.communications?.length ?? 0} 条</li></ul><p>未复核底稿和未定级发现不作为最终结论。当前为本地模板与规则演示，不外发资料。</p></details>
 <div ref={box} className="report-conversation-scroll" role="log" aria-label="报告编辑对话">
 {!c.chat.messages.length && <div className="report-chat-welcome"><Sparkles size={24}/><h3>先有初稿，再逐章完善</h3><p>我会根据项目记录整理报告内容，将修改放到右侧预览，确认后再写入正文。</p><ol><li>选择当前章节或全文</li><li>描述生成或修改要求</li><li>对照原文，逐章采纳</li></ol><Button type="primary-soft" disabled={!editable} onClick={()=>c.send('生成完整初稿')}>生成完整初稿</Button></div>}
 {c.chat.messages.map((m,i)=><article key={m.id ?? i} className={'report-chat-entry '+m.role}>
 <div className="report-message-meta">{m.role==='assistant'?<><Sparkles size={13}/><b>报告助手</b></>:<b>你</b>}{m.at && <time>{new Date(m.at).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})}</time>}</div>
 <div className="report-message-text">{m.text}</div>
 {m.status && <div className={'report-message-status '+m.status}><Check size={12}/>{statuses[m.status]}</div>}
 {m.proposalId && c.chat.proposal?.id===m.proposalId && <div className="report-change-links">{c.chat.proposal.sections.map((s)=><button key={s.id} onClick={()=>c.select(s.id)}><FileText size={12}/>{s.title}<span>查看修改 →</span></button>)}</div>}
 </article>)}
 </div>
 {editable?<div className="report-assistant-compose"><div className="report-compose-target"><label htmlFor="report-edit-scope">处理范围</label><select id="report-edit-scope" aria-label="对话处理范围" value={c.scope} onChange={(e)=>c.setScope(e.target.value as 'chapter'|'all')}><option value="chapter">当前章节 · {current.title}</option><option value="all">整份报告 · 五个章节</option></select></div>
 <div className="report-quick-requests">{['生成初稿','检查缺项','改成条目'].map((s)=><button key={s} onClick={()=>c.send(s)}>{s}</button>)}<details><summary>更多</summary><div>{['精简当前章节','当前章节分段','生成完整初稿'].map((s)=><button key={s} onClick={()=>c.send(s)}>{s}</button>)}<button onClick={()=>setInput('将“原词”替换为“新词”')}>替换指定文字</button><button onClick={()=>setInput('在当前章节追加“待补充的文字”')}>追加明确内容</button></div></details></div>
 <div className="report-compose-input" onKeyDown={(e)=>{if(e.key==='Enter' && !e.shiftKey && !e.nativeEvent.isComposing && e.keyCode!==229){e.preventDefault();send()}}}><Textarea aria-label="报告对话要求" value={input} onChange={setInput} rows={3} maxLength={3000} placeholder={'例如：把第三章改成条目；或将“原词”替换为“新词”'}/><Button aria-label="发送要求" title="发送要求" type="primary" icon={<ArrowUp size={16}/>} disabled={!input.trim()} onClick={send}/></div><div className="report-compose-foot"><span>Enter 发送 · Shift + Enter 换行</span>{c.chat.undo && <button onClick={c.undo}><Undo2 size={12}/>撤销上次采纳</button>}</div>
 </div>:<div className="report-readonly-note">报告已送审或签发，对话记录可查阅，正文暂停修改。</div>}
 {c.notice && <p role="status" className="report-assistant-notice">{c.notice}</p>}
 </aside>
}

export function ReportChangePreview({sections,active,editable,controller:c}:{sections:ReportSection[];active:string;editable:boolean;controller:ReportConversationController}){
 const p=c.chat.proposal, suggestion=p?.sections.find((s)=>s.id===active), original=sections.find((s)=>s.id===active)
 if(!p)return null
 return <div className="report-change-preview"><div className="report-change-header"><div><b>{p.summary}</b><small>草稿尚未改变，可先编辑建议正文</small></div><Button disabled={!editable || c.stale} type="primary" onClick={()=>c.apply(p.sections.map((s)=>s.id))}>采纳全部修改</Button></div>
 {c.stale && <p role="alert" className="report-stale-notice">正文或来源已变化，请重新生成提案后采纳，避免覆盖新编辑。</p>}
 {suggestion?<><div className="report-diff-columns"><section><h4>当前正文 <span>{original?.content.length ?? 0} 字</span></h4><div className="report-original-content">{original?.content || '本章尚未填写'}</div></section><section><h4>建议正文 <span>{suggestion.content.length} 字</span></h4><Textarea aria-label={'建议正文：'+suggestion.title} rows={12} disabled={!editable || c.stale} value={suggestion.content} onChange={(value)=>c.editProposal(active,value)}/></section></div><div className="report-change-actions"><span>只更新“{suggestion.title}”</span><Button disabled={!editable} onClick={()=>c.discard(active)}>放弃本章修改</Button><Button disabled={!editable || c.stale || !suggestion.content.trim()} type="primary" onClick={()=>c.apply([active])}>采纳本章修改</Button></div></>:<div className="report-no-change"><p>本章没有待采纳的修改。</p>{p.sections.map((s)=><Button key={s.id} onClick={()=>c.select(s.id)}>查看{s.title}</Button>)}</div>}
 <button className="report-discard-all" disabled={!editable} onClick={()=>c.discard()}>放弃本次全部修改</button>
 </div>
}
