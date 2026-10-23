import { create } from 'zustand'

export type IssueLevel = '重大' | '重要' | '一般'
export type IssueStatus =
  | '待确认'
  | '待分级审核'
  | '分级审核不通过'
  | '异议中'
  | '整改中'
  | '已整改'
  | '已关闭'

export type IssueObjectionStatus = '无' | '异议中' | '异议成立' | '异议不成立'

export type RectificationStatus = '待方案审批' | '整改中' | '已整改' | '已销号'
export type RectificationPlanStatus = '待提交' | '待审批' | '审批通过' | '审批不通过'

export type AuditType =
  | '问题确认'
  | '分级审核'
  | '异议审核'
  | '整改方案审批'
  | '整改复核'
  | '报告审核'
  | '计划校审'

export type AuditStatus = '待处理' | '已通过' | '已退回'

export type ReportStatus = '草稿' | '待审核' | '审核中' | '审核不通过' | '审核通过' | '已归档'

export type PlanStatus = '草稿' | '待校审' | '已立项' | '已派发'

export interface WorkflowIssue {
  id: string
  title: string
  level: IssueLevel
  status: IssueStatus
  owner: string
  deadline: string
  workpaperId: string
  evidenceIds: string[]
  fact: string
  basis: string
  rootCause: string
  impact: string
  suggestion: string
  rectificationId?: string
  updatedAt: string
  // P0 extensions
  creator: string
  gradedLevel?: IssueLevel
  gradingAuditor?: string
  gradingOpinion?: string
  objection: {
    status: IssueObjectionStatus
    reason: string
    raisedBy: string
    raisedAt: string
    auditorOpinion?: string
    resolvedAt?: string
  }
  mergeCandidates: string[]
  mergedIntoId?: string
  sourceFindingIds: string[]
}

export interface ProofItem {
  id: string
  name: string
  required: boolean
  submitted: boolean
  evidenceId?: string
  uploadedAt?: string
}

export interface WorkflowRectification {
  id: string
  issueId: string
  title: string
  owner: string
  status: RectificationStatus
  planStatus: RectificationPlanStatus
  progress: number
  proofCount: number
  verifyConclusion: string
  updatedAt: string
  // P0 extensions
  deadline: string
  planContent?: string
  evidenceChecklist: ProofItem[]
  closeOutAt?: string
  followUpAt?: string
  followUpCount: number
  overdueWarned: boolean
}

export interface PlanApprovalNode {
  node: string
  owner: string
  role: string
  status: '未提交' | '待处理' | '进行中' | '通过' | '不通过'
  date: string
  opinion: string
}

export interface WorkflowPlan {
  id: string
  name: string
  type: string
  source: string
  status: PlanStatus
  unit: string
  unitLevel: string
  checkDomain: string
  riskTheme: string
  owner: string
  period: string
  budget: string
  basis: string
  objective: string
  avoidanceCheck: string
  blocker: string
  next: string
  approvals: PlanApprovalNode[]
  needParty: boolean
  needBoard: boolean
}

export interface WorkflowAudit {
  id: string
  type: AuditType
  title: string
  businessId: string
  route: string
  applicant: string
  status: AuditStatus
  node: string
  submittedAt: string
  opinion?: string
}

export interface WorkflowReport {
  id: string
  title: string
  rectificationId: string
  owner: string
  status: ReportStatus
  referenceIds: string[]
  updatedAt: string
  auditOpinion?: string
}

const stamp = '2026-07-23 10:00'
const today = '2026-07-23'

