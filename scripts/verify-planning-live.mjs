import assert from 'node:assert/strict'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const browser = await chromium.launch({ channel: 'msedge', headless: true })
const context = await browser.newContext({ storageState: { cookies: [], origins: [] } })
// Allow the configured chat endpoint for a synthetic smoke test; no actual audit documents are read.
await context.route('**/*', (route) => {
  const url = new URL(route.request().url())
  return (url.hostname === '127.0.0.1' && !url.pathname.startsWith('/api/')) || url.pathname.endsWith('/chat/completions') ? route.continue() : route.abort()
})
const page = await context.newPage()
try {
  await page.goto('http://127.0.0.1:4176/plan-workbench?year=2027')
  const result = await page.evaluate(async () => {
    const { requestAssistantReply } = await import('/src/pages/icm/assistant/deepseek.ts')
    const { planningMessages, parsePlanningReply } = await import('/src/pages/icm/pages/annual-plan/conversationProtocol.ts')
    const risk = { id: 'SYNTHETIC-R1', title: '合成样例采购风险', subject: '虚拟测试单位', domain: '采购', likelihood: 4, impact: 4, required: false, workdays: 10, recommendation: '虚拟采购审计', evidenceIds: [], lastAudit: '' }
    const plan = { id: 'SYNTHETIC-P1', year: 2027, status: '编制中', creator: { id: 'synthetic', name: '测试' }, submissions: [], content: { name: '合成样例年度计划', department: '虚拟内审机构', objective: '', basis: '', items: [], capacity: 20, reviewer: { id: 'b', name: '测试' }, approver: { id: 'c', name: '测试' } } }
    const sources = [{ id: 'synthetic-risk', name: '合成风险评估', category: '年度风险评估结果', subject: risk.subject, source: '自动化合成测试，非业务资料', version: 'v1', summary: '虚拟采购风险，建议 10 人天', risk }, { id: 'synthetic-budget', name: '合成预算', category: '资源台账', source: '自动化合成测试，非业务资料', version: 'v1', summary: '可用 20 人天，具备财务审计能力，无外包预算', capacity: 20 }]
    try {
      const answer = await requestAssistantReply(planningMessages(plan, sources, '仅使用合成测试资料，生成一个项目的年度计划建议，并填写后续审计安排及资源能力安排。', []), undefined, { maxTokens: 1800 })
      const parsed = parsePlanningReply(answer, plan, sources)
      return { ok: Boolean(parsed.proposal), count: parsed.proposal?.content.items.length, followUp: Boolean(parsed.proposal?.content.followUp), resourceStrategy: Boolean(parsed.proposal?.content.resourceStrategy), resourceNeeds: Boolean(parsed.proposal?.content.items[0]?.resourceNeeds) }
    } catch (error) { return { ok: false, error: error.message } }
  })
  console.log(JSON.stringify(result))
  assert.deepEqual(result, { ok: true, count: 1, followUp: true, resourceStrategy: true, resourceNeeds: true })
} finally { await browser.close() }
