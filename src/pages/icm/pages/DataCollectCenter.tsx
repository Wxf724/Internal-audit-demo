import { useState } from 'react'
import { ChevronDown, Database, FileUp, Search, ShieldCheck } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { Button, Card, DataTable, DetailLine, Kpi, PageFrame, Tag, Toolbar, type Tone } from '../components/IcmPageKit'
import { dataCollect, overview } from '../data'

type Tab = 'demands' | 'materials' | 'packages' | 'quality'

const navItems: { key: Tab; label: string; note: string }[] = [
  { key: 'demands', label: '数据需求与文件', note: '需求分派、提交与文件入库' },
  { key: 'materials', label: '材料清单', note: '按归档节点核验完整性' },
  { key: 'packages', label: '数据包管理', note: '审查数据包及来源范围' },
  { key: 'quality', label: '质量校验', note: '字段质量与映射规则' },
]

const materialChecklist = [
  { stage: '计划准备', node: '检查计划', type: '立项类', required: '是', count: 1, material: '2026年度采购围标风险专项检查计划.pdf', status: '已齐' },
  { stage: '计划准备', node: '资料需求清单', type: '备查类', required: '是', count: 1, material: '采购与合同专项资料需求清单.xlsx', status: '已齐' },
  { stage: '检查执行', node: '供应商准入资料', type: '证明类', required: '是', count: 0, material: '需补充供应商准入审批、评价记录', status: '待补充' },
  { stage: '检查执行', node: '招标评分表', type: '证明类', required: '是', count: 2, material: '评分表扫描件.zip', status: '待完善' },
  { stage: '检查执行', node: '付款审批流水', type: '证明类', required: '是', count: 1, material: '大额付款审批流水.xlsx', status: '已齐' },
  { stage: '整改跟踪', node: '整改佐证', type: '整改类', required: '是', count: 0, material: '待责任部门提交整改佐证', status: '待补充' },
]

type DemandItem = { name: string; owner: string; scale: string; method: string; status: string; due: string }
type DemandCategory = { key: string; label: string; note: string; items: DemandItem[] }

