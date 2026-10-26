import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button, Input, Textarea } from '@/components'
import { Card, DataTable, Tag } from '../components/IcmPageKit'
import type { AuditProject } from '../data/auditProjects'
import { useProjectDocumentStore } from '../store/projectDocumentStore'
import { useIcmDemoRole } from '../AppShell'
import { saveProjectFile, downloadProjectFile } from './projectFileStorage'
export function ProjectMaterials({ project }: { project: AuditProject }) {
 const {role} = useIcmDemoRole(), [params,setParams] = useSearchParams()
 const store = useProjectDocumentStore(), [create,setCreate] = useState(false), [busy,setBusy] = useState(false)
 const [form,setForm] = useState({name:'',owner:project.subject,due:'',scale:'',method:'文件上传',category:'审计资料',programIds:[] as string[]})
 const [opinion,setOpinion] = useState(''), [description,setDescription] = useState(''), [notice,setNotice] = useState('')
 const demands = store.demands.filter((d) => d.projectId === project.id), selected = demands.find((d) => d.id === params.get('demand'))
 const locked=Boolean(project.archivedAt || project.auditReport?.status === '已签发')
 const act=(fn:()=>void) => { try { fn(); setNotice('操作已保存。') } catch(e) { setNotice((e as Error).message) } }
 const choose=(id:string) => setParams((p) => {p.set('demand',id); return p})
 const upload=async(file?:File) => { if(!file || !selected || locked) return; setBusy(true); try { const meta=await saveProjectFile(file,project.id,role.name); store.receive(selected.id,meta,role.name); setNotice('文件已保存，等待校验。') } catch(e) { setNotice((e as Error).message) } finally {setBusy(false)} }
 return <><Card title="资料需求与接收" note="需求关联审计程序，文件校验后登记取证内容。" action={!locked && <Button onClick={() => setCreate(!create)}>新增资料需求</Button>}>
 {create && !locked && <div className="project-section"><div className="project-form-grid">{([['name','资料需求名称'],['owner','提交责任人'],['due','提交期限'],['scale','数据范围与口径']] as const).map(([k,l]) => <label key={k}>{l}<Input aria-label={l} value={form[k]} onChange={(v) => setForm({...form,[k]:v})} /></label>)}</div><div className="project-choice-list">{(project.programs ?? []).map((p) => <label key={p.id}><input type="checkbox" checked={form.programIds.includes(p.id)} onChange={(e) => setForm({...form,programIds:e.target.checked?[...form.programIds,p.id]:form.programIds.filter((id) => id !== p.id)})} />{p.title}</label>)}</div><Button onClick={() => act(() => { const id=store.addDemand({...form,projectId:project.id},role.name); setCreate(false); choose(id) })}>保存资料需求</Button></div>}
 <DataTable columns={['资料需求','责任人','期限','程序','状态']} rows={demands.map((d) => [<button className="icm-link" onClick={() => choose(d.id)}>{d.name}</button>,d.owner,d.due,d.programIds.map((id) => project.programs?.find((p) => p.id===id)?.title ?? id).join('、') || '历史需求',<Tag tone={d.status==='已采集'?'green':'blue'}>{d.status}</Tag>])} />
 </Card>{selected && <Card title={selected.name} note={selected.scale}><div className="icm-actions">{!locked && <label className="project-file-button">{busy?'保存中…':'上传资料文件'}<input aria-label="上传资料文件" disabled={busy} type="file" onChange={(e) => {void upload(e.target.files?.[0]); e.target.value=''}} /></label>}</div>{selected.fileIds.map((id) => store.files.find((f) => f.id===id)).filter((f) => !!f).map((f) => <div className="icm-list-row" key={f.id}><span>{f.name} · {Math.ceil(f.size/1024)} KB</span><Button onClick={() => downloadProjectFile(f).catch((e) => setNotice(e.message))}>下载原件</Button></div>)}
 {!locked && <><Textarea aria-label="资料校验意见" value={opinion} onChange={setOpinion} placeholder="完整性、期间、范围及真实性核对结论" /><div className="project-form-actions"><Button onClick={() => act(() => store.verify(selected.id,false,opinion,role.name))}>退回补充资料</Button><Button onClick={() => act(() => store.verify(selected.id,true,opinion,role.name))}>校验通过</Button></div>{selected.status==='已采集' && <><Textarea aria-label="证据证明内容" value={description} onChange={setDescription} placeholder="说明取证范围、关键事实及能够证明的事项" /><div className="project-form-actions"><Button type="primary" disabled={!selected.fileIds.length} onClick={() => act(() => { if(store.evidences.some((e) => e.link===selected.id)) throw new Error('该需求已登记证据，请在下方查看。'); store.addEvidence({projectId:project.id,title:selected.name,type:'资料取证',owner:role.name,status:'已核实',capturedAt:new Date().toISOString(),sourceSystem:'项目资料需求',link:selected.id,fileIds:selected.fileIds,description}); setDescription('') })}>登记为审计证据</Button></div></>}</>}
 </Card>}<Card title="证据索引"><DataTable columns={['证据名称','证明内容','来源文件','登记人']} rows={store.evidences.filter((e) => e.projectId===project.id).map((e) => [e.title,e.description,e.fileIds.map((id) => store.files.find((f) => f.id===id)?.name).join('、') || '历史索引，原件未迁入',e.owner])} /></Card>{notice && <p role="status" className="project-operation-note">{notice}</p>}</>
}

