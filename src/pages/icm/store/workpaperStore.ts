import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { seedCases, type WorkpaperCase } from '../data/workpaperCases'
import { workId, workEvent } from '../data/projectWork'
import { useAuditProjectStore } from './auditProjectStore'

export function paperReviewStep(paper?: WorkpaperCase) {
  if (!paper) return 0
  if (paper.reviewChain.every((r) => ['通过', '不适用'].includes(r.status))) return 4
  return ({ 一级复核: 1, 二级复核: 2, 交叉复核: 3 } as Record<string, number>)[paper.status] ?? 0
}
interface PaperStore {
  papers: WorkpaperCase[]; advanceReview: (id: string) => void
  createPaper: (projectId: string, programIds: string[], owner: string, title?: string) => string
  savePaper: (id: string, data: Pick<WorkpaperCase, 'title' | 'type' | 'body' | 'evidenceIds'>, actor: string) => void
}
export const useWorkpaperStore = create<PaperStore>()(persist((set, get) => ({
  papers: seedCases,
  createPaper: (projectId, programIds, owner, title) => {
    const p = useAuditProjectStore.getState().projects.find((p) => p.id === projectId)
    if (!p || p.archivedAt || p.auditReport?.status === '已签发') throw new Error('项目不存在或审计成果已经封存。')
    const programs = (p.programs ?? []).filter((r) => programIds.includes(r.id))
    if (!programs.length && !title?.trim()) throw new Error('请明确本次检查事项。')
    const id = workId('WP')
    const paper: WorkpaperCase = { id, projectId, programIds, evidenceIds: [], title: title || programs.map((r) => r.title).join('、') + '底稿', type: '合规底稿', status: '草稿', reviewState: '草稿', version: 1, unit: p.subject, field: p.type, source: '项目审计程序', owner, createdAt: new Date().toISOString(), process: '编制 → 复核 → 形成结论', evidenceSheet: { id: '', title: '', confirm: '待核实', parsed: [] }, reviewFinding: { id: '', title: '', confidence: '', rule: '' }, dataSnapshot: { id: '', package: '', files: [] }, reviewChain: programs.slice(0, 1).map((r) => ({ node: '底稿复核', owner: r.reviewer, status: '未提交', opinion: '' })), body: { procedure: programs.map((r) => r.method).join('\n'), facts: '', conclusion: '', next: '' }, history: [workEvent('创建底稿', owner)] }
    set((s) => ({ papers: [...s.papers, paper] })); return id
  },
  savePaper: (id, data, actor) => {
    const paper = get().papers.find((p) => p.id === id)
    if (!paper || ['待复核', '已复核'].includes(paper.reviewState ?? '') || paper.status === '留档锁定') throw new Error('当前底稿不能修改，请先退回或发起修订。')
    const project = useAuditProjectStore.getState().projects.find((p) => p.id === paper.projectId)
    if (project?.archivedAt || project?.auditReport?.status === '已签发') throw new Error('项目审计成果已经封存。')
    if (!data.title.trim()) throw new Error('请填写底稿名称。')
    set((s) => ({ papers: s.papers.map((p) => p.id !== id ? p : { ...p, ...data, version: (p.version ?? 1) + 1, history: [...(p.history ?? []), workEvent('保存底稿', actor)] }) }))
  },
  advanceReview: (id) => set((s) => ({ papers: s.papers.map((p) => {
    if (p.id !== id || paperReviewStep(p) >= 4 || p.status === '调阅审批') return p
    const step = paperReviewStep(p) + 1
    const statuses: WorkpaperCase['status'][] = ['取证中', '一级复核', '二级复核', '交叉复核', '待归档']
    return { ...p, status: statuses[step], reviewChain: p.reviewChain.map((r, index) => ({ ...r, status: index < step - 1 ? '通过' : index === step - 1 ? '处理中' : '未开始' })) }
  }) })),
}), { name: 'internal-audit-workpapers-v1', version: 1 }))
