import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PlanResource } from '../pages/annual-plan/conversationTypes'

export interface LibraryResource extends PlanResource { planId: string; shared: boolean }
interface LibraryState {
  resources: LibraryResource[]
  add: (resources: LibraryResource[], replaceGroup?: string) => void
  archive: (id: string) => void
}
export const usePlanningLibraryStore = create<LibraryState>()(persist((set) => ({
  resources: [],
  add: (resources, replaceGroup) => set((state) => ({ resources: [...state.resources.map((r) => replaceGroup && r.groupId === replaceGroup ? { ...r, archived: true } : r), ...resources] })),
  archive: (id) => set((state) => ({ resources: state.resources.map((r) => r.id === id ? { ...r, archived: true } : r) })),
}), { name: 'audit-plan-resource-library-v1' }))
