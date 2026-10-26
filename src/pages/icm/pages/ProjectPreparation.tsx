import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check, ClipboardCheck, FilePenLine, Users } from 'lucide-react'
import { Button, Input, Textarea } from '@/components'
import { Card, Tag } from '../components/IcmPageKit'
import type { AuditProject, ProjectPreparation as Preparation } from '../data/auditProjects'
import { useIcmDemoRole } from '../AppShell'
import { ProjectResourcePicker } from './ProjectResourcePicker'
import { ProjectReviewActions } from './ProjectReviewActions'
import { recordPreparationNotice, revisePreparation, savePreparation, submitPreparation } from './projectWorkActions'
import type { ProjectAssistProps } from './projectAssistTypes'
import { PreparationComposer } from './PreparationComposer'
import { preparationChapters, preparationChecks, type PreparationChapter } from './preparationDraft'
import './resources.css'
import './preparation-workspace.css'

const steps = [
  { title: '编制方案', detail: '目标、方法、进场安排', icon: FilePenLine },
  { title: '落实分工', detail: '执行责任与质量复核', icon: Users },
  { title: '审核与进场', detail: '提交审核、登记通知', icon: ClipboardCheck },
]
export function ProjectPreparation({ project }: { project: AuditProject } & ProjectAssistProps) {
  const { role } = useIcmDemoRole()
  const [draft, setDraft] = useState<Preparation>(project.preparation ?? { objective: project.scope, procedures: '', members: project.owner, reviewer: '', notice: '' })
  const [step, setStep] = useState(project.preparation?.status === '待审核' || project.preparation?.confirmedAt ? 2 : 0)
  const [chapter, setChapter] = useState<PreparationChapter>('objective')
  const [notice, setNotice] = useState(''), [error, setError] = useState(false), [reason, setReason] = useState('')
  const frozen = Boolean(project.archivedAt || project.auditReport?.status === '已签发')
  const approved = Boolean(project.preparation?.confirmedAt)
  const pending = project.preparation?.status === '待审核'
  const locked = frozen || approved || pending
  const checks = preparationChecks(draft), missing = checks.filter(c => !c.complete)
  const edited = JSON.stringify([draft.objective,draft.procedures,draft.members,draft.reviewer,draft.notice]) !== JSON.stringify([project.preparation?.objective ?? project.scope,project.preparation?.procedures ?? '',project.preparation?.members ?? project.owner,project.preparation?.reviewer ?? '',project.preparation?.notice ?? ''])
  const notificationSaved = Boolean(project.preparation?.notificationNo?.trim() && project.preparation?.deliveredAt?.trim())
  const act = (fn: () => void, message = '操作已保存。') => { try { fn(); setNotice(message); setError(false) } catch (e) { setNotice((e as Error).message); setError(true) } }
  const submit = () => {
    if (missing.length) { setNotice('请先补齐：' + missing.map(c => c.title).join('、') + '。点击检查项可前往填写。'); setError(true); return }
    act(() => { savePreparation(project.id,draft,role.name); submitPreparation(project.id,role.name) }, '已提交方案审核，可在本页或审核待办办理。')
  }
  return <div className="prep-workspace"><Card title="方案与分工" note="形成可执行的项目审计方案，明确责任后提交审核。" action={<Tag tone={approved ? 'green' : 'blue'}>V{project.preparation?.version ?? 1} · {project.preparation?.status ?? '草稿'}</Tag>}>
    <nav className="prep-steps" aria-label="方案办理步骤">{steps.map((s, i) => {
      const completed = i === 0 ? checks.slice(0,3).every(c => c.complete) : i === 1 ? checks.slice(3).every(c => c.complete) : approved && notificationSaved
      return <button key={s.title} aria-current={step === i ? 'step' : undefined} onClick={() => { setStep(i); setNotice('') }}><span className="prep-step-icon">{completed ? <Check size={17}/> : <s.icon size={17}/>}</span><span><b>{i + 1}. {s.title}</b><small>{s.detail}</small></span><em>{completed ? i === 2 ? '已办理' : '已填写' : i === 2 && pending ? '审核中' : '待办理'}</em></button>
    })}</nav>
    <div hidden={step !== 0}>
      <PreparationComposer project={project} draft={draft} locked={locked} onChange={setDraft} chapter={chapter} setChapter={setChapter}/>
      <details className="prep-resources"><summary>审计依据与可复用模板 <span>已引用 {project.resourceRefs?.length ?? 0} 项</span></summary><ProjectResourcePicker project={project} locked={locked} onApply={refs => { const text = refs.filter(r => r.snapshot.type === '审计程序').map(r => r.snapshot.title + '（V' + r.version + '）\n' + r.snapshot.content).join('\n'); setDraft(d => ({ ...d, procedures: [d.procedures,text].filter(Boolean).join('\n') })); setNotice('资源已引用，检查方法已带入方案草稿，请核对并保存。'); setError(false) }}/></details>
    </div>
    {step === 1 && <section className="prep-people">
      <header><h3>把审计内容落实到人</h3><p className="prep-muted">主审：{project.owner}。明确每位成员负责什么、谁复核；具体执行任务可在“实施与取证”中继续安排。</p></header>
      <div className="prep-people-grid"><div><label >项目组与职责分工 <span>必填</span></label><p className="prep-muted">按“姓名 · 负责事项 · 交付成果”逐行填写。</p>{locked ? <div className="prep-readonly">{draft.members}</div> : <Textarea name="prep-members" aria-label="项目组与职责分工" value={draft.members} onChange={value => setDraft({ ...draft, members:value })} rows={7} placeholder="例如：实际人员姓名 · 采购审批核查 · 检查记录及底稿"/>}</div>
      <div><label >复核安排 <span>必填</span></label><p className="prep-muted">明确复核人、复核范围和时间节点，核对独立性要求。</p>{locked ? <div className="prep-readonly">{draft.reviewer}</div> : <Textarea name="prep-reviewer" aria-label="复核安排" value={draft.reviewer} onChange={value => setDraft({ ...draft, reviewer:value })} rows={7} placeholder="填写实际复核人，以及证据、底稿、发现等复核范围和节点"/>}</div></div>
      <p className="prep-footnote">人员安排由项目组确认；AI 不代填姓名，不自动派发任务。</p>
    </section>}
    {step === 2 && <section className="prep-review">
      <div className="prep-review-grid"><div>
        <h3>{approved ? '方案已批准' : pending ? '方案审核中' : '提交前核对'}</h3>
        <p className="prep-muted">{approved ? '批准版本已留存。正文调整需发起方案变更。' : pending ? '本版内容已锁定；退回后可修改并再次提交。' : '逐项核对内容与责任安排，审核通过后办理进场通知。'}</p>
        <div className="prep-checks">{checks.map(c => <button key={c.title} onClick={() => { const target = preparationChapters.find(p => p.title === c.title); if (target) setChapter(target.key); setStep(c.step) }}><span className={c.complete ? 'done' : ''}>{c.complete ? <Check size={15}/> : '·'}</span><b>{c.title}</b><em>{c.complete ? approved ? '已批准' : '已填写，待核对' : '待补充'}</em><ArrowRight size={14}/></button>)}</div>
        {!locked && <div className="prep-review-submit"><span>{missing.length ? '还有 ' + missing.length + ' 项待补充' : '必填项已齐备，请核实内容后提交'}</span><Button type="primary" onClick={submit}>提交方案审核</Button></div>}
        <ProjectReviewActions projectId={project.id} object="preparation" businessId={project.id}/>
      </div><div className="prep-notification">
        <h3>进场通知</h3><p className="prep-muted">{approved ? '登记实际文号和送达情况，记录将随项目归档。' : '方案批准后在此登记实际送达，无需为提交审核提前填写。'}</p>
        {!approved ? <div className="prep-waiting"><ClipboardCheck size={24}/><strong>等待方案批准</strong><span>完成方案核对并提交审核。</span></div> : <><label>审计通知文号<Input aria-label="审计通知文号" value={draft.notificationNo ?? ''} onChange={value => setDraft({ ...draft, notificationNo:value })} disabled={frozen} placeholder="填写正式通知文号"/></label><label>通知送达记录<Textarea aria-label="通知送达记录" value={draft.deliveredAt ?? ''} onChange={value => setDraft({ ...draft, deliveredAt:value })} disabled={frozen} rows={4} placeholder="送达日期、接收方、送达方式及签收情况"/></label>
        {!frozen && <Button onClick={() => act(() => recordPreparationNotice(project.id,draft.notificationNo ?? '',draft.deliveredAt ?? '',role.name), '通知送达记录已保存，可进入实施与取证。')}>保存通知送达记录</Button>}
        {notificationSaved && <p className="prep-notice-done">已登记送达 · <Link to={'/projects/' + project.id + '?tab=execution&section=data'}>进入实施与取证 →</Link></p>}</>}
      </div></div>
      {approved && !frozen && <details className="prep-change"><summary>需要调整已批准方案？发起变更</summary><div className="project-form-actions"><Input aria-label="方案变更原因" value={reason} onChange={setReason} placeholder="说明变更内容与原因"/><Button onClick={() => act(() => revisePreparation(project.id,reason,role.name))}>发起方案变更</Button></div><p className="prep-muted">保留原批准版本，新版本重新审核；通知内容如受影响，请重新核对送达记录。</p></details>}
    </section>}
    {notice && <p role={error ? 'alert' : 'status'} className={error ? 'project-error' : 'project-operation-note'}>{notice}</p>}
    <footer className="prep-footer"><span>{locked ? approved ? '批准内容只读，通知独立留痕' : '审核中的方案只读' : edited ? '有修改未保存' : '草稿内容已同步'}{!locked && ' · ' + checks.filter(c => c.complete).length + '/5 项已填写'}</span><div>{step > 0 && <Button type="default" onClick={() => setStep(step - 1)}>上一步</Button>}{!locked && <Button type="default" onClick={() => act(() => savePreparation(project.id,draft,role.name), '方案草稿已保存。')}>保存方案</Button>}{step < 2 && <Button type="primary" onClick={() => setStep(step + 1)}>{step === 0 ? '下一步：落实分工' : '下一步：审核与进场'}</Button>}</div></footer>
  </Card><details className="project-section prep-history"><summary>版本与办理记录（{project.preparationVersions?.length ?? 0} 个批准版本）</summary>{project.preparation?.history?.length ? [...project.preparation.history].reverse().map((h,i) => <p key={i}>{h.action} · {h.by} · {h.at} {h.opinion}</p>) : <p className="prep-muted">保存、审核、变更及送达办理后，在此查看记录。</p>}</details></div>
}
