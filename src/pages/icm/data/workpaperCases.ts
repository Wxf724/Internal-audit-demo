type PaperType = '问题底稿' | '合规底稿' | '待判定'
type PaperStatus = '草稿' | '取证中' | '一级复核' | '二级复核' | '交叉复核' | '待归档' | '已入库' | '整改中' | '整改销号' | '留档锁定' | '调阅审批'
export type WorkpaperCase = {
  projectId?: string
  programIds?: string[]
  evidenceIds?: string[]
  reviewState?: '草稿' | '待复核' | '退回修改' | '已复核'
  version?: number
  history?: import('./projectWork').WorkEvent[]
  issueId?: string
  id: string
  title: string
  unit: string
  field: string
  type: PaperType
  status: PaperStatus
  source: string
  owner: string
  createdAt: string
  process: string
  evidenceSheet: {
    id: string
    title: string
    confirm: string
    parsed: string[]
  }
  reviewFinding: {
    id: string
    title: string
    confidence: string
    rule: string
  }
  dataSnapshot: {
    id: string
    package: string
    files: string[]
  }
  reviewChain: Array<{
    node: string
    owner: string
    status: string
    opinion: string
  }>
  issue?: {
    id: string
    title: string
    level: string
    department: string
    owner: string
    deadline: string
    rectifyStatus: string
  }
  body: {
    procedure: string
    facts: string
    conclusion: string
    next: string
  }
}

