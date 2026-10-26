import assert from 'node:assert/strict'
const {chromium}=await import('file:///D:/vscode/node/node_global/node_modules/@playwright/cli/node_modules/playwright/index.mjs')
const browser=await chromium.launch({channel:'msedge',headless:true})
const context=await browser.newContext({viewport:{width:1440,height:960}})
await context.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort())
const page=await context.newPage(), errors=[];page.on('pageerror',e=>errors.push(e.message))
const root='http://127.0.0.1:3100'
const click=name=>page.getByRole('button',{name,exact:true}).filter({visible:true}).last().click()
const state=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('internal-audit-demo-v2-projects')).state)
try {
 await page.goto(root+'/projects?view=projects')
 const fixture=await page.evaluate(async()=>{
  const {useAuditProjectStore:s}=await import('/src/pages/icm/store/auditProjectStore.ts')
  const {useAnnualPlanStore:a}=await import('/src/pages/icm/store/annualPlanStore.ts')
  const input={name:'删除验收草稿项目',type:'财务审计',subject:'测试单位',period:'2026年',plannedImplementation:'2026年11月',owner:'郑刚',risk:'测试',scope:'删除测试',managementYear:2026}
  const id=s.getState().createProject(input), second=s.getState().createProject({...input,name:'详情删除验收项目'}), protectedId=s.getState().createProject({...input,name:'已有业务保护项目'})
  s.getState().updateProject(protectedId,{preparation:{objective:'范围',procedures:'方法',members:'成员',reviewer:'复核',notice:'安排',status:'待审核',version:1}})
  const plan=a.getState().plans.find(p=>p.content.items.length)
  a.setState(st=>({plans:st.plans.map(p=>p.id===plan.id?{...p,content:{...p.content,items:p.content.items.map((i,n)=>n===0?{...i,projectId:id}:i)}}:p)}))
  return {id,second,protectedId,planId:plan.id,itemName:plan.content.items[0].name}
 })
 await page.reload();await page.getByRole('textbox',{name:'搜索项目'}).fill('删除验收草稿项目')
 await click('删除项目');await page.getByRole('dialog').waitFor();await click('取消')
 assert.ok((await state()).projects.some(p=>p.id===fixture.id))
 await click('删除项目');await page.screenshot({path:'.playwright-cli/project-delete-confirm.png',animations:'disabled'});await click('确认删除')
 assert.equal((await state()).projects.some(p=>p.id===fixture.id),false)
 assert.ok((await state()).deletedProjects.some(r=>r.project.id===fixture.id && r.deletedBy))
 await page.reload();assert.equal((await state()).projects.some(p=>p.id===fixture.id),false)
 const plan=await page.evaluate(async id=>{const {useAnnualPlanStore:a}=await import('/src/pages/icm/store/annualPlanStore.ts');await a.persist.rehydrate();return a.getState().plans.find(p=>p.id===id)},fixture.planId)
 assert.equal(plan.content.items[0].name,fixture.itemName);assert.equal(plan.content.items[0].projectId,undefined)
 await page.goto(root+'/projects/'+fixture.id);await page.getByText('未找到该项目，请返回项目台账重新选择。',{exact:true}).waitFor()
 await page.goto(root+'/projects/'+fixture.second);await click('删除项目');await click('确认删除');await page.waitForURL('**/projects?view=projects')
 assert.equal((await state()).projects.some(p=>p.id===fixture.second),false)
 await page.goto(root+'/projects/'+fixture.protectedId);await click('删除项目')
 await page.getByText('存在方案批准版本或审核记录。',{exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:'确认删除'}).count(),0)
 await click('关闭');assert.ok((await state()).projects.some(p=>p.id===fixture.protectedId))
 // Exercise seed reconciliation separately in this isolated browser's storage.
 const seedId=await page.evaluate(async()=>{const {auditProjects}=await import('/src/pages/icm/data/auditProjects.ts');const key='internal-audit-demo-v2-projects',data=JSON.parse(localStorage.getItem(key)),p=auditProjects[0];data.state.projects=data.state.projects.filter(r=>r.id!==p.id);data.state.deletedProjects.push({project:p,deletedBy:'验收',deletedAt:new Date().toISOString()});localStorage.setItem(key,JSON.stringify(data));return p.id})
 await page.reload();assert.equal((await state()).projects.some(p=>p.id===seedId),false)
 await page.goto(root+'/projects?view=projects');await page.setViewportSize({width:700,height:960});await page.screenshot({path:'.playwright-cli/project-delete-700.png'})
 assert.deepEqual(errors,[])
 console.log('PASS: 列表/详情删除、取消、持久化、防种子复活、计划项保留、已办业务保护、删除后路由。')
}catch(e){await page.screenshot({path:'.playwright-cli/project-delete-failure.png'});throw e}finally{await browser.close()}