const initialIssues: WorkflowIssue[] = [
  { id: 'ISS-2026-001', title: '三家投标供应商报价差异极小且格式相似', level: '重大', status: '待确认', owner: '采购管理部', deadline: '2026-07-30', workpaperId: 'WP-CG-001', evidenceIds: ['EV-2026-0618-01'], fact: '三家投标供应商报价差异极小，投标文件格式和生成信息存在相似特征。', basis: '集团采购管理办法第18条、招投标合规指引第12条。', rootCause: '供应商独立性核验和评审复核控制执行不足。', impact: '可能影响采购竞争充分性和价格公允性。', suggestion: '补充关联关系核验，完善异常报价复核和供应商准入控制。', updatedAt: stamp, creator: '李娜', objection: { status: '无', reason: '', raisedBy: '', raisedAt: '' }, mergeCandidates: [], sourceFindingIds: ['SUS-01'] },
  { id: 'ISS-2026-002', title: '供应商联系人与注册地址存在重合', level: '重要', status: '整改中', owner: '供应链管理部', deadline: '2026-08-05', workpaperId: 'WP-CG-002', evidenceIds: ['EV-2026-0620-04'], fact: '两家报名供应商联系人和注册地址存在重合。', basis: '供应商管理细则第9条。', rootCause: '供应商准入信息核验范围不足。', impact: '存在陪标围标和供应商管理失效风险。', suggestion: '建立关联供应商识别规则并复核存量供应商档案。', rectificationId: 'RCT-2026-002', updatedAt: stamp, creator: '李娜', objection: { status: '无', reason: '', raisedBy: '', raisedAt: '' }, mergeCandidates: [], sourceFindingIds: ['SUS-02'] },
  { id: 'ISS-2026-003', title: '专项奖金发放缺少超额审批依据', level: '重要', status: '整改中', owner: '人力资源部', deadline: '2026-07-28', workpaperId: 'WP-XC-003', evidenceIds: ['EV-2026-0622-02', 'EV-2026-0622-03'], fact: '两笔专项奖金超过岗位薪酬方案标准，未见分管领导追加审批记录。', basis: '薪酬管理办法第22条、工资总额管理细则第11条。', rootCause: '薪酬事项的额度预警与追加授权校验未嵌入审批流程。', impact: '存在薪酬违规发放及人工成本失控风险。', suggestion: '在薪酬审批表单中增加额度校验和超额授权附件校验。', rectificationId: 'RCT-2026-003', updatedAt: stamp, creator: '张衡', objection: { status: '无', reason: '', raisedBy: '', raisedAt: '' }, mergeCandidates: [], sourceFindingIds: [] },
  { id: 'ISS-2026-004', title: '付款节点早于验收资料归档时间', level: '重要', status: '已整改', owner: '财务共享中心', deadline: '2026-07-10', workpaperId: 'WP-ZJ-003', evidenceIds: ['EV-2026-0619-03', 'EV-2026-0619-04'], fact: '付款审批节点早于验收资料归档时间。', basis: '资金支付管理办法第15条。', rootCause: '付款审批与验收归档未形成系统校验。', impact: '可能造成验收前付款风险。', suggestion: '增加付款前验收资料完整性校验，并对异常付款实施拦截。', rectificationId: 'RCT-2026-004', updatedAt: stamp, creator: '王锐', objection: { status: '无', reason: '', raisedBy: '', raisedAt: '' }, mergeCandidates: [], sourceFindingIds: ['SUS-03'] },
  { id: 'ISS-2026-005', title: '境外投资项目风险数据未按期回传', level: '一般', status: '已整改', owner: '投资管理部', deadline: '2026-07-12', workpaperId: 'WP-TZ-005', evidenceIds: ['EV-2026-0624-01'], fact: '境外子公司二季度风险事项未在集团规定时限内完成回传。', basis: '境外投资监督管理办法第31条。', rootCause: '境外项目数据台账与集团风险平台未建立定时校验机制。', impact: '影响集团对境外投资风险的及时识别和处置。', suggestion: '建立月度回传清单和逾期提醒机制，明确境外项目责任人。', rectificationId: 'RCT-2026-005', updatedAt: stamp, creator: '赵明', objection: { status: '无', reason: '', raisedBy: '', raisedAt: '' }, mergeCandidates: [], sourceFindingIds: [] },
  { id: 'ISS-2026-006', title: '投资项目偏离主责主业论证材料不充分', level: '重要', status: '已整改', owner: '战略投资部', deadline: '2026-06-30', workpaperId: 'WP-TZ-006', evidenceIds: ['EV-2026-0616-01', 'EV-2026-0616-02'], fact: '某股权投资项目立项材料未充分说明与集团主责主业的协同关系。', basis: '投资项目管理办法第17条。', rootCause: '投资立项模板未设置主业匹配性必填论证项。', impact: '存在非主业投资扩张和投资决策依据不足风险。', suggestion: '修订投资立项模板，增加主业匹配性评估和专业部门会签要求。', rectificationId: 'RCT-2026-006', updatedAt: stamp, creator: '赵明', objection: { status: '无', reason: '', raisedBy: '', raisedAt: '' }, mergeCandidates: [], sourceFindingIds: [] },
  { id: 'ISS-2026-007', title: '固定资产盘点差异未及时履行审批处置', level: '一般', status: '已整改', owner: '资产管理部', deadline: '2026-06-20', workpaperId: 'WP-ZC-007', evidenceIds: ['EV-2026-0612-01'], fact: '两项固定资产盘点差异超过处置时限，未见完整的差异说明和审批资料。', basis: '固定资产管理办法第26条。', rootCause: '盘点差异台账未与审批流程联动催办。', impact: '资产账实一致性和资产处置合规性存在薄弱环节。', suggestion: '建立盘点差异线上催办和超期预警机制。', rectificationId: 'RCT-2026-007', updatedAt: stamp, creator: '李娜', objection: { status: '无', reason: '', raisedBy: '', raisedAt: '' }, mergeCandidates: [], sourceFindingIds: [] },
]

const defaultEvidenceChecklist = (domain = '通用'): ProofItem[] => {
  const common: ProofItem[] = [
    { id: 'PF-01', name: '整改情况说明', required: true, submitted: false },
    { id: 'PF-02', name: '修订后的制度文件', required: false, submitted: false },
    { id: 'PF-03', name: '流程优化截图或配置记录', required: false, submitted: false },
    { id: 'PF-04', name: '培训记录或会议纪要', required: false, submitted: false },
  ]
  if (domain === '资金' || domain === '财务') {
    common.push({ id: 'PF-05', name: '系统权限/审批链配置变更记录', required: true, submitted: false })
  }
  if (domain === '采购' || domain === '供应商') {
    common.push({ id: 'PF-06', name: '供应商关联关系复核记录', required: true, submitted: false })
  }
  return common
}

