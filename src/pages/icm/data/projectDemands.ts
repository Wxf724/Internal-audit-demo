type DemandItem = { name: string; owner: string; scale: string; method: string; status: string; due: string }
type DemandCategory = { key: string; label: string; note: string; items: DemandItem[] }

// 按央国企内控检查资料要求分类归集（演示 Mock 数据）
export const demandCategories: DemandCategory[] = [
  {
    key: 'system',
    label: '制度与授权文件',
    note: '制度办法、职责分工与授权审批依据',
    items: [
      { name: '采购与招投标管理制度', owner: '内控监督部', scale: '6 份制度文件', method: '制度库调取', status: '已采集', due: '2026-06-24' },
      { name: '授权审批权限表（采购/资金）', owner: '综合管理部', scale: '2 份清单', method: '资料上传', status: '已采集', due: '2026-06-24' },
      { name: '不相容岗位分离清单', owner: '人力资源部', scale: '1 份台账', method: '手工补录', status: '待补充', due: '2026-07-02' },
    ],
  },
  {
    key: 'business',
    label: '业务台账与合同',
    note: '采购、招标、合同履约业务底册',
    items: [
      { name: '采购合同台账', owner: '采购部', scale: '86 行', method: 'Mock 批量导入', status: '已采集', due: '2026-06-26' },
      { name: '招标文件与评分表', owner: '招采中心', scale: '14 份标段', method: '资料上传', status: '已采集', due: '2026-06-27' },
      { name: '合同履约与验收记录', owner: '采购部', scale: '38 份', method: '资料上传', status: '待完善', due: '2026-07-03' },
    ],
  },
  {
    key: 'approval',
    label: '审批留痕与流水',
    note: '关键控制节点的审批与执行记录',
    items: [
      { name: '付款审批流水', owner: '财务部', scale: '23 行', method: 'Mock 取数', status: '已采集', due: '2026-06-28' },
      { name: '采购申请与立项审批单', owner: '采购部', scale: '31 份', method: '资料上传', status: '已采集', due: '2026-06-28' },
      { name: '评标过程与定标审批记录', owner: '招采中心', scale: '2 份缺失', method: '手工补录', status: '待补充', due: '2026-07-02' },
    ],
  },
  {
    key: 'counterparty',
    label: '供应商与相对方',
    note: '供应商准入、评价与关联关系核验资料',
    items: [
      { name: '供应商准入审批资料', owner: '供应链管理部', scale: '32 家', method: '手工补录', status: '待补充', due: '2026-07-02' },
      { name: '供应商评价与考核记录', owner: '供应链管理部', scale: '24 份', method: '资料上传', status: '待完善', due: '2026-07-04' },
      { name: '供应商工商与关联关系信息', owner: '内控监督部', scale: '32 条', method: 'Mock 取数', status: '已采集', due: '2026-06-30' },
    ],
  },
  {
    key: 'rectify',
    label: '整改与佐证',
    note: '历史缺陷整改与本期佐证材料',
    items: [
      { name: '上年度内控缺陷整改台账', owner: '内控监督部', scale: '1 份台账', method: '制度库调取', status: '已采集', due: '2026-06-25' },
      { name: '本期整改佐证材料', owner: '责任部门', scale: '待提交', method: '资料上传', status: '待补充', due: '2026-07-15' },
    ],
  },
]

export const projectDemands = demandCategories.flatMap((category) => category.items.map((item, index) => ({ ...item, id: `DEM-${category.key}-${index + 1}`, category: category.key, projectId: 'AUD-PL-2026-001' })))

