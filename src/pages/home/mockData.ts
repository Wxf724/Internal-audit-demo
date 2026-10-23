import {
  BadgeCheck,
  ClipboardCheck,
  Database,
  FileCheck2,
  FileDown,
  Fingerprint,
  GitBranch,
  Landmark,
  Radar,
  Route,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react'

export const leadershipKpis = [
  { label: '疑似围标风险', value: '3', unit: '项', tone: 'danger', note: '均已形成证据链' },
  { label: '涉及金额', value: '1,180', unit: '万', tone: 'warn', note: '合同拆分逼近招标线' },
  { label: '整改闭环率', value: '67', unit: '%', tone: 'success', note: '1 项已销号，2 项推进中' },
  { label: '报告引用项', value: '12', unit: '条', tone: 'info', note: '底稿、问题、法规、整改' },
]

export const navGroups = [
  {
    key: 'A',
    title: '准备与依据',
    items: [
      { id: 'overview', label: '监管价值总览', icon: Landmark },
      { id: 'plan', label: '计划编制审批', icon: ClipboardCheck },
      { id: 'dispatch', label: '派发进场', icon: Route },
      { id: 'standard', label: '规则依据库', icon: ShieldCheck },
    ],
  },
  {
    key: 'B',
    title: '智能检查',
    items: [
      { id: 'data', label: '数据采集', icon: Database },
      { id: 'review', label: '智能审查', icon: Radar },
      { id: 'walkthrough', label: '穿行测试', icon: GitBranch },
      { id: 'evidence', label: '底稿取证', icon: Fingerprint },
    ],
  },
  {
    key: 'C',
    title: '成果处置',
    items: [
      { id: 'issues', label: '问题整改', icon: TriangleAlert },
      { id: 'report', label: '报告导出', icon: FileDown },
    ],
  },
]

export const chainSteps = [
  { id: 'plan', label: '计划审批', status: '党委前置已校验', metric: '通过' },
  { id: 'dispatch', label: '派发进场', status: '检查组已确认', metric: '4 人' },
  { id: 'data', label: '数据采集', status: '采购包已准备', metric: '86 条' },
  { id: 'review', label: '智能审查', status: '围标规则命中', metric: '92%' },
  { id: 'walkthrough', label: '穿行测试', status: '关键控制点验证', metric: '5/7' },
  { id: 'evidence', label: '底稿取证', status: '阳性底稿形成', metric: '2 份' },
  { id: 'issues', label: '整改闭环', status: '派单并跟踪', metric: '3 项' },
  { id: 'report', label: '报告输出', status: '可生成简版文件', metric: 'Word/PDF' },
]

export const caseProfile = {
  taskId: 'T-2026-CG-018',
  title: '采购围标风险专项内控检查',
  unit: '华北装备制造集团西北分公司',
  object: '2026 年 1-5 月工程物资采购与合同签订事项',
  owner: '集团内控监督部',
  team: ['张衡 · 检查组长', '李娜 · 合同核验', '王锐 · 资金取数', '赵明 · 外部专家'],
  valueLine: '把“采购围标风险”从线索识别、证据固化、问题定级到整改报告一次讲清。',
}

export const rules = [
  {
    id: 'RULE-BID-001',
    name: '拆分采购规避公开招标识别',
    source: '集团采购管理办法第 18 条',
    condition: '同一项目、同一供应商、短周期内多合同金额接近招标线',
    result: '重大风险，要求人工复核',
  },
  {
    id: 'RULE-BID-002',
    name: '陪标供应商异常相似识别',
    source: '招标投标合规指引',
    condition: '报价差异小、联系人/账户/地址存在重复或强关联',
    result: '重要风险，进入穿行测试',
  },
  {
    id: 'RULE-PAY-003',
    name: '中标后大额预付款异常',
    source: '资金支付制度第 8 条',
    condition: '预付款比例高于合同约定或收款方存在关联嫌疑',
    result: '重大风险，生成取证单',
  },
]

export const dataPackages = [
  { name: '采购合同台账', owner: '采购部', rows: '86', quality: 96, status: '已校验' },
  { name: '招标文件与评分表', owner: '招采中心', rows: '14', quality: 92, status: '已校验' },
  { name: '供应商准入资料', owner: '供应链管理部', rows: '32', quality: 88, status: '待补充' },
  { name: '资金支付流水', owner: '财务部', rows: '23', quality: 94, status: '已校验' },
]

export const agents = [
  { name: '采购审查智能体', domain: '采购', status: '已完成', progress: 100, hits: 2 },
  { name: '合同审查智能体', domain: '合同', status: '已完成', progress: 100, hits: 3 },
  { name: '资金审查智能体', domain: '资金', status: '运行中', progress: 72, hits: 1 },
  { name: '供应商关联核验智能体', domain: '供应商', status: '待复核', progress: 86, hits: 2 },
]

export const findings = [
  {
    id: 'SUS-01',
    title: '三份合同疑似拆分规避公开招标',
    level: '重大',
    confidence: 92,
    sample: 'HT-2026-1182/1183/1184 合计 1,180 万，单笔均低于 400 万招标线。',
    evidence: '合同台账、招标文件、供应商一致性比对记录',
    status: '人工复核确认',
  },
  {
    id: 'SUS-02',
    title: '两家陪标供应商报价与联系人异常相似',
    level: '重要',
    confidence: 84,
    sample: '投标报价差异 0.8%，联系人手机号归属同一经办人。',
    evidence: '投标文件元数据、联系人登记表、供应商准入资料',
    status: '需补充取证',
  },
  {
    id: 'SUS-03',
    title: '中标后预付款比例超合同约定',
    level: '重大',
    confidence: 88,
    sample: '合同约定预付 30%，实际付款 50%，金额 620 万。',
    evidence: '付款审批单、资金流水、合同付款条款',
    status: '人工复核确认',
  },
]

export const walkthroughNodes = [
  { label: '采购需求提出', owner: '使用部门', result: '通过', note: '需求审批完整' },
  { label: '招标方案审批', owner: '招采中心', result: '异常', note: '采购包拆分依据不足' },
  { label: '供应商报名', owner: '供应链管理部', result: '关注', note: '两家供应商联系人重复' },
  { label: '评标定标', owner: '评标委员会', result: '关注', note: '评分差距过小' },
  { label: '合同签订', owner: '合同管理岗', result: '异常', note: '三份合同短期连续签订' },
  { label: '付款审批', owner: '财务部', result: '异常', note: '预付比例偏高' },
  { label: '验收入库', owner: '仓储岗', result: '通过', note: '验收记录齐全' },
]

export const evidenceChain = [
  { id: 'EV-0312', type: '取证单', title: '调阅采购合同台账及招标文件', owner: '李娜', status: '已归档' },
  { id: 'EV-0318', type: '取证单', title: '调取大额付款流水及审批单', owner: '王锐', status: '已归档' },
  { id: 'WP-0451', type: '阳性底稿', title: '合同金额拆分规避招标核查', owner: '张衡', status: '审定通过' },
  { id: 'WP-0455', type: '阳性底稿', title: '大额预付款异常核查', owner: '张衡', status: '复核中' },
]

export const issues = [
  {
    id: 'ISS-077',
    title: '拆分合同规避公开招标',
    level: '重大',
    owner: '采购部',
    deadline: '2026-07-10',
    progress: 55,
    status: '整改中',
  },
  {
    id: 'ISS-079',
    title: '陪标供应商管理失控',
    level: '重要',
    owner: '供应链管理部',
    deadline: '2026-07-18',
    progress: 30,
    status: '待整改',
  },
  {
    id: 'ISS-081',
    title: '预付款比例控制不严',
    level: '重大',
    owner: '财务部',
    deadline: '2026-07-12',
    progress: 80,
    status: '待复核',
  },
]

export const reportSections = [
  '检查背景与范围',
  '采购围标风险发现情况',
  '证据链与人工复核结论',
  '问题定级与责任建议',
  '整改要求与后续监督安排',
]

export const reportCitations = [
  'WP-0451 合同金额拆分规避招标核查底稿',
  'EV-0312 采购合同台账与招标文件取证单',
  'ISS-077 拆分合同规避公开招标问题',
  '集团采购管理办法第 18 条',
  '整改任务 RC-077 阶段性佐证',
]

export const sectionIconMap = {
  overview: BadgeCheck,
  plan: ClipboardCheck,
  dispatch: Route,
  standard: ShieldCheck,
  data: Database,
  review: Radar,
  walkthrough: GitBranch,
  evidence: Fingerprint,
  issues: TriangleAlert,
  report: FileCheck2,
}
