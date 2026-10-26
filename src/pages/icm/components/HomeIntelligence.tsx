import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bot, ChevronRight, Play } from 'lucide-react'

import { Button, Tag } from './IcmPageKit'
import { AGENT_DEFINITIONS } from '../agents'
import { useAgentRuntimeStore } from '../agents/store'
import { canSeePageRoute } from '../pageVisibility'
import { useIcmDemoRole } from '../AppShell'
import { useAuditProjectStore } from '../store/auditProjectStore'

type IntelligenceTab = 'agents' | 'predictions' | 'suggestions'

export default function HomeIntelligence() {
  const navigate = useNavigate()
  const { role } = useIcmDemoRole()
  const projects = useAuditProjectStore((state) => state.projects)
  const allRuns = useAgentRuntimeStore((state) => state.runs)
  const runAgent = useAgentRuntimeStore((state) => state.runAgent)
  const completeQueuedRun = useAgentRuntimeStore((state) => state.completeQueuedRun)
  const [tab, setTab] = useState<IntelligenceTab>('agents')
  const [projectId, setProjectId] = useState('all')
  const runs = useMemo(() => allRuns.filter((run) => projectId === 'all' || run.projectId === projectId), [allRuns, projectId])
  const queued = runs.filter((run) => run.status === 'queued').length
  const finished = runs.filter((run) => run.status === 'completed' || run.status === 'failed').length
  const completed = runs.filter((run) => run.status === 'completed').length
  const pending = runs.reduce((sum, run) => sum + run.outputs.filter((output) => output.status === 'pending').length, 0)
  const metrics = [
    { label: '待运行', value: queued.toString(), unit: '个', hint: '当前范围内等待人工发起的运行任务' },
    { label: '处理负载', value: Math.round(queued / AGENT_DEFINITIONS.length * 100).toString(), unit: '%', hint: `排队任务数 ÷ ${AGENT_DEFINITIONS.length} 个已配置智能体；非服务器利用率` },
    { label: '运行成功率', value: finished ? Math.round(completed / finished * 100).toString() : '—', unit: finished ? '%' : '', hint: `${completed} 次完成 / ${finished} 次已结束的演示运行` },
    { label: '待人工确认', value: pending.toString(), unit: '项', hint: '运行产物中尚未人工采纳的结果数' },
  ]
  const insights = tab === 'predictions' ? [
    { title: '采购与合同风险优先级', note: '供应商集中度、短期多合同聚合事项建议优先核验。', route: '/review-workbench' },
    { title: `${projects.filter((project) => project.stage === '实施中').length} 个实施项目需关注延期风险`, note: '结合资料齐备程度与程序完成节奏开展人工评估。', route: '/projects' },
    { title: '整改逾期风险研判', note: '重点核实责任部门进度、延期审批与佐证完整性。', route: '/rectify' },
  ] : [
    { title: '优先核验供应商关联与合同拆分', note: '核对供应商关系、审批链和原始合同，再形成审计判断。', route: '/review-workbench' },
    { title: '补齐关键材料，明确项目关键路径', note: '主审核对未完成程序、资料缺项与剩余工时。', route: '/projects' },
    { title: '先核对整改佐证，再办理复核销号', note: '关注责任单位反馈、必传材料和整改有效性。', route: '/rectify' },
  ]

  return <section className="icm-home-intelligence icm-card" aria-label="智能工作区">
    <div className="icm-card-head">
      <div className="icm-home-tabs" role="tablist" aria-label="智能工作区页签">
        {([{ key: 'agents', label: '智能体' }, { key: 'predictions', label: '智能预测' }, { key: 'suggestions', label: '智能建议' }] as const).map((item) => <button key={item.key} id={`home-ai-tab-${item.key}`} role="tab" aria-selected={tab === item.key} aria-controls="home-ai-panel" className={tab === item.key ? 'active' : ''} type="button" onClick={() => setTab(item.key)}>{item.label}</button>)}
      </div>
    </div>
    <div className="icm-home-agent-metrics" aria-label="智能体运行指标">
      {metrics.map((metric) => <div key={metric.label} title={metric.hint}><span>{metric.label}</span><strong>{metric.value}<small>{metric.unit}</small></strong></div>)}
    </div>
    <div className="icm-home-agent-scope"><span>{tab === 'agents' ? '智能体运行记录' : tab === 'predictions' ? '研判结果 · 须人工核验' : '审计办理建议'}</span><select aria-label="智能体指标与记录的项目范围" value={projectId} onChange={(event) => setProjectId(event.target.value)}><option value="all">全部项目</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></div>
    <div className="icm-home-agent-scroll" id="home-ai-panel" role="tabpanel" aria-labelledby={`home-ai-tab-${tab}`} tabIndex={0}>
      {tab === 'agents' ? runs.map((run) => {
        const agent = AGENT_DEFINITIONS.find((item) => item.id === run.agentId)
        const pendingOutputs = run.outputs.filter((output) => output.status === 'pending').length
        return <div className="icm-home-agent-row" key={run.id}>
          <button className="icm-home-agent-open" type="button" disabled={!canSeePageRoute(role.id, run.reviewContext ? `/review-workbench?project=${run.projectId}` : projects.some((project) => project.id === run.projectId) ? `/projects/${run.projectId}` : run.outputs[0]?.target.route ?? `/plan-workbench?annual=${run.projectId}`)} onClick={() => navigate(run.reviewContext ? `/review-workbench?project=${run.projectId}&task=${run.reviewContext.taskId}&run=${run.id}` : projects.some((project) => project.id === run.projectId) ? `/projects/${run.projectId}` : run.outputs[0]?.target.route ?? `/plan-workbench?annual=${run.projectId}`)} title={`查看 ${run.projectName}`}><span className="icm-home-agent-icon"><Bot size={17} /></span><span className="icm-home-agent-copy"><strong>{agent?.name ?? '审计智能体'}</strong><span>{run.projectName}</span></span></button>
          <div className="icm-home-agent-state"><Tag tone={run.status === 'failed' ? 'red' : run.status === 'queued' ? 'amber' : 'green'}>{run.status === 'queued' ? '待运行' : run.status === 'failed' ? '失败' : '已完成'}</Tag><span>{pendingOutputs ? `${pendingOutputs} 项待确认` : `${run.outputs.length} 项产物`}</span></div>
            <Button size="sm" type="default-soft" icon={<Play size={12} />} aria-label={`${run.reviewContext ? '查看结果' : run.status === 'queued' ? '运行' : '重跑'}${agent?.name ?? '审计智能体'}`} onClick={() => {
            if (run.reviewContext) { navigate(`/review-workbench?project=${run.projectId}&task=${run.reviewContext.taskId}&run=${run.id}`); return }
            if (run.status === 'queued') completeQueuedRun(run.id, role.title)
            else runAgent({ agentId: run.agentId, projectId: run.projectId, projectName: run.projectName, triggeredBy: role.title })
          }}>{run.reviewContext ? '查看结果' : run.status === 'queued' ? '运行' : '重跑'}</Button>
        </div>
      }) : insights.map((item) => <button className="icm-home-insight-row" key={item.title} type="button" onClick={() => navigate(item.route)}><span><strong>{item.title}</strong><span>{item.note}</span></span><ChevronRight size={15} /></button>)}
      {tab === 'agents' && !runs.length ? <div className="icm-home-agent-empty">当前项目暂无运行记录</div> : null}
    </div>
  </section>
}
