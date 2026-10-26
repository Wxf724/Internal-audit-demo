import { useWorkflowStore, type WorkflowRectification, type WorkflowReport } from '../store/workflowStore'
import { saveProjectFile } from './projectFileStorage'
import { rectStage } from './rectificationActions'
import { replyToReport } from './rectificationReportAssistant'
import type { RectReportMaterial } from './rectificationReportTypes'

export const reportExamplePrompts = [
  { label: '查看编制依据', text: '请列出本次报告有哪些资料，说明整改记录和附件分别能支撑哪些内容。' },
  { label: '起草完整报告', text: '结合已确认的支撑资料，起草完整整改进展报告，写明整改概况、各事项进展、支撑依据和后续安排。' },
  { label: '突出未闭环', text: '修改报告，重点展示未闭环事项，逐项列出责任单位、整改期限和当前进度，保留完整范围的统计数据。' },
  { label: '补充后续安排', text: '结合已确认的《后续跟踪安排（示例）.txt》，补充报告的后续安排，保留台账中的整改状态和期限。' },
  { label: '精简为摘要', text: '把上一版报告精简成摘要，保留统计范围、关键进展和需要继续跟踪的事项。' },
  { label: '修改一句话', text: '将“继续跟踪未关闭事项”改为“按周跟踪未关闭事项进展”，保留其他正文内容不变。' },
]

const pending = new Map<string, Promise<string>>()
export function ensureRectReportExample(records: WorkflowRectification[], actor: string, scope = 'all'): Promise<string> {
  const id = `RPT-EXAMPLE-RECT-${scope}`
  if (useWorkflowStore.getState().reports.some((r) => r.id === id)) return Promise.resolve(id)
  if (pending.has(id)) return pending.get(id)!
  const create = async () => {
    // Snapshot real demo ledger entries; never fabricate a historical cutoff for an old report.
    const pool = records.filter((r) => r.id.startsWith('RCT-DEMO-2026'))
    const candidates = pool.length ? pool : records
    const chosen = [...new Map(['整改中', '待复核', '已关闭'].flatMap((stage) => {
      const item = candidates.find((r) => rectStage(r) === stage)
      return item ? [[item.id, item] as const] : []
    })).values()]
    for (const item of candidates) { if (chosen.length >= 3) break; if (!chosen.some((r) => r.id === item.id)) chosen.push(item) }
    if (!chosen.length) throw new Error('当前范围暂无整改事项，无法准备编制示例。')
    const at = new Date().toISOString(), cutoff = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Shanghai' })
    const snapshot = chosen.map((r) => ({ id: r.id, title: r.title, owner: r.owner, status: rectStage(r), progress: r.progress, deadline: r.deadline, conclusion: r.verifyConclusion }))
    const summary = snapshot.map((r, i) => `${i + 1}. ${r.title}\n责任单位：${r.owner}；当前环节：${r.status}；进度：${r.progress}%；台账期限：${r.deadline}。\n记录说明：${r.conclusion || '尚待补充进展或复核说明'}。`).join('\n\n')
    const files = [
      { name: '整改进展汇总（示例）.txt', text: `编制演示资料，依据本次选定的整改台账整理。\n数据截止：${cutoff}\n\n${summary}` },
      { name: '报告复核意见（示例）.txt', text: '编制演示用复核意见，不代表真实审核结论。\n1. 区分“已整改待复核”与“已关闭”，未完成复核的事项不得写成已销号。\n2. 对未闭环事项逐项列明责任单位、当前进度与原定期限。\n3. 附件中的计划安排使用“拟开展”表述，不作为已完成整改的证据。\n4. 正文保留引用资料编号，便于复核。' },
      { name: '后续跟踪安排（示例）.txt', text: `编制演示用跟踪安排，以下均为建议，不改变台账状态或原定期限。\n${snapshot.filter((r) => r.status !== '已关闭').map((r, i) => `${i + 1}. ${r.owner}拟按周反馈“${r.title}”进展，补齐措施落实及佐证材料；项目组拟按验收标准复核，通过后再办理关闭。`).join('\n') || '项目组拟开展后续抽查，关注整改效果是否持续。'}\n审计机构拟汇总逾期和待复核事项，按既定程序督促落实。` },
    ]
    const attachments: RectReportMaterial[] = []
    for (const sample of files) {
      const file = await saveProjectFile(new File([sample.text], sample.name, { type: 'text/plain;charset=utf-8' }), `report:${id}`, actor)
      attachments.push({ id: file.id, title: sample.name, text: sample.text, kind: '补充资料', locator: '预制示例附件', at, selected: false, prepared: true, file })
    }
    const report: WorkflowReport = { id, example: true, title: `${cutoff.slice(0, 4)} 年整改进展报告（编制示例）`, rectificationId: chosen[0].id, rectificationIds: chosen.map((r) => r.id), reportKind: '整改进展报告', cutoff, owner: actor, status: '草稿', updatedAt: at, referenceIds: chosen.flatMap((r) => [r.id, r.issueId]), snapshot, content: '',
      supportingMaterials: [...snapshot.map((r) => ({ id: `snapshot:${r.id}`, title: r.title, kind: '整改记录' as const, text: `责任单位：${r.owner}\n期限：${r.deadline}\n环节：${r.status}\n进度：${r.progress}%\n记录说明：${r.conclusion || '待补充'}`, locator: `截至 ${cutoff} 的整改记录`, at, selected: true })), ...attachments],
      conversation: [{ id: crypto.randomUUID(), role: 'assistant', at, content: `已准备 ${snapshot.length} 项整改记录和 3 份示例附件。附件待你确认后引用。下面先给出仅依据整改记录起草的一版，你可以直接采纳，再确认资料、发送修改要求。` }, { id: crypto.randomUUID(), role: 'user', at, content: '请先依据本次整改记录起草一份整改进展报告。' }],
    }
    report.conversation!.push(replyToReport(report, '依据本次整改记录起草完整整改进展报告'))
    useWorkflowStore.setState((s) => ({ reports: s.reports.some((r) => r.id === id) ? s.reports : [report, ...s.reports] }))
    return id
  }
  const work = create().finally(() => pending.delete(id))
  pending.set(id, work)
  return work
}
