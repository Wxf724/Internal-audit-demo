import { useState } from 'react'
import { Button, Input, Textarea } from '@/components'
import type { Communication } from '../data/projectWork'
import { workId } from '../data/projectWork'
export function ProjectCommunication({ records, onSave, actor, locked = false }: { records: Communication[]; onSave: (records: Communication[]) => void; actor: string; locked?: boolean }) {
 const [form,setForm] = useState({subject:'',recipient:'',sentAt:'',reply:'',decision:''}), [error,setError] = useState('')
 const save = () => { if (!Object.values(form).every((v) => v.trim())) { setError('请完整填写征求事项、接收人、送达日期、回复和处理结论。'); return }
 try { onSave([...records,{...form,id:workId('COM'),by:actor,resolvedAt:new Date().toISOString()}]); setForm({subject:'',recipient:'',sentAt:'',reply:'',decision:''}); setError('已登记沟通结果。') } catch(e) { setError((e as Error).message) } }
 return <section className="project-section"><div className="project-section-heading"><strong>征求意见与沟通记录</strong><small>登记线下送达与实际反馈，不代发消息</small></div>{records.map((r) => <div className="project-communication-record" key={r.id}><strong>{r.subject}</strong><p>{r.recipient} · {r.sentAt} · 登记人：{r.by}</p><p>回复：{r.reply}</p><p>处理：{r.decision}</p></div>)}{!locked && <details><summary>登记沟通结果</summary><div className="project-form-grid">{([['subject','征求事项'],['recipient','接收人或单位'],['sentAt','送达日期'],['reply','反馈意见'],['decision','采纳或不采纳结论及理由']] as const).map(([key,label]) => <label key={key}>{label}{key === 'sentAt' ? <input type="date" className="icm-input" aria-label={label} value={form[key]} onChange={(e) => setForm({...form,[key]:e.target.value})} /> : key === 'subject' || key === 'recipient' ? <Input aria-label={label} value={form[key]} onChange={(value) => setForm({...form,[key]:value})} /> : <Textarea aria-label={label} value={form[key]} onChange={(value) => setForm({...form,[key]:value})} />}</label>)}</div><div className="project-form-actions"><Button onClick={save}>保存沟通记录</Button></div></details>}{error && <p role="status">{error}</p>}</section>
}

