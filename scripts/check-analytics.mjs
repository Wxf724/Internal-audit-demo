import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
const root = new URL('../src/pages/icm/pages/', import.meta.url)
const moduleUrl = (name, imports = {}) => {
  let code = ts.transpileModule(readFileSync(new URL(name, root), 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText
  for (const [specifier, url] of Object.entries(imports)) code = code.replaceAll(`'${specifier}'`, `'${url}'`)
  return `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`
}
const { buildAnalytics, validDate, overdueDays } = await import(moduleUrl('analytics/model.ts', { '../projectRelations': moduleUrl('projectRelations.ts') }))
const item = { id: 'I1', name: '采购审计', subject: '采购部', type: '财务审计', start: '2026-05-01', end: '2026-06-30', workdays: 20 }
const content = { items: [item], risks: [], capacity: 100 }
const plan = { id: 'A26', year: 2026, content: { ...content, items: [...content.items, { ...item, id: 'DRAFT' }] }, approved: { content } }
const project = { id: 'P1', name: '采购项目', subject: '采购部', type: '财务审计', managementYear: 2026, stage: '实施中', plannedImplementation: '2026-05-01 至 2026-06-30', actualImplementation: '2026-05-02', executionLinks: [{ annualPlanId: 'A26', itemId: 'I1', year: 2026 }] }
const issue = { id: 'ISS1', projectId: 'P1', title: '重大问题', level: '重大', status: '整改中', owner: '采购部' }
const rect = { id: 'R1', issueId: 'ISS1', title: '整改一', owner: '采购部', status: '已整改', deadline: '2026-06-01', closeOutAt: '2026-06-02' }
const input = { plans: [plan], projects: [project, { ...project, id: 'P2' }], issues: [issue, { ...issue, id: 'PENDING', status: '待确认' }, { ...issue, id: 'MERGED', mergedIntoId: 'ISS1' }, { ...issue, id: 'UNKNOWN', projectId: undefined }], rectifications: [rect, { ...rect, id: 'R2', status: '已销号' }], today: '2026-10-25' }
const filter = { year: 2026, unit: '', type: '', stage: '', period: 'all' }
let count = 0
const check = (name, fn) => { fn(); count++; console.log(`PASS ${name}`) }
const data = buildAnalytics(input, filter)
check('approved baseline excludes draft and arrangement deduplicates projects', () => { assert.equal(data.rows.plans.length, 1); assert.equal(data.metrics.find(m => m.id === 'arranged').value, 100); assert.equal(data.rows.projects.length, 2) })
check('pending, merged and unlinked issues excluded from confirmed statistics', () => { assert.equal(data.rows.issues.length, 1); assert.equal(data.pendingIssues.length, 1); assert.equal(data.unlinkedRows.length, 1) })
check('completed rectification is not verified closeout', () => { assert.equal(data.closedCount, 1); assert.equal(data.closeRate, 50); assert.equal(data.aging.flatMap(g => g.rows).length, 1); assert.equal(data.months[5].closed, 1) })
check('invalid calendar dates rejected', () => { assert.equal(validDate('2026-02-30'), undefined); assert.equal(overdueDays('invalid', input.today), null); assert.equal(overdueDays('2026-10-25', input.today), 0) })
check('unit, type, stage and period filters apply to linked records', () => { for (const patch of [{ unit: '另一单位' }, { type: '工程审计' }, { stage: '已归档' }, { period: 'Q1' }]) assert.equal(buildAnalytics(input, { ...filter, ...patch }).rows.projects.length, 0); assert.equal(buildAnalytics(input, { ...filter, period: '06' }).rows.issues.length, 1) })
check('signatures use registered event dates, never archive or update dates', () => { const d = buildAnalytics({ ...input, projects: [{ ...project, stage: '已归档', updatedAt: '2026-08-01', auditReport: { status: '已签发', history: [{ action: '签发报告', at: '2026-07-01' }], versions: [] } }] }, filter); assert.equal(d.months[6].signed, 1); assert.equal(d.months[7].signed, 0) })
check('empty denominator is unknown, not zero percent', () => { const d = buildAnalytics({ ...input, plans: [], projects: [] }, filter); assert.equal(d.closeRate, null); assert.equal(d.metrics.find(m => m.id === 'arranged').value, '—') })
check('future planning risk coverage and resource budget use draft', () => { const risk = { id: 'RK1', title: '采购风险', subject: '采购部', likelihood: 5, impact: 5, required: true, workdays: 20 }; const d = buildAnalytics({ ...input, plans: [{ id: 'A27', year: 2027, content: { capacity: 100, risks: [risk], items: [{ ...item, start: '2027-05-01', end: '2027-06-30', riskId: 'RK1' }] } }] }, { ...filter, year: 2027 }); assert.equal(d.planning, true); assert.equal(d.coveredRisks.length, 1); assert.equal(d.metrics.find(m => m.id === 'remaining').value, 80) })
console.log(`${count} analytics checks passed`)
