import { useWorkflowStore, type WorkflowReport } from '../store/workflowStore'
import type { RectReportMaterial, RectReportMessage } from './rectificationReportTypes'

export function reportMaterials(report: WorkflowReport): RectReportMaterial[] {
  if (report.supportingMaterials) return report.supportingMaterials
  return (report.snapshot ?? []).map((r) => ({ id: `snapshot:${r.id}`, title: r.title, kind: '整改记录',
    text: `责任单位：${r.owner}\n期限：${r.deadline}\n环节：${r.status}\n进度：${r.progress}%\n进展或复核说明：${r.conclusion || '待补充'}`,
    locator: `截至 ${report.cutoff} 的整改记录`, at: report.updatedAt, selected: true }))
}
export function updateRectReport(id: string, patch: Partial<WorkflowReport>) {
  const report = useWorkflowStore.getState().reports.find((r) => r.id === id)
  if (!report || !['草稿', '审核不通过'].includes(report.status)) throw new Error('报告已提交审核，当前内容不可修改。')
  useWorkflowStore.setState((s) => ({ reports: s.reports.map((r) => r.id === id ? { ...r, ...patch, updatedAt: new Date().toISOString() } : r) }))
}

export function replyToReport(report: WorkflowReport, prompt: string): RectReportMessage {
  const materials = reportMaterials(report).filter((m) => m.kind === '整改记录' || (m.selected && m.text.trim()))
  const citations = materials.map((m) => ({ id: m.id, title: m.title, locator: m.locator, excerpt: m.text }))
  const result: RectReportMessage = { id: crypto.randomUUID(), role: 'assistant', at: new Date().toISOString(), content: '', citations, basedOnContent: report.content ?? '' }
  const snapshot = report.snapshot ?? []
  const lastDraft = [...(report.conversation ?? [])].reverse().find((m) => m.draft)?.draft
  const replacement = prompt.match(/将[“「"]([^”」"]+)[”」"]改为[“「"]([^”」"]+)[”」"]/)
  if (replacement) {
    const base = report.content?.trim() ? report.content : lastDraft
    if (!base?.includes(replacement[1])) { result.content = '当前正文中没有找到这句话，请复制需要修改的原句后再发送。'; return result }
    result.draft = base.split(replacement[1]).join(replacement[2])
    result.content = '已按要求替换指定文字，其他正文保持不变。请预览后采纳。'
    return result
  }
  if (/有哪些资料|哪些依据|查看依据|引用来源|支撑资料|依据是什么/.test(prompt) && !/生成|起草|补充|加入/.test(prompt)) {
    result.content = materials.length ? `本次可引用 ${materials.length} 份资料：\n${materials.map((m, i) => `${i + 1}. ${m.title} · ${m.locator}`).join('\n')}\n点击下方来源可核对原文。附件中的说明需结合复核记录确认，不直接改变整改结论。` : '请先添加并核对支撑资料，再生成报告草稿。'
    return result
  }
  if (!/生成|起草|汇总|整理|报告|草稿|精简|简短|简洁|摘要|未完成|未闭环|逾期|补充|加入|结合|修改|正式/.test(prompt)) {
    result.content = '请明确本次要整理的内容，例如“结合所选资料起草整改进展报告”“突出未闭环事项”或“把上一版精简成摘要”。需要补充的事实可先加入支撑资料。'
    return result
  }
  if (!snapshot.length) { result.content = '这份报告未留存截止日整改记录。请新建报告并选择整改范围，再依据记录和支撑资料编制。'; return result }
  const concise = /精简|简短|简洁|摘要/.test(prompt)
  const previousFocus = [...(report.conversation ?? [])].reverse().find((m) => m.role === 'user' && /未完成|未闭环|逾期|全部|完整/.test(m.content))?.content ?? ''
  const focusPrompt = concise && !/未完成|未闭环|逾期|全部|完整/.test(prompt) ? previousFocus : prompt
  const focused = /未完成|未闭环|逾期/.test(focusPrompt) && !/展示全部|全部事项|完整报告/.test(focusPrompt)
  const overdueOnly = focused && /逾期/.test(focusPrompt)
  const closed = snapshot.filter((r) => r.status === '已关闭').length
  const rows = focused ? snapshot.filter((r) => r.status !== '已关闭' && (!overdueOnly || r.deadline < (report.cutoff ?? ''))) : snapshot
  const supplement = materials.filter((m) => m.kind !== '整改记录')
  const sourceNumber = (id: string) => materials.findIndex((m) => m.id === id) + 1
  const factLines = rows.map((r, i) => `${i + 1}. ${r.title}【资料${sourceNumber(`snapshot:${r.id}`)}】\n责任单位：${r.owner}；期限：${r.deadline}；环节：${r.status}；进度：${r.progress}%。${concise ? '' : `\n记录说明：${r.conclusion || '尚待补充进展或复核说明'}。`}`).join('\n\n')
  const evidenceLines = supplement.map((m) => `《${m.title}》【资料${sourceNumber(m.id)}】记载：\n${m.text.slice(0, concise ? 180 : 700)}${m.text.length > (concise ? 180 : 700) ? '\n（节选，完整内容见引用来源）' : ''}`).join('\n\n')
  const followUp = /补充|加入/.test(prompt) && /后续|跟踪安排/.test(prompt) ? supplement.filter((m) => /后续|跟踪安排/.test(m.title)).map((m) => `依据《${m.title}》【资料${sourceNumber(m.id)}】：\n${m.text}`).join('\n') : ''
  result.draft = `${report.title}${concise ? '（摘要）' : ''}\n\n一、整改概况\n截至 ${report.cutoff}，本报告纳入 ${snapshot.length} 项整改事项，已关闭 ${closed} 项，尚未关闭 ${snapshot.length - closed} 项。统计范围与报告截止日记录一致。\n\n二、${focused ? (overdueOnly ? '逾期未闭环事项' : '未闭环事项') : '事项进展'}\n${factLines || '本次范围内无符合条件的事项。'}${evidenceLines ? `\n\n三、支撑资料摘要\n${evidenceLines}\n以上为资料记载，涉及实际效果的判断以审计复核结论为准。` : ''}\n\n${evidenceLines ? '四' : '三'}、后续安排\n${rows.some((r) => r.status !== '已关闭') ? '继续跟踪未关闭事项，补齐措施落实及佐证材料，按验收标准核实后办理关闭。' : '保留闭环资料，按后续跟踪安排关注整改效果。'}${followUp ? `\n${followUp}` : ''}`
  // Follow-up format requests retain the selected evidence and the original statistical scope.
  result.content = `${lastDraft || report.content ? '已整理新一版' : '已起草'}${concise ? '报告摘要' : focused ? '重点事项报告' : '整改报告'}，引用 ${materials.length} 份资料。${supplement.length ? `其中 ${supplement.length} 份为已核对附件。` : ''}请预览并采纳到右侧正文。`
  return result
}
