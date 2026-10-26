import assert from 'node:assert/strict'
import {spawn} from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import {createHash} from 'node:crypto'
const root=process.cwd(),work=process.argv[2]
const preview=path.join(work,'extracted-test/InternalAudit-preview')
const server=spawn('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',path.join(preview,'preview-server.ps1'),'-NoBrowser','-Port','4186'],{windowsHide:true})
const {chromium}=await import('file:///D:/vscode/node/node_global/node_modules/@playwright/cli/node_modules/playwright/index.mjs')
const browser=await chromium.launch({channel:'msedge',headless:true})
try {
 for(let i=0;i<50;i++){try{if((await fetch('http://127.0.0.1:4186/__preview_health')).ok)break}catch{}await new Promise(r=>setTimeout(r,100))}
 const results=[],errors=[],external=[]
 for(const [kind,base] of [['dev','http://127.0.0.1:3100'],['package','http://127.0.0.1:4186']]){
  const context=await browser.newContext({viewport:{width:1920,height:1080}})
  await context.route('**/*',r=>{if(new URL(r.request().url()).hostname==='127.0.0.1')return r.continue();external.push(r.request().url());return r.abort()})
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message))
  for(const width of [1440,1920,2560,700]){
   await page.setViewportSize({width,height:1080})
   for(const route of ['/workplace','/plan-workbench','/projects','/rectify','/audit-resources','/cockpit']){
    await page.goto(base+route);await page.waitForFunction(()=>document.querySelector('main')?.textContent.length>50)
    await page.evaluate(()=>document.fonts.ready)
    await page.waitForFunction(()=>[...document.images].every(i=>i.complete && i.naturalWidth>0))
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))))
    const info=await page.evaluate(()=>({viewport:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth+1,items:[...document.querySelectorAll('main,.icm-page,.audit-analysis')].map(el=>{const rect=el.getBoundingClientRect(),parent=el.parentElement,s=getComputedStyle(parent);return{selector:el.className,width:rect.width,x:rect.x,parentWidth:parent.clientWidth-parseFloat(s.paddingLeft)-parseFloat(s.paddingRight),maxWidth:getComputedStyle(el).maxWidth}}),images:[...document.images].map(i=>({src:i.getAttribute('src'),width:i.naturalWidth}))}))
    assert.equal(info.overflow,false,kind+route+width+' horizontal overflow')
    for(const item of info.items.filter(i=>i.selector==='icm-page'))assert.ok(Math.abs(item.width-item.parentWidth)<2,kind+route+width+' page not filling parent: '+JSON.stringify(item))
    results.push({kind,route,...info})
    if([1920,700].includes(width))await page.screenshot({path:path.join(work,kind+'-'+route.slice(1)+'-'+width+'.png'),animations:'disabled'})
   }
  }
  await context.close()
 }
 for(const record of results.filter(r=>r.kind==='dev')){
  const other=results.find(r=>r.kind==='package'&&r.route===record.route&&r.viewport===record.viewport)
  assert.deepEqual(other.items,record.items,'Development/package geometry differs '+record.route+' '+record.viewport)
  assert.deepEqual(other.images,record.images,'Development/package images differ')
 }
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'public/asset-manifest.json'),'utf8'))
 for(const asset of manifest.assets){const bytes=fs.readFileSync(path.join(preview,'site',asset.file));assert.equal(createHash('sha256').update(bytes).digest('hex'),asset.sha256,asset.file)}
 assert.deepEqual(errors,[]);assert.deepEqual(external,[])
 fs.writeFileSync(path.join(work,'layout-verification.json'),JSON.stringify(results,null,2))
 console.log('PASS: 48 dev/package route-width combinations; 1440/1920/2560/700; exact matching geometry; full-width pages; original image hashes; local fonts; no external requests or browser errors.')
}finally{await browser.close();server.kill()}
