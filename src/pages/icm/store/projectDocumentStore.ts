import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { projectDemands } from '../data/projectDemands'
import { evidences } from '../data'
import { workId, workEvent, type ProjectDemand, type ProjectEvidence, type WorkFile } from '../data/projectWork'
import { useAuditProjectStore } from './auditProjectStore'

function editable(projectId?: string) {
  const p = useAuditProjectStore.getState().projects.find((p) => p.id === projectId)
  if (!p || p.archivedAt || p.archivePending || p.auditReport?.status === '已签发') throw new Error('项目不存在或审计资料已封存。')
}

const owners: Record<string, string> = { 'EV-0312': 'AUD-PL-2026-001', 'EV-0316': 'AUD-PL-2026-001', 'EV-0321': 'AUD-PL-2026-001', 'EV-0318': 'AUD-PL-2026-021' }
interface Documents {
  demands: ProjectDemand[]; evidences: ProjectEvidence[]; files: WorkFile[]
  addDemand: (data: Omit<ProjectDemand, 'id' | 'history' | 'fileIds' | 'status'>, actor: string) => string
  receive: (id: string, file: WorkFile, actor: string) => void
  importFile: (file: WorkFile, actor: string) => string
  verify: (id: string, pass: boolean, opinion: string, actor: string) => void
  addEvidence: (data: Omit<ProjectEvidence, 'id'>) => string
}
export const useProjectDocumentStore = create<Documents>()(persist((set, get) => ({
  demands: projectDemands.map((d) => ({ ...d, programIds: [], fileIds: [], history: [] })),
  evidences: evidences.map((e) => ({ ...e, projectId: owners[e.id], fileIds: [], description: '历史取证索引；原文件尚未迁入本地档案。' })), files: [],
  addDemand: (data, actor) => {
    editable(data.projectId)
    if (![data.name, data.owner, data.due].every((s) => s.trim())) throw new Error('请填写需求、责任人和提交期限。')
    const id = workId('DEM'); set((s) => ({ demands: [...s.demands, { ...data, id, status: '待提交', fileIds: [], history: [workEvent('发起资料需求', actor)] }] })); return id
  },
  receive: (id, file, actor) => {
    const d = get().demands.find((d) => d.id === id)
    if (!d || file.projectId !== d.projectId) throw new Error('文件与需求的项目不一致。')
    editable(d.projectId)
    set((s) => ({ files: [...s.files, file], demands: s.demands.map((d) => d.id !== id ? d : { ...d, fileIds: [...d.fileIds, file.id], status: '待校验', history: [...d.history, workEvent('接收文件', actor, file.name)] }) }))
  },
  importFile: (file, actor) => {
    editable(file.projectId)
    const id=workId('DEM')
    set((s)=>({files:[...s.files,file],demands:[...s.demands,{id,projectId:file.projectId,name:file.name,owner:actor,due:file.at.slice(0,10),scale:'直接导入资料，范围待核实',method:'直接导入',category:'审计资料',programIds:[],fileIds:[file.id],status:'待校验',history:[workEvent('直接导入资料',actor,file.name)]}]}))
    return id
  },
  verify: (id, pass, opinion, actor) => {
    const d = get().demands.find((d) => d.id === id)
    if (!d?.fileIds.length || !opinion.trim()) throw new Error('请先上传文件，并填写校验结论。')
    editable(d.projectId)
    set((s) => ({ demands: s.demands.map((d) => d.id !== id ? d : { ...d, status: pass ? '已采集' : '待补充', history: [...d.history, workEvent(pass ? '校验通过' : '退回补充', actor, opinion)] }) }))
  },
  addEvidence: (data) => {
    editable(data.projectId)
    if (!data.projectId || !data.title.trim() || !data.description.trim()) throw new Error('请明确项目、取证事项和证明内容。')
    if (data.fileIds.some((id) => !get().files.some((f) => f.id === id && f.projectId === data.projectId))) throw new Error('引用文件不属于当前项目。')
    const id = workId('EV'); set((s) => ({ evidences: [...s.evidences, { ...data, id }] })); return id
  },
}), { name: 'internal-audit-project-documents-v1', version: 1 }))
