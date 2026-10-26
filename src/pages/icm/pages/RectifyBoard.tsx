import { useProjectRecords, useProjectNavigate } from './projectScope'
import { saveProjectFile, downloadProjectFile } from './projectFileStorage'
import { issueProjectId } from './projectScope'
import { useIcmDemoRole } from '../AppShell'
import { useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, CalendarClock, CheckCircle2, FileText, MessageSquare, RotateCcw, Search, ShieldCheck, Upload } from 'lucide-react'

import { Button, Card, DataTable, DetailLine, Kpi, PageFrame, Tag, Toolbar, type Tone } from '../components/IcmPageKit'
import { useWorkflowStore, type RectificationStatus } from '../store/workflowStore'
import { daysUntil, isOverdueRectification } from './workplaceMetrics'

function tone(status: RectificationStatus | string): Tone {
  if (status === '已销号' || status === '已整改') return 'green'
  if (status === '待方案审批') return 'red'
  if (status === '整改中') return 'amber'
  return 'blue'
}

export default function RectifyBoard() {
  const navigate = useProjectNavigate()
  const { role } = useIcmDemoRole()
  const fileInput = useRef<HTMLInputElement>(null)
  const { rectifications, issues, reports } = useProjectRecords()
  const [searchParams, setSearchParams] = useSearchParams()
  const createReport = useWorkflowStore((state) => state.createReport)
  const submitRectificationPlan = useWorkflowStore((state) => state.submitRectificationPlan)
  const approveRectificationPlan = useWorkflowStore((state) => state.approveRectificationPlan)
  const returnRectificationPlan = useWorkflowStore((state) => state.returnRectificationPlan)
  const addRectificationProof = useWorkflowStore((state) => state.addRectificationProof)
  const toggleEvidenceChecklist = useWorkflowStore((state) => state.toggleEvidenceChecklist)
  const submitRectificationReview = useWorkflowStore((state) => state.submitRectificationReview)
  const closeOutRectification = useWorkflowStore((state) => state.closeOutRectification)
  const scheduleFollowUp = useWorkflowStore((state) => state.scheduleFollowUp)

  const [selectedId, setSelectedId] = useState(searchParams.get('rect') ?? '')
  const [keyword, setKeyword] = useState('')
  const requestedStatus = searchParams.get('status')
  const status = requestedStatus === 'overdue' ? '逾期整改' : requestedStatus === '已整改' || requestedStatus === '整改中' || requestedStatus === '待方案审批' || requestedStatus === '已销号' ? requestedStatus : '全部状态'
  const [activeTab, setActiveTab] = useState<'plan' | 'progress' | 'evidence' | 'review' | 'followup'>('plan')
  const [planContent, setPlanContent] = useState('')
  const [reviewOpinion, setReviewOpinion] = useState('')
  const [followUpDate, setFollowUpDate] = useState('')
  const [notice, setNotice] = useState('')

  const selected = rectifications.find((item) => item.id === selectedId)
  const selectedIssue = issues.find((item) => item.id === selected?.issueId)
  const selectedReport = reports.find((item) => item.rectificationId === selected?.id)
  const visible = useMemo(() => rectifications.filter((item) => {
    const issue = issues.find((record) => record.id === item.issueId)
    const matchesKeyword = !keyword.trim() || `${item.id}${item.title}${item.owner}${issue?.title ?? ''}`.includes(keyword.trim())
    const matchesStatus = status === '全部状态' || (status === '逾期整改' ? isOverdueRectification(item) : item.status === status)
    return matchesKeyword && matchesStatus
  }), [rectifications, issues, keyword, status])

  if (!selected) {
    const pendingPlan = rectifications.filter((item) => item.status === '待方案审批').length
    const ongoing = rectifications.filter((item) => item.status === '整改中').length
    const completed = rectifications.filter((item) => item.status === '已整改').length
    const closed = rectifications.filter((item) => item.status === '已销号').length
    const overdue = rectifications.filter((item) => isOverdueRectification(item)).length

    return (
      <PageFrame title="整改追踪" subtitle="问题确认后形成整改事项；整改方案审批、佐证提交、复核销号全流程跟踪。">
        <Toolbar>
          <div className="icm-modal-search" style={{ maxWidth: 340 }}><Search size={15} /><input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索整改编号、事项或责任部门" /></div>
          <select className="icm-select" aria-label="整改状态" value={status} onChange={(event) => setSearchParams((params) => { params.set('status', event.target.value === '逾期整改' ? 'overdue' : event.target.value); return params })}>
            <option>全部状态</option>
            <option>逾期整改</option>
            <option>待方案审批</option>
            <option>整改中</option>
            <option>已整改</option>
            <option>已销号</option>
          </select>
          <span className="icm-toolbar-spacer" /><Tag tone="blue">共 {visible.length} 项</Tag>
        </Toolbar>
        <div className="icm-grid cols-5" style={{ marginBottom: 12 }}>
          <Kpi value={rectifications.length.toString()} label="整改事项" note="均关联已确认问题" tone="blue" />
          <Kpi value={pendingPlan.toString()} label="待方案审批" note="需审核整改方案" tone="red" />
          <Kpi value={ongoing.toString()} label="整改中" note="跟踪进度与佐证" tone="amber" />
          <Kpi value={completed.toString()} label="已整改" note="待销号或编报告" tone="green" />
          <Kpi value={overdue.toString()} label="超期" note="未闭环且已逾期" tone="red" />
        </div>
        <Card title="整改事项列表" note="点击事项查看整改方案、佐证清单、复核销号和跟踪提醒。">
          <DataTable
            columns={['整改编号', '整改事项', '来源问题', '责任部门', '进度', '状态', '期限', '操作']}
            rows={visible.map((item) => {
              const issue = issues.find((record) => record.id === item.issueId)
              const d = daysUntil(item.deadline)
              const dayText = d === null ? '-' : d >= 0 ? `剩 ${d} 天` : `逾期 ${Math.abs(d)} 天`
              return [
                item.id,
                item.title,
                issue?.title ?? item.issueId,
                item.owner,
                `${item.progress}%`,
                <Tag tone={tone(item.status)}>{item.status}</Tag>,
                <Tag tone={isOverdueRectification(item) ? 'red' : 'blue'}>{item.status === '已整改' || item.status === '已销号' ? '已完成整改' : dayText}</Tag>,
                <button className="icm-link" type="button" onClick={(event) => { event.stopPropagation(); setSelectedId(item.id) }}>查看</button>,
              ]
            })}
            onRowClick={(index) => setSelectedId(visible[index].id)}
          />
        </Card>
      </PageFrame>
    )
  }

  const d = daysUntil(selected.deadline)
  const isOverdue = isOverdueRectification(selected)
  const canEditPlan = selected.planStatus === '待提交' || selected.planStatus === '审批不通过'
  const canApprovePlan = selected.planStatus === '待审批'
  const canExecute = selected.status === '整改中'
  const canReview = selected.status === '整改中' && selected.evidenceChecklist.filter((c) => c.required).every((c) => c.submitted)
  const canCloseOut = selected.status === '已整改'
  const canCreateReport = selected.status === '已整改' || selected.status === '已销号'
  const openReport = () => navigate(`/report?report=${selectedReport?.id ?? createReport(selected.id)}`)

  const submitPlan = () => {
    if (!planContent.trim()) { setNotice('请填写整改方案内容'); return }
    submitRectificationPlan(selected.id, planContent)
    setNotice('整改方案已提交审批')
    setPlanContent('')
  }

  const approvePlan = () => {
    if (!reviewOpinion.trim()) { setNotice('请填写方案审批意见'); return }
    approveRectificationPlan(selected.id, reviewOpinion)
    setNotice('整改方案已审批通过')
    setReviewOpinion('')
  }

  const returnPlan = () => {
    if (!reviewOpinion.trim()) { setNotice('请填写退回原因'); return }
    returnRectificationPlan(selected.id, reviewOpinion)
    setNotice('整改方案已退回')
    setReviewOpinion('')
  }

  const addProof = () => fileInput.current?.click()
  const receiveProof = async (file?: File) => {
    if (!file) return
    try {
      const projectId = selectedIssue && issueProjectId(selectedIssue)
      if (!projectId) throw new Error('请先明确来源问题所属项目。')
      const meta = await saveProjectFile(file, projectId, role.name)
      addRectificationProof(selected.id, meta)
      setNotice('原始佐证已保存，请关联下方验收清单并提交复核。')
    } catch (e) { setNotice((e as Error).message) }
  }

  const submitReview = () => {
    try { submitRectificationReview(selected.id); setNotice('已提交整改复核') } catch (e) { setNotice((e as Error).message) }
  }

  const closeOut = () => {
    if (!reviewOpinion.trim()) { setNotice('请填写效果验证与销号意见'); return }
    closeOutRectification(selected.id, reviewOpinion)
    setNotice('整改事项已销号')
    setReviewOpinion('')
  }

  const schedule = () => {
    if (!followUpDate) { setNotice('请选择跟踪提醒日期'); return }
    scheduleFollowUp(selected.id, followUpDate)
    setNotice('跟踪提醒已设置')
    setFollowUpDate('')
  }

  return (
    <PageFrame title={<span style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Button type="default-soft" icon={<ArrowLeft size={15} />} onClick={() => setSelectedId('')}>返回列表</Button>整改事项详情</span>} subtitle={`${selected.id} · ${selected.title}`}>
      <Toolbar>
        <Tag tone={tone(selected.status)}>{selected.status}</Tag>
        {isOverdue && selected.status !== '已整改' && selected.status !== '已销号' ? <Tag tone="red"><AlertTriangle size={12} /> 已逾期 {Math.abs(d!)} 天</Tag> : null}
        <span className="icm-toolbar-spacer" />
        {canCreateReport ? <Button type="primary" icon={<FileText size={14} />} onClick={openReport}>{selectedReport ? '查看报告' : '编制报告'}</Button> : null}
      </Toolbar>

      <input ref={fileInput} aria-label="整改佐证文件" hidden type="file" onChange={(e) => { void receiveProof(e.target.files?.[0]); e.target.value = '' }} />
      {(selected.proofFiles ?? []).map((f) => <div className="icm-list-row" key={f.id}><span>{f.name} · {f.by}</span><button className="icm-link" onClick={() => downloadProjectFile(f).catch((e) => setNotice(e.message))}>下载佐证</button></div>)}
      <div className="icm-rectify-detail-layout">
        <div style={{ display: 'grid', gap: 12 }}>
          <Card title="整改事项信息" note="整改责任、期限和来源问题保持绑定。">
            <div className="icm-grid cols-3">
              <DetailLine label="整改状态" value={<Tag tone={tone(selected.status)}>{selected.status}</Tag>} />
              <DetailLine label="方案状态" value={<Tag tone={selected.planStatus === '审批通过' ? 'green' : selected.planStatus === '待审批' ? 'amber' : 'red'}>{selected.planStatus}</Tag>} />
              <DetailLine label="责任部门" value={selected.owner} />
              <DetailLine label="整改进度" value={`${selected.progress}%`} />
              <DetailLine label="整改期限" value={<Tag tone={isOverdue ? 'red' : 'blue'}>{selected.deadline}{isOverdue ? `（逾期 ${Math.abs(d!)} 天）` : ''}</Tag>} />
              <DetailLine label="来源问题" value={<button className="icm-link" type="button" onClick={() => navigate(`/issues?issue=${selected.issueId}`)}>{selected.issueId}</button>} />
              <DetailLine label="问题等级" value={selectedIssue ? <Tag tone={selectedIssue.level === '重大' ? 'red' : selectedIssue.level === '重要' ? 'amber' : 'blue'}>{selectedIssue.level}</Tag> : '-'} />
              <DetailLine label="最后更新" value={selected.updatedAt} />
              {selected.closeOutAt ? <DetailLine label="销号时间" value={selected.closeOutAt} /> : null}
            </div>
            <div className="icm-progress-line" style={{ marginTop: 12 }}>
              <span style={{ width: `${selected.progress}%` }} /><b>{selected.progress}%</b>
            </div>
          </Card>

          <div className="icm-tabs" style={{ marginBottom: 12 }}>
            {[
              { key: 'plan', label: '整改方案' },
              { key: 'progress', label: '整改进度' },
              { key: 'evidence', label: `佐证清单（${selected.evidenceChecklist.filter((c) => c.submitted).length}/${selected.evidenceChecklist.length}）` },
              { key: 'review', label: '复核销号' },
              { key: 'followup', label: '跟踪提醒' },
            ].map((tab) => (
              <button key={tab.key} className={activeTab === tab.key ? 'active' : ''} type="button" onClick={() => setActiveTab(tab.key as typeof activeTab)}>{tab.label}</button>
            ))}
          </div>

          {activeTab === 'plan' ? (
            <Card title="整改方案" note={canEditPlan ? '请填写整改措施、责任分工、完成时限和验收标准。' : '整改方案经审批后进入执行阶段。'}>
              {canEditPlan ? (
                <>
                  <textarea className="icm-input" rows={6} value={planContent} onChange={(event) => setPlanContent(event.target.value)} placeholder="填写整改方案..." />
                  <div className="icm-form-actions">
                    <Button type="primary" icon={<Upload size={14} />} onClick={submitPlan}>提交方案审批</Button>
                  </div>
                </>
              ) : canApprovePlan ? (
                <>
                  <p style={{ color: '#334155', lineHeight: 1.7 }}><b>方案内容：</b>{selected.planContent || '待补充'}</p>
                  <textarea className="icm-input" rows={3} value={reviewOpinion} onChange={(event) => setReviewOpinion(event.target.value)} placeholder="填写审批意见..." />
                  <div className="icm-form-actions">
                    <Button type="default-soft" icon={<RotateCcw size={14} />} onClick={returnPlan}>方案不通过</Button>
                    <Button type="primary" icon={<ShieldCheck size={14} />} onClick={approvePlan}>方案通过</Button>
                  </div>
                </>
              ) : (
                <>
                  <p style={{ color: '#334155', lineHeight: 1.7 }}><b>方案内容：</b>{selected.planContent || '未记录'}</p>
                  <Tag tone="green">方案已审批通过</Tag>
                </>
              )}
            </Card>
          ) : activeTab === 'progress' ? (
            <Card title="整改进度" note="责任单位按方案执行并反馈进度。">
              <DetailLine label="整改措施" value={selectedIssue?.suggestion ?? '待补充'} />
              <DetailLine label="当前进度" value={`${selected.progress}%`} />
              <DetailLine label="已上传佐证" value={`${selected.proofCount} 份`} />
              <DetailLine label="复核结论" value={selected.verifyConclusion} />
              {canExecute ? (
                <div className="icm-form-actions">
                  <Button type="primary-soft" icon={<Upload size={14} />} onClick={addProof}>上传佐证材料</Button>
                  <Button type="primary" icon={<ShieldCheck size={14} />} onClick={submitReview} disabled={!canReview}>{canReview ? '提交整改复核' : '请先完成必传佐证'}</Button>
                </div>
              ) : null}
            </Card>
          ) : activeTab === 'evidence' ? (
            <Card title="佐证材料清单" note="必传材料全部提交后，方可提交整改复核。">
              <DataTable
                columns={['材料名称', '是否必传', '提交状态', '上传时间', '操作']}
                rows={selected.evidenceChecklist.map((item) => [
                  item.name,
                  item.required ? <Tag tone="red">必传</Tag> : <Tag tone="gray">可选</Tag>,
                  item.submitted ? <Tag tone="green">已提交</Tag> : <Tag tone="amber">待提交</Tag>,
                  item.uploadedAt || '-',
                  canExecute ? (
                    <select className="icm-select" aria-label={'关联佐证：' + item.name} value={item.evidenceId ?? ''} onChange={(e) => toggleEvidenceChecklist(selected.id, item.id, e.target.value)}>
                      <option value="">选择佐证文件</option>{selected.proofFiles?.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  ) : (
                    '-'
                  ),
                ])}
              />
              {canExecute ? <div className="icm-form-actions"><Button type="primary-soft" icon={<Upload size={14} />} onClick={addProof}>上传其他佐证</Button></div> : null}
            </Card>
          ) : activeTab === 'review' ? (
            <Card title="复核与销号" note="整改完成后提交复核，复核通过可销号。">
              <DetailLine label="复核结论" value={selected.verifyConclusion} />
              {selected.status === '已整改' || selected.status === '已销号' ? (
                <>
                  {selected.closeOutAt ? <DetailLine label="销号时间" value={selected.closeOutAt} /> : null}
                  {canCloseOut ? (
                    <>
                      <textarea className="icm-input" rows={3} value={reviewOpinion} onChange={(event) => setReviewOpinion(event.target.value)} placeholder="填写销号意见..." />
                      <div className="icm-form-actions">
                        <Button type="primary" icon={<CheckCircle2 size={14} />} onClick={closeOut}>复核销号</Button>
                      </div>
                    </>
                  ) : (
                    <Tag tone="green">已销号</Tag>
                  )}
                </>
              ) : (
                <>
                  <p style={{ color: '#607089', fontSize: 13 }}>整改复核由审核待办统一办理。提交复核后，审核人员将检查整改措施落地情况和佐证材料完整性。</p>
                  {canExecute && canReview ? <Button type="primary" icon={<ShieldCheck size={14} />} onClick={submitReview}>提交整改复核</Button> : null}
                </>
              )}
            </Card>
          ) : (
            <Card title="跟踪提醒" note="销号后可设置 3/6/12 个月回访提醒。">
              <DetailLine label="已设置提醒" value={selected.followUpCount > 0 ? `${selected.followUpCount} 次` : '未设置'} />
              {selected.followUpAt ? <DetailLine label="下次提醒" value={selected.followUpAt} /> : null}
              <label style={{ display: 'grid', gap: 8, marginTop: 12 }}>
                <span style={{ color: '#334155', fontSize: 13 }}>设置跟踪提醒日期</span>
                <input className="icm-input" type="date" value={followUpDate} onChange={(event) => setFollowUpDate(event.target.value)} />
              </label>
              <div className="icm-form-actions">
                <Button type="primary" icon={<CalendarClock size={14} />} onClick={schedule} disabled={!followUpDate}>保存提醒</Button>
              </div>
            </Card>
          )}
        </div>

        <aside>
          <Card title="来源追溯" note="整改事项不能脱离问题、底稿和取证材料单独存在。">
            <div className="icm-trace-list">
              <button type="button" onClick={() => navigate(`/issues?issue=${selected.issueId}`)}>{selected.issueId}<span>问题台账</span></button>
              <button type="button" onClick={() => navigate('/workpaper')}>{selectedIssue?.workpaperId ?? '-'}<span>审查记录</span></button>
              <button type="button" onClick={() => navigate('/evidence')}>{selectedIssue?.evidenceIds.join(' / ') ?? '-'}<span>取证材料</span></button>
              {selectedReport ? <button type="button" onClick={openReport}>{selectedReport.id}<span>整改报告</span></button> : null}
            </div>
          </Card>
          <Card title="状态说明">
            <DetailLine label="待方案审批" value="责任单位需提交整改方案并经审批" />
            <DetailLine label="整改中" value="按方案执行整改并提交佐证" />
            <DetailLine label="已整改" value="复核通过，可销号或编报告" />
            <DetailLine label="已销号" value="整改闭环完成，状态锁定" />
          </Card>
        </aside>
      </div>
      {notice ? <div className="icm-toast-fixed">{notice}</div> : null}
    </PageFrame>
  )
}
