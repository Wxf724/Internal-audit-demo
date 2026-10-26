import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
const root = new URL('../src/pages/icm/pages/annual-plan/', import.meta.url)
const moduleUrl = (name, imports = {}) => {
  let code = ts.transpileModule(readFileSync(new URL(name, root), 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText
  for (const [specifier, url] of Object.entries(imports)) code = code.replaceAll(`'${specifier}'`, `'${url}'`)
  return `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`
}
const modelUrl = moduleUrl('model.ts')
const { parsePlanningReply, planningMessages } = await import(moduleUrl('conversationProtocol.ts', { './model': modelUrl, './conversationTypes': moduleUrl('conversationTypes.ts'), './draftRules': moduleUrl('draftRules.ts') }))
const { submitPlan } = await import(modelUrl)
const risk = { id: 'R1', title: '采购风险', subject: '采购部', required: true, recommendation: '采购审计', evidenceIds: [], likelihood: 5, impact: 5, workdays: 20 }
const resources = [{ id: 'risk:R1', category: '年度风险评估结果', name: '采购风险', subject: '采购部', source: '风险库', version: 'v1', summary: '采购风险', risk }, { id: 'budget', category: '资源台账', name: '资源', source: '预算', version: 'v1', summary: '20人天', capacity: 20 }]
const plan = { id: 'P1', year: 2027, status: '编制中', creator: { id: 'a', name: '内审机构' }, submissions: [], recordingMode: true, content: { name: '年度计划', department: '审计部', items: [], risks: [risk], basis: '', objective: '', capacity: 20, reviewer: { id: 'b', name: '复核' }, approver: { id: 'c', name: '批准' } }, conversation: { selectedResourceIds: [], messages: [], revisions: [], riskLibrary: [risk] } }
const fresh = () => ({ reply: '形成草案，请核对。', proposal: { objective: '覆盖重点风险', capacity: 20, items: [{ id: '', name: '采购审计', subject: '采购部', type: '财务审计', period: '2026年度', start: '2027-01-01', end: '2027-01-30', owner: '内审机构', workdays: 20, scope: '采购付款', risk: '采购风险', riskId: 'R1', priority: '高', source: '风险评估', resourceIds: ['risk:R1'] }] } })
let checks = 0
const check = (name, fn) => { fn(); checks++; console.log(`PASS ${name}`) }
const parse = (data) => parsePlanningReply(JSON.stringify(data), plan, resources)
check('plain answer needs no proposal or budget', () => assert.equal(parsePlanningReply('{"reply":"请补充资源预算","proposal":null}', plan, []).proposal, undefined))
check('valid proposal is separate from current draft and snapshots resources', () => { const result = parse(fresh()); assert.equal(result.proposal.content.items.length, 1); assert.equal(plan.content.items.length, 0); result.proposal.resources[0].name = 'change'; assert.equal(resources[0].name, '采购风险') })
check('reject malformed model output', () => assert.throws(() => parsePlanningReply('not json', plan, resources)))
check('reject unselected source', () => { const data = fresh(); data.proposal.items[0].resourceIds = ['not-selected']; assert.throws(() => parse(data), /未勾选/) })
check('reject invented new audit subject', () => { const data = fresh(); data.proposal.items[0].subject = '虚构部门'; assert.throws(() => parse(data), /审计对象/) })
check('reject invalid dates and different annual year', () => { for (const date of ['2027-02-30', '2026-01-01']) { const data = fresh(); data.proposal.items[0].start = date; assert.throws(() => parse(data), /窗口/) } })
check('reject mismatched risk identity', () => { const data = fresh(); data.proposal.items[0].riskId = 'R2'; assert.throws(() => parse(data), /风险编号/) })
check('reject total workdays beyond capacity', () => { const data = fresh(); data.proposal.items[0].workdays = 21; assert.throws(() => parse(data), /总人天/) })
check('reject increased budget without resource evidence', () => { const data = fresh(); data.proposal.capacity = 21; assert.throws(() => parse(data), /预算/) })
check('retain existing project identity during dialogue changes', () => { const data = fresh(); data.proposal.items[0].id = 'EXISTING'; const p = structuredClone(plan); p.content.items = [{ ...data.proposal.items[0], projectId: 'PROJECT-1' }]; const item = parsePlanningReply(JSON.stringify(data), p, resources).proposal.content.items[0]; assert.equal(item.id, 'EXISTING'); assert.equal(item.projectId, 'PROJECT-1') })
check('prompt sends only selected resource snapshots and accepted draft', () => { const messages = planningMessages(plan, [resources[1]], '检查资料', []); const payload = JSON.parse(messages.at(-1).content); assert.deepEqual(payload.selectedResources.map((r) => r.id), ['budget']); assert.deepEqual(payload.currentDraft.items, []) })
check('unselecting mandatory source cannot bypass submission', () => { const p = structuredClone(plan); p.content = parse(fresh()).proposal.content; p.content.items[0].riskId = undefined; p.content.risks = []; p.content.reviewStages = ['有权机构批准']; p.content.evidence.forEach((entry) => { entry.status = '已确认' }); assert.throws(() => submitPlan(p, p.creator), /必审/) })
check('conflicting budget versions cannot silently override', () => assert.throws(() => parsePlanningReply(JSON.stringify(fresh()), plan, [...resources, { ...resources[1], id: 'new-budget', capacity: 30 }]), /冲突/))
check('locked project cannot be changed or removed by model', () => {
  const p = structuredClone(plan); p.content = parse(fresh()).proposal.content; p.content.items[0].locked = true
  const data = fresh(); data.proposal.items[0].id = p.content.items[0].id; data.proposal.items[0].workdays = 19
  assert.throws(() => parsePlanningReply(JSON.stringify(data), p, resources), /保持不变/)
})
check('existing project can retain earlier evidence when not reselected', () => {
  const p = structuredClone(plan); p.content = parse(fresh()).proposal.content; p.conversation.revisions = [{ resources }]
  const data = fresh(); data.proposal.items[0].id = p.content.items[0].id
  assert.equal(parsePlanningReply(JSON.stringify(data), p, [resources[1]]).proposal.content.items[0].id, p.content.items[0].id)
})
check('formal draft requires follow-up, resource strategy and actual approval basis', () => {
  const p = structuredClone(plan); p.content = parse(fresh()).proposal.content; p.content.evidence.forEach((entry) => { entry.status = '已确认' }); p.content.reviewStages = ['有权机构批准']; p.conversation.standardsVersion = 2
  assert.throws(() => submitPlan(p, p.creator), /后续审计/)
  p.content.followUp = '季度检查'; p.content.resourceStrategy = '财务专业人员'; p.content.items[0].resourceNeeds = '财务审计人员'
  assert.throws(() => submitPlan(p, p.creator), /批准主体/)
  p.content.approvalAuthority = '董事会'; p.content.governanceBasis = '内部审计制度第五条'
  assert.equal(submitPlan(p, p.creator).status, '审批中')
})
console.log(`${checks} conversation integrity checks passed.`)