const initialRectifications: WorkflowRectification[] = [
  { id: 'RCT-2026-002', issueId: 'ISS-2026-002', title: '供应商关联关系核验整改', owner: '供应链管理部', status: '整改中', planStatus: '审批通过', progress: 55, proofCount: 2, verifyConclusion: '待责任单位补充存量供应商复核记录', updatedAt: stamp, deadline: '2026-08-05', evidenceChecklist: defaultEvidenceChecklist('供应商'), followUpCount: 0, overdueWarned: false },
  { id: 'RCT-2026-003', issueId: 'ISS-2026-003', title: '薪酬超额审批控制整改', owner: '人力资源部', status: '整改中', planStatus: '审批通过', progress: 100, proofCount: 4, verifyConclusion: '整改措施已完成，待内控部门复核', updatedAt: stamp, deadline: '2026-07-28', evidenceChecklist: defaultEvidenceChecklist('薪酬'), followUpCount: 0, overdueWarned: false },
  { id: 'RCT-2026-004', issueId: 'ISS-2026-004', title: '付款验收联动整改', owner: '财务共享中心', status: '已整改', planStatus: '审批通过', progress: 100, proofCount: 3, verifyConclusion: '复核通过', updatedAt: stamp, deadline: '2026-07-10', evidenceChecklist: defaultEvidenceChecklist('资金'), closeOutAt: stamp, followUpCount: 0, overdueWarned: false },
  { id: 'RCT-2026-005', issueId: 'ISS-2026-005', title: '境外项目风险数据回传整改', owner: '投资管理部', status: '已整改', planStatus: '审批通过', progress: 100, proofCount: 3, verifyConclusion: '复核通过', updatedAt: stamp, deadline: '2026-07-12', evidenceChecklist: defaultEvidenceChecklist('投资'), closeOutAt: stamp, followUpCount: 0, overdueWarned: false },
  { id: 'RCT-2026-006', issueId: 'ISS-2026-006', title: '投资主业匹配性论证整改', owner: '战略投资部', status: '已整改', planStatus: '审批通过', progress: 100, proofCount: 5, verifyConclusion: '复核通过', updatedAt: stamp, deadline: '2026-06-30', evidenceChecklist: defaultEvidenceChecklist('投资'), closeOutAt: stamp, followUpCount: 0, overdueWarned: false },
  { id: 'RCT-2026-007', issueId: 'ISS-2026-007', title: '固定资产盘点差异处置整改', owner: '资产管理部', status: '已整改', planStatus: '审批通过', progress: 100, proofCount: 4, verifyConclusion: '复核通过', updatedAt: stamp, deadline: '2026-06-20', evidenceChecklist: defaultEvidenceChecklist('资产'), closeOutAt: stamp, followUpCount: 0, overdueWarned: false },
]

const initialReports: WorkflowReport[] = [
  { id: 'RPT-2026-004', title: '资金支付授权执行情况检查报告', rectificationId: 'RCT-2026-004', owner: '财务共享中心', status: '草稿', referenceIds: ['ISS-2026-004', 'WP-ZJ-003', 'EV-2026-0619-03', 'EV-2026-0619-04', 'RCT-2026-004'], updatedAt: stamp },
  { id: 'RPT-2026-005', title: '境外投资项目内控检查报告', rectificationId: 'RCT-2026-005', owner: '投资管理部', status: '审核中', referenceIds: ['ISS-2026-005', 'WP-TZ-005', 'EV-2026-0624-01', 'RCT-2026-005'], updatedAt: stamp },
  { id: 'RPT-2026-006', title: '投资决策合规专项检查报告', rectificationId: 'RCT-2026-006', owner: '战略投资部', status: '审核不通过', referenceIds: ['ISS-2026-006', 'WP-TZ-006', 'EV-2026-0616-01', 'EV-2026-0616-02', 'RCT-2026-006'], updatedAt: stamp, auditOpinion: '请补充主业匹配性论证整改后的抽样验证结论。' },
  { id: 'RPT-2026-007', title: '固定资产盘点管理检查报告', rectificationId: 'RCT-2026-007', owner: '资产管理部', status: '审核通过', referenceIds: ['ISS-2026-007', 'WP-ZC-007', 'EV-2026-0612-01', 'RCT-2026-007'], updatedAt: stamp, auditOpinion: '报告事实、依据和整改佐证完整，同意归档。' },
]

