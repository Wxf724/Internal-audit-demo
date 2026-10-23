import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, FileText, GitMerge, GitPullRequestArrow, MessageSquareWarning, Save, Search, ShieldCheck } from 'lucide-react'

import { Button, Card, DataTable, DetailLine, Kpi, PageFrame, Tag, Toolbar, type Tone } from '../components/IcmPageKit'
import { useWorkflowStore, type WorkflowIssue } from '../store/workflowStore'

function tone(value: string): Tone {
  if (value === '重大' || value === '待确认' || value === '分级审核不通过') return 'red'
  if (value === '重要' || value === '整改中' || value === '异议中' || value === '待分级审核') return 'amber'
  if (value === '已整改' || value === '已关闭' || value === '已通过') return 'green'
  return 'blue'
}

function daysUntil(deadline: string) {
  if (!deadline || deadline === '待确认') return null
  const diff = Math.ceil((new Date(deadline).getTime() - new Date('2026-07-23').getTime()) / (1000 * 60 * 60 * 24))
  return diff
}

export default function IssueLedger() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const issues = useWorkflowStore((state) => state.issues)
  const rectifications = useWorkflowStore((state) => state.rectifications)
  const saveIssueDraft = useWorkflowStore((state) => state.saveIssueDraft)
  const confirmIssue = useWorkflowStore((state) => state.confirmIssue)
  const submitIssueGradingAudit = useWorkflowStore((state) => state.submitIssueGradingAudit)
  const raiseIssueObjection = useWorkflowStore((state) => state.raiseIssueObjection)
  const resolveIssueObjection = useWorkflowStore((state) => state.resolveIssueObjection)
  const findMergeCandidates = useWorkflowStore((state) => state.findMergeCandidates)
  const mergeIssues = useWorkflowStore((state) => state.mergeIssues)

  const [selectedId, setSelectedId] = useState(searchParams.get('issue') ?? '')
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState('全部状态')
  const [notice, setNotice] = useState('')
  const [activePanel, setActivePanel] = useState<'draft' | 'grading' | 'objection' | 'merge' | 'lineage'>('draft')
  const [objectionReason, setObjectionReason] = useState('')
  const [mergeCandidateIds, setMergeCandidateIds] = useState<string[]>([])

  const selected = issues.find((item) => item.id === selectedId)
  const [draft, setDraft] = useState<Pick<WorkflowIssue, 'fact' | 'basis' | 'rootCause' | 'impact' | 'suggestion'>>({ fact: '', basis: '', rootCause: '', impact: '', suggestion: '' })

  useEffect(() => {
    if (selected) {
      setDraft({ fact: selected.fact, basis: selected.basis, rootCause: selected.rootCause, impact: selected.impact, suggestion: selected.suggestion })
      setMergeCandidateIds([])
    }
  }, [selected])

  const filtered = useMemo(() => issues.filter((item) => {
    const matchedKeyword = !keyword.trim() || `${item.id}${item.title}${item.owner}`.includes(keyword.trim())
    const matchedStatus = status === '全部状态' || item.status === status
    return matchedKeyword && matchedStatus
  }), [issues, keyword, status])

  const selectIssue = (id: string) => setSelectedId(id)
  const saveDraft = () => {
    if (!selected) return
    saveIssueDraft(selected.id, draft)
    setNotice('问题草稿已暂存')
  }
  const submitConfirmation = () => {
    if (!selected) return
    saveIssueDraft(selected.id, draft)
    const rectificationId = confirmIssue(selected.id)
    if (!rectificationId) { setNotice('请补全问题事实、制度依据和根因分析'); return }
    setNotice('问题已确认，等待分级审核')
    setActivePanel('grading')
  }
  const submitGrading = () => {
    if (!selected) return
    submitIssueGradingAudit(selected.id)
    setNotice('已提交分级审核')
  }
  const submitObjection = () => {
    if (!selected || !objectionReason.trim()) return
    raiseIssueObjection(selected.id, objectionReason, selected.owner)
    setNotice('异议已提交')
    setObjectionReason('')
  }
  const resolveObjection = (result: '成立' | '不成立') => {
    if (!selected) return
    resolveIssueObjection(selected.id, result, result === '成立' ? '经复核，异议成立，调整问题状态' : '经复核，异议不成立，维持原认定')
    setNotice(`异议已判定为${result}`)
  }
  const loadMergeCandidates = () => {
    if (!selected) return
    const candidates = findMergeCandidates(selected.id)
    setMergeCandidateIds(candidates)
    setActivePanel('merge')
  }
  const confirmMerge = () => {
    if (!selected || mergeCandidateIds.length === 0) return
    mergeIssues(selected.id, mergeCandidateIds)
    setNotice(`已合并 ${mergeCandidateIds.length} 个问题`)
    setMergeCandidateIds([])
  }

  if (!selected) {
    const pending = issues.filter((item) => item.status === '待确认').length
    const grading = issues.filter((item) => item.status === '待分级审核' || item.status === '分级审核不通过').length
    const objection = issues.filter((item) => item.status === '异议中').length
    const ongoing = issues.filter((item) => item.status === '整改中').length
    const completed = issues.filter((item) => item.status === '已整改' || item.status === '已关闭').length
    const overdue = issues.filter((item) => {
      const d = daysUntil(item.deadline)
      return d !== null && d < 0 && item.status !== '已整改' && item.status !== '已关闭'
    }).length

    return (
      <PageFrame title="问题台账" subtitle="从审查记录形成问题草稿，经确认、定级、异议处理后派发整改并持续追溯。">
        <Toolbar>
          <div className="icm-modal-search" style={{ maxWidth: 340 }}><Search size={15} /><input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索问题编号、描述或责任部门" /></div>
          <select className="icm-select" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option>全部状态</option>
            <option>待确认</option>
            <option>待分级审核</option>
            <option>分级审核不通过</option>
            <option>异议中</option>
            <option>整改中</option>
            <option>已整改</option>
            <option>已关闭</option>
          </select>
          <span className="icm-toolbar-spacer" /><Tag tone="blue">共 {filtered.length} 条</Tag>
        </Toolbar>
        <div className="icm-grid cols-6" style={{ marginBottom: 12 }}>
          <Kpi value={issues.length.toString()} label="问题总数" note="均关联来源底稿" tone="blue" />
          <Kpi value={pending.toString()} label="待确认" note="需补全定稿要素" tone="red" />
          <Kpi value={grading.toString()} label="待分级审核" note="需定级复核" tone="amber" />
          <Kpi value={objection.toString()} label="异议中" note="待复核异议" tone="amber" />
          <Kpi value={ongoing.toString()} label="整改中" note="已派发责任单位" tone="cyan" />
          <Kpi value={overdue.toString()} label="超期" note="未闭环且已逾期" tone="red" />
        </div>
        <Card title="问题列表" note="点击问题进入定稿、分级审核、异议处理、合并建议或来源追溯。">
          <DataTable
            columns={['问题编号', '问题描述', '等级', '状态', '责任部门', '期限', '剩余/逾期', '操作']}
            rows={filtered.map((item) => {
              const d = daysUntil(item.deadline)
              const dayText = d === null ? '-' : d >= 0 ? `剩 ${d} 天` : `逾期 ${Math.abs(d)} 天`
              return [
                item.id,
                item.title,
                <Tag tone={tone(item.level)}>{item.level}</Tag>,
                <Tag tone={tone(item.status)}>{item.status}</Tag>,
                item.owner,
                item.deadline,
                <Tag tone={d !== null && d < 0 ? 'red' : 'blue'}>{dayText}</Tag>,
                <button className="icm-link" type="button" onClick={(event) => { event.stopPropagation(); selectIssue(item.id) }}>查看</button>,
              ]
            })}
            onRowClick={(index) => selectIssue(filtered[index].id)}
          />
        </Card>
      </PageFrame>
    )
  }

  const linkedRectification = rectifications.find((r) => r.id === selected.rectificationId)
  const canEditDraft = selected.status === '待确认' || selected.status === '分级审核不通过'
  const canSubmitGrading = selected.status === '待分级审核' || selected.status === '分级审核不通过'
  const canObjection = selected.status === '整改中' || selected.status === '待分级审核'
  const canResolveObjection = selected.status === '异议中'

  return (
    <PageFrame title={<span style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Button type="default-soft" icon={<ArrowLeft size={15} />} onClick={() => setSelectedId('')}>返回列表</Button>问题详情</span>} subtitle={`${selected.id} · ${selected.title}`}>
      <Toolbar>
        <Tag tone={tone(selected.level)}>{selected.level}</Tag>
        <Tag tone={tone(selected.status)}>{selected.status}</Tag>
        <span className="icm-toolbar-spacer" />
        {canEditDraft ? (
          <>
            <Button type="default-soft" icon={<Save size={14} />} onClick={saveDraft}>暂存</Button>
            <Button type="primary" icon={<ShieldCheck size={14} />} onClick={submitConfirmation}>确认问题</Button>
          </>
        ) : canSubmitGrading ? (
          <Button type="primary" icon={<ShieldCheck size={14} />} onClick={submitGrading}>提交分级审核</Button>
        ) : (
          <Button type="primary-soft" icon={<FileText size={14} />} onClick={() => navigate(selected.rectificationId ? `/rectify?rect=${selected.rectificationId}` : '/rectify')}>查看整改</Button>
        )}
      </Toolbar>

      <div className="icm-issue-detail-layout">
        <div className="icm-issue-detail-main">
          <Card title="问题概况" note="问题定级、责任和整改时限">
            <div className="icm-grid cols-3">
              <DetailLine label="问题等级" value={<Tag tone={tone(selected.level)}>{selected.gradedLevel ? `${selected.level}（复核：${selected.gradedLevel}）` : selected.level}</Tag>} />
              <DetailLine label="责任部门" value={selected.owner} />
              <DetailLine label="整改期限" value={selected.deadline} />
              <DetailLine label="来源底稿" value={<button className="icm-link" type="button" onClick={() => navigate('/workpaper')}>{selected.workpaperId}</button>} />
              <DetailLine label="取证材料" value={selected.evidenceIds.join(' / ')} />
              <DetailLine label="整改工单" value={selected.rectificationId ?? '确认后自动生成'} />
              {selected.gradingAuditor ? <DetailLine label="分级审核人" value={selected.gradingAuditor} /> : null}
              {selected.gradingOpinion ? <DetailLine label="分级审核意见" value={selected.gradingOpinion} /> : null}
              {selected.objection.status !== '无' ? <DetailLine label="异议状态" value={<Tag tone={selected.objection.status === '异议成立' ? 'green' : selected.objection.status === '异议不成立' ? 'red' : 'amber'}>{selected.objection.status}</Tag>} /> : null}
            </div>
          </Card>

          <div className="icm-tabs" style={{ marginBottom: 12 }}>
            {[
              { key: 'draft', label: '问题定稿' },
              { key: 'grading', label: '分级审核' },
              { key: 'objection', label: `异议处理${selected.objection.status !== '无' ? '·' + selected.objection.status : ''}` },
              { key: 'merge', label: '合并建议' },
              { key: 'lineage', label: '来源血缘' },
            ].map((tab) => (
              <button
                key={tab.key}
                className={activePanel === tab.key ? 'active' : ''}
                type="button"
                onClick={() => {
                  setActivePanel(tab.key as typeof activePanel)
                  if (tab.key === 'merge') loadMergeCandidates()
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activePanel === 'draft' ? (
            <Card title={canEditDraft ? '问题定稿' : '问题定稿内容'} note={canEditDraft ? '补齐核心要素后才能确认问题。' : '已确认问题保留定稿版本和来源。'}>
              <div className="icm-issue-form-grid">
                {([['问题事实', 'fact'], ['制度依据', 'basis'], ['根因分析', 'rootCause'], ['影响评估', 'impact'], ['整改建议', 'suggestion']] as const).map(([label, key]) => (
                  <label key={key}>
                    <span>{label}{(key === 'fact' || key === 'basis' || key === 'rootCause') ? ' *' : ''}</span>
                    {canEditDraft ? (
                      <textarea className="icm-input" value={draft[key]} onChange={(event) => setDraft((item) => ({ ...item, [key]: event.target.value }))} placeholder={`填写${label}`} />
                    ) : (
                      <p>{selected[key] || '未填写'}</p>
                    )}
                  </label>
                ))}
              </div>
            </Card>
          ) : activePanel === 'grading' ? (
            <Card title="分级审核" note="重大问题需经内控部门复核定级。">
              <div className="icm-grid cols-3" style={{ marginBottom: 12 }}>
                <DetailLine label="当前建议等级" value={<Tag tone={tone(selected.level)}>{selected.level}</Tag>} />
                <DetailLine label="复核后等级" value={selected.gradedLevel ? <Tag tone={tone(selected.gradedLevel)}>{selected.gradedLevel}</Tag> : '待复核'} />
                <DetailLine label="复核人" value={selected.gradingAuditor || '待分配'} />
              </div>
              <p style={{ color: '#607089', fontSize: 13, lineHeight: 1.7 }}>
                分级审核由审核中心统一办理。提交后，审核人员将依据问题事实、制度依据、金额标准和影响程度对问题等级进行复核。
                复核结论将自动回写问题台账并驱动整改流程。
              </p>
              {selected.gradingOpinion ? <p style={{ marginTop: 12, padding: 12, background: '#f8fbff', borderRadius: 8, color: '#334155', fontSize: 13 }}><b>复核意见：</b>{selected.gradingOpinion}</p> : null}
              <div className="icm-form-actions">
                {canSubmitGrading ? <Button type="primary" icon={<ShieldCheck size={14} />} onClick={submitGrading}>提交分级审核</Button> : null}
              </div>
            </Card>
          ) : activePanel === 'objection' ? (
            <Card title="异议处理" note="责任单位可在规定期限内提出申诉，审核人复核后判定。">
              {selected.objection.status === '无' || selected.objection.status === '异议不成立' ? (
                <>
                  <p style={{ color: '#607089', fontSize: 13, marginBottom: 12 }}>责任部门如对本问题的事实、定级或整改要求有异议，可填写理由并提交申诉。</p>
                  {canObjection ? (
                    <label style={{ display: 'grid', gap: 8 }}>
                      <span style={{ color: '#334155', fontSize: 13 }}>异议理由</span>
                      <textarea className="icm-input" rows={4} value={objectionReason} onChange={(event) => setObjectionReason(event.target.value)} placeholder="填写异议理由..." />
                      <div className="icm-form-actions">
                        <Button type="primary" icon={<MessageSquareWarning size={14} />} onClick={submitObjection} disabled={!objectionReason.trim()}>提交异议</Button>
                      </div>
                    </label>
                  ) : (
                    <Tag tone="gray">当前状态不允许提交异议</Tag>
                  )}
                </>
              ) : (
                <>
                  <div className="icm-grid cols-2" style={{ marginBottom: 12 }}>
                    <DetailLine label="异议状态" value={<Tag tone={selected.objection.status === '异议成立' ? 'green' : 'amber'}>{selected.objection.status}</Tag>} />
                    <DetailLine label="提出单位" value={selected.objection.raisedBy} />
                    <DetailLine label="提出时间" value={selected.objection.raisedAt} />
                    <DetailLine label="异议理由" value={selected.objection.reason} />
                    {selected.objection.auditorOpinion ? <DetailLine label="审核意见" value={selected.objection.auditorOpinion} /> : null}
                  </div>
                  {canResolveObjection ? (
                    <div className="icm-form-actions">
                      <Button type="default-soft" onClick={() => resolveObjection('不成立')}>异议不成立</Button>
                      <Button type="primary" onClick={() => resolveObjection('成立')}>异议成立</Button>
                    </div>
                  ) : null}
                </>
              )}
            </Card>
          ) : activePanel === 'merge' ? (
            <Card title="合并建议" note="系统将相同责任部门、相似根因的问题推荐为可合并对象。">
              {mergeCandidateIds.length === 0 ? (
                <div className="icm-empty-inline">当前暂无推荐合并问题</div>
              ) : (
                <>
                  <DataTable
                    columns={['选择', '问题编号', '问题描述', '等级', '责任部门']}
                    rows={mergeCandidateIds.map((id) => {
                      const candidate = issues.find((i) => i.id === id)
                      if (!candidate) return []
                      const checked = mergeCandidateIds.includes(id)
                      return [
                        <input key="chk" type="checkbox" checked={checked} onChange={() => setMergeCandidateIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])} />,
                        candidate.id,
                        candidate.title,
                        <Tag tone={tone(candidate.level)}>{candidate.level}</Tag>,
                        candidate.owner,
                      ]
                    }).filter((row) => row.length > 0)}
                  />
                  <div className="icm-form-actions">
                    <Button type="primary" icon={<GitMerge size={14} />} onClick={confirmMerge} disabled={mergeCandidateIds.length === 0}>合并选中问题</Button>
                  </div>
                </>
              )}
            </Card>
          ) : (
            <Card title="来源血缘" note="完整展示从审查线索到问题再到整改的追溯链路。">
              <div className="icm-trace-list">
                {selected.sourceFindingIds.map((fid) => (
                  <button key={fid} type="button" onClick={() => navigate('/review-workbench?view=results')}>
                    {fid}<span>审查线索</span>
                  </button>
                ))}
                <button type="button" onClick={() => navigate('/workpaper')}>{selected.workpaperId}<span>审查记录</span></button>
                <button type="button" onClick={() => navigate('/evidence')}>{selected.evidenceIds.join(' / ')}<span>取证材料</span></button>
                <button type="button" onClick={() => {}}>{selected.id}<span>当前问题</span></button>
                {selected.rectificationId ? (
                  <button type="button" onClick={() => navigate(`/rectify?rect=${selected.rectificationId}`)}>
                    {selected.rectificationId}<span>{linkedRectification?.status || '整改跟踪'}</span>
                  </button>
                ) : null}
              </div>
            </Card>
          )}
        </div>

        <aside className="icm-issue-detail-side">
          <Card title="快捷操作">
            <div className="icm-actions" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
              <Button type="default-soft" onClick={() => setActivePanel('draft')}>问题定稿</Button>
              <Button type="default-soft" onClick={() => setActivePanel('grading')}>分级审核</Button>
              <Button type="default-soft" onClick={() => setActivePanel('objection')}>异议处理</Button>
              <Button type="default-soft" onClick={() => { setActivePanel('merge'); loadMergeCandidates() }}>合并建议</Button>
              <Button type="default-soft" onClick={() => setActivePanel('lineage')}>来源血缘</Button>
            </div>
          </Card>
          <Card title="状态记录">
            <DetailLine label="当前状态" value={<Tag tone={tone(selected.status)}>{selected.status}</Tag>} />
            <DetailLine label="最后更新" value={selected.updatedAt} />
            <DetailLine label="当前环节" value={selected.status === '待确认' ? '问题确认' : selected.status === '异议中' ? '异议复核' : selected.status === '整改中' ? '整改执行' : '整改复核完成'} />
          </Card>
        </aside>
      </div>
      {notice ? <div className="icm-toast-fixed">{notice}</div> : null}
    </PageFrame>
  )
}
