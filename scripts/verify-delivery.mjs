import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import {spawn,spawnSync} from 'node:child_process'
const work=process.argv[2],root=process.cwd()
if(!work) throw new Error('Pass delivery work directory')
const unpacked=path.join(work,'extracted-test'),preview=path.join(unpacked,'InternalAudit-preview'),source=path.join(unpacked,'InternalAudit-source')
let output=''
const server=spawn('powershell.exe',['-NoLogo','-NoProfile','-ExecutionPolicy','Bypass','-File',path.join(preview,'preview-server.ps1'),'-NoBrowser','-Port','4186'],{windowsHide:true})
server.stdout.on('data',b=>output+=b);server.stderr.on('data',b=>output+=b)
const base='http://127.0.0.1:4186'
const {chromium}=await import('file:///D:/vscode/node/node_global/node_modules/@playwright/cli/node_modules/playwright/index.mjs')
let browser
try{
 for(let i=0;i<100;i++){
  try{const r=await fetch(base+'/__preview_health',{signal:AbortSignal.timeout(500)});if(r.ok)break}catch{}
  if(server.exitCode!==null)throw new Error(output)
  await new Promise(r=>setTimeout(r,100))
 }
 assert.equal((await (await fetch(base+'/__preview_health')).json()).status,'ok')
 assert.equal((await fetch(base+'/api/test')).status,503)
 assert.equal((await fetch(base+'/%2e%2e%5cREADME.txt')).status,403)
 assert.equal((await fetch(base+'/missing.js')).status,404)
 const head=await fetch(base+'/index.html',{method:'HEAD'});assert.equal(head.status,200);assert.equal(await head.text(),'')
 browser=await chromium.launch({channel:'msedge',headless:true})
 const context=await browser.newContext({viewport:{width:1440,height:960}}),external=[],errors=[],failed=[]
 await context.route('**/*',r=>{const url=new URL(r.request().url());if(url.hostname!=='127.0.0.1'){external.push(url.origin);return r.abort()}return r.continue()})
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)failed.push(r.status()+' '+r.url())})
 for(const route of ['/workplace','/projects?view=projects','/plan-workbench','/audit-resources','/rectify','/cockpit']){
  await page.goto(base+route);await page.locator('main').waitFor();await page.locator('main').getByText(/./).first().waitFor()
  assert.ok((await page.locator('main').innerText()).length>30,route)
 }
 await page.goto(base+'/projects?view=projects');await page.locator('.project-table-title').first().click();await page.waitForURL(/\/projects\/[^/?]+/)
 const projectPath=new URL(page.url()).pathname
 await page.goto(base+projectPath+'?tab=preparation');await page.getByRole('navigation',{name:'方案办理步骤'}).waitFor();await page.reload();await page.getByRole('navigation',{name:'方案办理步骤'}).waitFor()
 await page.screenshot({path:path.join(work,'preview-project.png'),animations:'disabled'})
 await page.goto(base+'/workplace');await page.waitForFunction(()=>document.querySelector('main')?.textContent.length>50);await page.evaluate(()=>document.fonts.ready);await page.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0));await page.screenshot({path:path.join(work,'preview-home.png'),animations:'disabled'})
 assert.deepEqual(external,[],'Unexpected external page dependency');assert.deepEqual(errors,[]);assert.deepEqual(failed,[])
 // Build directly from the unpacked source, reusing installed dependencies only for validation.
 fs.symlinkSync(path.join(root,'node_modules'),path.join(source,'node_modules'),'junction')
 try{
  const build=spawnSync(process.execPath,[path.join(root,'node_modules/vite/bin/vite.js'),'build'],{cwd:source,encoding:'utf8',maxBuffer:12*1024*1024})
  fs.writeFileSync(path.join(work,'extracted-source-build.log'),build.stdout+'\n'+build.stderr)
  assert.equal(build.status,0,'Extracted source build failed')
 }finally{fs.unlinkSync(path.join(source,'node_modules'))}
 fs.writeFileSync(path.join(work,'verification.txt'),'PASS: Windows PowerShell 5.1 preview; local-only server; HEAD/MIME/fallback routes; homepage/projects/plans/resources/rectification/cockpit; project deep-link refresh; no external page dependencies; no page errors; extracted source production build. Dependencies reused for build; npm ci lock check performed separately.\n')
 console.log('PASS: extracted preview local server, six main routes, project refresh, offline page dependencies and extracted source build.')
}catch(e){console.error(output);throw e}finally{if(browser)await browser.close();server.kill()}
