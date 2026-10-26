import { knowledge, rules } from './mock'
import { AGENT_DEFINITIONS } from '../agents/definitions'
import type { ResourceAsset, ResourceCategory, ResourceContent } from './resourceModel'

const sectionText = (rows?: { heading?: string; title?: string; text: string }[]) => rows?.map((r) => `${r.heading ?? r.title ?? ''}\n${r.text}`).join('\n\n') ?? ''
function asset(id: string, category: ResourceCategory, data: Partial<ResourceContent> & Pick<ResourceContent, 'title' | 'type' | 'summary' | 'content'>): ResourceAsset {
  return { id, category, enabled: true, versions: [{ version: 1, at: '2026-01-01T00:00:00+08:00', by: '资源维护岗', opinion: '预置资源', snapshot: { domain: '通用', owner: '审计部', source: '现有审计资源', effectiveFrom: '', effectiveTo: '', relatedIds: [], ...data } }], history: [] }
}
const seeds: ResourceAsset[] = [
  ...knowledge.clauses.map((c) => asset(c.id, 'basis', { title: c.title, type: '企业制度', summary: c.summary, content: c.fullText || sectionText(c.sections) || c.summary, domain: c.domain, owner: c.issuer, source: `${c.issuer} · ${c.docNo ?? c.version}`, effectiveFrom: c.effectiveDate, relatedIds: c.relatedClauseIds ?? [] })),
  ...knowledge.methods.map((m) => asset(m.id, 'programs', { title: m.name, type: '审计程序', summary: m.scenario, content: `${sectionText(m.procedureSteps) || m.steps}\n\n预期输出：${m.output}\n${m.sampleOutputDesc ?? ''}`, relatedIds: [...(m.linkedClauseIds ?? []), ...(m.linkedRuleIds ?? []), m.bindTemplate].filter(Boolean) })),
  ...knowledge.templates.map((t) => asset(t.id, 'programs', { title: t.name, type: '文书模板', summary: t.reuse, content: sectionText(t.sections) || t.reuse, domain: t.domain, source: `原模板 ${t.version}`, relatedIds: t.bindClauseIds ?? [] })),
  ...knowledge.cases.map((c) => asset(c.id, 'cases', { title: c.title, type: '审计案例', summary: c.issuePattern, content: `问题表现：${c.issuePattern}\n处理结果：${c.result}\n适用建议：${c.use}\n关联方法：${c.generatedMethod}`, domain: c.riskType, source: `${c.sourceModule} · ${c.id}` })),
  ...rules.map((r) => asset(r.id, 'tools', { title: r.name, type: '检测规则', summary: r.condition, content: `判定条件：${r.condition}\n输入字段：${r.sampleFields?.join('、') ?? '待明确'}\n风险权重：${r.riskWeight}\n输出：${r.output}\n规则命中形成待核实线索，经人工复核后再形成发现。`, domain: r.domain, source: r.source, relatedIds: r.linkedClauseId ? [r.linkedClauseId] : [] })),
  ...AGENT_DEFINITIONS.map((a) => asset(a.id, 'tools', { title: a.name, type: '智能体', summary: a.purpose, content: `能力范围：${a.purpose}\n输出类别：${a.outputKinds.join('、')}\n使用方式：在项目“智能分析”中发起运行，输出由责任人审核采纳。`, source: '项目智能分析能力目录' })),
  asset('RCM-PAY-01', 'programs', { title: '采购付款风险控制矩阵', type: '风险控制矩阵', domain: '采购与资金', summary: '将付款风险、控制要求、评价标准与审计程序关联。', content: '风险：验收前付款、超授权付款。\n控制要求：验收记录完整；付款按企业授权矩阵审批。\n评价标准：验收与付款节点一致，授权层级和业务金额匹配。\n程序：关联合同、验收、付款和审批记录，识别异常后核实原因。\n证据：合同、验收记录、付款凭证及审批日志。', relatedIds: ['LAW-CG-018', 'DATA-PAY-01'] }),
  asset('DATA-PAY-01', 'programs', { title: '采购付款数据采集规范', type: '数据采集规范', domain: '采购与资金', summary: '统一合同、验收与付款字段口径。', content: '必备字段：合同编号、审计对象、付款编号、付款金额、付款日期、验收编号、验收日期、审批人及审批时间。\n口径：金额注明币种和含税状态；时间注明时区；冲销和撤回记录单列。\n校验：主键唯一、关联可追溯、关键字段非空，并记录取数范围与来源系统。' }),
  asset('QC-PAPER-01', 'programs', { title: '底稿与报告质量复核清单', type: '质量复核清单', summary: '核对事实、依据、证据、结论及引用一致性。', content: '1. 范围与批准方案一致，偏离已说明。\n2. 事实有充分、相关、可靠的证据支持。\n3. 制度依据适用于被审计业务发生期间。\n4. 分析与结论相符，异议及处理意见留痕。\n5. 报告、底稿和证据编号及版本一致。' }),
  asset('ACCEPT-RECT-01', 'programs', { title: '整改效果验收检查清单', type: '整改验收标准', summary: '从措施落实、根因覆盖及持续有效性评价整改。', content: '措施落实：责任单位提交实施记录及佐证。\n根因覆盖：整改措施针对原问题成因，不能仅补填表单。\n效果验证：按风险确定复核样本及观察期间，记录验证结果。\n结论：通过、补充整改或持续观察；对未达到条件的事项不能销号。' }),
  asset('GRADE-ISSUE-01', 'programs', { title: '问题分类与分级评估要点', type: '问题分级标准', summary: '按企业批准标准综合评估影响与严重程度。', content: '分类维度：业务领域、风险类型、控制设计或执行缺陷。\n评估维度：影响范围、金额、发生频率、合规影响及管理层级。\n分级结论：引用企业适用标准及判断理由，不仅依赖模型评分。\n涉及分级调整时，保留原结论、复核意见与变更依据。' }),
  asset('SAMPLE-RISK-01', 'programs', { title: '风险导向抽样方法', type: '抽样方法', summary: '记录总体、样本、选取依据与结论适用范围。', content: '界定总体与期间，核对总体完整性。\n按风险选择大额、异常及其他适当样本，记录覆盖和样本限制。\n需要统计推断时单独确定统计抽样参数。\n发现异常后评估是否扩大测试，保留样本清单与调整理由。' }),
]

// Preserve unresolved legacy references without inventing a published authority.
const missingIds = [...new Set(seeds.flatMap((a) => a.versions[0].snapshot.relatedIds).filter((id) => !seeds.some((a) => a.id === id)))]
export const resourceSeeds: ResourceAsset[] = [
  ...seeds.map((a) => missingIds.some((id) => a.versions[0].snapshot.relatedIds.includes(id)) ? { ...a, enabled: false, history: [{ at: '2026-10-24T00:00:00+08:00', by: '资源迁移', action: '原演示数据引用的依据缺少正文，暂时停用；补全依据并审核后方可恢复。' }] } : a),
  ...missingIds.map((id): ResourceAsset => ({ id, category: 'basis', enabled: false, versions: [], history: [], draft: { state: '草稿', at: '2026-10-24T00:00:00+08:00', by: '资源迁移', content: { title: `待补录依据 · ${id}`, type: '企业制度', domain: '通用', summary: '原演示规则引用此编号，但资源库未提供对应正文；请核实来源和有效版本。', content: '', owner: '审计部', source: '原演示数据中的待核实引用', effectiveFrom: '', effectiveTo: '', relatedIds: [] } } })),
]