const initialPlans: WorkflowPlan[] = [
  { id: 'PL-2026-001', name: '年度内部控制评价工作计划（采购与招投标）', type: '专项检查', source: '年度计划', status: '已立项', unit: '华北装备制造集团西北分公司', unitLevel: '二级企业', checkDomain: '采购', riskTheme: '采购围标风险', owner: '张衡', period: '2026-06-20 至 2026-07-31', budget: '32 人/天', basis: '年度内控检查安排（内控办〔2026〕3号）、集团采购管理办法第18条、招投标合规指引第12条', objective: '核验采购围标风险识别、报价异常检测、供应商关联关系排查的完整性和整改闭环有效性。', avoidanceCheck: '已通过', blocker: '检查组已进场，正执行检查任务', next: '进入智能审查', approvals: [{ node: '内控部门审核', owner: '郑刚', role: '内控部负责人', status: '通过', date: '2026-06-10', opinion: '检查范围适当，建议增加供应商关联关系核验指标。' }, { node: '合规审查', owner: '法律合规部', role: '合规审查岗', status: '通过', date: '2026-06-12', opinion: '检查依据充分，合规性审核通过。' }, { node: '党委前置研究', owner: '党委办公室', role: '党委办', status: '通过', date: '2026-06-14', opinion: '经党委会研究，同意纳入年度专项检查计划。' }, { node: '分管领导审批', owner: '赵总', role: '分管副总经理', status: '通过', date: '2026-06-16', opinion: '同意按方案执行，重点关注围标陪标风险。' }, { node: '主要领导审批', owner: '孙总', role: '总经理', status: '通过', date: '2026-06-18', opinion: '批准立项，检查组尽快进场。' }], needParty: true, needBoard: false },
  { id: 'PL-2026-014', name: '内控专项检查工作计划（供应商关联交易风险）', type: '专项检查', source: '风险预警', status: '待校审', unit: '华东装备制造有限公司', unitLevel: '二级企业', checkDomain: '采购', riskTheme: '供应商关联风险', owner: '李娜', period: '2026-07-05 至 2026-08-05', budget: '28 人天', basis: '风险驾驶舱红色预警（预警编号 RA-2026-0628）、供应商管理细则第9条、关联交易管理办法', objective: '核验供应商关联关系、异常交易和审批留痕是否完整，排查围标陪标风险。', avoidanceCheck: '已通过', blocker: '待提交线上校审', next: '提交审批流', approvals: [{ node: '风险预警触发', owner: '风险驾驶舱', role: '系统自动', status: '通过', date: '2026-07-01', opinion: '红色预警已自动触发专项检查建议。' }, { node: '内控部门审核', owner: '郑刚', role: '内控部负责人', status: '待处理', date: '-', opinion: '待确认检查范围与抽样口径。' }, { node: '合规审查', owner: '法律合规部', role: '合规审查岗', status: '待处理', date: '-', opinion: '待线上流转。' }, { node: '党委前置研究', owner: '党委办公室', role: '党委办', status: '待处理', date: '-', opinion: '待前置研究。' }, { node: '分管领导审批', owner: '赵总', role: '分管副总经理', status: '待处理', date: '-', opinion: '待线上校审通过后审批。' }], needParty: true, needBoard: false },
  { id: 'PL-2026-021', name: '内部审计暨内控综合核查计划（资金支付审批链）', type: '专项抽查', source: '审计协同', status: '已派发', unit: '财务共享中心', unitLevel: '集团直管', checkDomain: '资金', riskTheme: '资金支付风险', owner: '王锐', period: '2026-06-18 至 2026-07-20', budget: '18 人天', basis: '审计部年度审计计划（审计〔2026〕12号）、资金支付制度第8条、大额资金监督管理办法', objective: '复核大额支付审批链完整性、超比例付款情况和验收前付款合规性。', avoidanceCheck: '已通过', blocker: '无阻塞，已进入执行阶段', next: '查看执行', approvals: [{ node: '审计计划同步', owner: '审计部', role: '审计部', status: '通过', date: '2026-06-18', opinion: '已纳入年度审计协同计划。' }, { node: '内控部门审核', owner: '郑刚', role: '内控部负责人', status: '通过', date: '2026-06-19', opinion: '同意协同审计，由内控检查组执行抽查。' }, { node: '合规审查', owner: '法律合规部', role: '合规审查岗', status: '通过', date: '2026-06-19', opinion: '合规审查通过。' }, { node: '分管领导审批', owner: '赵总', role: '分管副总经理', status: '通过', date: '2026-06-20', opinion: '同意派发至财务共享中心。' }], needParty: false, needBoard: false },
  { id: 'PL-2026-028', name: '境外投资项目内控专项检查', type: '专项检查', source: '上级交办', status: '待校审', unit: '国际业务事业部', unitLevel: '集团直管', checkDomain: '境外', riskTheme: '境外投资监管', owner: '赵明', period: '2026-08-01 至 2026-09-15', budget: '45 人天', basis: '国资委国资厅监督〔2026〕15号文、境外投资管理办法、境外资产监督管理办法', objective: '验证境外投资项目数据回传、授权审批和风险预警专岗配置情况，并对关键控制点实施穿行测试。', avoidanceCheck: '已通过', blocker: '计划范围待完善', next: '完善计划详情', approvals: [{ node: '计划草拟', owner: '赵明', role: '国际业务部', status: '进行中', date: '2026-07-01', opinion: '检查范围和系统清单待补充。' }, { node: '内控部门审核', owner: '郑刚', role: '内控部负责人', status: '未提交', date: '-', opinion: '完善后提交线上校审。' }, { node: '合规审查', owner: '法律合规部', role: '合规审查岗', status: '未提交', date: '-', opinion: '待前置条件满足。' }, { node: '党委前置研究', owner: '党委办公室', role: '党委办', status: '未提交', date: '-', opinion: '重大境外投资事项按制度要求提交前置研究。' }, { node: '董事会审议', owner: '董事会办公室', role: '董事会办', status: '未提交', date: '-', opinion: '重大事项按制度要求提交董事会审议。' }, { node: '分管领导审批', owner: '钱总', role: '分管副总经理', status: '未提交', date: '-', opinion: '待前置审批完成。' }], needParty: true, needBoard: true },
]

const initialAudits: WorkflowAudit[] = [
  { id: 'APR-2026-021', type: '问题确认', title: '三家投标供应商报价差异极小且格式相似', businessId: 'ISS-2026-001', route: '/issues?issue=ISS-2026-001', applicant: '李娜', status: '待处理', node: '检查组长确认', submittedAt: '2026-07-21 14:20' },
  { id: 'APR-2026-022', type: '整改复核', title: '薪酬超额审批控制整改', businessId: 'RCT-2026-003', route: '/rectify?rect=RCT-2026-003', applicant: '人力资源部', status: '待处理', node: '内控部门复核', submittedAt: '2026-07-22 09:40' },
  { id: 'APR-2026-023', type: '报告审核', title: '境外投资项目内控检查报告', businessId: 'RPT-2026-005', route: '/report?report=RPT-2026-005', applicant: '系统管理员', status: '待处理', node: '内控部门审核', submittedAt: '2026-07-23 09:15' },
  { id: 'APR-2026-019', type: '报告审核', title: '投资决策合规专项检查报告', businessId: 'RPT-2026-006', route: '/report?report=RPT-2026-006', applicant: '系统管理员', status: '已退回', node: '内控部门审核', submittedAt: '2026-07-18 16:30', opinion: '请补充主业匹配性论证整改后的抽样验证结论。' },
  { id: 'APR-2026-018', type: '报告审核', title: '固定资产盘点管理检查报告', businessId: 'RPT-2026-007', route: '/report?report=RPT-2026-007', applicant: '资产管理部', status: '已通过', node: '内控部门审核', submittedAt: '2026-07-16 11:05', opinion: '报告事实、依据和整改佐证完整，同意归档。' },
]

function nextAuditId(state: Pick<WorkflowState, 'audits'>) {
  return `APR-2026-${String(state.audits.length + 21).padStart(3, '0')}`
}

function nextIssueId(state: Pick<WorkflowState, 'issues'>) {
  return `ISS-2026-${String(state.issues.length + 1).padStart(3, '0')}`
}

