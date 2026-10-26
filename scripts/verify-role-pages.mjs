import assert from 'node:assert/strict'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const browser = await chromium.launch({ channel: 'msedge', headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 960 } })
await context.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort())
const page = await context.newPage(), errors = []
page.on('pageerror', e => errors.push(e.message))
const origin = 'http://127.0.0.1:4176'
const project = '/projects/AUD-DEMO-2026-001'
const top = () => page.getByRole('navigation', { name: '主导航', exact: true })
const switchRole = async (name) => {
  await page.locator('.icm-role-menu > summary').click()
  await page.locator('.icm-role-menu-panel').getByRole('button').filter({ hasText: name }).click()
}
const expectedTop = ['首页', '审计项目', '审计整改', '审计资源']
const expectedProject = ['项目总览', '方案与分工', '实施与取证', '发现与沟通', '整改与验证']
try {
  await page.goto(`${origin}${project}?tab=report`)
  await top().waitFor()
  assert.equal(await top().getByRole('link').count(), 6)
  assert.equal(await page.getByRole('navigation', { name: '项目环节', exact: true }).getByRole('link').count(), 7)
  await switchRole('张衡')
  assert.equal(await top().getByRole('link').count(), 6)
  assert.equal(await page.getByRole('navigation', { name: '项目环节', exact: true }).getByRole('link').count(), 7)
  await switchRole('李娜')
  await page.waitForURL('**tab=overview')
  assert.deepEqual(await top().getByRole('link').allTextContents(), expectedTop)
  assert.deepEqual(await page.getByRole('navigation', { name: '项目环节', exact: true }).getByRole('link').allTextContents(), expectedProject)
  assert.deepEqual(await page.locator('.project-mobile-stages button').allTextContents(), expectedProject)
  for (const tab of ['preparation', 'execution', 'findings', 'rectification']) {
    await page.goto(`${origin}${project}?tab=${tab}`)
    await top().waitFor()
    assert.equal(new URL(page.url()).searchParams.get('tab'), tab)
    assert.deepEqual(await top().getByRole('link').allTextContents(), expectedTop)
  }
  for (const tab of ['report', 'archive']) {
    await page.goto(`${origin}${project}?tab=${tab}&section=hidden`)
    await page.waitForURL('**tab=overview')
    assert.equal(new URL(page.url()).searchParams.get('section'), null)
  }
  for (const path of ['/plan-workbench?year=2026', '/cockpit?year=2026']) {
    await page.goto(origin + path)
    await page.waitForURL('**/workplace')
    assert.equal(await page.getByRole('button', { name: '年度审计计划', exact: true }).count(), 0)
    assert.equal(await page.getByRole('button', { name: '我负责的计划', exact: true }).count(), 0)
  }
  await switchRole('郑刚')
  await top().getByRole('link', { name: '统计分析', exact: true }).click()
  await page.waitForURL('**/cockpit')
  await switchRole('李娜')
  await page.waitForURL('**/workplace')
  await switchRole('张衡')
  await page.goto(`${origin}${project}?tab=archive`)
  await top().waitFor()
  assert.equal(new URL(page.url()).searchParams.get('tab'), 'archive')
  assert.equal(await page.getByRole('navigation', { name: '项目环节', exact: true }).getByRole('link').count(), 7)
  await switchRole('李娜')
  await page.waitForURL('**tab=overview')
  await page.setViewportSize({ width: 800, height: 900 })
  assert.deepEqual(await page.locator('.project-mobile-stages button').allTextContents(), expectedProject)
  assert.deepEqual(errors, [])
  console.log('PASS: lead/main auditor 6+7, auditor 4+5, role changes redirect hidden pages, direct URLs and reload retain selection, home shortcuts consistent, mobile tabs match')
} finally { await browser.close() }
