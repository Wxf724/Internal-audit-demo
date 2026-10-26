import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { Button, Modal, Textarea } from '@/components'
import type { AuditProject } from '../data/auditProjects'
import { reportSections, workId } from '../data/projectWork'
import { useAuditProjectStore } from '../store/auditProjectStore'
import { useWorkpaperStore } from '../store/workpaperStore'
import { useProjectDocumentStore } from '../store/projectDocumentStore'
import { useWorkflowStore } from '../store/workflowStore'
import { useIcmDemoRole } from '../AppShell'
import { isPaperApproved, savePreparation, saveProjectReport } from './projectWorkActions'
import { issueProjectId } from './projectScope'
import { preparationAssistField, preparationAssistFields, paperAssistField, paperAssistFields, type ProjectAssistRequest } from './projectAssistTypes'

type Mode = 'generate' | 'suggest' | 'revise'
type Style = 'paragraphs' | 'list' | 'concise'
const modes = [{id:'generate',title:'AI 生成',description:'按项目资料生成初稿'}, {id:'suggest',title:'AI 建议',description:'检查缺项与业务关联'}, {id:'revise',title:'AI 修改',description:'整理结构、精简重复'}] as const
export function ProjectAI({ project, request, onClose, onApplied }: { project: AuditProject; request: ProjectAssistRequest; onClose: () => void; onApplied: () => void }) {
 const {role}=useIcmDemoRole()
 const papers=useWorkpaperStore((s)=>s.papers).filter((p)=>p.projectId===project.id)
 const evidence=useProjectDocumentStore((s)=>s.evidences).filter((e)=>e.projectId===project.id)
 const issues=useWorkflowStore((s)=>s.issues).filter((i)=>issueProjectId(i)===project.id && !i.mergedIntoId && !['待确认','待分级审核','分级审核不通过','异议中'].includes(i.status))
 const kind=request.kind, target=request.target ?? 'scope'
 const prepField=preparationAssistField(request.field), paperField=paperAssistField(request.field)
 const paper=papers.find((p)=>p.id===request.target)
 const section=(project.auditReport?.sections ?? reportSections).find((s)=>s.id===target)
 const label=kind==='preparation'?preparationAssistFields[prepField]:kind==='paper'?paperAssistFields[paperField]:section?.title ?? '报告章节'
 const destination=kind==='preparation'?'项目方案 → '+label:kind==='paper'?(paper?.title ?? '底稿')+' → '+label:'项目审计报告 → '+label
 const original=(kind==='preparation'?project.preparation?.[prepField]:kind==='paper'?paper?.body[paperField]:section?.content) ?? ''
 const [selected,setSelected]=useState<string[]>((paper?.evidenceIds ?? []).filter((id)=>evidence.some((e)=>e.id===id)))
 const [mode,setMode]=useState<Mode>('generate'),[style,setStyle]=useState<Style>('paragraphs')
 const [content,setContent]=useState(''),[resultMode,setResultMode]=useState<Mode>(),[notice,setNotice]=useState(''),[error,setError]=useState(false),[fingerprint,setFingerprint]=useState(''),[accepted,setAccepted]=useState(false)
 const [draft,setDraft]=useState(''),[usedEvidence,setUsedEvidence]=useState<string[]>([])
 const version=()=>JSON.stringify({project:useAuditProjectStore.getState().projects.find((p)=>p.id===project.id),papers:useWorkpaperStore.getState().papers.filter((p)=>p.projectId===project.id),evidence:useProjectDocumentStore.getState().evidences.filter((e)=>e.projectId===project.id),issues:useWorkflowStore.getState().issues.filter((i)=>issueProjectId(i)===project.id)})
 const scope=project.preparation?.objective || project.scope
 const programs=kind==='paper'?(project.programs ?? []).filter((p)=>paper?.programIds?.includes(p.id)):project.programs ?? []
 const selectedEvidence=evidence.filter((e)=>selected.includes(e.id))
 const programText=programs.map((p,i)=>(i+1)+'. '+p.title+'：'+p.method+'；评价依据：'+p.criteria).join('\n')
 const evidenceText=selectedEvidence.map((e)=>'【'+e.id+'】'+e.title+'：'+e.description).join('\n')
 const fieldDraft=()=>{
  if(kind==='preparation'){
   const values={
    objective:'本项目以'+project.subject+'为审计对象，围绕“'+project.scope+'”开展审计，覆盖期间为'+project.period+'。\n重点关注'+(project.risk || '关键业务风险和控制薄弱环节')+'，评价相关控制设计与执行情况，识别问题并提出改进建议。\n实施前应明确纳入范围的业务、组织和期间边界；对资料无法取得或测试受到限制的事项单独记录。',
    procedures:'一、风险导向与范围确认\n围绕“'+scope+'”，梳理关键流程、风险和控制点，核对制度依据及适用期间。\n二、拟执行程序\n'+(programText || '通过制度查阅、访谈、穿行测试和记录核对，识别关键控制；依据风险确定需要进一步测试的环节。')+'\n三、抽样与证据\n先核验样本总体的完整性，结合金额、业务类型和异常特征分层选样；异常事项延伸检查。抽样总体、具体样本量和依据应在实施前据实确定。\n四、质量复核\n记录程序、测试结果及证据索引，核实例外后形成结论，由复核人员检查事实与依据的一致性。',
    notice:'拟就“'+project.name+'”与'+project.subject+'开展进场沟通，明确目标范围、覆盖期间（'+project.period+'）和双方配合事项。\n进场前：核对资料清单，确认数据口径、提供方式、联系人及时间安排。\n实施期间：安排访谈和资料答疑，记录补充需求及范围限制。\n结束现场工作前：沟通初步发现、待核实事项与反馈安排。\n具体进场日期、联系人和通知送达情况由项目人员据实登记；本草稿不代表通知已送达。',
   }
   return values[prepField]
  }
  if(kind==='paper'){
   const values={
    procedure:'拟按以下程序实施测试：\n'+(programText || '先确认业务范围和控制要求，再核验样本总体、选样依据及证据完整性。')+'\n实施记录应补充实际抽样总体、样本量、检查步骤、例外及处理情况，不将拟执行方法记为已完成测试。',
    facts:evidenceText?'已登记证据的内容摘要（尚需与原件及实际测试核对）：\n'+evidenceText+'\n核实要求：逐项记录适用期间、实际检查步骤、涉及样本与例外，并补充可追溯的原始记录位置。':'本底稿围绕“'+(paper?.title ?? scope)+'”记录检查事实。\n建议依次整理：检查对象与期间、实际执行的步骤、核查记录、发现的差异及相关证据索引。\n目前尚未选择参考证据，不能生成已执行测试或已发现问题的事实结论；请先登记并引用证据。',
    conclusion:'本底稿结论应覆盖“'+(paper?.title ?? scope)+'”对应的控制要求。\n'+(paper?.body.facts?'已记录事实：'+paper.body.facts+'\n':'当前尚无审计事实记录。\n')+'请结合引用证据和实际测试结果说明控制执行情况、例外影响及范围限制。现有登记内容不足以自动判断控制有效性，结论待审计人员核实。',
    next:'建议围绕本底稿已核实事实，明确需完善的控制节点、责任部门、措施及验收依据。\n对证据不足事项，先补充原始资料和测试；对已确认异常，记录原因、影响并形成发现；对未发现异常的事项，保留执行过程与支持依据。\n具体责任人、完成期限与措施需沟通确认，不由本演示自动认定。',
   }
   return values[paperField]
  }
  const values:Record<string,string>={
   scope:'项目：'+project.name+'\n审计对象：'+project.subject+'\n覆盖期间：'+project.period+'\n审计范围：'+scope+'\n引用依据：'+(project.resourceRefs?.map((r)=>r.snapshot.title+'（V'+r.version+'）').join('、') || '尚未引用适用依据，需核实后补充')+'\n本报告对实际范围内的审计结果作出说明；受限范围应在实施情况中披露。',
   work:'项目登记程序：\n'+(programText || '尚未建立结构化程序')+'\n底稿记录：\n'+(papers.map((p)=>p.title+' · '+(p.reviewState ?? p.status)).join('\n') || '尚无底稿记录')+'\n实际实施步骤、样本覆盖和范围限制应与已复核底稿核对，任务安排不代表测试已经完成。',
   conclusion:'本项目围绕“'+scope+'”实施审计，当前已确认并完成定级的发现共 '+issues.length+' 项。\n总体评价应结合程序覆盖、证据充分性、发现性质及影响形成。\n'+(issues.length?'请区分个别例外与系统性控制缺陷，并说明判断依据。':'当前无已确认发现记录，不据此直接推断控制有效。')+'\n本节综合结论仍需主审核实；未完成测试或证据缺口应单独披露。',
   findings:issues.length?issues.map((i,index)=>(index+1)+'. '+i.title+'【'+i.id+'】\n事实：'+i.fact+'\n依据：'+i.basis+'\n影响：'+i.impact+'\n建议：'+i.suggestion).join('\n\n'):'当前没有已确认且完成定级的发现。\n请先完成底稿复核、事实沟通和发现定级；若实际测试未发现问题，应据实说明测试范围和结果，不虚构问题或无问题结论。',
   feedback:project.auditReport?.communications?.length?project.auditReport.communications.map((c)=>'征求事项：'+c.subject+'\n接收方：'+c.recipient+' · '+c.sentAt+'\n反馈：'+c.reply+'\n处理：'+c.decision).join('\n\n'):'尚未登记实际征求意见记录。\n拟就报告事实、依据及建议征求被审计单位意见，对反馈逐项核实，记录采纳情况与理由。\n正式报告应据实补充送达时间、反馈内容、争议处理及结论；本草稿不代表已完成沟通。',
  }
  return values[target] ?? ''
 }
 const checks=()=>{
  const rows:string[]=[]
  if(!original.trim())rows.push('当前字段为空：可先生成一版初稿，再核实其中的待补事项。')
  if(!project.resourceRefs?.length)rows.push('适用依据尚未引用：在方案与分工中选择制度或标准版本，核实适用期间。')
  if(!project.preparation?.procedures?.trim())rows.push('方案尚缺少检查方法：先在方案与分工中完善方法与抽样策略。')
  if(kind==='paper'){
   if(!selected.length)rows.push('尚未选择证据：先到资料与取证登记原件及证明内容，再关联本底稿。')
   if(!paper?.body.facts.trim())rows.push('审计事实未填写：补充实际检查步骤、对象、期间和例外，不用拟议方法替代执行记录。')
   if(!paper?.body.conclusion.trim())rows.push('审计结论未填写：核实事实与证据后，说明控制执行情况及判断依据。')
  }
  if(kind==='report'){
   if(papers.some((p)=>!isPaperApproved(p)))rows.push('存在未完成复核的底稿：核对其状态，报告不能将未复核内容当成最终结论。')
   if(!project.auditReport?.communications?.length)rows.push('报告尚无征求意见记录：取得真实反馈后登记送达、反馈及处理结论。')
   if(!issues.length)rows.push('无已确认定级发现：检查是否有待沟通或定级事项，不能据此认定控制有效。')
  }
  rows.push('提交前人工核对：数据口径、事实与依据是否一致，责任和期限是否落实。')
  return rows.map((s,i)=>(i+1)+'. '+s).join('\n\n')
 }
 const generate=()=>{
  setError(false);setAccepted(false)
  if(mode==='suggest'){setContent(checks());setResultMode('suggest');setNotice('已按本地规则检查缺项；尚未进行模型语义分析。建议不会直接写入业务正文。');return}
  let text=fieldDraft()
  if(mode==='revise'){
   if(draft && fingerprint && fingerprint!==version()){setError(true);setNotice('业务记录已变化，请先重新生成初稿，再进行修改。');return}
   const current=resultMode && resultMode!=='suggest'?content:draft || original
   if(!current.trim()){setError(true);setNotice('当前没有可修改的内容，请先生成初稿。');return}
   const lines=current.split(/\n+/).map((s)=>s.trim()).filter(Boolean)
   text=style==='concise'?[...new Set(lines)].join('\n'):style==='list'?lines.map((s,i)=>(i+1)+'. '+s.replace(/^\d+[.、]\s*/, '')).join('\n'):lines.join('\n\n')
  }
  setContent(text);setDraft(text);setResultMode(mode);setFingerprint(version());setUsedEvidence([...selected])
  setNotice(mode==='revise'?'已按所选方式整理文本，未进行模型改写。核对后可采纳到当前字段。':'已根据本项目记录生成模板初稿；待核实事项已注明，可编辑后采纳。')
 }
 const accept=()=>{try{
  if(!resultMode || resultMode==='suggest')return
  if(fingerprint!==version())throw new Error('业务内容已变化，请重新生成，避免覆盖新版本。')
  if(!content.trim())throw new Error('草稿不能为空。')
  if(kind==='preparation')savePreparation(project.id,{...(project.preparation ?? {objective:project.scope,procedures:'',members:project.owner,reviewer:'',notice:''}),[prepField]:content},role.name)
  else if(kind==='paper'){if(!paper)throw new Error('目标底稿不存在。');useWorkpaperStore.getState().savePaper(paper.id,{title:paper.title,type:paper.type,body:{...paper.body,[paperField]:content},evidenceIds:[...new Set([...(paper.evidenceIds ?? []),...usedEvidence])]},role.name)}
  else {if(!section)throw new Error('目标章节不存在。');saveProjectReport(project.id,project.auditReport?.title ?? project.name+'报告',(project.auditReport?.sections ?? reportSections).map((s)=>s.id===target?{...s,content}:s),role.name)}
  const p=useAuditProjectStore.getState().projects.find((p)=>p.id===project.id)!
  useAuditProjectStore.getState().updateProject(project.id,{draftItems:[...p.draftItems,{id:workId('DEMO'),title:'AI 本地演示 · '+label,summary:'本地'+(resultMode==='revise'?'格式修改':'模板生成')+'；写入：'+destination+'；引用：'+(usedEvidence.join('、') || '当前项目记录'),kind:'文本草稿',acceptedBy:role.name,acceptedAt:new Date().toISOString()}]})
  setAccepted(true);setError(false);setNotice('已写入：'+destination+'。请返回业务页面核对并提交审核。');onApplied()
 }catch(e){setError(true);setNotice((e as Error).message)}}
 const changeMode=(value:Mode)=>{if(resultMode && resultMode!=='suggest')setDraft(content);setMode(value);setNotice('');setError(false)}
 return <Modal open title={'AI 助手 · '+label} width="min(1040px, 96vw)" onClose={onClose} footer={accepted?<Button type="primary" onClick={onClose}>返回查看写入结果</Button>:<>
  <Button type="primary" icon={<Sparkles size={14}/>} onClick={generate}>{mode==='generate'?'生成演示初稿':mode==='suggest'?'查看检查建议':'预览修改效果'}</Button>
  {resultMode==='suggest'?<Button onClick={()=>{setMode('generate');setNotice('已切换到生成模式，可生成初稿后按检查建议手工完善。')}}>去生成并完善初稿</Button>:<Button disabled={!resultMode || !content.trim()} onClick={accept}>采纳到当前字段</Button>}
 </>}>
 <div className="project-ai-intro"><span><Sparkles size={17}/><b>本地演示 · 不外发</b></span><small>模板生成 / 规则检查 / 格式修改；不调用 AI 模型</small></div>
 <div className="project-ai-modes" role="group" aria-label="AI 演示处理方式">{modes.map((m)=><button key={m.id} disabled={accepted} aria-pressed={mode===m.id} onClick={()=>changeMode(m.id)}><b>{m.title}</b><small>{m.description}</small></button>)}</div>
 <div className="project-ai-workspace"><aside className="project-ai-input">
 <div className="project-assist-target"><b>本次处理：</b>{destination}<p className="project-help">当前编辑已保存；采纳仅替换此字段，其他内容保留。</p></div>
 {mode==='revise'?<><strong>选择修改方式</strong><div className="project-ai-prompts">{([['paragraphs','分段整理'],['list','改成条目'],['concise','删除重复行']] as const).map(([id,title])=><button key={id} aria-pressed={style===id} disabled={accepted} onClick={()=>setStyle(id)}>{title}</button>)}</div><p className="project-help">对当前草稿或原文进行格式整理，不扩写事实。</p></>:<div className="project-ai-starter"><b>{mode==='generate'?'已为当前字段准备内容框架':'检查哪些内容'}</b><p>{mode==='generate'?'结合项目范围、程序及相关业务记录生成一版可编辑文本，无需从空白开始。':'按当前记录检查字段空缺、程序与证据关联、报告反馈等事项，并告诉你下一步补什么。'}</p></div>}
 <details className="project-ai-source-details"><summary>参考资料与当前原文</summary><p>项目：{project.name}</p><p>范围：{scope}</p><p>相关程序：{programs.length} 项{kind==='report'?'；底稿：'+papers.length+' 份；已确认发现：'+issues.length+' 项':''}</p><pre>{original || '当前字段尚未填写'}</pre></details>
 {kind==='paper' && <details className="project-ai-source-details" open><summary>参考证据 · 已选 {selected.length} 项</summary><div className="project-ai-sources">{evidence.map((e)=><label key={e.id}><input type="checkbox" disabled={accepted} checked={selected.includes(e.id)} onChange={(v)=>{setSelected(v.target.checked?[...selected,e.id]:selected.filter((id)=>id!==e.id));setResultMode(undefined);setDraft('');setContent('')}}/><span>{e.title}<small className="project-block">{e.description}</small></span></label>)}</div>{!evidence.length && <p className="project-help">暂无证据，将演示内容框架与核实要求，不补造事实。</p>}</details>}
 </aside><section className="project-ai-output">
 <div className="project-ai-output-heading"><b>{resultMode==='suggest'?'检查建议 · 本地规则':resultMode?'演示草稿 · 可编辑':'内容预览 · 尚未采纳'}</b><small>待人工核实</small></div>
 {resultMode?<Textarea aria-label="辅助建议草稿" rows={13} value={content} disabled={accepted} onChange={setContent}/>:<div className="project-ai-seed-preview">{fieldDraft()}</div>}
 </section></div>
 {notice && <p role={error?'alert':'status'} className={error?'project-error':'project-operation-note'}>{notice}</p>}
 </Modal>
}

