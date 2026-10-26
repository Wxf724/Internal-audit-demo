import assert from 'node:assert/strict'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const browser = await chromium.launch({ channel: 'msedge', headless: true })
const context = await browser.newContext({ storageState: { cookies: [], origins: [] } })
await context.route('**/*', (route) => {
  const url = new URL(route.request().url())
  return (url.hostname === '127.0.0.1' && !url.pathname.startsWith('/api/')) || ['cdn.jsdelivr.net', 'unpkg.com', 'tessdata.projectnaptha.com'].includes(url.hostname) ? route.continue() : route.abort()
})
const page = await context.newPage()
try {
  await page.goto('http://127.0.0.1:4176/plan-workbench?year=2027')
  const result = await page.evaluate(async () => {
    const { parsePlanFile } = await import('/src/pages/icm/pages/annual-plan/planFiles.ts')
    const canvas = document.createElement('canvas'); canvas.width = 900; canvas.height = 160
    const ctx = canvas.getContext('2d'); ctx.fillStyle = 'white'; ctx.fillRect(0, 0, 900, 160); ctx.fillStyle = 'black'; ctx.font = '48px Arial'; ctx.fillText('AUDIT PLAN 2027 20 DAYS', 30, 95)
    const blob = await new Promise((resolve) => canvas.toBlob(resolve))
    try {
      const result = await Promise.race([parsePlanFile(new File([blob], 'synthetic-ocr.png', { type: 'image/png' }), () => {}), new Promise((_, reject) => setTimeout(() => reject(new Error('OCR timeout')), 90000))])
      return { ok: /2027/.test(result.passages[0]?.text), text: result.passages[0]?.text }
    } catch (error) { return { ok: false, error: error.message } }
  })
  console.log(JSON.stringify(result)); assert.equal(result.ok, true)
} finally { await browser.close() }
