import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { tasks } from '../data'
import type { Task } from '../data/types'

export type DispatchStage = 'confirm' | 'team' | 'materials' | 'release' | 'entry'

const initialStage: Record<string, DispatchStage> = {
  'TK-001': 'entry',
  'TK-002': 'materials',
  'TK-003': 'confirm',
}

interface TaskDispatchState {
  tasks: Task[]
  stageByTask: Record<string, DispatchStage>
  enteredTaskIds: string[]
  addTask: (task: Task) => void
  advanceDispatch: (taskId: string, stage: DispatchStage) => void
  confirmDispatch: (taskId: string) => void
  confirmEntry: (taskId: string) => void
}

export const useTaskDispatchStore = create<TaskDispatchState>()(persist((set) => ({
  tasks,
  stageByTask: initialStage,
  enteredTaskIds: ['TK-001'],
  addTask: (task) => set((state) => ({
    tasks: state.tasks.some((item) => item.id === task.id) ? state.tasks : [...state.tasks, task],
    stageByTask: { ...state.stageByTask, [task.id]: 'confirm' },
  })),
  advanceDispatch: (taskId, stage) => set((state) => ({
    stageByTask: { ...state.stageByTask, [taskId]: stage },
  })),
  confirmDispatch: (taskId) => set((state) => ({
    stageByTask: { ...state.stageByTask, [taskId]: 'entry' },
    tasks: state.tasks.map((task) => task.id === taskId ? { ...task, status: '待启动', progress: 0 } : task),
  })),
  confirmEntry: (taskId) => set((state) => ({
    enteredTaskIds: state.enteredTaskIds.includes(taskId) ? state.enteredTaskIds : [...state.enteredTaskIds, taskId],
    stageByTask: { ...state.stageByTask, [taskId]: 'entry' },
    tasks: state.tasks.map((task) => task.id === taskId ? { ...task, status: '进行中', progress: Math.max(task.progress, 5) } : task),
  })),
}), { name: 'internal-audit-project-tasks-v1', version: 1 }))
