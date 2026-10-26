import { useState } from 'react'
import { Button, Textarea } from '@/components'
import type { WorkflowIssue } from '../store/workflowStore'
type Draft=Pick<WorkflowIssue,'fact'|'basis'|'rootCause'|'impact'|'suggestion'>
export function FindingAssistant({issue,draft,editable,onApply}:{issue:WorkflowIssue;draft:Draft;editable:boolean;onApply:(suggestion:string)=>void}){
 const [result,setResult]=useState(''),[proposal,setProposal]=useState(false)
 const analyze=()=>{setProposal(false);const missing=([['fact','事实'],['basis','依据'],['rootCause','根因'],['impact','影响'],['suggestion','建议']] as const).filter(([k])=>!draft[k].trim()).map(([,l])=>l);setResult('待核实线索与正式发现应分开处理。\n'+(missing.length?'缺少要素：'+missing.join('、')+'。':'五项要素已有文本，仍需核对真实性与一致性。')+'\n'+(!issue.evidenceIds.length?'缺少关联证据，先补充证据引用。':'关联证据 '+issue.evidenceIds.length+' 项，请核对是否直接支持当前事实。')+'\n修改方向：事实写清对象、期间与差异；依据列明适用条款；根因与影响分别论证，不能由异常关键词直接推定。')}
 const communicate=()=>{setProposal(false);setResult('建议围绕“'+issue.title+'”沟通以下事项：\n1. 对当前事实描述是否有异议？请逐项列明并提供原始记录。\n2. 所引用制度和标准是否适用于该期间与事项？\n3. 差异产生的原因和影响是什么？是否存在其他解释？\n4. 对拟议整改措施、责任与期限有何意见？\n5. 需要补充哪些证据，谁负责、何时反馈？\n以上是沟通提纲，不代表对方已经反馈；实际回复在下方沟通记录中登记。')}
 const propose=()=>{setProposal(true);setResult((draft.suggestion?draft.suggestion+'\n\n':'')+'建议围绕“'+issue.title+'”中已核实的差异完善相关控制，明确责任部门、措施和完成期限；通过复测原控制节点及关联记录验证措施效果。具体措施应与已核实根因对应，并与责任单位沟通确认。')}
 return <details className="project-finding-assistant"><summary>AI 发现与沟通助手 <span>本地规则与模板 · 不自动定性</span></summary><div className="project-form-actions"><Button onClick={analyze}>检查发现要素</Button><Button onClick={communicate}>拟定沟通提纲</Button><Button disabled={!editable} onClick={propose}>建议修改稿</Button></div>{result && <><Textarea aria-label="发现辅助建议" value={result} onChange={setResult} rows={6}/>{proposal && editable && <Button onClick={()=>{onApply(result);setProposal(false)}}>带入整改建议草稿</Button>}</>}</details>
}
