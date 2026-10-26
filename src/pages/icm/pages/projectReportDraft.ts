import type { AuditProject } from '../data/auditProjects'
import { reportSections } from '../data/projectWork'
import { useWorkflowStore } from '../store/workflowStore'
import { useProjectDocumentStore } from '../store/projectDocumentStore'
import { useAuditProjectStore } from '../store/auditProjectStore'
import { isPaperApproved, workProjectPapers } from './projectWorkActions'
import { issueProjectId } from './projectScope'
export function reportSourceSnapshot(id:string){return JSON.stringify({project:useAuditProjectStore.getState().projects.find((p)=>p.id===id),papers:workProjectPapers(id),issues:useWorkflowStore.getState().issues.filter((i)=>issueProjectId(i)===id),evidence:useProjectDocumentStore.getState().evidences.filter((e)=>e.projectId===id)})}
export function buildProjectReport(project:AuditProject){
 const papers=workProjectPapers(project.id), approved=papers.filter(isPaperApproved)
 const all=useWorkflowStore.getState().issues.filter((i)=>issueProjectId(i)===project.id && !i.mergedIntoId)
 const issues=all.filter((i)=>!['待确认','待分级审核','分级审核不通过','异议中'].includes(i.status))
 const values:Record<string,string>={
 scope:'一、审计对象与期间\n本项目审计对象为'+project.subject+'，覆盖期间为'+project.period+'。\n二、审计目标与范围\n'+(project.preparation?.objective || project.scope)+'\n三、引用依据\n'+(project.resourceRefs?.map((r)=>r.snapshot.title+'（V'+r.version+'）').join('；') || '尚未引用适用制度或标准，正式报告前需核实补充。'),
 work:'本项目已登记底稿 '+papers.length+' 份，其中完成复核 '+approved.length+' 份。\n'+(approved.length?'已复核的实施记录：\n'+approved.map((p)=>'【'+p.id+'】'+p.title+'\n'+p.body.procedure).join('\n\n'):'当前尚无已复核底稿，实际实施情况需完成测试后据实列示。')+'\n'+(papers.length>approved.length?'部分底稿尚未完成复核，不纳入最终评价依据。':'')+'\n范围限制：需根据实际资料取得、样本覆盖和受限情况核实后披露，不预设不存在限制。',
 conclusion:'审计评价范围为“'+(project.preparation?.objective || project.scope)+'”。当前完成定级的发现共 '+issues.length+' 项'+(all.length>issues.length?'，另有 '+(all.length-issues.length)+' 项发现待确认或处理':'')+'。\n'+(approved.length?'已复核底稿结论：\n'+approved.map((p)=>'【'+p.id+'】'+p.body.conclusion).join('\n'):'尚无已复核底稿支持总体结论。')+'\n总体评价请结合以上结论的覆盖范围、证据充分性和问题影响核实，不将“无发现记录”认定为“控制有效”。',
 findings:issues.length?issues.map((i,n)=>(n+1)+'. '+i.title+'【'+i.id+'】\n事实：'+i.fact+'\n依据：'+i.basis+'\n原因：'+i.rootCause+'\n影响：'+i.impact+'\n建议：'+i.suggestion).join('\n\n'):'当前没有已完成确认及定级的发现可列入正式报告。请先核对待办发现；如实际测试未发现问题，应据实说明测试范围、结果与支持证据。',
 feedback:project.auditReport?.communications?.length?project.auditReport.communications.map((c)=>'事项：'+c.subject+'\n接收方：'+c.recipient+'；送达日期：'+c.sentAt+'\n反馈：'+c.reply+'\n处理结论：'+c.decision).join('\n\n'):'尚未登记报告征求意见。拟就报告事实、依据和整改建议征求被审计单位意见，收到反馈后逐项核实并记录采纳理由；本段为拟议安排，不代表已经完成沟通。',
 }
 return reportSections.map((s)=>({...s,content:values[s.id]}))
}
