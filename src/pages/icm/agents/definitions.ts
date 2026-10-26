import type { AgentDefinition, AgentId, AgentRun, AgentRunRequest } from './types'

export const AGENT_DEFINITIONS: AgentDefinition[] = [
  { id: 'AG01', name: '审计规划研判', purpose: '风险排序、方案建议、项目延期研判', mode: 'demo', predictionKinds: ['risk-priority', 'project-delay'], outputKinds: ['risk-assessment', 'todo'] },
  { id: 'AG02', name: '审计数据分析', purpose: '识别交易异常并形成待核实线索', mode: 'demo', predictionKinds: ['risk-priority'], outputKinds: ['analysis-clue', 'todo'] },
  { id: 'AG03', name: '取证与底稿助手', purpose: '整理证据索引并起草审计底稿', mode: 'demo', predictionKinds: [], outputKinds: ['evidence-index', 'workpaper-draft'] },
  { id: 'AG04', name: '审计质量检查', purpose: '检查依据、金额、日期和证据链完整性', mode: 'demo', predictionKinds: [], outputKinds: ['quality-review', 'todo'] },
  { id: 'AG05', name: '审计报告助手', purpose: '按审计类型生成报告章节草稿与引用清单', mode: 'demo', predictionKinds: [], outputKinds: ['report-draft'] },
  { id: 'AG06', name: '整改跟踪研判', purpose: '预测整改逾期并形成核验与督办建议', mode: 'demo', predictionKinds: ['rectification-overdue'], outputKinds: ['rectification-plan', 'todo'] },
]

const target = (label: string, tab: string, recordId: string) => ({ label, route: '/projects/AUD-PL-2026-001', tab, recordId })
const run = (id: string, agentId: AgentId, status: AgentRun['status'], trigger: string, inputs: AgentRun['inputs'], outputs: AgentRun['outputs'], currentStep: string, startedAt: string): AgentRun => ({
  id, agentId, projectId: 'AUD-PL-2026-001', projectName: '采购围标风险专项审计项目', status, startedAt,
  ...(status === 'completed' ? { completedAt: startedAt } : {}), triggeredBy: agentId === 'AG06' ? '审计负责人' : agentId === 'AG01' || agentId === 'AG04' || agentId === 'AG05' ? '项目负责人（主审）' : '审计人员',
  trigger, currentStep, inputs, outputs,
})

export const DEMO_AGENT_RUNS: AgentRun[] = [
  run('RUN-AG01-004', 'AG01', 'completed', '项目启动风险评估', [
    { label: '项目审前调查', version: 'v1.2', recordId: 'SUR-008-02' }, { label: '审计对象风险台账', version: '2026-Q3', recordId: 'RISK-2026-Q3' }, { label: '采购审计程序模板', version: 'v3.1', recordId: 'TPL-PROC-031' },
  ], [
    { id: 'ART-AG01-004-1', title: '采购风险优先级研判', kind: 'risk-assessment', status: 'pending', summary: '供应商集中度与合同拆分风险排序靠前；该排序为演示研判，需主审核验后用于方案。', target: target('项目准备 / 风险评估', 'preparation', 'RISK-AUD-008-04'), predictionKind: 'risk-priority' },
    { id: 'ART-AG01-004-2', title: '审计方案补充建议', kind: 'todo', status: 'pending', summary: '建议增加关联供应商与合同金额阈值分析程序。', target: target('审计方案', 'preparation', 'PLAN-AUD-008-01') },
  ], '已形成风险排序与方案建议', '2026-10-24 09:10'),
  run('RUN-AG02-003', 'AG02', 'completed', '采购付款数据批次导入', [
    { label: '采购付款明细', version: '批次2026-10-22', recordId: 'DATA-PO-1022' }, { label: '审计分析规则集', version: 'v2.4', recordId: 'MODEL-PO-024' },
  ], [{ id: 'ART-AG02-003-1', title: '供应商与合同异常线索', kind: 'analysis-clue', status: 'pending', summary: '3 条线索待核验；命中结果仅用于审计取证，不作为正式发现。', target: target('审计发现 / 线索', 'findings', 'CLUE-AUD-008-003'), predictionKind: 'risk-priority' }], '已识别 3 条待核验线索', '2026-10-24 10:15'),
  run('RUN-AG03-002', 'AG03', 'completed', '底稿证据归集', [
    { label: '审计程序执行记录', version: 'v1.0', recordId: 'PROC-008-12' }, { label: '访谈及合同材料', version: '材料包v2', recordId: 'EVID-SET-008-02' },
  ], [
    { id: 'ART-AG03-002-1', title: '供应商关联核验底稿草稿', kind: 'workpaper-draft', status: 'pending', summary: '草稿含执行过程、证据引用和待补充事项，须由编制人核对并提交复核。', target: target('审计实施 / 底稿', 'execution', 'WP-AUD-008-018') },
    { id: 'ART-AG03-002-2', title: '证据索引', kind: 'evidence-index', status: 'pending', summary: '已按程序整理 6 项证据引用，原件状态与经手记录保持独立。', target: target('项目档案 / 证据', 'archive', 'EVID-INDEX-008-02') },
  ], '证据索引与底稿草稿已就绪', '2026-10-24 11:20'),
  run('RUN-AG04-001', 'AG04', 'queued', '底稿质量预检', [
    { label: '当前底稿包', version: 'v1.0', recordId: 'WP-PACK-008-01' }, { label: '法规依据库', version: '2026-10-20', recordId: 'LAW-BASE-20261020' },
  ], [{ id: 'ART-AG04-001-1', title: '底稿质量检查结果', kind: 'quality-review', status: 'pending', summary: '待运行；检查结果仅为质量提示，不替代复核结论。', target: target('审计实施 / 底稿复核', 'execution', 'QC-AUD-008-01') }], '等待人工确认运行', '2026-10-24 13:00'),
  run('RUN-AG05-002', 'AG05', 'completed', '审计报告初稿', [
    { label: '已复核底稿', version: 'v1.3', recordId: 'WP-PACK-008-01' }, { label: '审计发现清单', version: 'v1.1', recordId: 'FIND-SET-008-01' }, { label: '采购报告模板', version: 'v2.0', recordId: 'TPL-RPT-PO-020' },
  ], [{ id: 'ART-AG05-002-1', title: '采购专项审计报告草稿', kind: 'report-draft', status: 'pending', summary: '包含审计范围、主要发现及建议；金额、日期和依据引用均需人工确认。', target: target('审计报告', 'report', 'RPT-AUD-008-DRAFT-02') }], '已生成报告章节草稿', '2026-10-24 14:05'),
  run('RUN-AG06-003', 'AG06', 'completed', '整改台账月度跟踪', [
    { label: '审计整改台账', version: '2026-10-23', recordId: 'RECT-LEDGER-20261023' }, { label: '整改责任与期限', version: 'v1.2', recordId: 'RECT-ASSIGN-008' },
  ], [{ id: 'ART-AG06-003-1', title: '整改逾期风险研判', kind: 'rectification-plan', status: 'pending', summary: '2 项整改存在逾期风险，为演示研判；须核实进度和延期审批后再督办。', target: target('整改跟踪', 'rectification', 'RECT-RISK-008-03'), predictionKind: 'rectification-overdue' }], '已形成逾期预测与核验建议', '2026-10-24 15:10'),
]

