import { useState } from 'react'
import { Button, Modal } from '@/components'
import { useIcmDemoRole } from '../../AppShell'
import { useAnnualPlanStore } from '../../store/annualPlanStore'
import type { AnnualPlan } from './model'
import { REVIEW_STAGES } from './planning'
import { draftIssues } from './draftRules'

export function ConversationReview({ plan, onClose, onEdit }: { plan: AnnualPlan; onClose: () => void; onEdit: () => void }) {
  const { role } = useIcmDemoRole()
  const submit = useAnnualPlanStore((state) => state.submitConversation)
  const [stages, setStages] = useState(plan.content.reviewStages ?? ['内审机构负责人审核', '有权机构批准'])
  const [authority, setAuthority] = useState(plan.content.approvalAuthority ?? '')
  const [basis, setBasis] = useState(plan.content.governanceBasis ?? '')
  const [confirmed, setConfirmed] = useState(false), [error, setError] = useState('')
  const total = plan.content.items.reduce((sum, item) => sum + item.workdays, 0)
  const sources = plan.conversation?.revisions.at(-1)?.resources ?? []
  const issues = draftIssues(plan, plan.content, sources)
  const send = () => { try { submit(plan.id, role, stages, confirmed, { approvalAuthority: authority, governanceBasis: basis.trim() }); onClose() } catch (error) { setError((error as Error).message) } }
  return <Modal className="annual-overlay" open title="提交年度计划审议" width="min(700px, 100vw)" onClose={onClose} footer={<><Button onClick={onClose}>继续编制</Button><Button type="primary" disabled={!confirmed || Boolean(issues.length) || !authority || !basis.trim()} onClick={send}>确认提交</Button></>}>
    <div className="plan-review-summary"><strong>{plan.content.name}</strong><span>{plan.content.items.length} 个项目 · {total} / {plan.content.capacity ?? 0} 人天</span></div>
    {issues.length > 0 && <div className="plan-review-issues"><strong>{issues.length} 项待完善</strong>{issues.map((issue, index) => <button className="plan-check-issue" key={index} onClick={onEdit}>{issue.message} →</button>)}</div>}
    <details className="plan-draft-sources"><summary>计划内容</summary><p>年度目标：{plan.content.objective}</p><p>后续审计：{plan.content.followUp || '待补充'}</p><p>资源安排：{plan.content.resourceStrategy || '待补充'}</p>{plan.content.deferred?.map((r) => <p key={r.riskId}>暂缓事项：{r.riskId} · {r.reason}</p>)}</details>
    <div className="annual-form"><label>批准主体<select className="icm-select" value={authority} onChange={(e) => setAuthority(e.target.value)}><option value="">按本单位制度选择</option><option>董事会</option><option>最高管理层（主要负责人）</option></select></label><label>本单位审议程序依据<input className="icm-input" placeholder="制度名称、条款或授权文件" value={basis} onChange={(e) => setBasis(e.target.value)} /></label></div>
    <div className="annual-stage-options">{REVIEW_STAGES.map((stage) => <label key={stage} className="annual-checkbox"><input type="checkbox" checked={stages.includes(stage)} disabled={stage === '有权机构批准'} onChange={(e) => setStages(e.target.checked ? [...stages.filter((s) => s !== '有权机构批准'), stage, '有权机构批准'] : stages.filter((entry) => entry !== stage))} />{stage === '有权机构批准' ? `最终批准${authority ? ' · ' + authority : ''}` : stage}</label>)}</div>
    <ol className="plan-review-order">{stages.map((stage, index) => <li key={stage}><span>{index + 1}. {stage === '有权机构批准' ? (authority || '最终批准') : stage}</span>{stage !== '有权机构批准' && <button className="plan-text-action" disabled={index === 0} aria-label={`上移${stage}`} onClick={() => { const next = [...stages]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; setStages(next) }}>上移</button>}</li>)}</ol>
    <details className="plan-draft-sources"><summary>送审依据与附件 · {sources.length} 项</summary>{sources.map((entry) => <div key={entry.id}><strong>{entry.name}</strong><span>{entry.source} · {entry.version} · {entry.locator ?? '来源摘要'}</span></div>)}</details>
    <label className="annual-checkbox plan-review-confirm"><input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />已核对草案、引用资料及资源安排，并确认审议程序适用</label>
    {error && <p role="alert" className="annual-error">{error}</p>}
  </Modal>
}
