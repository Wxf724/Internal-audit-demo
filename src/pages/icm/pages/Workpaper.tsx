import { useState } from 'react'
import { ArrowLeft, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, ClipboardList, Database, FilePlus2, FileSearch, GitBranch, Loader2, LockKeyhole, Search, X } from 'lucide-react'

import { Button, Card, DataTable, DetailLine, PageFrame, Tag, Toolbar, type Tone } from '../components/IcmPageKit'
import { legacyPaperOwners, useProjectScope } from './projectScope'
import { findingFromPaper } from './projectWorkActions'
import { useIcmDemoRole } from '../AppShell'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'

type SourceTab = 'evidence' | 'finding' | 'snapshot' | 'material'

function SectionTitle({ children }: { children: string }) {
  return <div className="icm-subsection-head"><div className="icm-card-title">{children}</div></div>
}

import { useWorkpaperStore, paperReviewStep } from '../store/workpaperStore'

function tone(status: string): Tone {
  if (status.includes('重大') || status.includes('问题底稿') || status.includes('整改中') || status.includes('取证中')) return 'red'
  if (status.includes('待') || status.includes('复核') || status.includes('审批') || status.includes('草稿')) return 'amber'
  if (status.includes('合规底稿') || status.includes('通过') || status.includes('已入库') || status.includes('销号') || status.includes('锁定') || status.includes('满足')) return 'green'
  return 'blue'
}