function nextRectificationId(state: Pick<WorkflowState, 'rectifications'>) {
  return `RCT-2026-${String(state.rectifications.length + 2).padStart(3, '0')}`
}

function nextPlanId(state: Pick<WorkflowState, 'plans'>) {
  return `PL-2026-${String(state.plans.length + 1).padStart(3, '0')}`
}

function nextReportId(state: Pick<WorkflowState, 'reports'>) {
  return `RPT-2026-${String(state.reports.length + 4).padStart(3, '0')}`
}

function buildApprovalChain(needParty: boolean, needBoard: boolean, approver: string): PlanApprovalNode[] {
  const chain: PlanApprovalNode[] = []
  const now = new Date().toISOString().slice(0, 10)
  chain.push({ node: '计划草拟', owner: '当前用户', role: '检查组', status: '通过', date: now, opinion: '手工创建计划。' })
  if (needParty) chain.push({ node: '党委前置研究', owner: '党委办公室', role: '党委办', status: '待处理', date: '-', opinion: '重大检查事项须党委前置研究。' })
  if (needBoard) chain.push({ node: '董事会审议', owner: '董事会办公室', role: '董事会办', status: '待处理', date: '-', opinion: '重大事项按制度要求提交董事会审议。' })
  chain.push({ node: '合规审查', owner: '法律合规部', role: '合规审查岗', status: '待处理', date: '-', opinion: '待合规审查。' })
  chain.push({ node: '内控部门审核', owner: approver || '待分配', role: '内控部负责人', status: '待处理', date: '-', opinion: '需线上确认检查范围和依据。' })
  chain.push({ node: '分管领导审批', owner: '待分配', role: '分管领导', status: '待处理', date: '-', opinion: '待线上流转。' })
  return chain
}

interface WorkflowState {
  issues: WorkflowIssue[]
  rectifications: WorkflowRectification[]
  audits: WorkflowAudit[]
  reports: WorkflowReport[]
  plans: WorkflowPlan[]

  // Issues
  saveIssueDraft: (id: string, patch: Pick<WorkflowIssue, 'fact' | 'basis' | 'rootCause' | 'impact' | 'suggestion'>) => void
  createIssueDraft: (input: Pick<WorkflowIssue, 'title' | 'level' | 'owner' | 'workpaperId' | 'evidenceIds' | 'basis'>) => string
  confirmIssue: (id: string, patch?: Pick<WorkflowIssue, 'fact' | 'basis' | 'rootCause' | 'impact' | 'suggestion'>) => string | undefined
  submitIssueGradingAudit: (id: string) => void
  returnIssueGrading: (id: string, opinion: string) => void
  raiseIssueObjection: (id: string, reason: string, raisedBy: string) => void
  resolveIssueObjection: (id: string, result: '成立' | '不成立', opinion: string) => void
  findMergeCandidates: (id: string) => string[]
  mergeIssues: (targetId: string, sourceIds: string[]) => void

  // Rectifications
  submitRectificationPlan: (id: string, planContent: string) => void
  approveRectificationPlan: (id: string, opinion: string) => void
  returnRectificationPlan: (id: string, opinion: string) => void
  addRectificationProof: (id: string) => void
  toggleEvidenceChecklist: (rectificationId: string, itemId: string) => void
  submitRectificationReview: (id: string) => void
  closeOutRectification: (id: string, opinion: string) => void
  reopenRectification: (id: string) => void
  scheduleFollowUp: (id: string, followUpAt: string) => void

  // Reports
  createReport: (id: string) => string
  generateReportLedger: (id: string) => void
  submitReportAudit: (id: string) => void
  archiveReport: (id: string) => void

  // Audits
  approveAudit: (id: string, opinion: string) => void
  returnAudit: (id: string, opinion: string) => void

  // Plans
  createPlan: (input: Partial<WorkflowPlan>) => string
  updatePlan: (id: string, patch: Partial<WorkflowPlan>) => void
  submitPlanForApproval: (id: string) => void
  approvePlanNode: (id: string, node: string, opinion: string) => void
  rejectPlanNode: (id: string, node: string, opinion: string) => void
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  issues: initialIssues,
  rectifications: initialRectifications,
  audits: initialAudits,
  reports: initialReports,
  plans: initialPlans,

  // Issues
  saveIssueDraft: (id, patch) => set((state) => ({
    issues: state.issues.map((item) => item.id === id ? { ...item, ...patch, updatedAt: stamp } : item),
  })),

  createIssueDraft: (input) => {
    const id = nextIssueId(get())
    set((state) => ({
      issues: [...state.issues, {
        id,
        ...input,
        status: '待确认',
        deadline: '待确认',
        fact: '',
        rootCause: '',
        impact: '',
        suggestion: '',
        creator: '当前用户',
        objection: { status: '无', reason: '', raisedBy: '', raisedAt: '' },
        mergeCandidates: [],
        sourceFindingIds: [],
        updatedAt: stamp,
      }],
    }))
    return id
  },

  confirmIssue: (id) => {
    const issue = get().issues.find((item) => item.id === id)
    if (!issue || !issue.fact.trim() || !issue.basis.trim() || !issue.rootCause.trim()) return
    const rectificationId = issue.rectificationId ?? `RCT-2026-${id.slice(-3)}`
    set((state) => ({
      issues: state.issues.map((item) => item.id === id ? { ...item, status: '待分级审核', updatedAt: stamp } : item),
      rectifications: state.rectifications.some((item) => item.id === rectificationId)
        ? state.rectifications
        : [...state.rectifications, {
            id: rectificationId,
            issueId: id,
            title: `${issue.title}整改`,
            owner: issue.owner,
            status: '待方案审批',
            planStatus: '待提交',
            progress: 0,
            proofCount: 0,
            verifyConclusion: '待责任单位提交整改方案',
            updatedAt: stamp,
            deadline: issue.deadline && issue.deadline !== '待确认' ? issue.deadline : '2026-08-31',
            evidenceChecklist: defaultEvidenceChecklist(),
            followUpCount: 0,
            overdueWarned: false,
          }],
    }))
    return rectificationId
  },

