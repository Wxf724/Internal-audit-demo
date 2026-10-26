import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'

// Exercise the pure transition functions used by the persistent store.
const source = readFileSync(new URL('../src/pages/icm/pages/annual-plan/model.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } })
const { submitPlan, decidePlan, saveContent, adjustPlan, describeChanges } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)
const author = { id: 'auditor', name: '李娜' }
const reviewer = { id: 'project-lead', name: '张衡' }
const approver = { id: 'audit-lead', name: '郑刚' }
const fresh = () => ({
  id: 'AP-2026', year: 2026, status: '编制中', creator: author, submissions: [], adjustmentReason: '', updatedAt: '',
  content: { name: '2026年度审计计划', department: '审计部', basis: '年度风险评估', objective: '覆盖主要风险', reviewer, approver,
    items: [{ id: 'ITEM-1', name: '采购审计', type: '财务审计', subject: '采购部', period: '2025年度', start: '2026-06-01', end: '2026-06-30', owner: '张衡', workdays: 20, scope: '采购付款', risk: '付款合规' }] },
})
let checks = 0
const check = (name, test) => { test(); checks++; console.log(`PASS ${name}`) }
check('cannot submit without projects', () => { const p = fresh(); p.content.items = []; assert.throws(() => submitPlan(p, author)) })
check('compiler cannot also review', () => { const p = fresh(); p.content.reviewer = author; assert.throws(() => submitPlan(p, author)) })
check('reviewer and approver must differ', () => { const p = fresh(); p.content.approver = reviewer; assert.throws(() => submitPlan(p, author)) })
check('date and workday validation', () => { const p = fresh(); p.content.items[0].end = '2025-01-01'; assert.throws(() => submitPlan(p, author)); p.content.items[0].end = '2026-06-30'; p.content.items[0].workdays = 0; assert.throws(() => submitPlan(p, author)) })
let p = submitPlan(fresh(), author)
check('submission freezes content snapshot', () => { const draft = fresh(); const sent = submitPlan(draft, author); draft.content.items[0].name = 'changed'; assert.equal(sent.submissions[0].content.items[0].name, '采购审计') })
check('no duplicate submission', () => assert.throws(() => submitPlan(p, author)))
check('cannot edit pending submission', () => assert.throws(() => saveContent(p, p.content, author)))
check('no out-of-order final approval', () => assert.throws(() => decidePlan(p, approver, '通过', '同意')))
check('no self approval', () => assert.throws(() => decidePlan(p, author, '通过', '同意')))
check('approval opinion required', () => assert.throws(() => decidePlan(p, reviewer, '退回', ' ')))
p = decidePlan(p, reviewer, '退回', '补充范围')
check('return reopens only compiler editing', () => { assert.equal(p.status, '已退回'); assert.throws(() => saveContent(p, p.content, reviewer)); p = saveContent(p, { ...p.content, objective: '补充目标' }, author) })
p = submitPlan(p, author)
check('resubmission preserves previous rejection', () => { assert.equal(p.submissions.length, 2); assert.equal(p.submissions[0].steps[0].status, '退回'); assert.equal(p.submissions[1].steps[0].status, '待处理') })
p = decidePlan(p, reviewer, '通过', '范围适当')
check('review passes to approver without finalizing', () => { assert.equal(p.status, '审批中'); assert.equal(p.submissions.at(-1).steps[1].status, '待处理') })
p = decidePlan(p, approver, '通过', '按授权批准')
check('final approval retains approved snapshot', () => { assert.equal(p.status, '已批准'); assert.equal(p.approved.version, 2); assert.throws(() => saveContent(p, p.content, author)); assert.throws(() => decidePlan(p, approver, '通过', '重复')) })
check('adjustment requires compiler and reason', () => { assert.throws(() => adjustPlan(p, reviewer, '新增项目')); assert.throws(() => adjustPlan(p, author, ' ')) })
p = adjustPlan(p, author, '调整工时和范围')
p = saveContent(p, { ...p.content, items: p.content.items.map((item) => ({ ...item, workdays: 30, scope: '采购及验收付款' })) }, author)
check('approved content remains unchanged during adjustment', () => { assert.equal(p.approved.content.items[0].workdays, 20); assert.equal(p.content.items[0].workdays, 30); assert.ok(describeChanges(p.approved.content, p.content).some((text) => text.includes('20 → 30'))) })
p = submitPlan(p, author)
p = decidePlan(p, reviewer, '通过', '同意调整')
p = decidePlan(p, approver, '通过', '批准调整')
check('adjusted plan requires both steps and preserves history', () => { assert.equal(p.approved.version, 3); assert.equal(p.approved.content.items[0].workdays, 30); assert.equal(p.submissions[1].content.items[0].workdays, 20); assert.equal(p.submissions.length, 3) })
const recordingPlan = () => ({ ...fresh(), recordingMode: true, content: { ...fresh().content, reviewStages: ['内审机构负责人审核', '党委前置研究', '有权机构批准'], capacity: 100, evidence: [{ id: 'E1', name: '年度评估', source: '风险台账', version: 'v1', status: '已确认', note: '已核对' }], risks: [] } })
check('recording mode permits institutional drafting without role switching', () => assert.equal(saveContent(recordingPlan(), recordingPlan().content, approver).status, '编制中'))
check('selected review stages are preserved in submission', () => assert.deepEqual(submitPlan(recordingPlan(), author).submissions[0].steps.map((step) => step.name), ['内审机构负责人审核', '党委前置研究', '有权机构批准']))
check('missing evidence blocks submission', () => { const draft = recordingPlan(); draft.content.evidence[0].status = '待补充'; assert.throws(() => submitPlan(draft, author), /编制依据/) })
check('mandatory risk cannot be silently excluded', () => { const draft = recordingPlan(); draft.content.risks = [{ id: 'R1', required: true }]; assert.throws(() => submitPlan(draft, author), /必审/) })
check('final approval stage cannot be omitted', () => { const draft = recordingPlan(); draft.content.reviewStages = ['党委前置研究']; assert.throws(() => submitPlan(draft, author), /最终批准/) })
let recorded = submitPlan(recordingPlan(), approver)
check('meeting or decision reference is required', () => assert.throws(() => decidePlan(recorded, approver, '通过', '同意'), /记录编号/))
recorded = decidePlan(recorded, approver, '通过', '审核通过', '审核-001')
recorded = decidePlan(recorded, approver, '通过', '研究通过', '党委会-002')
check('party deliberation alone does not approve annual plan', () => { assert.equal(recorded.status, '审批中'); assert.equal(recorded.approved, undefined) })
recorded = decidePlan(recorded, approver, '通过', '批准实施', '董事会-003')
check('evidence snapshot is frozen with approved plan', () => { const next = adjustPlan(recorded, reviewer, '补充依据'); next.content.evidence[0].version = 'v2'; assert.equal(next.approved.content.evidence[0].version, 'v1') })
const modelUrl = `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`
const planningSource = readFileSync(new URL('../src/pages/icm/pages/annual-plan/planning.ts', import.meta.url), 'utf8')
const relationsJs = ts.transpileModule(readFileSync(new URL('../src/pages/icm/pages/projectRelations.ts', import.meta.url), 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText
const relationsUrl = `data:text/javascript;base64,${Buffer.from(relationsJs).toString('base64')}`
const planningJs = ts.transpileModule(planningSource, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText.replace("'./model'", JSON.stringify(modelUrl)).replace("'../projectRelations'", JSON.stringify(relationsUrl))
const { timelinePosition, businessContent, buildPlanningRun } = await import(`data:text/javascript;base64,${Buffer.from(planningJs).toString('base64')}`)
check('adjustment leaves approved execution baseline available', () => { const next = adjustPlan(recorded, reviewer, '改排期'); next.content.items = []; assert.equal(businessContent(next).items.length, 1) })
check('timeline excludes out-of-year and invalid intervals', () => { assert.equal(timelinePosition('2025-01-01', '2025-03-01', 2026), null); assert.equal(timelinePosition('', '', 2026), null); assert.equal(timelinePosition('2026-01-01', '2026-12-31', 2026).width, '100%') })
check('AI ranks mandatory work first and carries evidence references', () => { const draft = recordingPlan(); draft.content.risks = [ { id: 'R1', required: false, likelihood: 5, impact: 5, subject: '单位A', domain: '采购', title: '风险A', recommendation: '专项审计A', workdays: 40, evidenceIds: ['E1'] }, { id: 'R2', required: true, likelihood: 1, impact: 1, subject: '单位B', domain: '工程', title: '必审B', recommendation: '专项审计B', workdays: 50, evidenceIds: ['E1'] } ]; const run = buildPlanningRun(draft, [], 2); assert.equal(run.suggestions[0].riskId, 'R2'); assert.ok(run.suggestions[0].sources[0].includes('v1')); assert.equal(draft.content.items.length, 1) })
console.log(`${checks} annual plan workflow and planning checks passed.`)
