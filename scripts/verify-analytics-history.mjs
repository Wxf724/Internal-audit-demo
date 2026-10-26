import assert from 'node:assert/strict'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const browser = await chromium.launch({ channel: 'msedge', headless: true })
const context = await browser.newContext({ viewport: { width: 1366, height: 768 } })
await context.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort())
const page = await context.newPage(), errors = []
page.on('pageerror', e => errors.push(e.message))
try {
  await page.goto('http://127.0.0.1:4176/cockpit?year=2024')
  await page.getByRole('heading', { name: '统计分析', exact: true }).waitFor()
  assert.equal(await page.getByRole('button', { name: '统计口径', exact: true }).count(), 0)
  const result = await page.evaluate(async () => {
    const fixtures = await import('/src/pages/icm/data/auditDemoHistory.ts')
    const { initialAnnualPlans, restoreAnnualPlans } = await import('/src/pages/icm/pages/annual-plan/seeds.ts')
    const { demoHistoryProjects: projects, demoHistoryIssues: issues, demoHistoryRectifications: rects, appendMissingDemoRecords } = fixtures
    const problems = []
    for (const p of projects) {
      const plan = initialAnnualPlans.find(a => a.year === p.managementYear)
      const link = p.executionLinks[0]
      if (!plan.approved.content.items.some(i => i.id === link.itemId && i.projectId === p.id) || plan.approved.version !== link.version) problems.push(`plan linkage ${p.id}`)
      const ownRects = rects.filter(r => issues.find(i => i.id === r.issueId)?.projectId === p.id)
      if (p.stage === '已归档' && ownRects.some(r => r.status !== '已销号')) problems.push(`archive open rect ${p.id}`)
      for (const date of [p.preparation?.confirmedAt, p.archivedAt, ...p.auditReport?.history.map(e => e.at) ?? []]) if (date && date.slice(0, 10) > '2026-10-25') problems.push(`future event ${p.id}`)
    }
    for (const i of issues) {
      if (!projects.some(p => p.id === i.projectId)) problems.push(`missing project ${i.id}`)
      if (i.rectificationId && !rects.some(r => r.id === i.rectificationId && r.issueId === i.id)) problems.push(`missing rect ${i.id}`)
    }
    for (const r of rects) {
      const issue = issues.find(i => i.id === r.issueId)
      if (!issue || (r.status === '已销号') !== (issue.status === '已关闭')) problems.push(`status mismatch ${r.id}`)
      if (r.status === '已销号' && !r.closeOutAt) problems.push(`missing close date ${r.id}`)
    }
    const current = initialAnnualPlans.find(p => p.year === 2025)
    const old = structuredClone({ ...current, content: current.submissions[0].content, approved: current.submissions[0], submissions: [current.submissions[0]] })
    const oldVersion = JSON.stringify(old.approved)
    const upgraded = restoreAnnualPlans([old]).find(p => p.year === 2025)
    if (upgraded.approved.version !== 2 || JSON.stringify(upgraded.submissions[0]) !== oldVersion) problems.push('approval history upgrade')
    if (restoreAnnualPlans([upgraded]).find(p => p.year === 2025).content.items.length !== upgraded.content.items.length) problems.push('duplicate upgrade')
    const edited = structuredClone(old); edited.content = { ...edited.content, name: '用户调整后的计划' }
    if (restoreAnnualPlans([edited]).find(p => p.year === 2025).content.items.length !== edited.content.items.length) problems.push('user plan overwritten')
    const merged = appendMissingDemoRecords([{ ...issues[0], title: '用户修改内容' }], issues)
    if (merged[0].title !== '用户修改内容' || merged.length !== issues.length || appendMissingDemoRecords(merged, issues).length !== issues.length) problems.push('record preservation')
    return { problems, counts: [2024, 2025, 2026].map(year => ({ year, projects: projects.filter(p => p.managementYear === year).length, issues: issues.filter(i => i.id.startsWith(`ISS-DEMO-${year}`)).length, rectifications: rects.filter(r => r.id.startsWith(`RCT-DEMO-${year}`)).length })) }
  })
  assert.deepEqual(result.problems, [])
  console.log('ADDED', JSON.stringify(result.counts))
  for (const year of [2024, 2025, 2026]) {
    await page.getByLabel('统计年度').selectOption(String(year))
    await page.waitForTimeout(450)
    console.log(`KPI ${year}`, (await page.locator('.analysis-kpis').innerText()).replaceAll('\n', ' '))
    assert.equal(await page.locator('.audit-analysis').evaluate(el => el.scrollHeight > el.clientHeight + 2), false)
    await page.getByRole('button', { name: '全部问题', exact: true }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('button', { name: '查看详情', exact: true }).first().waitFor()
    await dialog.getByRole('button', { name: '关闭', exact: true }).last().click()
    await page.screenshot({ path: `.playwright-cli/analytics-history-${year}.png` })
  }
  await page.evaluate(async () => {
    const fixtures = await import('/src/pages/icm/data/auditDemoHistory.ts')
    localStorage.setItem('internal-audit-workflow-v2', JSON.stringify({ version: 1, state: { issues: [{ ...fixtures.demoHistoryIssues[0], title: '保留用户修改的演示发现' }], rectifications: [fixtures.demoHistoryRectifications[0]] } }))
  })
  await page.reload(); await page.getByRole('heading', { name: '统计分析', exact: true }).waitFor()
  await page.getByLabel('统计年度').selectOption('2024')
  await page.getByRole('button', { name: '全部问题', exact: true }).click()
  await page.getByRole('dialog').getByText('保留用户修改的演示发现', { exact: true }).waitFor()
  assert.deepEqual(errors, [])
  console.log('PASS linked history fixtures, staged events, approval snapshots, idempotent hydration, preserved user edits, all annual charts and centered details')
} finally { await browser.close() }