export default function Workpaper() {
  const { projectId } = useProjectScope()
  const navigate = useNavigate(), { role } = useIcmDemoRole()
  const seedCases = useWorkpaperStore((s) => s.papers)
  const cases = projectId ? seedCases.filter((paper) => (paper.projectId ?? legacyPaperOwners[paper.id]) === projectId) : seedCases
  const [params] = useSearchParams()
  const [selectedId, setSelectedId] = useState<string | undefined>(params.get('paper') ?? undefined)
  const [sideCollapsed, setSideCollapsed] = useState(false)
  const [modalTab, setModalTab] = useState<SourceTab | null>(null)
  const [evidenceParsed, setEvidenceParsed] = useState(false)
  const [evidenceFolded, setEvidenceFolded] = useState(true)
  const [reviewFolded, setReviewFolded] = useState(true)
  const [reporting, setReporting] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const selected = cases.find((item) => item.id === selectedId)
  const reviewStep = paperReviewStep(selected)

  // 切换底稿时重置
  const selectPaper = (id: string) => {
    setSelectedId(id)
    setSideCollapsed(false)
    setModalTab(null)
    setEvidenceParsed(false)
    setEvidenceFolded(true)
    setReviewFolded(true)
    setReporting(false)
  }

  // 解析取证单
  const parseEvidence = () => {
    setEvidenceParsed(true)
  }

  // 进行复核
  const doReview = () => {
    if (reviewStep < 4) {
      setToastMsg('历史底稿保留原复核记录；新增工作请从项目审计程序编制并提交复核。')
      setEvidenceFolded(true)
      setReviewFolded(false)
    }
  }

  const submitRectify = () => {
    if (!selected) return
    try { const id = findingFromPaper(selected.id,role.name); navigate('/issues?issue=' + id + (projectId ? '&project=' + projectId : '')) } catch(e) {setToastMsg((e as Error).message)}
  }

  if (selected?.projectId) return <Navigate replace to={'/projects/' + selected.projectId + '?tab=execution&section=papers&paper=' + selected.id} />
  if (!selected) {
    return (
      <PageFrame
        title="审查记录"
        subtitle="审查记录的编制、取证、复核、问题生成和归档管理。"
        actions={<Button type="primary" icon={<FilePlus2 size={15} />} onClick={() => navigate(projectId ? '/projects/' + projectId + '?tab=execution' : '/projects')}>新建记录</Button>}
      >
        <Toolbar>
          <input className="icm-input" placeholder="搜索记录编号、单位、领域" />
          <select className="icm-select">
            <option>全部状态</option>
            <option>取证中</option>
            <option>复核中</option>
            <option>整改中</option>
            <option>已入库</option>
            <option>留档锁定</option>
          </select>
          <select className="icm-select">
            <option>全部类型</option>
            <option>问题记录</option>
            <option>正常记录</option>
          </select>
        </Toolbar>

        <div className="icm-grid cols-3">
            {cases.map((paper) => (
              <button
                className="icm-card"
                key={paper.id}
                onClick={() => selectPaper(paper.id)}
                style={{ border: '1px solid #dbe5f1', cursor: 'pointer', padding: 0, textAlign: 'left' }}
                type="button"
              >
                <div className="icm-card-head">
                  <div>
                    <div className="icm-card-title">{paper.title}</div>
                    <div className="icm-card-note">{paper.id} · {paper.unit}</div>
                  </div>
                  <Tag tone={tone(paper.type)}>{paper.type}</Tag>
                </div>
                <div className="icm-card-body">
                  <DetailLine label="底稿来源" value={paper.source} />
                  <DetailLine label="处理方式" value={paper.process} />
                  <DetailLine label="当前状态" value={<Tag tone={tone(paper.status)}>{paper.status}</Tag>} />
                  <DetailLine label="检查人员" value={paper.owner} />
                </div>
              </button>
            ))}
          </div>
        </PageFrame>
      )
    }

  const isLocked = selected.status === '留档锁定'
  const allReviewPassed = reviewStep >= 4

  const reviewNodes = [
    { node: '一级复核', owner: selected.reviewChain[0]?.owner ?? '-', status: reviewStep === 1 ? '复核中' : reviewStep >= 2 ? '通过' : '待复核', opinion: reviewStep >= 2 ? (selected.reviewChain[0]?.opinion ?? '-') : '-' },
    { node: '二级复核', owner: selected.reviewChain[1]?.owner ?? '-', status: reviewStep === 2 ? '复核中' : reviewStep >= 3 ? '通过' : '待复核', opinion: reviewStep >= 3 ? (selected.reviewChain[1]?.opinion ?? '-') : '-' },
    { node: '交叉复核', owner: selected.reviewChain[2]?.owner ?? '-', status: reviewStep === 3 ? '复核中' : reviewStep >= 4 ? '通过' : '待复核', opinion: reviewStep >= 4 ? (selected.reviewChain[2]?.opinion ?? '-') : '-' },
  ]

  return (
    <PageFrame
      title="审查记录"
      subtitle={`${selected.id} · ${selected.unit} · ${selected.field}`}
      actions={
        <>
          <Button type="default-soft" icon={<ArrowLeft size={15} />} onClick={() => { setSelectedId(undefined) }}>返回记录列表</Button>
          <Button type="primary" icon={<FilePlus2 size={15} />} onClick={() => navigate(projectId ? '/projects/' + projectId + '?tab=execution' : '/projects')}>新建记录</Button>
        </>
      }
    >
      <Card title="溯源材料" note="取证单、审查线索、数据快照和业务资料" action={<button className="icm-sidebar-toggle" type="button" onClick={() => setSideCollapsed((value) => !value)} aria-label="展开或收起溯源材料"><ChevronDown size={15} style={{ transform: sideCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }} /></button>}>
        {!sideCollapsed ? <div className="icm-actions"><Button type="info-soft" icon={<FileSearch size={15} />} onClick={() => setModalTab('evidence')}>取证单</Button><Button type="info-soft" icon={<Search size={15} />} onClick={() => setModalTab('finding')}>审查线索</Button><Button type="info-soft" icon={<Database size={15} />} onClick={() => setModalTab('snapshot')}>数据快照</Button><Button type="info-soft" icon={<ClipboardList size={15} />} onClick={() => setModalTab('material')}>业务资料</Button></div> : null}
      </Card>
      <div className="icm-workpaper-detail-grid">
        <div className="icm-reveal-panel">
          <Card title="底稿目录" note="当前检查任务底稿">
            <div className="icm-workpaper-directory">{cases.map((paper) => <button className={paper.id === selected.id ? 'active' : ''} key={paper.id} type="button" onClick={() => selectPaper(paper.id)}><span>{paper.type}</span>{paper.title}</button>)}</div>
          </Card>
        </div>

        <div className="icm-reveal-panel" key={selected.id}>
          <Card
            title={selected.title}
            note={`${selected.type} · ${selected.status} · ${selected.owner}`}
            action={isLocked ? <Tag tone="green"><LockKeyhole size={12} /> 留档锁定</Tag> : <Tag tone={tone(selected.status)}>{selected.status}</Tag>}
          >
            <div className="icm-grid cols-3">
              <DetailLine label="底稿来源" value={selected.source} />
              <DetailLine label="处理方式" value={selected.process} />
              <DetailLine label="创建时间" value={selected.createdAt} />
            </div>

            <SectionTitle>底稿正文</SectionTitle>
            <div className="icm-editor icm-editor-compact">
              <h2>{selected.title}</h2>
              <h3>一、检查程序</h3>
              <p>{selected.body.procedure}</p>
              <h3>二、取证事实</h3>
              <p>{selected.body.facts}</p>
              <h3>三、复核结论</h3>
              <p>{selected.body.conclusion}</p>
            </div>

            {!evidenceParsed ? (
              <div style={{ marginTop: 12 }}>
                <Button type="primary" icon={<FileSearch size={15} />} onClick={parseEvidence}>解析取证单</Button>
              </div>
            ) : allReviewPassed ? (
              <>
                <Card
                  title="取证单解析结果"
                  note="复核全部通过"
                  action={
                    <button className="icm-sidebar-toggle" type="button" onClick={() => setEvidenceFolded((v) => !v)} aria-label={evidenceFolded ? '展开' : '折叠'}>
                      {evidenceFolded ? <ChevronLeft size={15} style={{ transform: 'rotate(90deg)' }} /> : <ChevronLeft size={15} style={{ transform: 'rotate(-90deg)' }} />}
                    </button>
                  }
                >
                  {!evidenceFolded ? (
                    <DataTable
                      columns={['取证单', '解析要素', '被检查单位确认']}
                      rows={selected.evidenceSheet.parsed.map((item, index) => [
                        index === 0 ? selected.evidenceSheet.id : '',
                        item,
                        index === 0 ? selected.evidenceSheet.confirm : '',
                      ])}
                    />
                  ) : null}
                </Card>
                <Card
                  title="复核链路"
                  note="全部通过"
                  action={
                    <button className="icm-sidebar-toggle" type="button" onClick={() => setReviewFolded((v) => !v)} aria-label={reviewFolded ? '展开' : '折叠'}>
                      {reviewFolded ? <ChevronLeft size={15} style={{ transform: 'rotate(90deg)' }} /> : <ChevronLeft size={15} style={{ transform: 'rotate(-90deg)' }} />}
                    </button>
                  }
                >
                  {!reviewFolded ? (
                    <div className="icm-review-chain">
                      {reviewNodes.map((node, index) => (
                        <div className="icm-review-node done" key={node.node}>
                          <div className="icm-review-node-dot"><CheckCircle2 size={18} /></div>
                          <div className="icm-review-node-body">
                            <div className="icm-review-node-head">
                              <strong>{node.node}</strong>
                              <Tag tone="green">通过</Tag>
                            </div>
                            <div className="icm-review-node-meta">
                              <span>负责人：{node.owner}</span>
                              {node.opinion !== '-' ? <span>意见：{node.opinion}</span> : null}
                            </div>
                          </div>
                          {index < reviewNodes.length - 1 ? <div className="icm-review-node-line" /> : null}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </Card>
                <Card
                  title="问题底稿 · 已关联问题"
                  note="问题已确认"
                >
                  <div className="icm-grid cols-2" style={{ gap: 10 }}>
                    <DetailLine label="审查线索" value={selected.reviewFinding.id !== '-' ? `${selected.reviewFinding.id} · ${selected.reviewFinding.title}` : '无'} />
                    <DetailLine label="置信度" value={selected.reviewFinding.confidence} />
                    <DetailLine label="数据快照" value={`${selected.dataSnapshot.id}`} />
                    <DetailLine label="数据包" value={selected.dataSnapshot.package} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                    <Button type="primary" icon={reporting ? <Loader2 className="icm-spin" size={15} /> : <GitBranch size={15} />} disabled={reporting} onClick={submitRectify}>形成发现草稿</Button>
                  </div>
                </Card>
              </>
            ) : (
              <div className="icm-grid" style={{ marginTop: 14, gap: 12 }}>
                <Card
                  title="取证单解析结果"
                  note="系统自动解析事实要素，用于匹配问题归属和整改责任"
                  action={
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {reviewStep === 0 ? (
                        <Button type="primary" size="sm" icon={<Search size={15} />} onClick={doReview}>进行复核</Button>
                      ) : (
                        <Tag tone="blue">复核中</Tag>
                      )}
                      <button className="icm-sidebar-toggle" type="button" onClick={() => setEvidenceFolded((v) => !v)} aria-label={evidenceFolded ? '展开' : '折叠'}>
                        {evidenceFolded ? <ChevronLeft size={15} style={{ transform: 'rotate(90deg)' }} /> : <ChevronLeft size={15} style={{ transform: 'rotate(-90deg)' }} />}
                      </button>
                    </div>
                  }
                >
                  {!evidenceFolded ? (
                    <DataTable
                      columns={['取证单', '解析要素', '被检查单位确认']}
                      rows={selected.evidenceSheet.parsed.map((item, index) => [
                        index === 0 ? selected.evidenceSheet.id : '',
                        item,
                        index === 0 ? selected.evidenceSheet.confirm : '',
                      ])}
                    />
                  ) : null}
                </Card>

                {reviewStep > 0 ? (
                  <Card
                    title="复核链路"
                    note={`${reviewNodes.filter((n) => n.status === '通过').length}/${reviewNodes.length} 节点已通过`}
                    action={
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {!allReviewPassed ? (
                          <Button type="primary" size="sm" onClick={doReview}>继续复核</Button>
                        ) : null}
                        <button className="icm-sidebar-toggle" type="button" onClick={() => setReviewFolded((v) => !v)} aria-label={reviewFolded ? '展开' : '折叠'}>
                          {reviewFolded ? <ChevronLeft size={15} style={{ transform: 'rotate(90deg)' }} /> : <ChevronLeft size={15} style={{ transform: 'rotate(-90deg)' }} />}
                        </button>
                      </div>
                    }
                  >
                    {!reviewFolded ? (
                      <div className="icm-review-chain">
                        {reviewNodes.map((node, index) => {
                          const isDone = node.status === '通过'
                          const isActive = node.status === '复核中'
                          return (
                            <div className={`icm-review-node ${isDone ? 'done' : isActive ? 'active' : 'pending'}`} key={node.node}>
                              <div className="icm-review-node-dot">
                                {isDone ? <CheckCircle2 size={18} /> : <span>{index + 1}</span>}
                              </div>
                              <div className="icm-review-node-body">
                                <div className="icm-review-node-head">
                                  <strong>{node.node}</strong>
                                  <Tag tone={isDone ? 'green' : isActive ? 'blue' : 'gray'}>{node.status}</Tag>
                                </div>
                                <div className="icm-review-node-meta">
                                  <span>负责人：{node.owner}</span>
                                  {node.opinion !== '-' ? <span>意见：{node.opinion}</span> : null}
                                </div>
                              </div>
                              {index < reviewNodes.length - 1 ? <div className="icm-review-node-line" /> : null}
                            </div>
                          )
                        })}
                      </div>
                    ) : null}
                  </Card>
                ) : null}
              </div>
            )}
          </Card>
        </div>
        <div className="icm-reveal-panel">
          <Card title="复核结果" note="基于当前底稿、取证要素和复核节点形成">
            <div className="icm-workpaper-review-summary">
              <div><span>底稿状态</span><Tag tone={tone(selected.status)}>{selected.status}</Tag></div>
              <div><span>取证解析</span><Tag tone={evidenceParsed ? 'green' : 'amber'}>{evidenceParsed ? '已解析' : '待解析'}</Tag></div>
              <div><span>复核进度</span><strong>{reviewStep}/{reviewNodes.length + 1} 节点</strong></div>
            </div>
            <div className="icm-workpaper-review-list">
              <div><b>事实与取证一致性</b><span>{evidenceParsed ? '已提取取证要素，待复核确认。' : '请先解析取证单。'}</span></div>
              <div><b>制度依据适配性</b><span>检查程序已关联当前领域控制要求。</span></div>
              <div><b>结论与整改衔接</b><span>{selected.type === '问题底稿' ? '问题确认后可进入整改追踪。' : '合规结论成立后按权限归档。'}</span></div>
            </div>
            <div className="icm-actions" style={{ marginTop: 12 }}>
              {!evidenceParsed ? <Button type="primary" icon={<FileSearch size={15} />} onClick={parseEvidence}>解析取证</Button> : !allReviewPassed ? <Button type="primary" onClick={doReview}>{reviewStep ? '继续复核' : '开始复核'}</Button> : <Tag tone="green">复核通过</Tag>}
            </div>
          </Card>
        </div>
      </div>

      {/* Source material modal */}
      {modalTab ? (
        <div className="icm-modal-mask" role="dialog" aria-modal="true">
          <div className="icm-modal icm-modal-small">
            <div className="icm-modal-head">
              <div>
                <div className="icm-modal-title">
                  {modalTab === 'evidence' ? '取证单详情' : modalTab === 'finding' ? '审查线索详情' : modalTab === 'snapshot' ? '数据快照详情' : '业务资料'}
                </div>
                <div className="icm-modal-sub">
                  {modalTab === 'evidence' ? selected.evidenceSheet.id
                    : modalTab === 'finding' ? selected.reviewFinding.id
                    : modalTab === 'snapshot' ? selected.dataSnapshot.id
                    : '关联业务文件'}
                </div>
              </div>
              <button className="icm-modal-close" type="button" onClick={() => setModalTab(null)} aria-label="关闭"><X size={16} /></button>
            </div>
            <div style={{ padding: 18 }}>
              {modalTab === 'evidence' ? (
                <>
                  <DetailLine label="取证单名称" value={selected.evidenceSheet.title} />
                  <DetailLine label="被检查单位确认" value={selected.evidenceSheet.confirm} />
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontWeight: 800, color: '#172033', fontSize: 13, marginBottom: 6 }}>解析要素</div>
                    <DataTable columns={['序号', '要素']} rows={selected.evidenceSheet.parsed.map((item, i) => [(i + 1).toString(), item])} />
                  </div>
                </>
              ) : null}
              {modalTab === 'finding' ? (
                <>
                  <DetailLine label="线索标题" value={selected.reviewFinding.title} />
                  <DetailLine label="置信度" value={selected.reviewFinding.confidence} />
                  <DetailLine label="命中规则" value={selected.reviewFinding.rule} />
                </>
              ) : null}
              {modalTab === 'snapshot' ? (
                <>
                  <DetailLine label="来源数据包" value={selected.dataSnapshot.package} />
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontWeight: 800, color: '#172033', fontSize: 13, marginBottom: 6 }}>包含文件</div>
                    <ul style={{ margin: 0, paddingLeft: 18, color: '#334155', fontSize: 13, lineHeight: 1.8 }}>
                      {selected.dataSnapshot.files.map((f) => <li key={f}>{f}</li>)}
                    </ul>
                  </div>
                </>
              ) : null}
              {modalTab === 'material' ? (
                <div className="icm-empty-inline">当前底稿暂无关联的业务资料。可从数据快照中提取文件，或手动上传相关佐证材料。</div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {/* Toast */}
      {toastMsg ? (
        <div className="icm-toast-fixed">
          <CheckCircle2 size={16} />
          <span>{toastMsg}</span>
        </div>
      ) : null}
    </PageFrame>
  )
}
