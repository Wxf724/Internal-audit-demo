import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, FileCheck2 } from 'lucide-react'
import { Button, Input, Modal, Textarea } from '@/components'
import { Card, DataTable, Tag } from '../../components/IcmPageKit'
import { useAnnualPlanStore } from '../../store/annualPlanStore'
import { useAuditProjectStore } from '../../store/auditProjectStore'
import { useWorkflowStore } from '../../store/workflowStore'
import { useAgentRuntimeStore } from '../../agents/store'
import { AGENT_DEFINITIONS } from '../../agents/definitions'
import { buildPlanningRun } from './planning'
import { newId, now } from './model'
import type { AnnualPlan, PlanContent, PlanningEvidence, PlanningRisk } from './model'

interface WorkspaceProps { plan: AnnualPlan; editable: boolean; onSave: (content: PlanContent) => void }

export function EvidenceWorkspace({ plan, editable, onSave }: WorkspaceProps) {
  const navigate = useNavigate()
  const [entry, setEntry] = useState<PlanningEvidence | null>(null)
  const [error, setError] = useState('')
  const rows = plan.content.evidence ?? []
  const save = () => {
    if (!entry || !entry.name.trim() || !entry.source.trim() || !entry.version.trim() || !entry.note.trim()) { setError('请补全资料名称、来源、版本和内容说明。'); return }
    onSave({ ...plan.content, evidence: rows.some((value) => value.id === entry.id) ? rows.map((value) => value.id === entry.id ? entry : value) : [...rows, entry] }); setEntry(null)
  }
  return <>
    <Card title="编制依据与准备" note="资料确认后作为本次风险研判和送审依据，保留来源与版本。" action={editable ? <Button onClick={() => { setError(''); setEntry({ id: newId(), name: '', source: '', version: '', status: '待补充', note: '' }) }}>补充资料</Button> : undefined}>
      <div className="annual-prep-summary"><FileCheck2 size={20} /><strong>{rows.filter((row) => row.status === '已确认').length} / {rows.length} 项资料已确认</strong><span>缺失或未确认的资料会阻止送审</span></div>
      {rows.map((row) => <div className="annual-evidence-row" key={row.id}><div><strong>{row.name}</strong><p>{row.source} · {row.version}</p><small>{row.note}</small>{row.confirmedAt && <small className="annual-block">确认于 {row.confirmedAt}</small>}</div><Tag tone={row.status === '已确认' ? 'green' : 'amber'}>{row.status}</Tag>{editable && <Button onClick={() => { setError(''); setEntry({ ...row }) }}>{row.status === '已确认' ? '查看 / 更新' : '补充并确认'}</Button>}</div>)}
      <div className="annual-actions annual-bottom-actions"><Button onClick={() => navigate('/projects')}>查看历史审计项目</Button><Button onClick={() => navigate('/rectify')}>查看整改台账</Button></div>
    </Card>
    {entry && <Modal className="annual-overlay" open title="维护编制依据" onClose={() => setEntry(null)} footer={<><Button onClick={() => setEntry(null)}>取消</Button><Button type="primary" onClick={save}>保存资料</Button></>}><div className="annual-form">{(['name', 'source', 'version'] as const).map((key) => <label key={key}>{{ name: '资料名称', source: '来源 / 文档编号', version: '资料版本' }[key]}<Input value={entry[key]} onChange={(value) => setEntry({ ...entry, [key]: value })} /></label>)}<label>内容与核对说明<Textarea value={entry.note} onChange={(note) => setEntry({ ...entry, note })} /></label><label className="annual-checkbox"><input type="checkbox" checked={entry.status === '已确认'} onChange={(e) => setEntry({ ...entry, status: e.target.checked ? '已确认' : '待确认', confirmedAt: e.target.checked ? now() : undefined })} />内审机构已核对资料来源、版本与适用范围</label>{error && <p role="alert" className="annual-error">{error}</p>}</div></Modal>}
  </>
}

