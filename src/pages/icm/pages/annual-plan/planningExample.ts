import type { AnnualPlan } from './model'
import type { PlanMessage } from './conversationTypes'
import { contentFingerprint } from './conversationTypes'
import { attachDraftSources } from './draftRules'
import { exampleContent, exampleMessages, exampleResources } from './conversationExampleData'

export const exampleSupplementText = exampleResources.find((resource) => resource.id === 'example:supplement')!.summary.replace(/^【第 \d+ 行】\n/gm, '').trim()

// One shared example dataset supplies the conversation, references, draft and exports.
export function createConversationExample(version = 3): AnnualPlan {
  const resources = structuredClone(exampleResources)
  const first = attachDraftSources(structuredClone(exampleContent), resources)
  const second = structuredClone(first)
  const procurement = second.items.find((item) => item.riskId === 'RISK-2027-1')!
  procurement.start = '2027-01-11'; procurement.end = '2027-02-26'
  const third = structuredClone(second)
  third.items.find((item) => item.id === procurement.id)!.end = '2027-03-12'
  const contents = [first, second, third]
  return {
    id: 'EXAMPLE-ANNUAL-2027', year: 2027, status: '编制中', demo: true,
    creator: { id: 'example-author', name: '内审机构' }, submissions: [], adjustmentReason: '', updatedAt: '2026-10-24 16:30:00',
    content: contents[version - 1],
    conversation: {
      selectedResourceIds: resources.map((resource) => resource.id), messages: [],
      revisions: contents.slice(0, version).map((content, index) => ({ version: index + 1, at: `2026-10-24 16:${10 + index * 10}:00`, reason: ['采用 AI 首版建议', '对话调整采购时间', '人工调整结束日期'][index], content, resources })),
    },
  }
}

export function exampleChangeMessage(): PlanMessage {
  const before = createConversationExample(1), after = createConversationExample(2)
  return {
    id: 'EXAMPLE-CHANGE-2', role: 'assistant', at: after.updatedAt, text: exampleMessages[5].text,
    proposal: { content: after.content, baseContent: before.content, baseFingerprint: contentFingerprint(before.content), resources: exampleResources, changes: ['采购实施窗口提前至一季度'], acceptedRevision: 2 },
  }
}

export function exampleSessionMessages(): PlanMessage[] {
  const first = createConversationExample(1)
  return [...exampleMessages.map((entry, index): PlanMessage => ({
    ...entry, id: `EXAMPLE-MESSAGE-${index}`, sessionId: 'example', at: `2026-10-24 16:${String(5 + index * 4).padStart(2, '0')}:00`,
    resources: exampleResources.filter((resource) => index > 1 || resource.id !== 'example:supplement'),
    ...(index === 3 ? { proposal: { content: first.content, baseContent: { ...first.content, items: [] }, baseFingerprint: '', resources: exampleResources, changes: ['纳入六个审计项目，合计 270 人天'], acceptedRevision: 1 } } : {}),
    ...(index === 5 ? { proposal: exampleChangeMessage().proposal } : {}),
  })), { id: 'EXAMPLE-MANUAL-EDIT', sessionId: 'example', role: 'assistant', at: '2026-10-24 16:30:00', text: '人工修改已保存为草案 V3：采购审计结束日期由 2 月 26 日改为 3 月 12 日，45 人天保持不变。右侧可以查看当前草案、历史版本与甘特图，也可以导出。当前尚未提交审议。' }]
}

// Persist the example once; all subsequent work uses the same draft and session records.
export function createEditableExample(): AnnualPlan {
  const plan = createConversationExample()
  const chat = plan.conversation!
  return { ...plan, recordingMode: true, conversation: {
    ...chat, standardsVersion: 2, activeSessionId: 'example', messages: exampleSessionMessages(),
    riskLibrary: structuredClone(plan.content.risks ?? []),
    evidenceLibrary: structuredClone(plan.content.evidence ?? []), capacityLimit: plan.content.capacity,
    sessions: [{ id: 'example', title: '2027 年度计划编制 · 示例', createdAt: '2026-10-24 16:05:00', updatedAt: plan.updatedAt, input: '', selectedResourceIds: [...chat.selectedResourceIds] }],
  } }
}

export const EXAMPLE_QUESTIONS = [
  { label: '解释编制依据', text: '请解释当前六个审计项目各自的编制依据、风险优先级和纳入理由，并列出仍需补充确认的资料。先回答，不修改草案。' },
  { label: '调整采购时间', text: '请将采购审计的实施窗口调整为 2027 年 2 月 1 日至 3 月 31 日，保持 45 人天和其他五个项目不变，给出修改后的完整草案并说明差异。' },
  { label: '优化人天安排', text: '请在当前 300 人天预算内，将预留人天提高到至少 40 人天。保留全部六个项目和必审事项，结合风险提出人天调整草案，说明取舍及需要确认的影响，不虚构人员能力。' },
  { label: '根据新资料调整', text: '请根据本轮已选的新增编制资料核对当前草案。先指出新增资料及受影响的项目，再给出有依据的完整调整草案；没有新增资料或资料不足时请先询问，不自行推断。' },
  { label: '送审前检查', text: '请检查当前草案的风险覆盖、必审事项、实施窗口、人天预算、专业资源、结转事项和审议依据，按待解决事项列出送审前核对清单。先回答，不修改草案。' },
]

export const EXAMPLE_STEPS = [
  { name: '选择资料', action: '点击“选择推荐资源”，核对对象、风险、必审事项与年度预算。', result: '14 项资料进入本轮引用。' },
  { name: '检查资料', action: '先问资料是否充分，再决定是否生成计划。', result: '预计 270 人天；期限、专业能力和结转工作量需要补充确认。', round: 0 },
  { name: '补充文件', action: '上传文件，核对解析内容和分类，再点击“确认并加入引用”。', result: '加入一份补充条件，本轮引用增加至 15 项。' },
  { name: '生成草案', action: '发送编制要求，点击“预览建议”，核对后“采用为当前草案”。', result: '保存 V1：6 个项目，270 / 300 人天。', round: 1 },
  { name: '对话修改', action: '明确要改的项目、日期和保持不变的内容，查看差异后采用。', result: '保存 V2：采购提前到一季度，其余五个项目不变。', round: 2 },
  { name: '直接编辑', action: '打开当前草案，将采购结束日期改为 3 月 12 日，再点击“保存修改”。', result: '保存 V3；可在草案中切换历史版本、查看甘特图和导出。' },
  { name: '送审核对', action: '点击“提交审议”，核对计划内容、批准主体、制度依据和审议顺序。', result: '本例停在送审前，结转工作量等事项仍待确认。' },
]
