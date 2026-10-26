import type { AuditProject, ProjectPreparation } from '../data/auditProjects'

export const preparationChapters = [
  { key: 'objective', title: '目标与范围', label: '方案目标与范围', hint: '明确审计对象、覆盖期间、业务边界和重点风险。' },
  { key: 'procedures', title: '方法与抽样', label: '总体方法与抽样策略', hint: '说明检查方法、选样依据、证据要求及异常延伸方式。' },
  { key: 'notice', title: '进场安排', label: '进场安排', hint: '安排资料准备、访谈、现场工作与发现沟通，实际送达在批准后登记。' },
] as const
export type PreparationChapter = typeof preparationChapters[number]['key']
export type PreparationText = Pick<ProjectPreparation, PreparationChapter>
export const preparationChecks = (d: ProjectPreparation) => [
  ...preparationChapters.map(c => ({ title: c.title, complete: Boolean(d[c.key].trim()), step: 0 })),
  { title: '项目组与职责分工', complete: Boolean(d.members.trim()), step: 1 },
  { title: '复核安排', complete: Boolean(d.reviewer.trim()), step: 1 },
]
export const preparationText = (d: ProjectPreparation): PreparationText => ({ objective: d.objective, procedures: d.procedures, notice: d.notice })
export function buildPreparationDraft(p: AuditProject): PreparationText {
  const refs = (p.resourceRefs ?? []).map(r => `${r.snapshot.title}（V${r.version}）`).join('、')
  return {
    objective: `审计对象：${p.subject}\n覆盖期间：${p.period}\n审计范围：${p.scope}\n审计目标：评价上述范围内控制设计与执行情况，核实异常、分析原因并提出改进建议。\n重点风险：${p.risk || '待项目组结合风险评估确认'}\n范围边界：实施前确认纳入的单位、业务和数据口径；对无法取得资料的事项记录范围限制。`,
    procedures: `一、确认依据与总体\n${refs ? '已引用资源：' + refs + '，实施前核实条款适用性。' : '核实适用制度、控制要求与版本，可从下方资源库引用。'}核对业务总体的完整性、期间及口径。\n二、实施检查\n围绕“${p.scope}”，结合制度查阅、访谈、穿行测试和记录核对，检查关键控制的执行情况。\n三、抽样策略\n结合金额、业务类型和异常特征分层选样，对高风险事项延伸检查。具体总体、样本量及选样理由由项目组核实后确定。\n四、证据与复核\n保留原件来源、检查步骤、样本和例外记录，形成可追溯底稿；事实、依据与结论经复核后进入发现沟通。`,
    notice: `计划实施窗口：${p.plannedImplementation || '待双方确认'}\n进场前：与${p.subject}确认联系人、资料清单、数据口径及提供方式。\n实施中：按审计范围组织访谈、测试和补充资料核查，及时记录范围限制。\n结束现场工作前：沟通初步发现及待核实事项，约定反馈安排。\n具体日期与联系人由项目组确认；方案批准后另行登记真实通知文号及送达记录。`,
  }
}
