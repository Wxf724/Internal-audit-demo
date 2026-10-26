import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import * as XLSX from 'xlsx'
import { Document, Packer, Paragraph } from 'docx'
import mammoth from 'mammoth'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const browser = await chromium.launch({ channel: 'msedge', headless: true })
const context = await browser.newContext({ storageState: { cookies: [], origins: [] }, viewport: { width: 1440, height: 1000 } })
await context.route('**/*', (route) => { const url = new URL(route.request().url()); return url.hostname === '127.0.0.1' && !url.pathname.startsWith('/api/') ? route.continue() : route.abort() })
const page = await context.newPage(), errors = []
page.on('pageerror', (error) => errors.push(error.message))
const plan = () => page.evaluate(() => JSON.parse(localStorage.getItem('internal-audit-annual-plans-v1')).state.plans.find((p) => p.year === 2027))
const library = () => page.evaluate(() => JSON.parse(localStorage.getItem('audit-plan-resource-library-v1')).state.resources)
const shot = (name) => page.screenshot({ path: `.playwright-cli/plan-files-${name}.png`, fullPage: true, animations: 'disabled' })
const fixture = (days) => { const book = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([['风险', '单位', '可能性', '影响', '人天', '建议项目'], ['上传风险A', '测试采购部', 4, 5, days, '上传资料采购审计']]), '风险表'); return { name: '风险评估验收.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer: XLSX.write(book, { type: 'buffer', bookType: 'xlsx' }) } }
const uploadXlsx = async (days, replace = false) => {
  await page.getByRole('button', { name: '上传文件', exact: true }).click()
  await page.getByLabel('上传编制资料').setInputFiles(fixture(days))
  await page.getByLabel('按表格逐行导入').check()
  for (const [label, index] of [['风险主题', 0], ['审计对象', 1], ['可能性', 2], ['影响程度', 3], ['预计人天', 4], ['建议项目', 5]]) await page.getByRole('combobox', { name: new RegExp(`^${label}`) }).selectOption(String(index))
  if (replace) await page.getByLabel('作为同名资料的新版本，保留旧引用').check()
  await page.getByLabel('已核对原文件、引用内容、年度及字段对应关系').check()
  await shot(replace ? 'version' : 'mapping')
  await page.getByRole('button', { name: '确认并加入引用', exact: true }).click()
  await page.getByRole('dialog').waitFor({ state: 'hidden' })
}
try {
  await page.goto('http://127.0.0.1:4176/plan-workbench?annual=AP-2027-001&tab=compose')
  await page.getByRole('button', { name: '返回年度计划', exact: true }).click()
  await uploadXlsx(20)
  assert.equal((await library()).length, 1)
  const first = (await library())[0]
  assert.equal(first.risk.impact, 5)
  assert.equal(first.locator, '风险表 · 第 2 行')
  await page.reload()
  await page.getByRole('button', { name: /^编制资料 · / }).click()
  await page.getByRole('searchbox', { name: '搜索编制资源' }).fill('上传风险A')
  await page.getByRole('button', { name: /上传风险A/ }).click()
  await page.getByText('风险表 · 第 2 行', { exact: true }).first().waitFor()
  const originalDownload = page.waitForEvent('download')
  await page.getByRole('button', { name: '下载原文件', exact: true }).click()
  const original = await originalDownload
  assert.equal(original.suggestedFilename(), '风险评估验收.xlsx')
  await page.getByRole('button', { name: '关闭', exact: true }).click()
  await page.getByRole('button', { name: '完成选择', exact: true }).click()
  await page.getByRole('button', { name: '创建草案', exact: true }).click()
  await page.getByRole('button', { name: '添加项目', exact: true }).click()
  await page.getByLabel('项目名称', { exact: true }).fill('上传资料采购审计')
  await page.getByLabel('审计对象', { exact: true }).fill('测试采购部')
  await page.getByLabel('审计覆盖期间', { exact: true }).fill('2026年度')
  await page.getByLabel('项目资源需求', { exact: true }).fill('财务审计人员，20人天')
  await page.getByLabel('审计目标与范围', { exact: true }).fill('采购付款与供应商风险')
  await page.getByRole('checkbox', { name: '上传风险A', exact: true }).check()
  await page.getByRole('button', { name: '计划信息', exact: true }).click()
  await page.getByLabel('后续审计安排', { exact: true }).fill('季度核查整改进展')
  await page.getByLabel('专业能力、外部资源及缺口安排', { exact: true }).fill('财务专业内审人员，按需安排工程专家')
  await page.getByLabel('保持不变（后续 AI 调整保留此项目）').check()
  await shot('editing')
  await page.getByRole('button', { name: '保存修改', exact: true }).click()
  await page.getByRole('dialog').waitFor({ state: 'hidden' })
  assert.equal((await plan()).content.items[0].locked, true)
  assert.equal((await plan()).conversation.revisions[0].resources.find((r) => r.fileId).version, 'V1')
  await uploadXlsx(25, true)
  assert.equal((await library()).filter((r) => !r.archived).length, 1)
  assert.equal((await library()).at(-1).version, 'V2')
  assert.equal((await plan()).conversation.revisions[0].resources.find((r) => r.fileId).version, 'V1')
  await page.getByRole('button', { name: '编辑草案', exact: true }).click()
  await page.getByLabel('上传资料采购审计计划人天', { exact: true }).fill('22')
  await page.getByRole('button', { name: '取消编辑', exact: true }).click()
  await page.getByRole('button', { name: '放弃修改并返回', exact: true }).click()
  assert.equal((await plan()).content.items[0].workdays, 20)
  for (const format of ['Excel', 'Word']) {
    await page.getByRole('button', { name: '导出', exact: true }).click()
    const waiting = page.waitForEvent('download')
    await page.getByRole('button', { name: format, exact: true }).click()
    const download = await waiting
    const data = await readFile(await download.path())
    if (format === 'Excel') { const book = XLSX.read(data); assert.ok(book.SheetNames.includes('依据与附件清单')); assert.match(XLSX.utils.sheet_to_csv(book.Sheets['项目清单']), /上传资料采购审计/) }
    else { const result = await mammoth.extractRawText({ buffer: data }); assert.match(result.value, /后续审计安排/); assert.match(result.value, /季度核查整改进展/) }
    await page.getByRole('heading', { name: '导出草案', exact: true }).waitFor({ state: 'hidden' })
  }
  const doc = await Packer.toBuffer(new Document({ sections: [{ children: [new Paragraph('经营重点：关注重大采购。'), new Paragraph('下一段：检查年度资源。')] }] }))
  await page.getByRole('button', { name: '上传文件', exact: true }).click()
  await page.getByLabel('上传编制资料').setInputFiles({ name: '战略说明.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', buffer: doc })
  await page.getByLabel('核录内容', { exact: true }).waitFor()
  assert.match(await page.getByLabel('核录内容', { exact: true }).inputValue(), /经营重点/)
  await page.getByRole('combobox', { name: /^引用位置/ }).selectOption('第 2 段')
  assert.match(await page.getByLabel('核录内容', { exact: true }).inputValue(), /年度资源/)
  await page.getByRole('button', { name: '取消', exact: true }).last().click()
  const pdf = '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 200]/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>endobj\n4 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n5 0 obj<</Length 55>>stream\nBT /F1 12 Tf 20 100 Td (Audit plan resources 2027) Tj ET\nendstream\nendobj\ntrailer<</Root 1 0 R>>\n%%EOF'
  await page.getByRole('button', { name: '上传文件', exact: true }).click()
  await page.getByLabel('上传编制资料').setInputFiles({ name: '年度依据.pdf', mimeType: 'application/pdf', buffer: Buffer.from(pdf) })
  await page.getByLabel('核录内容', { exact: true }).waitFor()
  assert.match(await page.getByLabel('核录内容', { exact: true }).inputValue(), /Audit plan resources/)
  await shot('pdf')
  await page.getByRole('button', { name: '取消', exact: true }).last().click()
  assert.deepEqual(errors, [])
  console.log('PASS Excel mapping, original download, IndexedDB persistence, source versions, manual editing, discard guard, locked project, Word/Excel exports, DOCX paragraphs and PDF page extraction; isolated data only')
} catch (error) { await shot('failure'); throw error } finally { await browser.close() }