export function RiskWorkspace({ plan, editable, onSave }: WorkspaceProps) {
  const [risk, setRisk] = useState<PlanningRisk | null>(null)
  const [error, setError] = useState('')
  const rows = [...(plan.content.risks ?? [])].sort((a, b) => Number(b.required) - Number(a.required) || b.likelihood * b.impact - a.likelihood * a.impact)
  const save = () => {
    if (!risk || ![risk.subject, risk.domain, risk.title, risk.recommendation].every((value) => value.trim()) || !risk.evidenceIds.length || !Number.isFinite(risk.workdays) || risk.workdays <= 0) { setError('请填写对象、领域、风险、建议项目、有效人天，并至少关联一项依据。'); return }
    onSave({ ...plan.content, risks: rows.some((row) => row.id === risk.id) ? rows.map((row) => row.id === risk.id ? risk : row) : [...rows, risk] }); setRisk(null)
  }
  return <>
    <Card title="风险评估与项目选项" note="可能性 × 影响程度，范围 1—5 分；必审事项单列，最终选项由内审机构确认。" action={editable ? <Button onClick={() => { setError(''); setRisk({ id: `RISK-${newId()}`, subject: '', domain: '', title: '', recommendation: '', likelihood: 3, impact: 3, required: false, evidenceIds: [], lastAudit: '', workdays: 30 }) }}>登记风险 / 需求</Button> : undefined}>
      {rows.length ? <DataTable columns={['风险 / 需求', '对象 / 领域', '评估分值', '上次审计', '建议项目', '纳入情况', '操作']} rows={rows.map((row) => [<><strong>{row.title}</strong><small className="annual-block annual-muted">{row.required ? '必审事项' : '风险导向'} · {row.evidenceIds.length} 项依据</small></>, `${row.subject} / ${row.domain}`, <Tag tone={row.likelihood * row.impact >= 20 ? 'red' : 'amber'}>{row.likelihood} × {row.impact} = {row.likelihood * row.impact}</Tag>, row.lastAudit || '待核对', row.recommendation, plan.content.items.some((item) => item.riskId === row.id) ? '已纳入草案' : '待选项', <Button onClick={() => { setError(''); setRisk({ ...row }) }}>{editable ? '评估 / 编辑' : '查看依据'}</Button>])} /> : <div className="icm-empty-inline">尚未登记本轮风险评估，可依据历史审计、整改和经营重点补充风险及审计需求。</div>}
    </Card>
    {risk && <Modal className="annual-overlay" open title="风险评估与依据" onClose={() => setRisk(null)} footer={<><Button onClick={() => setRisk(null)}>关闭</Button>{editable && <Button type="primary" onClick={save}>保存评估</Button>}</>}><fieldset disabled={!editable} className="annual-form"><label>风险 / 需求名称<Input value={risk.title} onChange={(title) => setRisk({ ...risk, title })} /></label><div className="annual-form-grid"><label>被审计单位<Input value={risk.subject} onChange={(subject) => setRisk({ ...risk, subject })} /></label><label>业务领域<Input value={risk.domain} onChange={(domain) => setRisk({ ...risk, domain })} /></label></div><div className="annual-form-grid">{(['likelihood', 'impact'] as const).map((key) => <label key={key}>{key === 'likelihood' ? '发生可能性' : '影响程度'}<select className="icm-select" value={risk[key]} onChange={(e) => setRisk({ ...risk, [key]: Number(e.target.value) })}>{[1, 2, 3, 4, 5].map((value) => <option key={value}>{value}</option>)}</select></label>)}</div><label>建议审计项目<Input value={risk.recommendation} onChange={(recommendation) => setRisk({ ...risk, recommendation })} /></label><div className="annual-form-grid"><label>预计投入（人天）<input type="number" className="icm-input" min="1" value={risk.workdays} onChange={(e) => setRisk({ ...risk, workdays: Number(e.target.value) })} /></label><label>上次审计期间<Input value={risk.lastAudit} onChange={(lastAudit) => setRisk({ ...risk, lastAudit })} /></label></div><label className="annual-checkbox"><input type="checkbox" checked={risk.required} onChange={(e) => setRisk({ ...risk, required: e.target.checked })} />必审 / 交办事项</label><strong>关联编制依据</strong>{(plan.content.evidence ?? []).map((entry) => <label className="annual-checkbox" key={entry.id}><input type="checkbox" checked={risk.evidenceIds.includes(entry.id)} onChange={(e) => setRisk({ ...risk, evidenceIds: e.target.checked ? [...risk.evidenceIds, entry.id] : risk.evidenceIds.filter((id) => id !== entry.id) })} />{entry.name} · {entry.version}</label>)}{error && <p role="alert" className="annual-error">{error}</p>}</fieldset></Modal>}
  </>
}

