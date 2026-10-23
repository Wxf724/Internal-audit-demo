import type { LucideIcon } from 'lucide-react'

export type ModuleCategory = 'plan' | 'data' | 'review' | 'workpaper' | 'rectify'

export interface IcmRouteMeta {
  path: string
  title: string
  pageId: string
  category: ModuleCategory
  categoryName: string
  description: string
  icon: LucideIcon
  layout: string
}