  submitIssueGradingAudit: (id) => {
    const issue = get().issues.find((item) => item.id === id)
    if (!issue || get().audits.some((a) => a.businessId === id && a.status === '待处理')) return
    set((state) => ({
      audits: [...state.audits, {
        id: nextAuditId(state),
        type: '分级审核',
        title: issue.title,
        businessId: id,
        route: `/issues?issue=${id}`,
        applicant: issue.creator || '检查人员',
        status: '待处理',
        node: '内控部门定级复核',
        submittedAt: stamp,
      }],
      issues: state.issues.map((item) => item.id === id ? { ...item, status: '待分级审核', updatedAt: stamp } : item),
    }))
  },

  returnIssueGrading: (id, opinion) => set((state) => ({
    issues: state.issues.map((item) => item.id === id ? { ...item, status: '分级审核不通过', gradingOpinion: opinion, updatedAt: stamp } : item),
  })),

  raiseIssueObjection: (id, reason, raisedBy) => set((state) => ({
    issues: state.issues.map((item) => item.id === id ? {
      ...item,
      status: '异议中',
      objection: { status: '异议中', reason, raisedBy, raisedAt: stamp },
      updatedAt: stamp,
    } : item),
  })),

  resolveIssueObjection: (id, result, opinion) => {
    const issue = get().issues.find((item) => item.id === id)
    if (!issue) return
    set((state) => ({
      issues: state.issues.map((item) => {
        if (item.id !== id) return item
        const objection: WorkflowIssue['objection'] = {
          ...item.objection,
          status: result === '成立' ? '异议成立' : '异议不成立',
          auditorOpinion: opinion,
          resolvedAt: stamp,
        }
        let newStatus: IssueStatus = item.status
        if (result === '成立') {
          newStatus = item.level === '重大' ? '整改中' : '待确认'
        } else {
          newStatus = item.rectificationId ? '整改中' : '待分级审核'
        }
        return { ...item, status: newStatus, objection, updatedAt: stamp }
      }),
    }))
  },

  findMergeCandidates: (id) => {
    const issue = get().issues.find((item) => item.id === id)
    if (!issue) return []
    return get().issues
      .filter((item) => item.id !== id && !item.mergedIntoId && item.owner === issue.owner)
      .slice(0, 3)
      .map((item) => item.id)
  },

  mergeIssues: (targetId, sourceIds) => set((state) => {
    const target = state.issues.find((item) => item.id === targetId)
    if (!target) return state
    const sources = state.issues.filter((item) => sourceIds.includes(item.id))
    const mergedEvidenceIds = Array.from(new Set([...target.evidenceIds, ...sources.flatMap((s) => s.evidenceIds)]))
    return {
      issues: state.issues.map((item) => {
        if (item.id === targetId) {
          return {
            ...item,
            evidenceIds: mergedEvidenceIds,
            updatedAt: stamp,
          }
        }
        if (sourceIds.includes(item.id)) {
          return { ...item, status: '已关闭', mergedIntoId: targetId, updatedAt: stamp }
        }
        return item
      }),
    }
  }),

  // Rectifications
  submitRectificationPlan: (id, planContent) => {
    const rectification = get().rectifications.find((item) => item.id === id)
    if (!rectification) return
    set((state) => ({
      rectifications: state.rectifications.map((item) => item.id === id ? { ...item, planStatus: '待审批', planContent, updatedAt: stamp } : item),
      audits: [...state.audits, {
        id: nextAuditId(state),
        type: '整改方案审批',
        title: `${rectification.title}方案`,
        businessId: id,
        route: `/rectify?rect=${id}`,
        applicant: rectification.owner,
        status: '待处理',
        node: '内控部门方案审核',
        submittedAt: stamp,
      }],
    }))
  },

  approveRectificationPlan: (id, opinion) => set((state) => ({
    rectifications: state.rectifications.map((item) => item.id === id ? {
      ...item,
      planStatus: '审批通过',
      status: '整改中',
      verifyConclusion: opinion || '整改方案已通过，进入整改执行',
      updatedAt: stamp,
    } : item),
  })),

  returnRectificationPlan: (id, opinion) => set((state) => ({
    rectifications: state.rectifications.map((item) => item.id === id ? {
      ...item,
      planStatus: '审批不通过',
      status: '待方案审批',
      verifyConclusion: opinion || '整改方案未通过，请修改后重新提交',
      updatedAt: stamp,
    } : item),
  })),

  addRectificationProof: (id) => set((state) => ({
    rectifications: state.rectifications.map((item) => item.id === id ? {
      ...item,
      proofCount: item.proofCount + 1,
      progress: Math.min(95, item.progress + 15),
      updatedAt: stamp,
    } : item),
  })),

  toggleEvidenceChecklist: (rectificationId, itemId) => set((state) => ({
    rectifications: state.rectifications.map((item) => item.id === rectificationId ? {
      ...item,
      evidenceChecklist: item.evidenceChecklist.map((check) => check.id === itemId ? { ...check, submitted: !check.submitted, uploadedAt: check.submitted ? undefined : stamp } : check),
      updatedAt: stamp,
    } : item),
  })),

