import type { ReportSection } from '../data/projectWork'
export type ReportCommand = {kind:'generate'|'check'|'list'|'paragraphs'|'concise'|'replace'|'append';targets:string[];from?:string;to?:string}
export function parseReportCommand(text:string,sections:ReportSection[],active:string,scope:'chapter'|'all'):ReportCommand|null {
 const names:Record<string,string[]>={scope:['依据与范围','审计范围','第一章','第1章'],work:['实施情况','范围限制','第二章','第2章'],conclusion:['总体评价','第三章','第3章'],findings:['审计发现','发现与建议','第四章','第4章'],feedback:['征求意见','意见处理','第五章','第5章']}
 const named=sections.filter((s)=>text.includes(s.title) || names[s.id]?.some((alias)=>text.includes(alias))).map((s)=>s.id)
 const targets=/全文|完整|全部|整份/.test(text)?sections.map((s)=>s.id):named.length?named:/当前|本章/.test(text)?[active]:scope==='all'?sections.map((s)=>s.id):[active]
 const replacement=text.match(/[“"「]([^”"」]+)[”"」]\s*(?:替换为|替换成|改为|改成)\s*[“"「]([^”"」]*)[”"」]/)
 if(replacement)return {kind:'replace',targets,from:replacement[1],to:replacement[2]}
 const addition=text.match(/(?:追加|补充)(?:内容)?[：:\s]*[“"「]([^”"」]+)[”"」]/)
 if(addition)return {kind:'append',targets,to:addition[1]}
 if(/生成|起草|初稿|重新编制/.test(text))return {kind:'generate',targets}
 if(/条目|分条|列点/.test(text))return {kind:'list',targets}
 if(/分段/.test(text))return {kind:'paragraphs',targets}
 if(/精简|去重|删除重复/.test(text))return {kind:'concise',targets}
 if(/检查|缺项|完整性|给.{0,4}建议/.test(text))return {kind:'check',targets}
 return null
}
export function transformReportText(content:string,command:ReportCommand){
 if(command.kind==='replace')return content.split(command.from!).join(command.to!)
 if(command.kind==='append')return [content,command.to].filter(Boolean).join('\n\n')
 const lines=content.split(/\n+/).map((s)=>s.trim()).filter(Boolean)
 if(command.kind==='concise')return [...new Set(lines)].join('\n')
 if(command.kind==='list')return lines.map((s,i)=>(i+1)+'. '+s.replace(/^\d+[.、]\s*/, '')).join('\n')
 return lines.join('\n\n')
}