const RUN_OUTPUTS: Record<AgentId, AgentRun['outputs']> = {
  AG01: [
    { id: 'risk', title: '审计风险优先级研判', kind: 'risk-assessment', status: 'pending', summary: '采购集中度与合同拆分风险优先核验；演示研判需人工确认。', target: target('项目准备 / 风险评估', 'preparation', 'RISK-AUD-DEMO'), predictionKind: 'risk-priority' },
    { id: 'delay', title: '项目延期风险研判', kind: 'todo', status: 'pending', summary: '按剩余程序量与计划工期测算存在延期可能；演示研判需主审核实。', target: target('项目概览 / 进度', 'overview', 'DELAY-AUD-DEMO'), predictionKind: 'project-delay' },
  ],
  AG02: [{ id: 'clue', title: '待核验数据分析线索', kind: 'analysis-clue', status: 'pending', summary: '发现付款时点与合同节点不一致的候选记录，尚未形成正式发现。', target: target('审计实施 / 数据分析', 'execution', 'CLUE-AUD-DEMO') }],
  AG03: [
    { id: 'wp', title: '审计底稿草稿', kind: 'workpaper-draft', status: 'pending', summary: '按当前程序和证据引用生成草稿，等待编制人核对。', target: target('审计实施 / 底稿', 'execution', 'WP-AUD-DEMO') },
    { id: 'evidence', title: '证据索引草稿', kind: 'evidence-index', status: 'pending', summary: '整理材料引用与版本信息，不改变证据原始状态。', target: target('项目档案 / 证据', 'archive', 'EVID-AUD-DEMO') },
  ],
  AG04: [{ id: 'quality', title: '底稿质量检查结果', kind: 'quality-review', status: 'pending', summary: '标出依据版本、三类日期和金额口径的待检查项，不替代人工复核。', target: target('审计实施 / 底稿复核', 'execution', 'QC-AUD-DEMO') }],
  AG05: [{ id: 'report', title: '审计报告章节草稿', kind: 'report-draft', status: 'pending', summary: '依据已复核底稿组织报告章节，签发前须人工核对事实、金额和引用。', target: target('审计报告', 'report', 'RPT-AUD-DEMO') }],
  AG06: [{ id: 'rect', title: '整改逾期风险研判', kind: 'rectification-plan', status: 'pending', summary: '结合整改期限和反馈进度排序待核验事项；为演示研判，不改变正式整改状态。', target: target('整改跟踪', 'rectification', 'RECT-AUD-DEMO'), predictionKind: 'rectification-overdue' }],
}

export function buildDemoRun(request: AgentRunRequest, sequence: number): AgentRun {
  const definition = AGENT_DEFINITIONS.find((agent) => agent.id === request.agentId)!
  const suffix = String(sequence).padStart(3, '0')
  const at = new Date().toISOString().slice(0, 16).replace('T', ' ')
  const outputs = RUN_OUTPUTS[request.agentId].map((output) => ({ ...output, id: `${output.id}-${request.projectId}-${suffix}`, target: { ...output.target, route: `/projects/${request.projectId}` } }))
  return {
    id: `RUN-${request.agentId}-${suffix}`, agentId: request.agentId, projectId: request.projectId, projectName: request.projectName,
    status: 'completed', startedAt: at, completedAt: at, triggeredBy: request.triggeredBy, trigger: request.trigger ?? '人工发起演示运行',
    currentStep: `${definition.name}已生成 ${outputs.length} 项待确认结果`,
    inputs: [{ label: '项目当前资料集', version: 'v1.0', recordId: `INPUT-${request.projectId}` }, { label: '智能体规则配置', version: 'demo-1.0', recordId: `CFG-${definition.id}-DEMO` }],
    outputs,
  }
}