// 按央国企内控检查资料要求分类归集（演示 Mock 数据）
const demandCategories: DemandCategory[] = [
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

function toneForStatus(status: string): Tone {
  if (['已采集', '已入库', '可审查', '已齐', '通过'].includes(status)) return 'green'
  if (['待补充', '待完善', '关注'].includes(status)) return 'amber'
  if (status === '待处理') return 'red'
  return 'blue'
}

export default function DataCollectCenter() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const requestedTab = searchParams.get('view')
  const tab = navItems.some((item) => item.key === requestedTab) ? requestedTab as Tab : 'demands'
  const [expandedPackages, setExpandedPackages] = useState<string[]>([dataCollect.resultPackages[0]?.id ?? ''])
  const [keyword, setKeyword] = useState('')
  const active = navItems.find((item) => item.key === tab) ?? navItems[0]
  const togglePackage = (id: string) => setExpandedPackages((ids) => ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id])

  const [demandCat, setDemandCat] = useState<string>('all')
  const allDemandItems = demandCategories.flatMap((cat) => cat.items)
  const demandCount = allDemandItems.length
  const collectedCount = allDemandItems.filter((item) => item.status === '已采集').length
  const packageCount = dataCollect.resultPackages.filter((item) => item.status === '可审查').length
  const qualityScore = Math.round(dataCollect.quality.reduce((sum, item) => sum + item.score, 0) / Math.max(dataCollect.quality.length, 1))
  const incompleteCount = materialChecklist.filter((item) => item.status !== '已齐').length

  const shownCategories = demandCat === 'all' ? demandCategories : demandCategories.filter((cat) => cat.key === demandCat)

  const content = tab === 'demands'
    ? <div className="icm-collect-split">
        <div className="icm-collect-demands">
          <div className="icm-collect-cat-filter">
            <button className={demandCat === 'all' ? 'active' : ''} type="button" onClick={() => setDemandCat('all')}>全部（{demandCount}）</button>
            {demandCategories.map((cat) => <button className={demandCat === cat.key ? 'active' : ''} type="button" key={cat.key} onClick={() => setDemandCat(cat.key)}>{cat.label}（{cat.items.length}）</button>)}
          </div>
          {shownCategories.map((cat) => {
            const done = cat.items.filter((item) => item.status === '已采集').length
            return <Card key={cat.key} title={cat.label} note={cat.note} action={<Tag tone={done === cat.items.length ? 'green' : 'amber'}>{done}/{cat.items.length} 已采集</Tag>}>
              <DataTable columns={['需求事项', '责任部门', '数据规模', '采集方式', '状态', '提交期限']} rows={cat.items.map((item) => [item.name, item.owner, item.scale, item.method, <Tag tone={toneForStatus(item.status)}>{item.status}</Tag>, item.due])} />
            </Card>
          })}
        </div>
        <aside className="icm-collect-files">
          <Card title="已接收文件" note="文件关联需求后进入质量校验">
            <div className="icm-collect-file-list">
              {dataCollect.uploads.map((item) => (
                <div className="icm-collect-file-item" key={item.id}>
                  <div className="icm-collect-file-head"><FileUp size={14} /><strong>{item.fileName}</strong></div>
                  <div className="icm-collect-file-meta"><span>{item.owner}</span><Tag tone={toneForStatus(item.status)}>{item.status}</Tag></div>
                  <div className="icm-collect-file-link">关联需求：{item.linkedDemand}</div>
                </div>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    : tab === 'materials'
      ? <Card title="归档材料清单" note="缺失材料须补充说明及预计提交时间"><DataTable columns={['业务阶段', '归档节点', '材料类型', '必填', '已收数量', '材料说明', '状态', '操作']} rows={materialChecklist.map((item) => [item.stage, item.node, item.type, item.required, item.count, item.material, <Tag tone={toneForStatus(item.status)}>{item.status}</Tag>, item.status === '已齐' ? <button className="icm-link" type="button">查看</button> : <Button type="primary-soft" icon={<FileUp size={14} />}>补充材料</Button>])} /></Card>
      : tab === 'packages'
        ? <Card title="审查数据包" note="数据包通过质量校验后可在智能审查中引用"><div className="icm-package-tree">{dataCollect.resultPackages.map((pkg) => { const open = expandedPackages.includes(pkg.id); return <div className="icm-package-tree-node" key={pkg.id}><button className="icm-package-tree-head" type="button" onClick={() => togglePackage(pkg.id)}><ChevronDown className={open ? 'active' : ''} size={16} /><span><strong>{pkg.name}</strong><em>{pkg.id}</em></span><Tag tone={toneForStatus(pkg.status)}>{pkg.status}</Tag></button>{open ? <div className="icm-package-tree-children">{pkg.includes.map((item) => <div key={item}><span />{item}</div>)}<p>来源说明：已关联本次检查任务的数据需求与接收文件。</p></div> : null}</div> })}</div></Card>
        : <div className="icm-data-content-stack"><Card title="质量校验结果" note="存在异常时不得直接用于审查结论"><DataTable columns={['校验规则', '目标字段', '结果', '得分', '处理建议']} rows={dataCollect.quality.map((item) => [item.rule, item.target, <Tag tone={toneForStatus(item.result)}>{item.result}</Tag>, <b style={{ color: item.score >= 90 ? '#1d7a46' : '#9a6700' }}>{item.score}</b>, item.fixHint])} /></Card><Card title="字段映射口径" note="统一业务字段定义，避免同名异义"><DataTable columns={['源字段', '标准字段', '业务含义']} rows={[['vendorName', 'supplier_name', '供应商名称'], ['contractAmount', 'contract_amount', '合同金额'], ['signDate', 'sign_date', '签署日期'], ['approvalNode', 'approval_node', '审批节点']]} /></Card></div>

  return <PageFrame title="数据采集" subtitle="围绕当前检查任务统一办理数据需求、材料归档、数据包入库和质量校验。" actions={<><Button type="primary" icon={<FileUp size={15} />}>上传资料</Button><Button type="primary-soft" icon={<Database size={15} />}>接入系统数据</Button></>}>
    <Toolbar><Search size={15} color="#64748b" /><input className="icm-input" value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索数据需求、文件或数据包" aria-label="搜索采集内容" /><span className="icm-toolbar-spacer" /><Tag tone="blue">当前任务 {overview.taskId}</Tag><Tag tone={incompleteCount ? 'amber' : 'green'}>{incompleteCount ? `${incompleteCount} 项待补充` : '材料齐备'}</Tag></Toolbar>
    <div className="icm-grid icm-data-kpi-row" style={{ marginBottom: 16 }}><Kpi value={demandCount.toString()} label="数据需求" note="本次检查需求项" tone="blue" /><Kpi value={`${collectedCount}/${demandCount}`} label="已采集" note="已接收并关联需求" tone={collectedCount === demandCount ? 'green' : 'amber'} /><Kpi value={`${packageCount}/${dataCollect.resultPackages.length}`} label="可审查数据包" note="通过质量校验" tone="green" /><Kpi value={`${qualityScore}%`} label="数据质量" note="完整性与一致性评分" tone={qualityScore >= 90 ? 'green' : 'amber'} /><Kpi value={incompleteCount.toString()} label="待补材料" note="需责任部门补充" tone={incompleteCount ? 'amber' : 'green'} /></div>
    <div className="icm-operation-workbench">
       <section className="icm-operation-main"><div className="icm-operation-context"><div><span>当前检查任务</span><strong>{overview.planName}</strong><em>{overview.taskId} · 采购与合同专项检查</em></div><div><span>受检单位</span><strong>{overview.unit}</strong><em>二级企业</em></div><div><span>当前办理环节</span><strong>{active.label}</strong><em>{active.note}</em></div><div><span>资料状态</span><strong>{incompleteCount ? '存在待补材料' : '材料齐备'}</strong><em>质量得分 {qualityScore}%</em></div></div>{content}</section>
      <aside className="icm-operation-aside"><Card title="采集状态" note="当前任务数据准备情况"><div className="icm-operation-summary"><div><span>需求完成度</span><strong>{collectedCount}/{demandCount}</strong></div><div><span>可用数据包</span><strong>{packageCount} 个</strong></div><div><span>质量校验</span><strong>{qualityScore}%</strong></div><div><span>待补材料</span><strong>{incompleteCount} 项</strong></div></div></Card><Card title="下一步" note="数据准备完成后进入审查"><div className="icm-actions"><Button type="primary" icon={<ShieldCheck size={14} />} onClick={() => navigate('/review-workbench?view=execute')}>进入执行审查</Button></div></Card></aside>
    </div>
  </PageFrame>
}
