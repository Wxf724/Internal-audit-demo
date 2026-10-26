export interface WorkEvent { action: string; by: string; at: string; opinion?: string }
export interface AuditProgram {
  id: string; title: string; risk: string; control: string; criteria: string; method: string
  owner: string; reviewer: string; deadline: string; taskIds: string[]
}
export interface WorkFile { id: string; projectId: string; name: string; size: number; mime: string; at: string; by: string; digest: string; extractedText?: string }
export interface ProjectDemand {
  id: string; projectId: string; name: string; owner: string; due: string; scale: string; method: string
  status: string; category: string; programIds: string[]; fileIds: string[]; history: WorkEvent[]
}
export interface ProjectEvidence {
  id: string; projectId?: string; title: string; type: string; owner: string; status: string
  capturedAt: string; sourceSystem: string; link: string; fileIds: string[]; description: string
}
export interface ReportSection { id: string; title: string; content: string }
export interface Communication {
  id: string; subject: string; recipient: string; sentAt: string; reply: string
  decision: string; resolvedAt?: string; by: string
}
export interface ArchiveSnapshot {
  version: number; at: string; by: string; note: string
  manifest: { id: string; title: string; type: string }[]
  content: string
}
export const reportSections = [
  { id: 'scope', title: '审计依据与范围', content: '' }, { id: 'work', title: '实施情况与范围限制', content: '' },
  { id: 'conclusion', title: '总体评价', content: '' }, { id: 'findings', title: '审计发现与建议', content: '' },
  { id: 'feedback', title: '征求意见及处理情况', content: '' },
]
export const workId = (prefix: string) => `${prefix}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
export const workEvent = (action: string, by: string, opinion?: string): WorkEvent => ({ action, by, opinion, at: new Date().toISOString() })
