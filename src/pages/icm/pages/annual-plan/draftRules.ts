import type { AnnualPlan, PlanContent } from './model'
import type { PlanResource } from './conversationTypes'

export function attachDraftSources(content: PlanContent, resources: PlanResource[]): PlanContent {
  const all = [...new Map(resources.map((entry) => [entry.id, entry])).values()]
  const risks = [...new Map(all.filter((r) => r.risk).map((r) => [r.risk!.id, { ...r.risk!, evidenceIds: all.filter((entry) => entry.risk?.id === r.risk!.id).map((entry) => `chat:${entry.id}`) }])).values()]
  return { ...content, risks, evidence: all.map((r) => ({ id: `chat:${r.id}`, name: r.name, source: r.source, version: r.version, note: `${r.locator ? `${r.locator}\n` : ''}${r.summary}`, status: '待确认' })), basis: content.basis.trim() || all.map((r) => r.name).join('；') }
}

export function draftIssues(plan: AnnualPlan, content: PlanContent, resources: PlanResource[]) {
  const issues: { message: string; itemId?: string }[] = []
  for (const [key, label] of [['name', '计划名称'], ['department', '编制部门'], ['objective', '年度目标'], ['basis', '编制依据'], ['followUp', '后续审计安排'], ['resourceStrategy', '专业能力与外部资源安排']] as const) {
    if (!content[key]?.trim()) issues.push({ message: `请补充${label}` })
  }
  if (!content.items.length) issues.push({ message: '请添加拟开展项目' })
  if (!resources.length) issues.push({ message: '请关联编制依据资料' })
  if (!Number.isFinite(content.capacity) || (content.capacity ?? 0) <= 0) issues.push({ message: '请填写有效的可用人天' })
  if (content.items.reduce((sum, item) => sum + item.workdays, 0) > (content.capacity ?? 0)) issues.push({ message: '项目总人天超过年度可用人天' })
  for (const item of content.items) {
    if (![item.name, item.subject, item.scope, item.period, item.resourceNeeds].every((v) => v?.trim())) issues.push({ itemId: item.id, message: `${item.name || '未命名项目'}：请补充对象、期间、范围及资源需求` })
    const valid = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && value.startsWith(`${plan.year}-`) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value
    if (!valid(item.start) || !valid(item.end) || item.start > item.end) issues.push({ itemId: item.id, message: `${item.name}：实施时间无效` })
    if (!Number.isFinite(item.workdays) || item.workdays <= 0) issues.push({ itemId: item.id, message: `${item.name}：请核对人天` })
    if (!item.basisRefs?.length || item.basisRefs.some((id) => !resources.some((r) => r.id === id))) issues.push({ itemId: item.id, message: `${item.name}：请关联有效编制依据` })
  }
  const universe = [...new Map([...(plan.conversation?.riskLibrary ?? []), ...(content.risks ?? []), ...resources.flatMap((r) => r.risk ? [r.risk] : [])].map((r) => [r.id, r])).values()]
  for (const risk of universe.filter((r) => !content.items.some((item) => item.riskId === r.id))) {
    if (risk.required) issues.push({ message: `未纳入必审事项：${risk.recommendation}` })
    else if (!content.deferred?.find((entry) => entry.riskId === risk.id)?.reason.trim()) issues.push({ message: `请记录暂缓理由：${risk.recommendation}` })
  }
  return issues
}

export function detailedChanges(before: PlanContent, after: PlanContent) {
  const rows: { name: string; field: string; before: string; after: string }[] = []
  for (const [key, label] of [['name', '计划名称'], ['department', '编制部门'], ['basis', '编制依据'], ['objective', '年度目标'], ['capacity', '可用人天'], ['followUp', '后续审计'], ['resourceStrategy', '资源安排']] as const) {
    if (before[key] !== after[key]) rows.push({ name: '年度计划', field: label, before: String(before[key] ?? '—'), after: String(after[key] ?? '—') })
  }
  for (const item of after.items) {
    const old = before.items.find((entry) => entry.id === item.id)
    if (!old) { rows.push({ name: item.name, field: '新增项目', before: '—', after: `${item.subject} · ${item.start} 至 ${item.end} · ${item.workdays} 人天` }); continue }
    for (const [key, label] of [['name', '项目名称'], ['type', '审计类型'], ['subject', '审计对象'], ['owner', '牵头部门或团队'], ['risk', '风险主题'], ['source', '项目来源'], ['period', '覆盖期间'], ['start', '开始日期'], ['end', '结束日期'], ['workdays', '人天'], ['priority', '优先级'], ['scope', '范围'], ['resourceNeeds', '资源需求'], ['basisRefs', '引用依据'], ['locked', '保持不变']] as const) {
      if (JSON.stringify(old[key]) !== JSON.stringify(item[key])) rows.push({ name: item.name, field: label, before: String(old[key] ?? '—'), after: String(item[key] ?? '—') })
    }
  }
  for (const item of before.items.filter((old) => !after.items.some((item) => item.id === old.id))) rows.push({ name: item.name, field: '移出项目', before: item.name, after: '移出' })
  return rows
}
