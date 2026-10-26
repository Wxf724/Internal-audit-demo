import { useNavigate } from 'react-router-dom'

import { Button } from '@/components'

import { useIcmDemoRole } from '../../AppShell'
import { Card, Tag } from '../../components/IcmPageKit'
import { useAnnualPlanStore } from '../../store/annualPlanStore'
import './annual-plan.css'

export default function AnnualPlanApprovals() {
  const navigate = useNavigate()
  const { role } = useIcmDemoRole()
  const plans = useAnnualPlanStore((state) => state.plans)
  const pending = plans.filter((plan) => plan.status === '审批中')
  const mine = pending.filter((plan) => plan.recordingMode || plan.submissions.at(-1)?.steps.some((step) => step.status === '待处理' && step.actor.id === role.id))
  return <div className="annual-queue"><Card title="年度计划审议" note="与年度审计计划共享版本和记录，逐环节登记审议结果。" action={<Tag tone={mine.length ? 'amber' : 'gray'}>待登记 {mine.length} 项</Tag>}>
    {pending.length ? pending.map((plan) => {
      const step = plan.submissions.at(-1)?.steps.find((item) => item.status === '待处理')
      return <div className="annual-queue-row" key={plan.id}><div><strong>{plan.content.name}</strong><div className="annual-muted">{plan.id} · V{plan.submissions.at(-1)?.version} · {step?.name}</div></div><Button type="primary" onClick={() => navigate(`/plan-workbench?annual=${plan.id}&tab=approval`)}>查看 / 登记审议</Button></div>
    }) : <div className="annual-muted">暂无待审批年度计划。</div>}
  </Card></div>
}
