import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpenCheck, CheckCircle2, FileText, RotateCcw, Search } from 'lucide-react'

import { Button, DetailLine, Kpi, PageFrame, Segmented, Tag, Toolbar, type Tone } from '../components/IcmPageKit'
import { useWorkflowStore, type AuditStatus, type WorkflowAudit, type AuditType } from '../store/workflowStore'

type AuditTab = 'pending' | 'mine' | 'done'
const tone = (status: AuditStatus): Tone => status === '已通过' ? 'green' : status === '已退回' ? 'red' : 'amber'

function reviewChecks(audit: WorkflowAudit) {
  switch (audit.type) {
    case '计划校审':
      return ['检查范围适当、目标明确', '审批链完整、回避校验通过', '依据充分、资源配置合理', '重大检查事项前置程序完备']
    case '问题确认':
      return ['问题事实描述完整', '制度依据引用准确', '风险影响判断合理', '责任单位与整改建议明确']
    case '分级审核':
      return ['问题事实描述完整', '制度依据引用准确', '风险影响判断合理', '问题定级与金额/影响匹配']
    case '异议审核':
      return ['异议理由明确、有据', '原问题事实复核清晰', '制度依据适用正确', '定级或状态调整合理']
    case '整改方案审批':
      return ['整改措施覆盖问题根因', '责任分工与时限明确', '佐证材料清单完整', '验收标准可验证']
    case '整改复核':
      return ['整改措施已落地执行', '佐证材料完整且真实', '整改效果覆盖问题成因', '复核结论可支撑问题状态变更']
    case '报告审核':
      return ['报告范围与检查依据一致', '问题事实、底稿和取证可追溯', '整改结论与佐证材料一致', '整改建议和管理要求表述准确']
    default:
      return ['业务事实清楚', '依据引用准确', '处理建议合理', '留痕材料完整']
  }
}

const auditTypeOptions: { label: string; value: AuditType | '全部' }[] = [
  { label: '全部', value: '全部' },
  { label: '计划校审', value: '计划校审' },
  { label: '问题确认', value: '问题确认' },
  { label: '分级审核', value: '分级审核' },
  { label: '异议审核', value: '异议审核' },
  { label: '整改方案', value: '整改方案审批' },
  { label: '整改复核', value: '整改复核' },
  { label: '报告审核', value: '报告审核' },
]

