import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Textarea } from '@/components'
import { useWorkflowStore, type WorkflowAudit } from '../store/workflowStore'
import { useIcmDemoRole } from '../AppShell'
import { useAuditProjectStore } from '../store/auditProjectStore'
import { useWorkpaperStore } from '../store/workpaperStore'
import './project-detail.css'

export function ProjectReviewActions({ projectId, object, businessId }: { projectId: string; object: WorkflowAudit['projectObject']; businessId: string }) {
  const audits = useWorkflowStore((s) => s.audits)
  const audit = audits.find((a) => a.projectId === projectId && a.projectObject === object && a.businessId === businessId && a.status === '待处理')
  return audit ? <ProjectReviewDecision key={audit.id} audit={audit} /> : null
}
export function ProjectReviewDecision({ audit, preview = false }: { audit: WorkflowAudit; preview?: boolean }) {
  const [opinion, setOpinion] = useState(''), [notice, setNotice] = useState('')
  const { role } = useIcmDemoRole()
  const project = useAuditProjectStore((s) => s.projects.find((p) => p.id === audit.projectId))
  const paper = useWorkpaperStore((s) => s.papers.find((p) => p.id === audit.businessId))
  const decide = (pass: boolean) => { try { const s = useWorkflowStore.getState(); (pass ? s.approveAudit : s.returnAudit)(audit.id, opinion, role.name); setNotice(pass ? '审核通过，原业务已更新。' : '已退回原业务修改。') } catch (e) { setNotice((e as Error).message) } }
  const content = audit.projectObject === 'paper' ? Object.values(paper?.body ?? {}).join('\n\n') : audit.projectObject === 'report' ? project?.auditReport?.content : audit.projectObject === 'archive' ? project?.archiveCandidate?.manifest.map((r) => `${r.type} · ${r.title}`).join('\n') : ['目标与范围：\n' + (project?.preparation?.objective ?? ''), '方法与抽样：\n' + (project?.preparation?.procedures ?? ''), '项目组与职责：\n' + (project?.preparation?.members ?? ''), '复核安排：\n' + (project?.preparation?.reviewer ?? ''), '进场安排：\n' + (project?.preparation?.notice ?? ''), ...(project?.programs ?? []).map((p) => `${p.title}\n风险：${p.risk}\n标准：${p.criteria}\n程序：${p.method}\n执行：${p.owner}；复核：${p.reviewer}`)].join('\n\n')
  return <section className="project-review-box"><div className="project-section-heading"><strong>{audit.node} · V{audit.sourceVersion}</strong><Link className="icm-link" to={audit.route}>查看原业务</Link></div>{preview && <div className="project-document">{content || '请打开原业务核对材料。'}</div>}{audit.status === '待处理' && <><label>审核意见<Textarea aria-label="项目审核意见" value={opinion} onChange={setOpinion} placeholder="记录核对结果、退回原因或批准意见" /></label><div className="project-form-actions"><Button type="default" disabled={!opinion.trim()} onClick={() => decide(false)}>退回修改</Button><Button type="primary" disabled={!opinion.trim()} onClick={() => decide(true)}>审核通过</Button></div></>}{audit.status !== '待处理' && <p>{audit.status} · {audit.opinion}</p>}{notice && <p role="status">{notice}</p>}</section>
}
