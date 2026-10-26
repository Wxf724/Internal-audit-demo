import assert from 'node:assert/strict'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const browser = await chromium.launch({ channel: 'msedge', headless: true })
const context = await browser.newContext({ storageState: { cookies: [], origins: [] }, viewport: { width: 1440, height: 1000 } })
let mode = 'draft', requestCount = 0, lastPayload
// Isolated context; no backend writes and no external model requests.
await context.route('**/*', async (route) => {
  const url = new URL(route.request().url())
  if (url.pathname.endsWith('/chat/completions')) {
    requestCount++
    if (mode === 'failure') return route.fulfill({ status: 503, contentType: 'application/json', body: '{}' })
    const messages = route.request().postDataJSON().messages
    const payload = JSON.parse(messages.at(-1).content)
    lastPayload = payload
    const sources = payload.selectedResources
    const risks = sources.filter((r) => r.category === '年度风险评估结果' && r.risk)
    let items = payload.currentDraft.items.length ? payload.currentDraft.items.map((item) => ({ ...item, resourceIds: item.basisRefs })) : risks.map((r, i) => ({
      id: '', name: r.risk.recommendation, subject: r.subject, type: r.risk.domain === '工程' ? '工程审计' : r.risk.required ? '经济责任审计' : '财务审计',
      period: '2026-01-01 至 2026-12-31', start: `2027-${String(i + 3).padStart(2, '0')}-01`, end: `2027-${String(i + 3).padStart(2, '0')}-28`, owner: '内审机构统筹', workdays: r.risk.workdays,
      resourceNeeds: '财务或工程专业人员，必要时申请外部专家', scope: r.risk.recommendation, risk: r.risk.title, riskId: r.risk.id, priority: '高', source: r.risk.required ? '必审事项' : '风险评估', resourceIds: [r.id],
    }))
    if (mode === 'adjust') items = items.map((item, i) => i ? item : { ...item, start: '2027-01-05', end: '2027-03-20' })
    const reply = { reply: mode === 'answer' ? '已按已选资料核对，建议先确认资源预算和必审事项。' : '已根据本轮勾选的风险与资源形成计划草案。优先安排必审事项和高风险项目，请核对实施窗口及人天。', proposal: mode === 'answer' ? null : { objective: '覆盖重点风险与必审事项', followUp: '按季度检查整改进展，年末开展后续审计', resourceStrategy: '统筹内审专业人员，工程领域按需申请专家', capacity: sources.find((r) => r.capacity !== undefined).capacity, items } }
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ choices: [{ message: { content: JSON.stringify(reply) } }] }) })
  }
  return url.hostname === '127.0.0.1' && !url.pathname.startsWith('/api/') ? route.continue() : route.abort()
})
const page = await context.newPage()
const errors = []
page.on('pageerror', (error) => errors.push(error.message))
const origin = 'http://127.0.0.1:4176'
const state = () => page.evaluate(() => JSON.parse(localStorage.getItem('internal-audit-annual-plans-v1')).state.plans.find((p) => p.year === 2027))
const shot = (name) => page.screenshot({ path: `.playwright-cli/plan-conversation-${name}.png`, fullPage: true, animations: 'disabled' })
const send = async (text) => { await page.getByRole('textbox', { name: '编制要求', exact: true }).fill(text); await page.getByRole('button', { name: '发送', exact: true }).click() }
try {
  await page.goto(`${origin}/plan-workbench?year=2026&view=gantt`)
  await page.locator('.annual-timeline').waitFor()
  assert.equal(await page.getByRole('button', { name: '甘特图', exact: true }).getAttribute('aria-pressed'), 'true')
  await page.getByRole('button', { name: '列表', exact: true }).click()
  await page.getByRole('button', { name: '列表', exact: true, pressed: true }).waitFor()
  assert.equal(await page.getByRole('button', { name: '列表', exact: true }).getAttribute('aria-pressed'), 'true')
  assert.equal(await page.locator('.annual-view-pair').count(), 1)
  await page.goto(`${origin}/plan-workbench?year=2025&view=gantt`)
  await page.locator('.annual-timeline').waitFor()
  assert.equal(await page.locator('.annual-timeline-row').count(), 8)
  await page.goto(`${origin}/plan-workbench?year=2027&view=gantt`)
  await page.locator('.annual-empty-compose').waitFor()
  assert.equal(await page.locator('.annual-empty-compose').count(), 1)
  await shot('entry')
  await page.locator('.annual-empty-compose').click()
  await page.locator('.plan-conversation').waitFor()
  await shot('welcome')
  assert.equal(await page.locator('.annual-detail-nav').count(), 0)
  await send('编制 2027 年度计划')
  await page.getByRole('dialog').waitFor()
  assert.equal(requestCount, 0)
  await page.getByRole('button', { name: '完成选择', exact: true }).click()
  await page.getByRole('button', { name: '选择推荐资源', exact: true }).click()
  const selected = (await state()).conversation.selectedResourceIds.length
  assert.ok(selected > 6)
  await page.getByRole('searchbox', { name: '搜索编制资源' }).fill('采购')
  assert.equal((await state()).conversation.selectedResourceIds.length, selected)
  await page.getByRole('searchbox', { name: '搜索编制资源' }).fill('')
  await send('根据已选资源编制 2027 年度计划，优先安排高风险和必审事项。')
  await page.getByRole('button', { name: '确认采用', exact: true }).waitFor()
  assert.equal((await state()).content.items.length, 0)
  assert.deepEqual(lastPayload.selectedResources.map((r) => r.id).sort(), (await state()).conversation.selectedResourceIds.slice().sort())
  await shot('proposal')
  await page.locator('.plan-proposal-card').getByRole('button', { name: '预览建议', exact: true }).click()
  await page.getByRole('dialog').waitFor()
  await page.getByRole('dialog').getByRole('button', { name: '甘特图', exact: true }).click()
  await page.locator('.annual-timeline').waitFor()
  await shot('draft-gantt')
  await page.getByRole('dialog').getByRole('button', { name: '采用为当前草案', exact: true }).click()
  assert.equal((await state()).content.items.length, 6)
  assert.equal((await state()).conversation.revisions.length, 1)
  const ids = (await state()).content.items.map((item) => item.id)
  mode = 'adjust'
  await send('把采购项目提前到一季度，其他项目保持不变。')
  await page.getByRole('button', { name: '确认采用', exact: true }).click()
  assert.deepEqual((await state()).content.items.map((item) => item.id), ids)
  assert.equal((await state()).content.items[0].start, '2027-01-05')
  mode = 'failure'
  await send('检查资源是否充足')
  await page.getByRole('button', { name: '重新发送', exact: true }).waitFor()
  assert.equal((await state()).conversation.revisions.length, 2)
  mode = 'answer'
  await page.getByRole('button', { name: '重新发送', exact: true }).click()
  await page.getByText('已按已选资料核对，建议先确认资源预算和必审事项。', { exact: true }).waitFor()
  await page.reload()
  await page.getByRole('button', { name: '当前草案 · V2', exact: true }).click()
  await page.getByRole('combobox', { name: '草案版本' }).selectOption('1')
  assert.match(await page.getByRole('dialog').innerText(), /03-01/)
  await page.getByRole('button', { name: '返回对话', exact: true }).click()
  await page.setViewportSize({ width: 800, height: 900 })
  await shot('narrow')
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.getByRole('button', { name: '提交审议', exact: true }).click()
  assert.equal(await page.getByRole('button', { name: '确认提交', exact: true }).isDisabled(), true)
  await page.getByLabel('审计委员会审议', { exact: true }).uncheck()
  await page.getByLabel('党委前置研究', { exact: true }).check()
  await page.getByRole('combobox', { name: /^批准主体/ }).selectOption('董事会')
  await page.getByLabel('本单位审议程序依据', { exact: true }).fill('隔离测试内审制度第五条')
  await page.getByLabel('已核对草案、引用资料及资源安排，并确认审议程序适用').check()
  await page.getByRole('button', { name: '确认提交', exact: true }).click()
  await page.getByRole('button', { name: '审议记录', exact: true }).waitFor()
  assert.equal((await state()).status, '审批中')
  assert.equal(await page.getByRole('textbox', { name: '编制要求', exact: true }).isDisabled(), false)
  await page.getByRole('button', { name: '审议记录', exact: true }).click()
  for (let i = 0; i < 3; i++) {
    await page.getByRole('textbox', { name: '会议 / 决议 / 审核记录编号' }).fill(`ISOLATED-CHAT-${i + 1}`)
    await page.getByLabel(/^审议意见/).fill('隔离验收：核对并通过。')
    await page.getByRole('button', { name: '登记通过', exact: true }).click()
  }
  assert.equal((await state()).status, '已批准')
  await page.getByRole('button', { name: '返回对话', exact: true }).click()
  await shot('submitted')
  const guards = await page.evaluate(async () => {
    const { useAnnualPlanStore } = await import('/src/pages/icm/store/annualPlanStore.ts')
    const { contentFingerprint } = await import('/src/pages/icm/pages/annual-plan/conversationTypes.ts')
    const store = useAnnualPlanStore.getState(), p = store.plans.find((entry) => entry.year === 2027), actor = p.creator
    const approved = JSON.stringify(p.approved)
    store.adjust(p.id, actor, '隔离测试：版本保护')
    const draft = useAnnualPlanStore.getState().plans.find((entry) => entry.id === p.id)
    store.appendMessages(p.id, [{ id: 'stale-check', role: 'assistant', text: '旧建议', at: '', proposal: { content: structuredClone(draft.content), resources: [], baseFingerprint: contentFingerprint(draft.content), changes: [] } }])
    store.saveConversationDraft(p.id, { ...draft.content, objective: '人工更新目标' }, actor, [], '手动更新')
    let staleBlocked = false
    try { store.acceptProposal(p.id, 'stale-check', actor) } catch { staleBlocked = true }
    const latest = useAnnualPlanStore.getState().plans.find((entry) => entry.id === p.id)
    const before = JSON.stringify(latest)
    let unconfirmedBlocked = false
    try { store.submitConversation(p.id, actor, ['有权机构批准'], false) } catch { unconfirmedBlocked = true }
    return { staleBlocked, unconfirmedBlocked, unchanged: JSON.stringify(useAnnualPlanStore.getState().plans.find((entry) => entry.id === p.id)) === before, approvedIntact: JSON.stringify(latest.approved) === approved }
  })
  assert.deepEqual(guards, { staleBlocked: true, unconfirmedBlocked: true, unchanged: true, approvedIntact: true })
  assert.deepEqual(errors, [])
  console.log('PASS paired overview toggle, empty entry, resource selection/search, selected-only request, proposal preview and acceptance, conversational adjustment, preserved IDs, failed request/retry, revisions and reload, narrow viewport, review confirmation and 3-stage approval; no external requests')
} catch (error) { await shot('failure'); throw error } finally { await browser.close() }
