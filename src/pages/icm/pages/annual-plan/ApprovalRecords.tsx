import { useState } from 'react'

import { Button } from '@/components'

import { Card, DataTable, Tag } from '../../components/IcmPageKit'
import { useIcmDemoRole } from '../../AppShell'
import { useAnnualPlanStore } from '../../store/annualPlanStore'
import { describeChanges } from './model'
import type { AnnualPlan } from './model'

export function ApprovalRecords({ plan }: { plan: AnnualPlan }) {
  const { role } = useIcmDemoRole()
  const decide = useAnnualPlanStore((state) => state.decide)
  const [opinion, setOpinion] = useState('')
  const [notice, setNotice] = useState('')
  const [reference, setReference] = useState('')
  const latest = plan.submissions.at(-1)
  const pending = plan.status === '审批中' ? latest?.steps.find((step) => step.status === '待处理') : undefined
  const handleDecision = (decision: '通过' | '退回') => {
    try { decide(plan.id, role, decision, opinion, reference); setOpinion(''); setReference(''); setNotice(decision === '通过' ? '已登记当前环节结果。' : '已退回编制修改。') }
    catch (error) { setNotice((error as Error).message) }
  }
  return <Card title="年度计划审议记录" note="送审内容及编制依据按版本保存，逐环节登记审核、会议或决议结果。">
    {notice && <p className="annual-notice" role="status">{notice}</p>}
    {pending && <div className="annual-approval-action"><p>当前环节：<strong>{pending.name === '有权机构批准' ? (latest?.content.approvalAuthority ?? pending.name) : pending.name}</strong>{!plan.recordingMode && ` · 处理人：${pending.actor.name}`}</p>
      {plan.recordingMode || pending.actor.id === role.id ? <>{plan.recordingMode && <><p className="annual-muted">登记已有审核或集体决议结果，会议研究与最终批准分别留痕。</p><label>会议 / 决议 / 审核记录编号<input className="icm-input" aria-label="会议 / 决议 / 审核记录编号" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="填写可追溯的记录编号" /></label></>}<label>审议意见<textarea className="icm-input" aria-label="审议意见" rows={3} value={opinion} onChange={(e) => setOpinion(e.target.value)} placeholder="填写审核结论、会议意见或退回原因" /></label><div className="annual-actions"><Button disabled={!opinion.trim() || Boolean(plan.recordingMode && !reference.trim())} onClick={() => handleDecision('退回')}>登记退回</Button><Button type="primary" disabled={!opinion.trim() || Boolean(plan.recordingMode && !reference.trim())} onClick={() => handleDecision('通过')}>登记通过</Button></div></> : <p className="annual-muted">由 {pending.actor.name} 办理当前节点。</p>}
    </div>}
    {!latest && <div className="icm-empty-inline">计划尚未提交审批。编制人完善基本信息和项目清单后，可提交部门复核。</div>}
    {[...plan.submissions].reverse().map((submission) => <div className="annual-version" key={submission.version}>
      <div className="annual-version-heading"><strong>送审版本 V{submission.version}</strong><span>{submission.submittedBy.name} · {submission.submittedAt}</span>{plan.approved?.version === submission.version && <Tag tone="green">批准版本</Tag>}</div>
      <DataTable columns={['环节', '登记人', '状态', '意见 / 记录编号', '登记时间']} rows={submission.steps.map((step) => [step.name, step.actor.name, <Tag tone={step.status === '通过' ? 'green' : step.status === '退回' ? 'red' : 'amber'}>{step.status}</Tag>, <>{step.opinion || '—'}<small className="annual-muted annual-block">{step.reference}</small></>, step.at || '—'])} />
      {submission.content.evidence && <details><summary>本次编制依据与风险评估快照</summary><ul>{submission.content.evidence.map((entry) => <li key={entry.id}>{entry.name} · {entry.version} · {entry.status} · {entry.source}</li>)}</ul><p>风险评估 {(submission.content.risks ?? []).length} 项 · 资源预算 {submission.content.capacity ?? '—'} 人天</p></details>}
      <details><summary>查看本次送审内容 · {submission.content.items.length} 个项目</summary><p>{submission.content.name} · {submission.content.department}</p><p>编制依据：{submission.content.basis}</p><p>总体目标：{submission.content.objective}</p><DataTable columns={['项目名称', '类型', '审计对象', '审计期间', '实施时间', '负责人', '人天', '目标与范围']} rows={submission.content.items.map((item) => [item.name, item.type, item.subject, item.period, `${item.start} 至 ${item.end}`, item.owner, item.workdays, item.scope])} /></details>
    </div>)}
  </Card>
}

export function AdjustmentRecords({ plan }: { plan: AnnualPlan }) {
  const adjusted = plan.submissions.filter((submission) => submission.reason)
  return <Card title="计划调整记录" note="批准版本保留不变，调整内容重新履行复核与批准程序。">
    {plan.adjustmentReason && plan.status !== '已批准' && <div className="annual-notice"><strong>本轮调整原因：</strong>{plan.adjustmentReason}<ul>{describeChanges(plan.approved?.content, plan.content).map((change) => <li key={change}>{change}</li>)}</ul></div>}
    {!adjusted.length && <div className="icm-empty-inline">暂无已提交的计划调整记录。</div>}
    {[...adjusted].reverse().map((submission) => {
      const previous = [...plan.submissions].reverse().find((entry) => entry.version < submission.version && entry.steps.every((step) => step.status === '通过'))
      return <div className="annual-version" key={submission.version}><strong>调整送审 V{submission.version}</strong><p>{submission.submittedAt} · 原因：{submission.reason}</p><ul>{describeChanges(previous?.content, submission.content).map((change) => <li key={change}>{change}</li>)}</ul><Tag tone={submission.steps.every((step) => step.status === '通过') ? 'green' : 'amber'}>{submission.steps.some((step) => step.status === '退回') ? '已退回' : submission.steps.every((step) => step.status === '通过') ? '已批准' : '审批中'}</Tag></div>
    })}
  </Card>
}