  submitRectificationReview: (id) => {
    const rectification = get().rectifications.find((item) => item.id === id)
    if (!rectification || get().audits.some((a) => a.businessId === id && a.status === '待处理')) return
    set((state) => ({
      audits: [...state.audits, {
        id: nextAuditId(state),
        type: '整改复核',
        title: rectification.title,
        businessId: id,
        route: `/rectify?rect=${id}`,
        applicant: rectification.owner,
        status: '待处理',
        node: '内控部门复核',
        submittedAt: stamp,
      }],
    }))
  },

  closeOutRectification: (id, opinion) => {
    const rectification = get().rectifications.find((item) => item.id === id)
    if (!rectification) return
    set((state) => ({
      rectifications: state.rectifications.map((item) => item.id === id ? {
        ...item,
        status: '已销号',
        closeOutAt: stamp,
        verifyConclusion: opinion || '复核通过，已销号',
        updatedAt: stamp,
      } : item),
      issues: state.issues.map((item) => item.id === rectification.issueId ? { ...item, status: '已关闭', updatedAt: stamp } : item),
    }))
  },

  reopenRectification: (id) => set((state) => ({
    rectifications: state.rectifications.map((item) => item.id === id ? { ...item, status: '整改中', closeOutAt: undefined, updatedAt: stamp } : item),
  })),

  scheduleFollowUp: (id, followUpAt) => set((state) => ({
    rectifications: state.rectifications.map((item) => item.id === id ? { ...item, followUpAt, followUpCount: item.followUpCount + 1, updatedAt: stamp } : item),
  })),

  // Reports
  createReport: (id) => {
    const existing = get().reports.find((item) => item.rectificationId === id)
    if (existing) return existing.id
    const rectification = get().rectifications.find((item) => item.id === id)
    const issue = get().issues.find((item) => item.id === rectification?.issueId)
    const reportId = nextReportId(get())
    set((state) => ({
      reports: [...state.reports, {
        id: reportId,
        title: `${issue?.title ?? '整改事项'}整改情况报告`,
        rectificationId: id,
        owner: rectification?.owner ?? '待确认',
        status: '草稿',
        referenceIds: [issue?.id, issue?.workpaperId, ...(issue?.evidenceIds ?? []), id].filter(Boolean) as string[],
        updatedAt: stamp,
      }],
    }))
    return reportId
  },

  generateReportLedger: (id) => set((state) => ({
    reports: state.reports.map((item) => item.id === id && (item.status === '草稿' || item.status === '审核不通过') ? { ...item, status: '待审核', updatedAt: stamp } : item),
  })),

  submitReportAudit: (id) => {
    const report = get().reports.find((item) => item.id === id)
    if (!report || report.status !== '待审核') return
    set((state) => ({
      reports: state.reports.map((item) => item.id === id ? { ...item, status: '审核中', updatedAt: stamp } : item),
      audits: [...state.audits, {
        id: nextAuditId(state),
        type: '报告审核',
        title: report.title,
        businessId: id,
        route: `/report?report=${id}`,
        applicant: '系统管理员',
        status: '待处理',
        node: '内控部门审核',
        submittedAt: stamp,
      }],
    }))
  },

  archiveReport: (id) => set((state) => ({
    reports: state.reports.map((item) => item.id === id && item.status === '审核通过' ? { ...item, status: '已归档', updatedAt: stamp } : item),
  })),

  // Audits
  approveAudit: (id, opinion) => {
    const audit = get().audits.find((item) => item.id === id)
    if (!audit) return
    set((state) => {
      const base = {
        audits: state.audits.map((item) => item.id === id ? { ...item, status: '已通过' as AuditStatus, opinion } : item),
      }
      if (audit.type === '整改复核') {
        return {
          ...base,
          rectifications: state.rectifications.map((item) => item.id === audit.businessId ? { ...item, status: '已整改', progress: 100, verifyConclusion: opinion || '复核通过', updatedAt: stamp } : item),
          issues: state.issues.map((item) => state.rectifications.find((r) => r.id === audit.businessId)?.issueId === item.id ? { ...item, status: '已整改', updatedAt: stamp } : item),
        }
      }
      if (audit.type === '报告审核') {
        return {
          ...base,
          reports: state.reports.map((item) => item.id === audit.businessId ? { ...item, status: '审核通过', auditOpinion: opinion, updatedAt: stamp } : item),
        }
      }
      if (audit.type === '问题确认') {
        return {
          ...base,
          issues: state.issues.map((item) => item.id === audit.businessId ? { ...item, status: '待分级审核', updatedAt: stamp } : item),
        }
      }
      if (audit.type === '分级审核') {
        return {
          ...base,
          issues: state.issues.map((item) => item.id === audit.businessId ? { ...item, status: '整改中', gradedLevel: item.level, gradingAuditor: '当前用户', gradingOpinion: opinion, updatedAt: stamp } : item),
        }
      }
      if (audit.type === '异议审核') {
        return {
          ...base,
          issues: state.issues.map((item) => item.id === audit.businessId ? {
            ...item,
            objection: { ...item.objection, status: '异议不成立', auditorOpinion: opinion, resolvedAt: stamp },
            status: item.rectificationId ? '整改中' : '待分级审核',
            updatedAt: stamp,
          } : item),
        }
      }
      if (audit.type === '整改方案审批') {
        return {
          ...base,
          rectifications: state.rectifications.map((item) => item.id === audit.businessId ? { ...item, planStatus: '审批通过', status: '整改中', verifyConclusion: opinion || '整改方案已通过', updatedAt: stamp } : item),
        }
      }
      if (audit.type === '计划校审') {
        return {
          ...base,
          plans: state.plans.map((item) => item.id === audit.businessId ? { ...item, status: '已立项', blocker: '无阻塞，已立项', next: '进入计划任务拆解分配', updatedAt: stamp } : item),
        }
      }
      return base
    })
  },

