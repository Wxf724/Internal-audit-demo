import { useMemo, useState } from 'react'
import { ArrowUpRight, Bot, Check, ChevronRight, CircleAlert, Clock3, Play, RotateCcw } from 'lucide-react'

import { Button, Card, Tag } from '../components/IcmPageKit'
import { AGENT_DEFINITIONS } from './definitions'
import { canAcceptAgentArtifact, selectAgentRuns, useAgentRuntimeStore } from './store'
import type { AgentArtifact, AgentId, AgentRole, AgentRun, AgentRunRequest, AgentTarget } from './types'
import './agent-runtime.css'

export interface AgentRunPanelProps {
  projectId?: string
  projectName?: string
  agentId?: AgentId
  role?: AgentRole
  onOpenTarget?: (target: AgentTarget, artifact: AgentArtifact, run: AgentRun) => void
  onAcceptArtifact?: (artifact: AgentArtifact, run: AgentRun, role: AgentRole) => void
  compact?: boolean
}

const ROLE_DEFAULT: AgentRole = '项目负责人（主审）'

function statusText(run: AgentRun) {
  if (run.status === 'queued') return '待运行'
  if (run.status === 'failed') return '运行失败'
  return '已完成'
}

function artifactCount(run: AgentRun) {
  const pending = run.outputs.filter((item) => item.status === 'pending').length
  return pending ? `${pending} 项待确认` : `${run.outputs.length} 项已转草稿`
}

export function AgentRunPanel({ projectId, projectName, agentId, role = ROLE_DEFAULT, onOpenTarget, onAcceptArtifact, compact }: AgentRunPanelProps) {
  const allRuns = useAgentRuntimeStore((state) => state.runs)
  const runs = useMemo(() => selectAgentRuns({ runs: allRuns }, { projectId, agentId }), [allRuns, projectId, agentId])
  const runAgent = useAgentRuntimeStore((state) => state.runAgent)
  const completeQueuedRun = useAgentRuntimeStore((state) => state.completeQueuedRun)
  const acceptArtifact = useAgentRuntimeStore((state) => state.acceptArtifact)
  const [selectedRunId, setSelectedRunId] = useState<string | undefined>(runs[0]?.id)
  const selectedRun = runs.find((run) => run.id === selectedRunId) ?? runs[0]

  const pendingCount = useMemo(() => runs.reduce((sum, run) => sum + run.outputs.filter((item) => item.status === 'pending').length, 0), [runs])
  const runSelectedAgent = (id: AgentId, currentRun?: AgentRun) => {
    const request: AgentRunRequest = {
      agentId: id,
      projectId: projectId ?? currentRun?.projectId ?? 'AUD-2026-008',
      projectName: projectName ?? currentRun?.projectName ?? '采购与合同管理专项审计',
      triggeredBy: role,
      trigger: currentRun?.trigger ?? '项目工作台人工发起',
    }
    const idCreated = runAgent(request)
    setSelectedRunId(idCreated)
  }

  return (
    <div className={`icm-agent-runtime${compact ? ' icm-agent-runtime-compact' : ''}`}>
      <Card
        title="智能体运行"
        note="演示运行结果需人工核验；预测内容统一标记为演示研判。"
        action={<Tag tone={pendingCount ? 'amber' : 'green'}>{pendingCount ? `${pendingCount} 项待确认` : '无待确认结果'}</Tag>}
      >
        <div className="icm-agent-runtime-grid">
          <section className="icm-agent-runtime-list" aria-label="智能体运行记录">
            <div className="icm-agent-runtime-list-head">
              <span>智能体 / 项目 / 运行状态</span>
              <span>操作</span>
            </div>
            {runs.map((run) => {
              const agent = AGENT_DEFINITIONS.find((item) => item.id === run.agentId)!
              return (
                <div className={`icm-agent-runtime-row${selectedRun?.id === run.id ? ' active' : ''}`} key={run.id}>
                  <button className="icm-agent-runtime-row-main" type="button" onClick={() => setSelectedRunId(run.id)}>
                    <span className="icm-agent-runtime-icon"><Bot size={17} /></span>
                    <span className="icm-agent-runtime-row-copy">
                      <strong>{agent.name}<em>{agent.id}</em></strong>
                      <span>{run.projectName} · {run.trigger}</span>
                    </span>
                    <Tag tone={run.status === 'completed' ? 'green' : run.status === 'failed' ? 'red' : 'amber'}>{statusText(run)}</Tag>
                    <ChevronRight size={15} className="icm-agent-runtime-chevron" />
                  </button>
                  <div className="icm-agent-runtime-row-action">
                    <span>{artifactCount(run)}</span>
                    {run.status === 'queued' ? <Button size="sm" type="primary-soft" icon={<Play size={13} />} onClick={() => { completeQueuedRun(run.id, role); setSelectedRunId(run.id) }}>运行</Button> : null}
                  </div>
                </div>
              )
            })}
            {runs.length === 0 ? <div className="icm-agent-runtime-empty">当前项目暂无智能体运行记录</div> : null}
            <div className="icm-agent-runtime-launch">
              <span><Bot size={15} /> 发起演示运行</span>
              <div>{AGENT_DEFINITIONS.filter((agent) => !agentId || agent.id === agentId).map((agent) => <button type="button" key={agent.id} title={agent.purpose} onClick={() => runSelectedAgent(agent.id)}><Play size={12} />{agent.id}</button>)}</div>
            </div>
          </section>
          {selectedRun ? <AgentRunDetail run={selectedRun} role={role} onAccept={(artifact) => { acceptArtifact(selectedRun.id, artifact.id, role); onAcceptArtifact?.(artifact, selectedRun, role) }} onOpenTarget={(artifact) => onOpenTarget?.(artifact.target, artifact, selectedRun)} /> : (
            <div className="icm-agent-runtime-detail-empty"><Bot size={20} /><span>选择运行记录查看输入版本和输出结果</span></div>
          )}
        </div>
      </Card>
    </div>
  )
}

