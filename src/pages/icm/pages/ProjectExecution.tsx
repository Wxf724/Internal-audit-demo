import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button, Textarea } from '@/components'
import { Card } from '../components/IcmPageKit'
import type { AuditProject } from '../data/auditProjects'
import { useProjectDocumentStore } from '../store/projectDocumentStore'
import { useWorkpaperStore } from '../store/workpaperStore'
import { useIcmDemoRole } from '../AppShell'
import { downloadProjectFile, saveProjectFile } from './projectFileStorage'

export function ProjectExecution({project}:{project:AuditProject}) {
 const {role}=useIcmDemoRole(),[params,setParams]=useSearchParams(), docs=useProjectDocumentStore()
 const files=docs.files.filter((f)=>f.projectId===project.id), evidences=docs.evidences.filter((e)=>e.projectId===project.id)
 const demand=docs.demands.find((d)=>d.id===params.get('demand') && d.projectId===project.id)
 const [fileId,setFileId]=useState(demand?.fileIds[0] ?? files[0]?.id ?? '')
 const file=files.find((f)=>f.id===fileId), sourceDemand=docs.demands.find((d)=>d.projectId===project.id && d.fileIds.includes(fileId))
 const [summary,setSummary]=useState(file?.extractedText ?? ''),[checked,setChecked]=useState(false),[busy,setBusy]=useState(false),[notice,setNotice]=useState('')
 const [selected,setSelected]=useState<string[]>([]),[analysis,setAnalysis]=useState<string[]>([])
 const locked=Boolean(project.archivedAt || project.archivePending || project.auditReport?.status==='已签发')
 const choose=(id:string)=>{setFileId(id);setSummary(files.find((f)=>f.id===id)?.extractedText ?? '');setChecked(false);setAnalysis([])}
 const act=(fn:()=>void)=>{try{fn()}catch(e){setNotice((e as Error).message)}}
 const upload=async(list:FileList|null)=>{
  if(!list || locked || busy)return
  setBusy(true);let count=0
  try{for(const raw of Array.from(list)){
   const meta=await saveProjectFile(raw,project.id,role.name)
   if(/\.(txt|csv|json|md)$/i.test(raw.name) && raw.size<=2*1024*1024)meta.extractedText=(await raw.text()).slice(0,40000)
   docs.importFile(meta,role.name);setFileId(meta.id);setSummary(meta.extractedText ?? '');setChecked(false);setAnalysis([]);count++
  }setNotice('已导入 '+count+' 份资料。文件名、来源和原件已自动登记，请核实摘要。')}
  catch(e){setNotice('已导入 '+count+' 份；'+(e as Error).message)}finally{setBusy(false)}
 }
 const analyze=()=>{
  const lines=summary.split(/\n/).map((text,i)=>({text:text.trim(),line:i+1})).filter((r)=>r.text)
  const hints=lines.filter((r)=>/缺少|未审批|无审批|未授权|不一致|逾期|重复|异常|missing|duplicate/i.test(r.text)).slice(0,8)
  setAnalysis(hints.length?hints.map((r)=>'第 '+r.line+' 行出现待核实表述：“'+r.text.slice(0,180)+'”。请对照原件、适用标准和实际样本确认，不能直接定性为问题。'):['未命中本地示例关键词。请核验资料期间、样本覆盖和审批记录；未命中不代表不存在问题。'])
  setNotice('本地规则分析完成；仅分析下方文本，不代表已经核验附件或确认事实。')
 }
 const register=()=>act(()=>{
  if(!file || !sourceDemand || !checked || !summary.trim())throw new Error('请核对原件并填写证明内容。')
  const exists=docs.evidences.find((e)=>e.fileIds.includes(file.id))
  if(exists){setSelected([...new Set([...selected,exists.id])]);setNotice('该文件已有证据记录，已选中。');return}
  docs.verify(sourceDemand.id,true,'人工核对原件与下方摘要一致',role.name)
  const id=docs.addEvidence({projectId:project.id,title:file.name,type:'资料取证',owner:role.name,status:'已核实',capturedAt:new Date().toISOString(),sourceSystem:'资料分析工作区',link:sourceDemand.id,fileIds:[file.id],description:summary})
  setSelected([...selected,id]);setNotice('证据已登记并选中，可生成底稿草稿。')
 })
 const createPaper=()=>act(()=>{
  const chosen=evidences.filter((e)=>selected.includes(e.id));if(!chosen.length)throw new Error('请先选择已登记的证据。')
  const store=useWorkpaperStore.getState()
  const existing=store.papers.find((p)=>p.projectId===project.id && p.source==='资料分析工作区' && p.evidenceIds?.length===chosen.length && chosen.every((e)=>p.evidenceIds?.includes(e.id)))
  let id=existing?.id
  if(!id){id=store.createPaper(project.id,[],role.name,chosen[0].title.replace(/\.[^.]+$/,'')+'核查底稿')
   const paper=useWorkpaperStore.getState().papers.find((p)=>p.id===id)!
   store.savePaper(id,{title:paper.title,type:'待判定',evidenceIds:chosen.map((e)=>e.id),body:{procedure:project.preparation?.procedures || '核对原始资料、期间及适用标准，记录实际执行方法和样本。',facts:chosen.map((e)=>'【'+e.id+'】'+e.title+'\n'+e.description).join('\n\n'),conclusion:'待核实：上述资料是否构成控制缺陷及其影响，请结合实际测试形成结论。',next:'核实证据与评价依据，记录实际反馈；确认异常后形成审计发现。'}},role.name)
   useWorkpaperStore.setState((s)=>({papers:s.papers.map((p)=>p.id===id?{...p,source:'资料分析工作区'}:p)}))
  }
  setParams((p)=>{p.set('tab','execution');p.set('section','papers');p.set('paper',id!);return p})
 })
 return <div className="project-execution-workspace">{!locked && <div className="project-execution-tools"><label className="project-file-button">{busy?'导入中…':'导入资料'}<input aria-label="直接导入审计资料" type="file" multiple disabled={busy} onChange={(e)=>{void upload(e.target.files);e.target.value=''}}/></label></div>}
 <div className="project-execution-grid"><Card title={'项目资料 · '+files.length} note="TXT、CSV、JSON、MD 可读取文本；其他格式保留原件，摘要需核实录入。"><div className="project-record-list">{files.map((f)=><button key={f.id} aria-current={f.id===fileId?'true':undefined} onClick={()=>choose(f.id)}><strong>{f.name}</strong><small>{Math.ceil(f.size/1024)} KB · {evidences.some((e)=>e.fileIds.includes(f.id))?'已登记证据':'待核实'}</small></button>)}</div>{!files.length && <p className="project-help">直接导入资料即可开始，无需先新建需求或逐项填写审计程序。</p>}{file && <Button onClick={()=>void downloadProjectFile(file).catch((e)=>setNotice(e.message))}>查看原件（下载）</Button>}</Card>
 <Card title={file?.name ?? '资料分析'} action={<Button disabled={locked || !summary.trim()} onClick={analyze}>AI 分析线索</Button>}>
 {file?<><Textarea aria-label="资料摘要与证明内容" rows={7} disabled={locked} value={summary} onChange={(v)=>{setSummary(v);setChecked(false);setAnalysis([])}} placeholder="核对原件后填写可证明的内容；不支持解析的附件不会自动识别。"/>{analysis.length>0 && <div className="project-analysis-results"><b>待核实线索</b>{analysis.map((s,i)=><p key={i}>{s}</p>)}</div>}{!locked && <div className="project-form-actions"><label><input type="checkbox" checked={checked} onChange={(e)=>setChecked(e.target.checked)}/> 我已核对原件与摘要</label><Button disabled={!checked || !summary.trim()} onClick={register}>核实并登记证据</Button></div>}</>:<div className="project-analysis-results"><b>从资料直接开始</b><p>导入后自动登记文件；本地分析标出待核实线索。确认摘要后登记证据，一键带入底稿。</p></div>}</Card></div>
 <Card title={'可用于底稿的证据 · '+evidences.length} action={!locked && <Button type="primary" disabled={!selected.length} onClick={createPaper}>生成底稿草稿（{selected.length}）</Button>}><div className="project-choice-list">{evidences.map((e)=><label key={e.id}><input type="checkbox" disabled={locked} checked={selected.includes(e.id)} onChange={(v)=>setSelected(v.target.checked?[...selected,e.id]:selected.filter((id)=>id!==e.id))}/><span><b>{e.title}</b><small className="project-block">{e.description}</small></span></label>)}</div>{!evidences.length && <p className="project-help">核实资料后，证据会出现在这里。底稿由证据自动带入，人员重点核对事实和结论。</p>}</Card>
 {notice && <p role="status" className="project-operation-note">{notice}</p>}</div>
}
