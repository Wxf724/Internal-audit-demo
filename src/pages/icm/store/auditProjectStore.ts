import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { auditProjects, type AuditProject, type ProjectPlanLink } from '../data/auditProjects'
import { applyRequestedProjectRemoval, type DeletedProjectRecord } from './requestedProjectCleanup'

export type NewProjectInput = Pick<AuditProject, 'name' | 'type' | 'subject' | 'period' | 'plannedImplementation' | 'owner' | 'risk' | 'scope'> & Partial<Pick<AuditProject, 'managementYear' | 'sourceType' | 'authorization' | 'executionLinks'>>

interface AuditProjectState {
  projects: AuditProject[]
  deletedProjects: DeletedProjectRecord[]
  removeProject: (projectId: string, actor: string) => void
  createProject: (input: NewProjectInput) => string
  updateProject: (projectId: string, patch: Partial<AuditProject>) => void
  arrangeExecution: (allocations: { projectId?: string; input: NewProjectInput; links: ProjectPlanLink[] }[]) => string[]
  ensureAnnualProject: (annualPlanId: string, itemId: string, input: NewProjectInput, existingId?: string) => string
}

function createProjectId() {
  const suffix = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID().slice(0, 8).toUpperCase()
    : Math.random().toString(36).slice(2, 10).toUpperCase()
  return `AUD-${new Date().getFullYear()}-${suffix}`
}

export const useAuditProjectStore = create<AuditProjectState>()(persist((set, get) => ({
  projects: auditProjects,
  deletedProjects: [],
  removeProject: (projectId, actor) => {
    const project = get().projects.find(p => p.id === projectId)
    if (!project) throw new Error('项目不存在或已删除。')
    if (project.stage !== '准备中' || project.preparation?.confirmedAt || project.preparation?.status === '待审核' || project.archivedAt || project.archivePending || project.auditReport || project.preparationVersions?.length) throw new Error('已有正式审计记录的项目不能直接删除。')
    set(state => ({ projects: state.projects.filter(p => p.id !== projectId), deletedProjects: [...state.deletedProjects, { project: structuredClone(project), deletedAt: new Date().toISOString(), deletedBy: actor }] }))
  },
  arrangeExecution: (allocations) => {
    if (!allocations.length) throw new Error('请选择执行安排。')
    const existingIds = allocations.map((row) => row.projectId).filter(Boolean)
    if (new Set(existingIds).size !== existingIds.length) throw new Error('同一项目请合并为一条执行安排。')
    for (const row of allocations) {
      const project = get().projects.find((p) => p.id === row.projectId)
      if (row.projectId && (!project || project.archivedAt || project.stage === '已归档')) throw new Error('目标项目不存在或已归档。')
      if (!row.input.name.trim() || !row.input.scope.trim()) throw new Error('请补全项目名称和承担范围。')
      if (row.links.some((link) => project?.executionLinks?.some((old) => old.annualPlanId === link.annualPlanId && old.itemId === link.itemId))) throw new Error('该计划项已关联此项目，请勿重复安排。')
    }
    const ids = allocations.map((row) => row.projectId ?? createProjectId())
    set((state) => {
      const projects = [...state.projects]
      allocations.forEach((row, i) => {
        const index = projects.findIndex((p) => p.id === ids[i])
        if (index >= 0) projects[index] = { ...projects[index], executionLinks: [...(projects[index].executionLinks ?? []), ...row.links], currentRevision: projects[index].currentRevision + 1 }
        else projects.unshift({ ...row.input, id: ids[i], executionLinks: row.links, stage: '准备中', scenario: row.input.type === '工程审计' ? 'engineering' : row.input.type === '经济责任审计' ? 'economic' : 'finance', taskIds: [], notes: [], todoItems: [], draftItems: [], currentRevision: 1 })
      })
      return { projects }
    })
    return ids
  },
  ensureAnnualProject: (annualPlanId, itemId, input, existingId) => {
    const planId = `${annualPlanId}/${itemId}`
    const existing = get().projects.find((project) => project.id === existingId || project.planId === planId)
    if (existing) return existing.id
    const id = get().createProject(input)
    get().updateProject(id, { planId })
    return id
  },
  createProject: (input) => {
    const id = createProjectId()
    const type = input.type
    set((state) => ({
      projects: [{
        ...input,
        id,
        stage: '准备中',
        scenario: type === '工程审计' ? 'engineering' : type === '经济责任审计' ? 'economic' : 'finance',
        taskIds: [],
        notes: [],
        todoItems: [],
        draftItems: [],
        currentRevision: 1,
      }, ...state.projects],
    }))
    return id
  },
  updateProject: (projectId, patch) => set((state) => ({
    projects: state.projects.map((project) => project.id === projectId
      ? { ...project, ...patch, currentRevision: project.currentRevision + 1 }
      : project),
  })),
}), {
  name: 'internal-audit-demo-v2-projects',
  storage: createJSONStorage(() => localStorage),
  version: 3,
  merge: (persisted, current) => {
    const saved = persisted as Partial<AuditProjectState> | undefined
    const projects = saved?.projects ?? current.projects
    const deletedProjects = saved?.deletedProjects ?? []
    const deletedIds = new Set(deletedProjects.map(entry => entry.project.id))
    return { ...current, ...saved, deletedProjects, projects: [...projects, ...auditProjects.filter((item) => !projects.some((entry) => entry.id === item.id))].filter(project => !deletedIds.has(project.id)) }
  },
  migrate: (persistedState) => {
    const saved = persistedState as Partial<AuditProjectState>
    return applyRequestedProjectRemoval({
      ...saved,
      projects: (saved.projects ?? auditProjects).map((project) => ({ ...project, todoItems: project.todoItems ?? [], draftItems: project.draftItems ?? [] })),
    }, new Date().toISOString()) as AuditProjectState
  },
}))