  returnAudit: (id, opinion) => {
    const audit = get().audits.find((item) => item.id === id)
    if (!audit) return
    set((state) => {
      const base = {
        audits: state.audits.map((item) => item.id === id ? { ...item, status: '已退回' as AuditStatus, opinion } : item),
      }
      if (audit.type === '报告审核') {
        return {
          ...base,
          reports: state.reports.map((item) => item.id === audit.businessId ? { ...item, status: '审核不通过', auditOpinion: opinion, updatedAt: stamp } : item),
        }
      }
      if (audit.type === '整改复核') {
        return {
          ...base,
          rectifications: state.rectifications.map((item) => item.id === audit.businessId ? { ...item, status: '整改中', verifyConclusion: opinion || '复核退回，请补充整改', updatedAt: stamp } : item),
          issues: state.issues.map((item) => state.rectifications.find((r) => r.id === audit.businessId)?.issueId === item.id ? { ...item, status: '整改中', updatedAt: stamp } : item),
        }
      }
      if (audit.type === '问题确认') {
        return {
          ...base,
          issues: state.issues.map((item) => item.id === audit.businessId ? { ...item, status: '待确认', updatedAt: stamp } : item),
        }
      }
      if (audit.type === '分级审核') {
        return {
          ...base,
          issues: state.issues.map((item) => item.id === audit.businessId ? { ...item, status: '分级审核不通过', gradingOpinion: opinion, updatedAt: stamp } : item),
        }
      }
      if (audit.type === '异议审核') {
        return {
          ...base,
          issues: state.issues.map((item) => item.id === audit.businessId ? {
            ...item,
            objection: { ...item.objection, status: '异议不成立', auditorOpinion: opinion, resolvedAt: stamp },
            status: item.rectificationId ? '整改中' : '待分级审核',
            updatedAt: stamp,
          } : item),
        }
      }
      if (audit.type === '整改方案审批') {
        return {
          ...base,
          rectifications: state.rectifications.map((item) => item.id === audit.businessId ? { ...item, planStatus: '审批不通过', status: '待方案审批', verifyConclusion: opinion || '方案未通过，请修改', updatedAt: stamp } : item),
        }
      }
      if (audit.type === '计划校审') {
        return {
          ...base,
          plans: state.plans.map((item) => item.id === audit.businessId ? { ...item, status: '待校审', blocker: opinion || '校审退回，请修改', updatedAt: stamp } : item),
        }
      }
      return base
    })
  },

  // Plans
  createPlan: (input) => {
    const id = input.id ?? nextPlanId(get())
    set((state) => {
      const exists = state.plans.some((p) => p.id === id)
      if (exists) {
        return {
          plans: state.plans.map((item) => item.id === id ? { ...item, ...input, updatedAt: stamp } : item),
        }
      }
      return {
        plans: [...state.plans, {
          id,
          name: input.name || '未命名计划',
        type: input.type || '专项检查',
        source: input.source || '手工创建',
        status: '草稿',
        unit: input.unit || '待填写',
        unitLevel: input.unitLevel || '二级企业',
        checkDomain: input.checkDomain || '',
        riskTheme: input.riskTheme || '',
        owner: input.owner || '当前用户',
        period: input.period || '待确定',
        budget: input.budget || '待评估',
        basis: input.basis || '待补充',
        objective: input.objective || '待填写',
        avoidanceCheck: input.avoidanceCheck || '已通过',
        blocker: '草稿待完善',
        next: '完善并提交校审',
        approvals: [],
        needParty: input.needParty ?? true,
        needBoard: input.needBoard ?? false,
      }],
    }
  })
  return id
},

  updatePlan: (id, patch) => set((state) => ({
    plans: state.plans.map((item) => item.id === id ? { ...item, ...patch, updatedAt: stamp } : item),
  })),

  submitPlanForApproval: (id) => {
    const plan = get().plans.find((item) => item.id === id)
    if (!plan) return
    const chain = buildApprovalChain(plan.needParty, plan.needBoard, plan.owner)
    set((state) => ({
      plans: state.plans.map((item) => item.id === id ? { ...item, status: '待校审', approvals: chain, blocker: '待线上校审', next: '审批链流转中', updatedAt: stamp } : item),
      audits: [...state.audits, {
        id: nextAuditId(state),
        type: '计划校审',
        title: plan.name,
        businessId: id,
        route: `/plan-workbench?plan=${id}`,
        applicant: plan.owner,
        status: '待处理',
        node: '内控部门审核',
        submittedAt: stamp,
      }],
    }))
  },

  approvePlanNode: (id, node, opinion) => set((state) => {
    const plan = state.plans.find((item) => item.id === id)
    if (!plan) return state
    const updatedApprovals = plan.approvals.map((n) => n.node === node ? { ...n, status: '通过' as const, opinion, date: today } : n)
    const allPassed = updatedApprovals.every((n) => n.status === '通过')
    return {
      plans: state.plans.map((item) => item.id === id ? {
        ...item,
        approvals: updatedApprovals,
        status: allPassed ? '已立项' : item.status,
        blocker: allPassed ? '无阻塞，已立项' : `待${updatedApprovals.find((n) => n.status !== '通过')?.node}`,
        next: allPassed ? '进入计划任务拆解分配' : '审批链流转中',
        updatedAt: stamp,
      } : item),
    }
  }),

  rejectPlanNode: (id, node, opinion) => set((state) => ({
    plans: state.plans.map((item) => item.id === id ? {
      ...item,
      approvals: item.approvals.map((n) => n.node === node ? { ...n, status: '不通过' as const, opinion, date: today } : n),
      status: '待校审',
      blocker: opinion || '校审不通过，请修改',
      next: '修改后重新提交校审',
      updatedAt: stamp,
    } : item),
  })),
}))
