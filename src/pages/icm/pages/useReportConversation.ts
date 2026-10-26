import { useState } from 'react'
import type { AuditProject } from '../data/auditProjects'
import type { ReportSection } from '../data/projectWork'
import { useProjectAssistantStore, type ReportChat, type ReportMessage } from '../store/projectAssistantStore'
import { buildProjectReport, reportSourceSnapshot } from './projectReportDraft'
import { reportBlockers } from './projectWorkActions'
import { parseReportCommand, transformReportText } from './reportConversationCommands'

export function useReportConversation({project,title,sections,active,editable,onApply,onSelect}:{project:AuditProject;title:string;sections:ReportSection[];active:string;editable:boolean;onApply:(sections:ReportSection[])=>void;onSelect:(id:string)=>void}){
 const saved=useProjectAssistantStore((s)=>s.reports[project.id]), update=useProjectAssistantStore((s)=>s.update)
 const chat:ReportChat=saved ?? {messages:[]}
 const [scope,setScope]=useState<'chapter'|'all'>('chapter'),[notice,setNotice]=useState(''),[view,setView]=useState<'draft'|'proposal'>(chat.proposal?'proposal':'draft')
 const before=()=>JSON.stringify({title,sections})
 const stale=Boolean(chat.proposal && (chat.proposal.before!==before() || chat.proposal.sources!==reportSourceSnapshot(project.id)))
 const message=(text:string,extra:Partial<ReportMessage>={}):ReportMessage=>({id:crypto.randomUUID(),at:new Date().toISOString(),role:'assistant',text,...extra})
 const select=(id:string)=>{onSelect(id);setView('proposal')}
 const send=(value:string)=>{
  if(!editable || !value.trim())return
  const text=value.trim(),command=parseReportCommand(text,sections,active,scope)
  let proposal=chat.proposal, reply:ReportMessage, messages=chat.messages
  if(!command)reply=message('本地演示暂不支持这条自由指令，正文未改变。可指定章节生成、检查、分条、精简，或明确替换文字，例如：把第三章改成条目；将“原词”替换为“新词”。')
  else if(command.kind==='check'){
   const missing=sections.filter((s)=>command.targets.includes(s.id) && !s.content.trim()).map((s)=>s.title+'尚未填写')
   const checks=reportBlockers(project.id).filter((s)=>!s.includes('补全报告章节'))
   reply=message('检查结果（当前编辑与业务记录）：\n'+([...missing,...checks].map((s,i)=>(i+1)+'. '+s).join('\n') || '未发现必填缺项。')+'\n请人工核实事实与评价依据；本地规则不作语义或真实性判断。',{chapterIds:command.targets})
  }else if(stale && command.kind!=='generate')reply=message('当前提案的正文或来源已变化。请重新生成提案，再继续修改，避免覆盖新内容。')
  else{
   const generated=buildProjectReport(project), base=stale?sections:sections.map((s)=>proposal?.sections.find((p)=>p.id===s.id) ?? s)
   const targets=base.filter((s)=>command.targets.includes(s.id))
   const next=targets.map((s)=>({...s,content:command.kind==='generate'?generated.find((g)=>g.id===s.id)!.content:transformReportText(s.content,command)}))
   const changes=next.filter((s)=>s.content!==base.find((p)=>p.id===s.id)?.content)
   if(!changes.length){onSelect(command.targets[0]);setView(proposal?.sections.some((s)=>s.id===command.targets[0])?'proposal':'draft');reply=message('没有产生文字变更。请检查所选章节、原文或替换词；现有正文及提案保持不变。',{chapterIds:command.targets})}
   else{
    const id=crypto.randomUUID(),kept=stale?[]:proposal?.sections ?? []
    const merged=sections.map((s)=>changes.find((p)=>p.id===s.id) ?? kept.find((p)=>p.id===s.id)).filter((s):s is ReportSection=>Boolean(s)).filter((s)=>s.content!==sections.find((p)=>p.id===s.id)?.content)
    messages=messages.map((m)=>m.proposalId===proposal?.id && m.status && ['pending','partial'].includes(m.status)?{...m,status:'superseded'}:m)
    proposal=merged.length?{id,sections:merged,before:before(),sources:reportSourceSnapshot(project.id),summary:'待确认 '+merged.length+' 章修改'}:undefined
    reply=message(merged.length?'已整理 '+changes.length+' 章内容，右侧显示修改预览。'+(command.kind==='generate'?'引用本项目记录；缺失事实保留为待核实。':command.kind==='replace'||command.kind==='append'?'已按你提供的文字处理，请核实表述与事实。':'按本地格式规则处理，未扩写审计事实。'):'修改结果与正文一致，无需采纳。',{proposalId:id,chapterIds:changes.map((s)=>s.id),status:merged.length?'pending':'discarded'})
    onSelect(changes[0].id);setView(merged.length?'proposal':'draft')
   }
  }
  update(project.id,{...chat,messages:[...messages,{...message(text),role:'user'},reply],proposal});setNotice('')
 }
 const apply=(ids:string[])=>{try{
  const p=chat.proposal;if(!p || !editable)return
  if(stale)throw new Error('正文或来源已变化，请重新生成提案后采纳，避免覆盖新编辑。')
  const chosen=p.sections.filter((s)=>ids.includes(s.id));if(chosen.some((s)=>!s.content.trim()))throw new Error('建议正文不能为空，请补充内容或放弃该章修改。')
  if(!chosen.length)return
  const next=sections.map((s)=>chosen.find((p)=>p.id===s.id) ?? s)
  onApply(next)
  const remaining=p.sections.filter((s)=>!ids.includes(s.id)),snapshot=reportSourceSnapshot(project.id)
  update(project.id,{...chat,messages:chat.messages.map((m)=>m.proposalId===p.id?{...m,status:remaining.length?'partial':'accepted'}:m),proposal:remaining.length?{...p,sections:remaining,before:JSON.stringify({title,sections:next}),sources:snapshot,summary:'待确认 '+remaining.length+' 章修改'}:undefined,undo:{sections:structuredClone(sections),after:JSON.stringify({title,sections:next}),sources:snapshot,messageId:p.id}})
  setNotice('已采纳并保存 '+chosen.length+' 章，可撤销上次采纳。');if(!remaining.length)setView('draft')
 }catch(e){setNotice((e as Error).message)}}
 const discard=(id?:string)=>{const p=chat.proposal;if(!p || !editable)return;const remaining=id?p.sections.filter((s)=>s.id!==id):[];update(project.id,{...chat,messages:chat.messages.map((m)=>m.proposalId===p.id?{...m,status:remaining.length?'partial':'discarded'}:m),proposal:remaining.length?{...p,sections:remaining,summary:'待确认 '+remaining.length+' 章修改'}:undefined});setNotice(id?'该章修改已放弃，正文未改变。':'本次提案已放弃，正文未改变。');if(!remaining.length)setView('draft')}
 const undo=()=>{try{const u=chat.undo;if(!editable || !u)return;if(u.after!==before() || u.sources!==reportSourceSnapshot(project.id))throw new Error('采纳后正文或来源已有变化，不能直接撤销；请保留当前编辑并手动调整。');onApply(u.sections);update(project.id,{...chat,messages:chat.messages.map((m)=>m.proposalId===u.messageId?{...m,status:'undone'}:m),undo:undefined,proposal:chat.proposal?{...chat.proposal,before:JSON.stringify({title,sections:u.sections}),sources:reportSourceSnapshot(project.id)}:undefined});setNotice('已撤销上次采纳并保存。')}catch(e){setNotice((e as Error).message)}}
 const editProposal=(id:string,content:string)=>{if(editable && chat.proposal)update(project.id,{...chat,proposal:{...chat.proposal,sections:chat.proposal.sections.map((s)=>s.id===id?{...s,content}:s)}})}
 return {chat,scope,setScope,notice,view,setView,stale,send,select,apply,discard,undo,editProposal}
}
export type ReportConversationController=ReturnType<typeof useReportConversation>
