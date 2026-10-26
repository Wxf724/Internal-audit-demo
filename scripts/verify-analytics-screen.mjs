import assert from 'node:assert/strict'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const browser = await chromium.launch({ channel: 'msedge', headless: true })
const context = await browser.newContext()
await context.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort())
const page = await context.newPage()
const errors = []
page.on('pageerror', error => errors.push(error.message))
const auditLayout = async () => {
  const result = await page.locator('.audit-analysis').evaluate(root => {
    const panels = [...root.querySelectorAll('.analysis-panel')].filter(el => el.getBoundingClientRect().height)
    const scroll = [root, ...panels, ...root.querySelectorAll('.analysis-matrix-scroll,.analysis-risk-list,.analysis-focus')].filter(el => el.clientHeight && (el.scrollHeight > el.clientHeight + 2 || el.scrollWidth > el.clientWidth + 2)).map(el => el.className)
    const clipped = panels.flatMap(panel => { const box = panel.getBoundingClientRect(); return [...panel.querySelectorAll('button, canvas')].filter(el => { const rect = el.getBoundingClientRect(); return rect.width && rect.height && (rect.bottom > box.bottom + 2 || rect.right > box.right + 2 || rect.top < box.top - 2) }).map(el => el.textContent || el.tagName) })
    return { scroll, clipped, panels: panels.length, documentOverflow: document.documentElement.scrollHeight > innerHeight + 2 }
  })
  assert.deepEqual(result.scroll, [], JSON.stringify(result))
  assert.deepEqual(result.clipped, [], JSON.stringify(result))
  assert.equal(result.documentOverflow, false)
  return result
}
try {
  for (const [width, height] of [[1366, 768], [1920, 1080], [1280, 720]]) {
    await page.setViewportSize({ width, height })
    for (const year of [2025, 2026, 2027]) {
      await page.goto(`http://127.0.0.1:4176/cockpit?year=${year}`)
      await page.locator('.analysis-dashboard canvas').first().waitFor()
      await page.waitForTimeout(500)
      assert.equal((await auditLayout()).panels, 5)
      await page.screenshot({ path: `.playwright-cli/analytics-screen-${year}-${width}.png` })
      console.log(`PASS ${year} ${width}x${height}: five visible panels, no scrolling or clipped controls`)
    }
  }
  await page.goto('http://127.0.0.1:4176/cockpit?year=2026')
  await page.locator('.analysis-stage-legend').getByRole('button', { name: '实施中', exact: true }).click()
  await page.waitForTimeout(400)
  await auditLayout()
  await page.getByRole('button', { name: '重置筛选', exact: true }).click()
  await page.getByRole('button', { name: '全部问题', exact: true }).click()
  await page.getByRole('dialog').waitFor()
  await page.getByRole('dialog').getByRole('button', { name: '关闭', exact: true }).last().click()
  await page.setViewportSize({ width: 390, height: 844 })
  for (const section of ['execution', 'stages', 'issues', 'rectification', 'attention']) {
    await page.getByLabel('看板区域').selectOption(section)
    await page.waitForTimeout(350)
    assert.equal((await auditLayout()).panels, 1)
  }
  assert.deepEqual(errors, [])
  console.log('PASS filter layout, full-record drawer and narrow-screen section switching')
} finally { await browser.close() }
