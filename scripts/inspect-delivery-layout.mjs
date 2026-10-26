import {spawn} from 'node:child_process'
import fs from 'node:fs'
const root=process.cwd(), work='D:/飞书/内控检查系统/内审系统/InternalAudit/.delivery-20261026-mvoneqga'
const server=spawn('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',work+'/InternalAudit-preview/preview-server.ps1','-NoBrowser','-Port','4186'],{windowsHide:true})
const {chromium}=await import('file:///D:/vscode/node/node_global/node_modules/@playwright/cli/node_modules/playwright/index.mjs')
const browser=await chromium.launch({channel:'msedge',headless:true})
try {
 for(let i=0;i<50;i++){try{if((await fetch('http://127.0.0.1:4186/__preview_health')).ok)break}catch{}await new Promise(r=>setTimeout(r,100))}
 const results=[]
 for(const [kind,base] of [['dev','http://127.0.0.1:3100'],['package','http://127.0.0.1:4186']]){
  const context=await browser.newContext({viewport:{width:1920,height:1080}});await context.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort())
  const page=await context.newPage()
  for(const route of ['/workplace','/plan-workbench','/projects','/rectify','/audit-resources','/cockpit']){
   await page.goto(base+route);await page.locator('main').waitFor();await page.waitForFunction(()=>document.querySelector('main')?.textContent.length>50)
   const info=await page.evaluate(()=>({width:innerWidth,root:getComputedStyle(document.documentElement).fontSize,body:document.body.getBoundingClientRect().width,items:[...document.querySelectorAll('main,.icm-page,.rect-compact,.audit-analysis,.planning-workspace')].map(el=>({selector:el.className,width:el.getBoundingClientRect().width,x:el.getBoundingClientRect().x,maxWidth:getComputedStyle(el).maxWidth,zoom:getComputedStyle(el).zoom,display:getComputedStyle(el).display})),images:[...document.images].map(i=>({src:i.getAttribute('src'),width:i.naturalWidth}))}))
   results.push({kind,route,...info});await page.screenshot({path:root+'/.playwright-cli/compare-'+kind+'-'+route.slice(1)+'.png',animations:'disabled'})
  }
  await context.close()
 }
 fs.writeFileSync(root+'/.playwright-cli/delivery-layout-compare.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results))
}finally{await browser.close();server.kill()}