export const seedCases: WorkpaperCase[] = [
  {
    id: 'WP-CG-2026-0451',
    title: '工程物资采购合同拆分规避公开招标核查底稿',
    unit: '华北装备制造集团西北分公司',
    field: '采购 / 合同',
    type: '问题底稿',
    status: '整改中',
    source: '智能审查结果 SUS-01 自动生成',
    owner: '张衡',
    createdAt: '2026-06-27 10:20',
    process: '终审确认后，系统解析取证单并下发问题整改',
    evidenceSheet: {
      id: 'EVS-CG-2026-0451',
      title: '合同台账、招标方案、采购包划分审批记录取证单',
      confirm: '被检查单位已线上确认，采购部负责人签字',
      parsed: ['同一工程项目 12 日内签订 3 份合同', '三份合同供应商一致，合计金额 1180 万', '单份合同金额均低于公开招标阈值'],
    },
    reviewFinding: {
      id: 'SUS-01',
      title: '三份合同疑似拆分规避公开招标',
      confidence: '92%',
      rule: 'R-BID-001 同项目短周期多合同聚合规则',
    },
    dataSnapshot: {
      id: 'SNAP-CG-20260627-01',
      package: '采购合同结果包 / 招标评分结果包',
      files: ['2026工程物资采购合同台账.xlsx', '招标方案审批表.pdf', '三份合同正本.zip'],
    },
    reviewChain: [
      { node: '一级复核', owner: '李娜', status: '通过', opinion: '取证单、合同台账和审批记录一致。' },
      { node: '二级复核', owner: '郑刚', status: '通过', opinion: '认定为重要控制缺陷，建议形成问题。' },
      { node: '交叉复核', owner: '王锐', status: '通过', opinion: '资金付款链路与合同拆分事实相互印证。' },
    ],
    issue: {
      id: 'ISS-CG-077',
      title: '拆分合同规避公开招标',
      level: '重大',
      department: '采购管理部',
      owner: '采购部负责人 / 招采中心主任',
      deadline: '2026-07-15',
      rectifyStatus: '整改中',
    },
    body: {
      procedure: '抽取 2026 年 1-5 月工程物资采购合同台账，按项目编号、供应商、合同签订日期、合同金额进行聚合比对，并调阅采购包划分审批记录。',
      facts: '同一工程项目在 12 日内连续签订 HT-1182、HT-1183、HT-1184 三份合同，供应商均为宁北机电设备有限公司，合计金额 1180 万元，采购包划分说明缺失。',
      conclusion: '该事项存在通过拆分合同规避公开招标的重大控制缺陷，已由问题底稿确认问题并进入整改闭环。',
      next: '系统已匹配责任部门为采购管理部，整改责任人为采购部负责人和招采中心主任，整改状态为推进中。',
    },
  },
  {
    id: 'WP-PAY-2026-0455',
    title: '中标后预付款比例超合同约定核查底稿',
    unit: '财务共享中心',
    field: '资金 / 合同履约',
    type: '问题底稿',
    status: '交叉复核',
    source: '资金审查规则 SUS-03 自动生成',
    owner: '王锐',
    createdAt: '2026-06-28 09:45',
    process: '交叉复核确认后，问题底稿将生成问题',
    evidenceSheet: {
      id: 'EVS-PAY-2026-0455',
      title: '付款审批单、银行回单、合同付款条款取证单',
      confirm: '财务部已确认付款记录，业务部门待补充验收说明',
      parsed: ['合同约定预付比例 30%', '实际预付比例 50%', '验收节点晚于付款节点 9 天'],
    },
    reviewFinding: {
      id: 'SUS-03',
      title: '中标后预付款比例超合同约定',
      confidence: '88%',
      rule: 'R-PAY-003 付款比例与合同条款比对规则',
    },
    dataSnapshot: {
      id: 'SNAP-PAY-20260628-03',
      package: '资金付款结果包',
      files: ['付款审批流水.csv', '银行回单.pdf', '合同付款条款截图.png'],
    },
    reviewChain: [
      { node: '一级复核', owner: '张衡', status: '通过', opinion: '付款比例异常属实。' },
      { node: '二级复核', owner: '郑刚', status: '通过', opinion: '需核验是否存在特批依据。' },
      { node: '交叉复核', owner: '李娜', status: '处理中', opinion: '正在比对合同补充协议和验收资料。' },
    ],
    body: {
      procedure: '从资金系统抽取大额付款流水，与合同文本中的付款条款、验收单据及审批流进行三方比对。',
      facts: '合同约定预付款比例为 30%，实际于验收前支付 50%，涉及金额 620 万元；审批流程中未见超比例付款专项说明。',
      conclusion: '目前已形成问题底稿，待交叉复核确认后进入问题管理并下发整改。',
      next: '需补充合同补充协议、业务特批依据或验收提前确认材料。',
    },
  },
  {
    id: 'WP-SUP-2026-0456',
    title: '陪标供应商联系人重复情况核查底稿',
    unit: '华北装备制造集团西北分公司',
    field: '供应商管理',
    type: '问题底稿',
    status: '取证中',
    source: '供应商关联核验 SUS-02 自动生成',
    owner: '李娜',
    createdAt: '2026-06-29 15:30',
    process: '先补齐取证单，再提交一级复核',
    evidenceSheet: {
      id: 'EVS-SUP-2026-0456',
      title: '供应商报名资料、联系人访谈、投标文件元数据取证单',
      confirm: '被检查单位尚未确认，需补充两家供应商独立性说明',
      parsed: ['两家供应商联系人手机号归属同一经办人', '投标文件元数据作者一致', '报价差异 0.8%'],
    },
    reviewFinding: {
      id: 'SUS-02',
      title: '两家陪标供应商报价与联系人异常相似',
      confidence: '84%',
      rule: 'R-BID-002 供应商联系人与文件元数据相似规则',
    },
    dataSnapshot: {
      id: 'SNAP-SUP-20260629-02',
      package: '供应商准入资料补充包',
      files: ['供应商报名表.xlsx', '投标文件元数据导出.xlsx', '联系人访谈纪要.docx'],
    },
    reviewChain: [
      { node: '一级复核', owner: '张衡', status: '未提交', opinion: '等待取证单确认。' },
      { node: '二级复核', owner: '郑刚', status: '未开始', opinion: '-' },
      { node: '交叉复核', owner: '王锐', status: '未开始', opinion: '-' },
    ],
    body: {
      procedure: '比对供应商报名资料、联系人、投标文件元数据和报价文件格式，并对采购经办人开展访谈。',
      facts: '两家供应商联系人存在重复线索，投标文件元数据高度一致，但目前缺少工商关联关系和供应商独立出具说明。',
      conclusion: '暂不生成问题，需完成取证单补证和被检查单位确认。',
      next: '补充供应商工商关系、联系人授权说明、投标文件原始属性截图。',
    },
  },
  {
    id: 'WP-INV-2026-0460',
    title: '研发设备采购审批链完整性抽样检查底稿',
    unit: '研发中心',
    field: '采购 / 研发费用',
    type: '合规底稿',
    status: '已入库',
    source: '检查人员人工抽样生成',
    owner: '赵明',
    createdAt: '2026-06-30 11:10',
    process: '合规底稿终审通过后入库留痕',
    evidenceSheet: {
      id: 'EVS-INV-2026-0460',
      title: '研发设备采购申请、预算审批、验收入库记录取证单',
      confirm: '无需问题确认，已作为合规底稿归档留痕',
      parsed: ['抽样 8 笔采购均有预算审批', '验收入库记录完整', '未发现越权审批'],
    },
    reviewFinding: {
      id: '-',
      title: '无智能审查异常，来源为人工抽样',
      confidence: '-',
      rule: '人工抽样检查程序',
    },
    dataSnapshot: {
      id: 'SNAP-INV-20260630-01',
      package: '研发设备采购资料包',
      files: ['研发设备采购申请.zip', '预算审批记录.xlsx', '验收入库单.pdf'],
    },
    reviewChain: [
      { node: '一级复核', owner: '李娜', status: '通过', opinion: '抽样资料完整。' },
      { node: '二级复核', owner: '郑刚', status: '通过', opinion: '正常结论成立。' },
      { node: '交叉复核', owner: '王锐', status: '不适用', opinion: '合规底稿无需交叉复核。' },
    ],
    body: {
      procedure: '按金额分层抽取 8 笔研发设备采购事项，核查申请、预算、审批、验收、入库资料是否完整。',
      facts: '抽样事项均完成预算审批和验收入库，未发现超预算采购、未验收付款或审批缺失。',
      conclusion: '未发现控制缺陷，作为合规底稿入库，不生成问题。',
      next: '底稿和取证单已入库，可按权限申请调阅。',
    },
  },
  {
    id: 'WP-HR-2026-0462',
    title: '劳务外包人员考勤与结算一致性核查底稿',
    unit: '综合服务中心',
    field: '人力 / 合同结算',
    type: '问题底稿',
    status: '留档锁定',
    source: '人工检查录入后补充系统取数',
    owner: '陈珂',
    createdAt: '2026-06-24 16:40',
    process: '整改销号后，底稿和取证单留档锁定',
    evidenceSheet: {
      id: 'EVS-HR-2026-0462',
      title: '劳务考勤、外包合同、月度结算单取证单',
      confirm: '被检查单位已确认，整改佐证已复核',
      parsed: ['3 名人员考勤缺失但参与结算', '合同约定结算口径与实际结算不一致', '补扣款已完成'],
    },
    reviewFinding: {
      id: 'MAN-04',
      title: '人工复核发现劳务结算异常',
      confidence: '人工确认',
      rule: '劳务结算与考勤一致性检查程序',
    },
    dataSnapshot: {
      id: 'SNAP-HR-20260624-04',
      package: '劳务外包结算资料包',
      files: ['外包人员考勤表.xlsx', '劳务合同.pdf', '整改扣款凭证.pdf'],
    },
    reviewChain: [
      { node: '一级复核', owner: '李娜', status: '通过', opinion: '事实清楚，金额可核。' },
      { node: '二级复核', owner: '郑刚', status: '通过', opinion: '已形成一般问题并整改。' },
      { node: '交叉复核', owner: '王锐', status: '通过', opinion: '整改佐证与财务扣款记录一致。' },
    ],
    issue: {
      id: 'ISS-HR-090',
      title: '劳务外包结算审核不严',
      level: '一般',
      department: '综合服务中心',
      owner: '综合服务中心主任',
      deadline: '2026-06-28',
      rectifyStatus: '已销号',
    },
    body: {
      procedure: '核对外包合同、人员考勤和月度结算单，抽查异常人员的入场记录和付款凭证。',
      facts: '发现 3 名外包人员部分月份考勤缺失但参与结算，涉及金额 4.6 万元；责任部门已完成补扣款。',
      conclusion: '问题已整改销号，底稿、取证单和整改佐证留档锁定。',
      next: '后续仅支持审批调阅，不允许修改底稿和取证单。',
    },
  },
  {
    id: 'WP-ARCH-2026-0468',
    title: '历史整改底稿调阅申请记录',
    unit: '集团内控监督部',
    field: '档案调阅',
    type: '合规底稿',
    status: '调阅审批',
    source: '报告中心引用触发调阅申请',
    owner: '档案管理员',
    createdAt: '2026-07-01 09:00',
    process: '已入库底稿调阅需走审批，不允许直接修改',
    evidenceSheet: {
      id: 'EVS-ARCH-2026-0468',
      title: '历史底稿调阅审批单',
      confirm: '待内控负责人审批',
      parsed: ['调阅目的为专项报告引用', '调阅范围限定底稿正文和取证单摘要', '附件下载权限待审批'],
    },
    reviewFinding: {
      id: '-',
      title: '非审查线索，来源为调阅申请',
      confidence: '-',
      rule: '档案调阅审批规则',
    },
    dataSnapshot: {
      id: 'ARCHIVE-20260701-01',
      package: '归档底稿库',
      files: ['调阅申请单.pdf', '审批记录待生成'],
    },
    reviewChain: [
      { node: '一级复核', owner: '档案管理员', status: '通过', opinion: '调阅范围合规。' },
      { node: '二级复核', owner: '郑刚', status: '待审批', opinion: '等待内控负责人审批。' },
      { node: '交叉复核', owner: '-', status: '不适用', opinion: '档案调阅不触发交叉复核。' },
    ],
    body: {
      procedure: '核验申请人、调阅目的、调阅范围、下载权限和有效期。',
      facts: '报告中心申请引用历史合规底稿用于说明已覆盖检查范围，需调阅正文和取证单摘要。',
      conclusion: '该事项为调阅审批流程，不生成问题，不进入整改。',
      next: '审批通过后开放 7 日只读权限，下载需单独授权。',
    },
  },
]