export interface AgentRunDetailProps {
  run: AgentRun
  role: AgentRole
  onAccept?: (artifact: AgentArtifact) => void
  onOpenTarget?: (artifact: AgentArtifact) => void
}

export function AgentRunDetail({ run, role, onAccept, onOpenTarget }: AgentRunDetailProps) {
  const agent = AGENT_DEFINITIONS.find((item) => item.id === run.agentId)!
  return (
    <section className="icm-agent-runtime-detail" aria-label="智能体运行详情">
      <div className="icm-agent-runtime-detail-head">
        <div><span className="icm-agent-runtime-eyebrow">{agent.id} · {(run.executionMode ?? agent.mode).toUpperCase()} 模式</span><h3>{agent.name}</h3><p>{run.projectName} · {run.currentStep}</p></div>
        <Tag tone={run.status === 'completed' ? 'green' : run.status === 'failed' ? 'red' : 'amber'}>{statusText(run)}</Tag>
      </div>
      {run.message ? <div className="icm-agent-runtime-message"><CircleAlert size={14} />{run.message}</div> : null}
      <div className="icm-agent-runtime-meta"><span><Clock3 size={13} />{run.startedAt}</span><span>发起人：{run.triggeredBy}</span><span>触发：{run.trigger}</span></div>
      <div className="icm-agent-runtime-section">
        <div className="icm-agent-runtime-section-title">输入依据及版本</div>
        <div className="icm-agent-runtime-refs">{run.inputs.map((input) => <div key={`${input.recordId}-${input.label}`}><span>{input.label}</span><strong>{input.version}</strong>{input.recordId ? <code>{input.recordId}</code> : null}</div>)}</div>
      </div>
      <div className="icm-agent-runtime-section">
        <div className="icm-agent-runtime-section-title">运行产物 <span>{run.outputs.length} 项</span></div>
        <div className="icm-agent-runtime-artifacts">
          {run.outputs.map((artifact) => {
            const prediction = Boolean(artifact.predictionKind)
            const canAccept = artifact.status === 'pending' && canAcceptAgentArtifact(role, artifact)
            return (
              <article className="icm-agent-runtime-artifact" key={artifact.id}>
                <div className="icm-agent-runtime-artifact-head"><div><strong>{artifact.title}</strong>{prediction ? <Tag tone="amber">演示研判</Tag> : null}</div><Tag tone={artifact.status === 'draft' ? 'blue' : 'amber'}>{artifact.status === 'draft' ? '已采纳为草稿' : '待人工确认'}</Tag></div>
                <p>{artifact.summary}</p>
                <div className="icm-agent-runtime-artifact-foot"><span>业务目标：{artifact.target.label}{artifact.target.recordId ? ` · ${artifact.target.recordId}` : ''}</span><div>
                  {artifact.status === 'pending' ? artifact.target.route.startsWith('/plan-workbench') ? <span className="icm-agent-runtime-accepted">请进入年度计划确认选项</span> : <Button size="sm" type="primary-soft" icon={<Check size={13} />} disabled={!canAccept} onClick={() => onAccept?.(artifact)}>采纳为草稿</Button> : <span className="icm-agent-runtime-accepted">采纳人：{artifact.acceptedBy} · {artifact.acceptedAt}</span>}
                  <Button size="sm" type="default-soft" icon={<ArrowUpRight size={13} />} disabled={!onOpenTarget} onClick={() => onOpenTarget?.(artifact)}>打开业务对象</Button>
                </div></div>
              </article>
            )
          })}
        </div>
      </div>
      <div className="icm-agent-runtime-guardrail">智能体产物进入草稿区后仍按原业务流程办理；运行结果不会自动认定审计发现、通过复核、签发报告或销号整改。</div>
    </section>
  )
}

export function AgentRunDetails({ run, role, onAccept, onOpenTarget }: AgentRunDetailProps) {
  return <AgentRunDetail run={run} role={role} onAccept={onAccept} onOpenTarget={onOpenTarget} />
}

export function AgentResetButton() {
  const resetDemo = useAgentRuntimeStore((state) => state.resetDemo)
  return <Button type="default-soft" size="sm" icon={<RotateCcw size={13} />} onClick={resetDemo}>重置智能体演示数据</Button>
}