export function PlanningAssistant({ plan, editable }: { plan: AnnualPlan; editable: boolean }) {
  const projects = useAuditProjectStore((state) => state.projects)
  const rectifications = useWorkflowStore((state) => state.rectifications)
  const addRun = useAnnualPlanStore((state) => state.addRun)
  const decide = useAnnualPlanStore((state) => state.decideSuggestion)
  const record = useAgentRuntimeStore((state) => state.recordPlanningRun)
  const acceptArtifact = useAgentRuntimeStore((state) => state.acceptArtifact)
  const [open, setOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const [reason, setReason] = useState<Record<string, string>>({})
  const [runId, setRunId] = useState('')
  const run = (plan.aiRuns ?? []).find((entry) => entry.id === runId) ?? plan.aiRuns?.at(-1)
  const generate = () => {
    try { const analysis = buildPlanningRun(plan, projects, rectifications.filter((item) => item.status !== '已销号').length); addRun(plan.id, analysis); record(plan.id, plan.content.name, analysis); setRunId(analysis.id); setOpen(true); setNotice('') }
    catch (error) { setNotice((error as Error).message); setOpen(true) }
  }
  const handleDecision = (id: string, accepted: boolean) => {
    if (!run) return
    try { decide(plan.id, run.id, id, accepted, reason[id] ?? ''); if (accepted) acceptArtifact(`${run.id}-AG01`, id, '审计负责人'); setNotice(accepted ? '已纳入草案，可在“项目与资源”中修改排期和范围。' : '已记录暂不纳入理由。') }
    catch (error) { setNotice((error as Error).message) }
  }
  return <>
    <div className="annual-ai-strip"><Sparkles size={18} /><div><strong>AI 辅助编制</strong><span>风险排序、历史覆盖、整改需求与资源检查</span></div><Button disabled={!editable} type="primary" onClick={generate}>分析并生成建议</Button>{plan.aiRuns?.length ? <Button onClick={() => setOpen(true)}>查看建议记录</Button> : null}</div>
    <Modal className="annual-overlay" open={open} drawer width="min(680px, 100vw)" title="年度计划 · AI 编制建议" onClose={() => setOpen(false)} footer={<Button onClick={() => setOpen(false)}>返回计划编制</Button>}>
      <p className="annual-notice">演示分析：依据当前风险评分、资料清单和项目 / 整改记录生成建议，未连接外部大模型。建议须由内审机构核实后采纳。</p>
      {notice && <p role="status" className="annual-notice">{notice}</p>}
      {run && <><div className="annual-form"><label>分析记录<select className="icm-select" value={run.id} onChange={(e) => setRunId(e.target.value)}>{[...(plan.aiRuns ?? [])].reverse().map((entry, index) => <option key={entry.id} value={entry.id}>{entry.at} · 第 {(plan.aiRuns?.length ?? 0) - index} 次研判</option>)}</select></label></div><div className="annual-agent-line">{run.agents.map((id) => <span key={id}>{AGENT_DEFINITIONS.find((agent) => agent.id === id)?.name ?? id}</span>)}</div><details><summary>本次输入资料与版本</summary><ul className="annual-reading-list">{run.sources.map((source) => <li key={source}>{source}</li>)}</ul></details><ul className="annual-reading-list">{run.findings.map((finding) => <li key={finding}>{finding}</li>)}</ul>
      {run.suggestions.map((suggestion) => <section className="annual-suggestion" key={suggestion.id}><div className="annual-version-heading"><strong>{suggestion.item.name}</strong><Tag tone={suggestion.status === '已采纳' ? 'green' : 'blue'}>{suggestion.status}</Tag></div><p>{suggestion.reason}</p><p className="annual-muted">依据：{suggestion.sources.join('；')}</p><p className="annual-muted">建议窗口 {suggestion.item.start} 至 {suggestion.item.end} · {suggestion.item.workdays} 人天</p>{editable && suggestion.status === '待确认' ? <><label className="annual-reason">处理理由<Input value={reason[suggestion.id] ?? ''} onChange={(value) => setReason({ ...reason, [suggestion.id]: value })} placeholder="暂不纳入时必填；采纳时可补充说明" /></label><div className="annual-actions"><Button onClick={() => handleDecision(suggestion.id, false)}>暂不纳入</Button><Button type="primary" disabled={plan.content.items.some((item) => item.riskId === suggestion.riskId)} onClick={() => handleDecision(suggestion.id, true)}>{plan.content.items.some((item) => item.riskId === suggestion.riskId) ? '草案已有该项目' : '采纳到草案'}</Button></div></> : <p className="annual-muted">{suggestion.decisionReason ?? '当前计划不可修改'}</p>}</section>)}
      {!run.suggestions.length && <p className="icm-empty-inline">尚无风险候选项，请先在“风险与选项”登记评估。</p>}</>}
    </Modal>
  </>
}
