import { useState } from 'react'
import { Button, Modal, Textarea } from '@/components'
import type { AgentArtifact, AgentRun } from '../agents/types'
import { useProjectDocumentStore } from '../store/projectDocumentStore'
import { useIcmDemoRole } from '../AppShell'
import { downloadProjectFile } from './projectFileStorage'
import { disposeReviewClue } from './intelligentReviewActions'
import { useProjectNavigate } from './projectScope'

export function ReviewClueDrawer({ run, clue, locked, onClose }: { run: AgentRun; clue: AgentArtifact; locked: boolean; onClose: () => void }) {
  const { role } = useIcmDemoRole()
  const navigate = useProjectNavigate()
  const [opinion, setOpinion] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [notice, setNotice] = useState('')
  const source = run.reviewContext?.sources.find((s) => s.fileId === clue.reviewEvidence?.fileId)
  const file = useProjectDocumentStore((s) => s.files.find((f) => f.id === source?.fileId && f.projectId === run.projectId))
  const paperHref = (id: string) => `/projects/${run.projectId}?tab=execution&section=papers&paper=${id}`
  const dispose = (create: boolean) => { try {
    if (create && !confirmed) throw new Error('请先核对原件与线索摘录。')
    const id = disposeReviewClue(run.id, clue.id, opinion, role.name, create)
    if (id) navigate(paperHref(id)); else setNotice('线索已排除，核验意见已记录。')
  } catch (e) { setNotice((e as Error).message) } }
  return <Modal open drawer width="min(720px, 100vw)" title="审查线索核验" onClose={onClose} footer={clue.paperId ? <Button type="primary" onClick={() => navigate(paperHref(clue.paperId!))}>查看关联底稿</Button> : !locked && clue.reviewDisposition !== '已排除' ? <><Button onClick={() => dispose(false)}>排除线索</Button><Button type="primary" disabled={!confirmed || !opinion.trim()} onClick={() => dispose(true)}>核实并转底稿</Button></> : null}>
    <h3>{clue.title}</h3><p>{run.projectName} → {run.reviewContext?.taskName}</p>
    <div className="review-detail-block"><strong>来源资料</strong><p>{source?.name} · {clue.reviewEvidence?.locator}</p><pre>{clue.reviewEvidence?.excerpt}</pre>{file && <Button onClick={() => downloadProjectFile(file).catch((e) => setNotice(e.message))}>下载原始资料</Button>}</div>
    <div className="review-detail-block"><strong>本次采用的配置</strong><p>{run.reviewContext?.agent.title} · V{run.reviewContext?.agent.version} · 关注词：{clue.reviewEvidence?.term}</p><p>该表述需要核实，风险等级与事实结论由审计人员判断。</p>{run.reviewContext?.references.map((r) => <details key={r.id}><summary>{r.title} · V{r.version}</summary><pre>{r.content}</pre></details>)}</div>
    {clue.reviewDisposition === '已排除' || clue.paperId ? <p className="review-notice">{clue.reviewDisposition} · {clue.acceptedBy}<br />{clue.reviewOpinion}</p> : !locked ? <div className="review-detail-block"><label className="review-check"><input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />已核对原件与上述摘录</label><Textarea aria-label="线索核验意见" value={opinion} onChange={setOpinion} placeholder="记录核验结果、排除理由或需要继续测试的事项" rows={4} /></div> : <p>项目已封存，当前可查看历史线索及引用记录。</p>}
    {notice && <p role="status" className="review-notice">{notice}</p>}
  </Modal>
}