export default function AuditCenter() {
  const navigate = useNavigate()
  const audits = useWorkflowStore((state) => state.audits)
  const reports = useWorkflowStore((state) => state.reports)
  const rectifications = useWorkflowStore((state) => state.rectifications)
  const issues = useWorkflowStore((state) => state.issues)
  const plans = useWorkflowStore((state) => state.plans)
  const approveAudit = useWorkflowStore((state) => state.approveAudit)
  const returnAudit = useWorkflowStore((state) => state.returnAudit)
  const approvePlanNode = useWorkflowStore((state) => state.approvePlanNode)
  const rejectPlanNode = useWorkflowStore((state) => state.rejectPlanNode)

  const [tab, setTab] = useState<AuditTab>('pending')
  const [typeFilter, setTypeFilter] = useState<AuditType | '全部'>('全部')
  const [keyword, setKeyword] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [opinion, setOpinion] = useState('')
  const [checkedItems, setCheckedItems] = useState<string[]>([])

  const visible = useMemo(() => audits.filter((item) => {
    const matchesTab = tab === 'pending' ? item.status === '待处理' : tab === 'mine' ? item.applicant === '系统管理员' : item.status !== '待处理'
    const matchesType = typeFilter === '全部' || item.type === typeFilter
    return matchesTab && matchesType && (!keyword.trim() || `${item.id}${item.type}${item.title}${item.applicant}${item.node}`.includes(keyword.trim()))
  }), [audits, tab, typeFilter, keyword])

  const selected = visible.find((item) => item.id === selectedId) ?? visible[0]
  const linkedReport = reports.find((item) => item.id === selected?.businessId)
  const linkedRectification = rectifications.find((item) => item.id === (linkedReport?.rectificationId ?? selected?.businessId))
  const linkedIssue = issues.find((item) => item.id === (linkedRectification?.issueId ?? selected?.businessId))
  const linkedPlan = plans.find((item) => item.id === selected?.businessId)
  const checks = selected ? reviewChecks(selected) : []
  const extraSection = selected?.type === '异议审核' && linkedIssue?.objection?.reason
    ? '异议内容'
    : selected?.type === '整改方案审批' && linkedRectification?.planContent
      ? '整改方案'
      : ''
  // 材料目录与正文小节保持一致，避免目录标题与实际章节对不上
  const sections = useMemo(() => {
    if (!selected) return []
    if (selected.type === '计划校审') return ['计划基本信息', '检查依据与目标', '审批链路']
    return ['业务背景与范围', '问题事实与制度依据', ...(extraSection ? [extraSection] : []), '整改措施及复核结论', '关联底稿与取证材料']
  }, [selected, extraSection])
  const sectionNo = (index: number) => `${['一', '二', '三', '四', '五', '六'][index] ?? String(index + 1)}、`

  useEffect(() => {
    setOpinion('')
    setCheckedItems([])
  }, [selected?.id])

  const handleApprove = () => {
    if (!selected) return
    const finalOpinion = opinion || '审核通过，业务事实、依据和留痕材料齐备。'
    if (selected.type === '计划校审' && linkedPlan) {
      const pendingNode = linkedPlan.approvals.find((n) => n.status === '待处理' || n.status === '未提交')
      if (pendingNode) {
        approvePlanNode(linkedPlan.id, pendingNode.node, finalOpinion)
      }
    }
    approveAudit(selected.id, finalOpinion)
    setSelectedId('')
  }

  const handleReturn = () => {
    if (!selected) return
    const finalOpinion = opinion || '请补充审核关注事项后重新提交。'
    if (selected.type === '计划校审' && linkedPlan) {
      const pendingNode = linkedPlan.approvals.find((n) => n.status === '待处理' || n.status === '未提交')
      if (pendingNode) {
        rejectPlanNode(linkedPlan.id, pendingNode.node, finalOpinion)
      }
    }
    returnAudit(selected.id, finalOpinion)
    setSelectedId('')
  }

  const renderDocumentBody = () => {
    if (!selected) return null
    if (selected.type === '计划校审' && linkedPlan) {
      return (
        <>
          <h3>{linkedPlan.name}</h3>
          <p className="icm-audit-paper-sub">计划编号：{linkedPlan.id}　检查类型：{linkedPlan.type}　来源：{linkedPlan.source}</p>
          <h4>{sectionNo(0)}计划基本信息</h4>
          <p><b>受检单位：</b>{linkedPlan.unit}（{linkedPlan.unitLevel}）</p>
          <p><b>检查领域：</b>{linkedPlan.checkDomain || '-'}　<b>风险主题：</b>{linkedPlan.riskTheme}</p>
          <p><b>计划周期：</b>{linkedPlan.period}　<b>预算工作量：</b>{linkedPlan.budget}</p>
          <p><b>负责人：</b>{linkedPlan.owner}</p>
          <h4>{sectionNo(1)}检查依据与目标</h4>
          <p><b>依据：</b>{linkedPlan.basis}</p>
          <p><b>目标：</b>{linkedPlan.objective}</p>
          <h4>{sectionNo(2)}审批链路</h4>
          <div className="icm-audit-reference-list">
            {linkedPlan.approvals.map((node) => (
              <button type="button" key={node.node}><FileText size={14} />{node.node} · {node.owner} · {node.status}</button>
            ))}
          </div>
        </>
      )
    }

    const offset = extraSection ? 1 : 0
    return (
      <>
        <p className="icm-audit-paper-sub icm-audit-paper-meta">检查领域：{linkedIssue?.basis?.split('第')[0] ?? '内控检查'}　业务编号：{selected.businessId}　当前节点：{selected.node}</p>
        <h4>{sectionNo(0)}业务背景与范围</h4>
        <p>本事项来源于年度内控检查计划，围绕关键业务流程、控制执行及整改闭环情况开展复核。审核材料应与检查底稿、取证资料和责任单位反馈保持一致。</p>
        <h4>{sectionNo(1)}问题事实与制度依据</h4>
        <p>{linkedIssue?.fact ?? '请在原业务页面补充问题事实后办理审核。'}</p>
        <p><b>制度依据：</b>{linkedIssue?.basis ?? '待补充'}</p>
        {extraSection === '异议内容' && linkedIssue?.objection ? (
          <>
            <h4>{sectionNo(2)}异议内容</h4>
            <p><b>异议理由：</b>{linkedIssue.objection.reason}</p>
            <p><b>提出单位：</b>{linkedIssue.objection.raisedBy}　<b>提出时间：</b>{linkedIssue.objection.raisedAt}</p>
          </>
        ) : null}
        {extraSection === '整改方案' && linkedRectification?.planContent ? (
          <>
            <h4>{sectionNo(2)}整改方案</h4>
            <p>{linkedRectification.planContent}</p>
          </>
        ) : null}
        <h4>{sectionNo(2 + offset)}整改措施及复核结论</h4>
        <p>{linkedIssue?.suggestion ?? '本次为问题确认，请确认事实、依据和整改方向。'}</p>
        <p><b>整改进度：</b>{linkedRectification ? `${linkedRectification.progress}%` : '待发起整改'}　<b>复核结论：</b>{linkedRectification?.verifyConclusion ?? '待确认'}</p>
        <h4>{sectionNo(3 + offset)}关联底稿与取证材料</h4>
        <div className="icm-audit-reference-list">
          {[linkedIssue?.workpaperId, ...(linkedIssue?.evidenceIds ?? []), linkedRectification?.id, linkedReport?.id].filter(Boolean).map((id) => <button type="button" key={id} onClick={() => navigate(selected.route)}><FileText size={14} />{id}</button>)}
        </div>
      </>
    )
  }

  return (
    <PageFrame title="审核中心" subtitle="按业务对象办理计划校审、问题确认、分级审核、异议审核、整改方案审批、整改复核和报告审核，处理结论自动回写原业务记录。">
      <div className="icm-grid cols-5" style={{ marginBottom: 12 }}>
        <Kpi value={audits.filter((item) => item.status === '待处理').length.toString()} label="待处理" note="当前用户需办理" tone="amber" />
        <Kpi value={audits.filter((item) => item.type === '计划校审' && item.status === '待处理').length.toString()} label="计划校审" note="待审批计划" tone="red" />
        <Kpi value={audits.filter((item) => (item.type === '问题确认' || item.type === '分级审核' || item.type === '异议审核') && item.status === '待处理').length.toString()} label="问题审核" note="确认/定级/异议" tone="blue" />
        <Kpi value={audits.filter((item) => (item.type === '整改方案审批' || item.type === '整改复核') && item.status === '待处理').length.toString()} label="整改审核" note="方案/复核" tone="cyan" />
        <Kpi value={audits.filter((item) => item.type === '报告审核' && item.status === '待处理').length.toString()} label="报告审核" note="待审核结论" tone="green" />
      </div>
      <Toolbar>
        <Segmented value={tab} onChange={(value) => setTab(value as AuditTab)} options={[{ label: '待处理', value: 'pending' }, { label: '我发起的', value: 'mine' }, { label: '已处理', value: 'done' }]} />
        <select className="icm-select" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as AuditType | '全部')}>
          {auditTypeOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
        <div className="icm-modal-search" style={{ maxWidth: 320 }}><Search size={15} /><input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索审批编号、业务事项或节点" /></div>
        <span className="icm-toolbar-spacer" /><Tag tone="blue">{visible.length} 条</Tag>
      </Toolbar>

      <div className="icm-audit-review-workbench">
        <section className="icm-audit-directory" aria-label="审核事项列表">
          <div className="icm-audit-pane-title"><BookOpenCheck size={16} /><strong>审核事项</strong><span>选择一项查看材料并办理</span></div>
          <div className="icm-audit-directory-list">
            {visible.map((item) => <button className={selected?.id === item.id ? 'active' : ''} type="button" key={item.id} onClick={() => setSelectedId(item.id)}>
              <span className="icm-audit-directory-meta"><Tag tone={tone(item.status)}>{item.status}</Tag><em>{item.type}</em></span>
              <strong>{item.title}</strong><small>{item.id} · {item.node}</small>
            </button>)}
            {!visible.length ? <div className="icm-empty-inline">当前筛选条件下暂无审核事项。</div> : null}
          </div>
        </section>

        <section className="icm-audit-document">
          {selected ? <>
            <div className="icm-audit-document-head"><div><span>{selected.type} · {selected.id}</span><h2>{selected.title}</h2><p>发起单位：{selected.applicant}　提交时间：{selected.submittedAt}　当前节点：{selected.node}</p></div><Tag tone={tone(selected.status)}>{selected.status}</Tag></div>
            <div className="icm-audit-document-body">
              <aside className="icm-audit-outline"><strong>材料目录</strong>{sections.map((title, index) => <button className={index === 0 ? 'active' : ''} type="button" key={title}>{sectionNo(index)}{title}</button>)}</aside>
              <article className="icm-audit-paper">
                {renderDocumentBody()}
              </article>
            </div>
          </> : <div className="icm-empty-inline">从左侧选择一项审核事项。</div>}
        </section>

        <aside className="icm-audit-review-panel">
          <div className="icm-audit-pane-title"><CheckCircle2 size={16} /><strong>审核意见</strong><span>{selected ? '核对要点后填写处理意见' : '请选择审核事项'}</span></div>
          {selected ? <>
            <div className="icm-audit-checks">{checks.map((item) => <label key={item}><input checked={checkedItems.includes(item)} onChange={() => setCheckedItems((value) => value.includes(item) ? value.filter((entry) => entry !== item) : [...value, item])} type="checkbox" /><span>{item}</span></label>)}</div>
            <div className="icm-audit-status">
              <DetailLine label="业务编号" value={selected.businessId} />
              {selected.type === '计划校审' && linkedPlan ? <DetailLine label="计划状态" value={<Tag tone={linkedPlan.status === '已立项' ? 'green' : 'amber'}>{linkedPlan.status}</Tag>} /> : null}
              <DetailLine label="关联问题" value={linkedIssue?.id ?? '待问题确认'} />
              <DetailLine label="关联整改" value={linkedRectification?.id ?? '待发起'} />
              <DetailLine label="材料数量" value={`${(linkedIssue?.evidenceIds.length ?? 0) + (linkedIssue?.workpaperId ? 1 : 0)} 份`} />
            </div>
            <textarea className="icm-input icm-audit-opinion-input" value={opinion} onChange={(event) => setOpinion(event.target.value)} placeholder="填写审核意见；退回时请说明需补充的材料。" />
            <div className="icm-actions icm-audit-review-actions"><Button type="default-soft" onClick={() => navigate(selected.route)}>查看原业务</Button>{selected.status === '待处理' ? <><Button type="default-soft" icon={<RotateCcw size={14} />} onClick={handleReturn}>退回修改</Button><Button type="primary" icon={<CheckCircle2 size={14} />} onClick={handleApprove}>审核通过</Button></> : <Tag tone={tone(selected.status)}>{selected.status}</Tag>}</div>
            {selected.opinion ? <div className="icm-audit-opinion">历史意见：{selected.opinion}</div> : null}
          </> : null}
        </aside>
      </div>
    </PageFrame>
  )
}
