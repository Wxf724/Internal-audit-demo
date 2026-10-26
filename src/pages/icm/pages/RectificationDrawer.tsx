import { useRef, useState } from 'react'
import { Bot, Plus, Upload } from 'lucide-react'
import { Button, Input, Modal, Textarea } from '@/components'
import { Tag } from '../components/IcmPageKit'
import { useIcmDemoRole } from '../AppShell'
import { useWorkflowStore, type WorkflowRectification, type WorkflowIssue } from '../store/workflowStore'
import { issueProjectId } from './projectScope'
import { saveProjectFile, downloadProjectFile } from './projectFileStorage'
import { recordRectification, rectStage } from './rectificationActions'

export function RectificationDrawer({ item, issue, onClose }: { item: WorkflowRectification; issue?: WorkflowIssue; onClose: () => void }) {
  const { role } = useIcmDemoRole()
  const store = useWorkflowStore()
  const pending = store.audits.find((a) => a.businessId === item.id && a.status === '待处理')
  const audits = store.audits.filter((a) => a.businessId === item.id)
  const fileInput = useRef<HTMLInputElement>(null)
  const [measures, setMeasures] = useState(item.measures ?? [{ id: crypto.randomUUID(), content: item.planContent ?? '', owner: item.owner, deadline: item.deadline, acceptance: '' }])
  const [opinion, setOpinion] = useState('')
  const [notice, setNotice] = useState('')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(String(item.progress))
  const [followUpDate, setFollowUpDate] = useState(item.followUpAt ?? '')
  const [tab, setTab] = useState('办理')
  const stage = rectStage(item)
  const locked = stage === '已关闭' || Boolean(pending) || item.status === '已整改'
  const editablePlan = ['待提交', '审批不通过'].includes(item.planStatus)
  const act = (text: string, fn: () => void) => {
    try { fn(); recordRectification(item.id, role.name, text); setNotice(text) } catch (e) { setNotice((e as Error).message) }
  }
  const saveMeasures = () => recordRectification(item.id, role.name, '保存整改措施', { measures, planContent: measures.map((m) => `${m.content}；责任人：${m.owner}；期限：${m.deadline}；验收标准：${m.acceptance}`).join('\n') })
  const check = (kind: '措施检查' | '证据核对') => {
    const results = kind === '措施检查' ? measures.flatMap((m, i) => {
      const missing = [!m.content.trim() && '整改措施', !m.owner.trim() && '责任人', !m.deadline && '完成期限', !m.acceptance.trim() && '验收标准'].filter(Boolean)
      return missing.length ? [`措施 ${i + 1}：请补充${missing.join('、')}。`] : []
    }) : item.evidenceChecklist.filter((c) => c.required && (!c.evidenceId || !item.proofFiles?.some((f) => f.id === c.evidenceId))).map((c) => `缺少有效关联材料：${c.name}。`)
    if (kind === '证据核对' && !item.proofFiles?.length) results.push('尚无已上传的原始佐证文件。')
    if (!results.length) results.push(kind === '措施检查' ? '措施要素填写完整，请结合问题原因确认措施有效性。' : '必需材料已关联；请人工核实内容真实性与整改效果。')
    recordRectification(item.id, '整改助手', kind, { agentChecks: [...(item.agentChecks ?? []), { at: new Date().toISOString(), kind, results }] })
  }
  const upload = async (file?: File) => {
    if (!file) return
    setUploading(true)
    try {
      const meta = await saveProjectFile(file, (issue && issueProjectId(issue)) ?? `rectification:${item.id}`, role.name)
      store.addRectificationProof(item.id, meta); recordRectification(item.id, role.name, `上传佐证：${file.name}`); setNotice('佐证已保存，请关联验收材料。')
    } catch (e) { setNotice((e as Error).message) } finally { setUploading(false) }
  }
  const review = (pass: boolean) => {
    if (!opinion.trim()) { setNotice('请填写办理意见。'); return }
    act(pass ? (pending?.type === '整改方案审批' ? '整改措施审核通过' : '复核通过并关闭') : '已退回补充整改', () => {
      if (pending) { if (pass) store.approveAudit(pending.id, opinion, role.name); else store.returnAudit(pending.id, opinion, role.name) }
      if (pass && item.planStatus === '审批通过' && (pending?.type === '整改复核' || item.status === '已整改')) store.closeOutRectification(item.id, opinion)
    })
  }
  const latest = item.agentChecks?.filter((c) => c.kind === (editablePlan ? '措施检查' : '证据核对')).at(-1)
  return <Modal open drawer width="min(780px, 100vw)" title={item.title} onClose={onClose} footer={null} className="rect-sheet">
    <div className="icm-actions"><Tag tone={stage === '已关闭' ? 'green' : 'blue'}>{stage}</Tag><span>{item.owner} · 截止 {item.deadline}</span></div>
    <div className="icm-tabs">{['办理', '办理记录'].map((t) => <button type="button" className={tab === t ? 'active' : ''} key={t} onClick={() => setTab(t)}>{t}</button>)}</div>
    {tab === '办理' ? <>
      <section className="rect-section"><h3>问题与要求</h3><p>{issue?.fact || issue?.title || item.title}</p><p><b>依据：</b>{issue?.basis || '未登记'}</p><p><b>整改要求：</b>{issue?.suggestion || '按确认问题落实整改并提交有效佐证。'}</p></section>
      <section className="rect-section"><div className="icm-actions"><h3>措施与证据</h3><span className="icm-toolbar-spacer" /><Button size="sm" icon={<Bot size={14} />} onClick={() => check(editablePlan ? '措施检查' : '证据核对')}>{editablePlan ? '检查措施' : '核对证据'}</Button></div>
        {editablePlan ? <>{measures.map((m, i) => <div className="rect-measure" key={m.id}>
          <label className="rect-field">措施 {i + 1}<Textarea aria-label={`措施${i + 1}`} value={m.content} onChange={(v) => setMeasures(measures.map((x) => x.id === m.id ? { ...x, content: v } : x))} /></label>
          <div className="rect-fields"><label>责任人<Input value={m.owner} onChange={(v) => setMeasures(measures.map((x) => x.id === m.id ? { ...x, owner: v } : x))} /></label><label>完成期限<input className="icm-input" type="date" value={m.deadline} onChange={(e) => setMeasures(measures.map((x) => x.id === m.id ? { ...x, deadline: e.target.value } : x))} /></label></div>
          <label className="rect-field">验收标准<Input value={m.acceptance} onChange={(v) => setMeasures(measures.map((x) => x.id === m.id ? { ...x, acceptance: v } : x))} /></label>
        </div>)}<Button icon={<Plus size={14} />} onClick={() => setMeasures([...measures, { id: crypto.randomUUID(), content: '', owner: item.owner, deadline: item.deadline, acceptance: '' }])}>增加措施</Button></> : <p>{item.planContent || issue?.suggestion || '历史整改方案未留存正文。'}</p>}
        {latest && <div className="rect-agent" role="status"><b><Bot size={14} /> 整改助手 · {latest.kind}</b><ul>{latest.results.map((r) => <li key={r}>{r}</li>)}</ul><small>{new Date(latest.at).toLocaleString()}</small></div>}
        <input hidden type="file" aria-label="上传整改佐证" ref={fileInput} onChange={(e) => { void upload(e.target.files?.[0]); e.target.value = '' }} />
        {(item.proofFiles ?? []).map((f) => <div className="icm-list-row" key={f.id}><span>{f.name}</span><button className="icm-link" onClick={() => downloadProjectFile(f).catch((e) => setNotice(e.message))}>下载</button></div>)}
        {!editablePlan && item.evidenceChecklist.map((c) => <label className="rect-field rect-measure" key={c.id}>{c.name}{c.required ? '（必需）' : '（可选）'}<select aria-label={`关联材料：${c.name}`} className="icm-select" disabled={locked} value={c.evidenceId ?? ''} onChange={(e) => store.toggleEvidenceChecklist(item.id, c.id, e.target.value)}><option value="">选择已上传文件</option>{item.proofFiles?.map((f) => <option value={f.id} key={f.id}>{f.name}</option>)}</select></label>)}
        {!locked && !editablePlan && <><div className="rect-fields rect-section"><label>完成进度（%）<input className="icm-input" type="number" min="0" max="100" value={progress} onChange={(e) => setProgress(e.target.value)} /></label><Button onClick={() => act('整改进度已更新', () => { const value = Number(progress); if (!progress || !Number.isFinite(value) || value < 0 || value > 100) throw new Error('进度应为 0 至 100。'); recordRectification(item.id, role.name, `更新进度：${value}%`, { progress: value }) })}>更新进度</Button></div><Button loading={uploading} icon={<Upload size={14} />} onClick={() => fileInput.current?.click()}>上传佐证</Button></>}
      </section>
      {stage !== '已关闭' && <details className="rect-section"><summary>跟进提醒</summary><label className="rect-field">提醒日期<input type="date" className="icm-input" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} /></label><Button onClick={() => act('跟进提醒已保存', () => { if (!followUpDate) throw new Error('请选择提醒日期。'); store.scheduleFollowUp(item.id, followUpDate) })}>保存提醒</Button></details>}
      <section className="rect-section rect-current"><h3>当前办理</h3><p>{pending ? `等待${pending.type} · ${pending.node}` : item.verifyConclusion}</p>
        {(pending || item.status === '已整改') && <label className="rect-field">办理意见<Textarea value={opinion} onChange={setOpinion} /></label>}
        <div className="icm-actions">
          {editablePlan && <><Button onClick={() => act('措施草稿已保存', saveMeasures)}>保存草稿</Button><Button type="primary" onClick={() => act('整改措施已提交审核', () => {
            if (measures.some((m) => !m.content.trim() || !m.owner.trim() || !m.deadline || !m.acceptance.trim())) throw new Error('请补齐每条措施、责任人、期限和验收标准。')
            saveMeasures(); store.submitRectificationPlan(item.id, useWorkflowStore.getState().rectifications.find((r) => r.id === item.id)!.planContent!)
          })}>提交措施</Button></>}
          {!locked && !editablePlan && <Button type="primary" onClick={() => act('已提交整改验收', () => store.submitRectificationReview(item.id))}>提交验收</Button>}
          {(pending || item.status === '已整改') && <><Button onClick={() => review(false)} disabled={!pending}>退回补充</Button><Button type="primary" onClick={() => review(true)}>{pending?.type === '整改方案审批' ? '通过措施' : '复核通过并关闭'}</Button></>}
          {stage === '已关闭' && <span>整改已关闭 · {item.closeOutAt?.slice(0, 10)}</span>}
        </div>
      </section>
    </> : <section className="rect-section"><h3>办理记录</h3><div className="rect-log"><small>{item.id} · {item.updatedAt.slice(0, 10)}</small>当前：{stage}；{item.verifyConclusion}</div>{audits.map((a) => <div key={a.id} className="rect-log"><small>{a.submittedAt} · {a.applicant}</small>{a.type} · {a.status}{a.opinion ? ` · ${a.opinion}` : ''}</div>)}{item.handlingLog?.map((l, i) => <div className="rect-log" key={i}><small>{new Date(l.at).toLocaleString()} · {l.by}</small>{l.text}</div>)}</section>}
    {notice && <p role="status" className="rect-agent">{notice}</p>}
  </Modal>
}
