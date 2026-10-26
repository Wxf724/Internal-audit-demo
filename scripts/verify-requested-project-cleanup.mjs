import assert from 'node:assert/strict'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const browser = await chromium.launch({ channel: 'msedge', headless: true })
const context = await browser.newContext({ viewport: { width: 1366, height: 768 } })
await context.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort())
const page = await context.newPage(), errors = []
page.on('pageerror', e => errors.push(e.message))
try {
  await page.goto('http://127.0.0.1:4176/cockpit?year=2026')
  await page.getByRole('heading', { name: '统计分析', exact: true }).waitFor()
  const before = await page.evaluate(async () => {
    const { useAuditProjectStore } = await import('/src/pages/icm/store/auditProjectStore.ts')
    const { useAnnualPlanStore } = await import('/src/pages/icm/store/annualPlanStore.ts')
    const { useWorkflowStore } = await import('/src/pages/icm/store/workflowStore.ts')
    const { useAgentRuntimeStore } = await import('/src/pages/icm/agents/store.ts')
    const id = 'AUD-2026-8971CF5D'
    const base = useAuditProjectStore.getState().projects.find(p => p.stage === '实施中')
    const project = { ...structuredClone(base), id, name: '1', subject: '1', taskIds: [], preparation: { objective: '测试', procedures: '测试程序', members: '郑刚', reviewer: '郑刚', notice: '测试通知', status: '已批准', confirmedAt: '2026-10-24 10:00:00' }, executionLinks: [1, 2, 3].map(n => ({ id: `test-link-${n}`, annualPlanId: 'AP-2026-001', itemId: `test-item-${n}`, year: 2026, version: 1, itemName: `计划${n}`, scope: '测试', deliverable: '测试', owner: '郑刚', linkedAt: '2026-10-24', linkedBy: '郑刚' })) }
    const other = { ...structuredClone(project), id: 'AUD-KEEP-TEST', name: '另一个实施中项目' }
    const projects = [...useAuditProjectStore.getState().projects, project, other]
    const plans = structuredClone(useAnnualPlanStore.getState().plans)
    const plan = plans.find(p => p.year === 2026)
    plan.content.items.slice(0, 3).forEach(item => item.projectId = id)
    plan.approved.content = structuredClone(plan.content)
    const audits = [...useWorkflowStore.getState().audits, { ...useWorkflowStore.getState().audits[0], id: 'AUDIT-TEST-KEEP', projectId: id, status: '已通过' }]
    const runs = [...useAgentRuntimeStore.getState().runs, { ...useAgentRuntimeStore.getState().runs[0], id: 'RUN-TEST-KEEP', projectId: id, projectName: '1' }]
    localStorage.setItem('internal-audit-demo-v2-projects', JSON.stringify({ version: 2, state: { projects, deletedProjects: [] } }))
    localStorage.setItem('internal-audit-annual-plans-v1', JSON.stringify({ version: 0, state: { plans, workspaceModes: { 'AP-2027-001': true } } }))
    localStorage.setItem('internal-audit-workflow-v2', JSON.stringify({ version: 1, state: { ...useWorkflowStore.getState(), audits } }))
    localStorage.setItem('icm-audit-agent-runtime-v1', JSON.stringify({ version: 0, state: { runs, sequence: 10 } }))
    return { project, other, approved: plan.approved, submissions: plan.submissions, audits, runs, count: projects.length }
  })
  await page.reload(); await page.getByRole('heading', { name: '统计分析', exact: true }).waitFor()
  const read = () => page.evaluate(() => Object.fromEntries(['internal-audit-demo-v2-projects', 'internal-audit-annual-plans-v1', 'internal-audit-workflow-v2', 'icm-audit-agent-runtime-v1'].map(key => [key, JSON.parse(localStorage.getItem(key))])))
  const after = await read(), projects = after['internal-audit-demo-v2-projects']
  assert.equal(projects.version, 3)
  assert.equal(projects.state.projects.length, before.count - 1)
  assert(!projects.state.projects.some(p => p.id === before.project.id))
  assert.deepEqual(projects.state.projects.find(p => p.id === before.other.id), before.other)
  assert.deepEqual(projects.state.deletedProjects[0].project, before.project)
  const annual = after['internal-audit-annual-plans-v1'].state.plans.find(p => p.year === 2026)
  assert(!annual.content.items.some(item => item.projectId === before.project.id))
  assert.deepEqual(annual.approved, before.approved)
  assert.deepEqual(annual.submissions, before.submissions)
  assert.deepEqual(after['internal-audit-workflow-v2'].state.audits, before.audits)
  assert.deepEqual(after['icm-audit-agent-runtime-v1'].state.runs, before.runs)
  const guarded = await page.evaluate(async () => {
    const { useAuditProjectStore } = await import('/src/pages/icm/store/auditProjectStore.ts')
    try { useAuditProjectStore.getState().removeProject('AUD-KEEP-TEST', '测试'); return false } catch { return true }
  })
  assert.equal(guarded, true)
  await page.reload(); await page.getByRole('heading', { name: '统计分析', exact: true }).waitFor()
  assert.deepEqual((await read())['internal-audit-demo-v2-projects'], projects)
  assert.deepEqual(errors, [])
  console.log('PASS exact-ID removal, complete recovery snapshot, three live pointers detached, approvals and agent history preserved, unrelated project unchanged, repeat reload idempotent, normal deletion guards retained')
} finally { await browser.close() }
