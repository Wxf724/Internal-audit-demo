import { useWorkflowStore, type WorkflowRectification } from '../store/workflowStore'

export const rectStages = ['待制定措施', '整改中', '待复核', '已关闭'] as const
export function rectStage(item: WorkflowRectification) {
  if (item.status === '已销号') return '已关闭'
  if (item.status === '已整改' || useWorkflowStore.getState().audits.some((a) => a.businessId === item.id && a.type === '整改复核' && a.status === '待处理')) return '待复核'
  return item.status === '待方案审批' ? '待制定措施' : '整改中'
}
export function recordRectification(id: string, by: string, text: string, patch: Partial<WorkflowRectification> = {}) {
  useWorkflowStore.setState((s) => ({ rectifications: s.rectifications.map((r) => r.id !== id ? r : {
    ...r, ...patch, updatedAt: new Date().toISOString(),
    handlingLog: [...(r.handlingLog ?? []), { at: new Date().toISOString(), by, text }],
  }) }))
}
export function createRectificationReport(ids: string[], title: string, kind: '整改进展报告' | '整改复核报告', cutoff: string, owner: string) {
  const state = useWorkflowStore.getState()
  const records = state.rectifications.filter((r) => ids.includes(r.id))
  if (!title.trim() || !records.length || !cutoff) throw new Error('请填写报告名称、截止日期并选择整改事项。')
  if (cutoff !== new Date().toLocaleDateString('sv-SE')) throw new Error('当前仅支持按今日状态形成快照，请选择今日。')
  const id = `RPT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
  useWorkflowStore.setState((s) => ({ reports: [...s.reports, {
    id, title: title.trim(), rectificationId: records[0].id, rectificationIds: records.map((r) => r.id),
    reportKind: kind, cutoff, owner, status: '草稿', updatedAt: new Date().toISOString(),
    referenceIds: records.flatMap((r) => [r.id, r.issueId]),
    supportingMaterials: records.flatMap((r) => {
      const issue = state.issues.find((i) => i.id === r.issueId)
      return [{ id: `snapshot:${r.id}`, title: r.title, kind: '整改记录' as const, locator: `截至 ${cutoff} 的整改记录`, at: new Date().toISOString(), selected: true,
        text: `责任单位：${r.owner}\n整改期限：${r.deadline}\n当前环节：${rectStage(r)}\n进度：${r.progress}%\n问题事实：${issue?.fact ?? '未登记'}\n整改要求：${issue?.suggestion ?? '未登记'}\n整改措施：${r.planContent ?? '未留存正文'}\n进展或复核说明：${r.verifyConclusion || '待补充'}` },
      ...(r.proofFiles ?? []).map((f) => ({ id: f.id, title: f.name, kind: '佐证文件' as const, locator: r.title, at: f.at, selected: false, text: f.extractedText ?? '', file: f }))]
    }),
    snapshot: records.map((r) => ({ id: r.id, title: r.title, owner: r.owner, status: rectStage(r), progress: r.progress, deadline: r.deadline, conclusion: r.verifyConclusion })),
  }] }))
  return id
}
