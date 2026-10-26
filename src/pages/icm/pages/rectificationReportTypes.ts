import type { WorkFile } from '../data/projectWork'

export interface RectReportMaterial {
  id: string
  title: string
  kind: '整改记录' | '佐证文件' | '补充资料'
  text: string
  locator: string
  at: string
  selected: boolean
  file?: WorkFile
  prepared?: boolean
}
export interface RectReportCitation { id: string; title: string; locator: string; excerpt: string }
export interface RectReportMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  at: string
  citations?: RectReportCitation[]
  draft?: string
  basedOnContent?: string
  adoptedAt?: string
}
