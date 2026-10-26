import assert from 'node:assert/strict'
const {chromium}=await import('file:///D:/vscode/node/node_global/node_modules/@playwright/cli/node_modules/playwright/index.mjs')
const browser=await chromium.launch({channel:'msedge',headless:true})
const context=await browser.newContext({viewport:{width:1440,height:960}})
await context.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort())
const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message))
try{
 await page.goto('http://127.0.0.1:3100/projects?view=items')
 await page.getByRole('combobox',{name:'办理范围',exact:true}).waitFor()
 await page.getByRole('combobox',{name:'办理范围',exact:true}).selectOption('mine')
 assert.match(page.url(),/scope=mine/)
 await page.screenshot({path:'.playwright-cli/matter-dropdown-v2.png'})
 for(const tab of ['overview','preparation','execution','findings','report','rectification','archive']){
  await page.goto('http://127.0.0.1:3100/projects/AUD-PL-2026-001?tab='+tab)
  await page.locator('.project-detail').waitFor()
  assert.equal(await page.locator('h1').count(),1,tab+' single heading')
  await page.screenshot({path:'.playwright-cli/project-v2-'+tab+'.png',fullPage:true})
 }
 assert.deepEqual(errors,[])
 console.log('PASS dropdown and seven project tabs; no runtime errors')
}finally{await browser.close()}

