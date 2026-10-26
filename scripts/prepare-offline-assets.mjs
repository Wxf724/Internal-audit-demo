import fs from 'node:fs'
import path from 'node:path'
import {createHash} from 'node:crypto'
const root=process.cwd(),publicDir=path.join(root,'public'),vendor=path.join(publicDir,'vendor')
fs.mkdirSync(vendor,{recursive:true})
const records=[]
async function get(url){
 for(let n=0;n<3;n++){
  try{const response=await fetch(url,{headers:{'User-Agent':'Mozilla/5.0 Chrome/131.0.0.0 Safari/537.36'},signal:AbortSignal.timeout(45000)});if(!response.ok)throw new Error('HTTP '+response.status);return Buffer.from(await response.arrayBuffer())}catch(e){if(n===2)throw new Error('Cannot preserve asset '+url+': '+e.message)}
 }
}
async function save(url,filename){const bytes=await get(url);fs.mkdirSync(path.dirname(filename),{recursive:true});fs.writeFileSync(filename,bytes);records.push({source:url,file:path.relative(publicDir,filename).replaceAll('\\','/'),bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});return bytes}
const references=[
 ['https://static.readdy.ai/image/ef95b83776c013c4a1c3d783d82ec693/790fa4d64762eea3565205595e6b025d.png','images/original-brand.png'],
 ['https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=900&q=80','images/news-meeting.jpg'],
 ['https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=900&q=80','images/news-experience.jpg'],
 ['https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=900&q=80','images/news-training.jpg'],
]
await Promise.all(references.map(([url,file])=>save(url,path.join(publicDir,file))))
const fontsDir=path.join(vendor,'noto-sans-sc');fs.mkdirSync(fontsDir,{recursive:true})
let fontCss=(await get('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;600;700&display=swap')).toString('utf8')
const urls=[...new Set([...fontCss.matchAll(/url\((https:[^)]+)\)/g)].map(m=>m[1]))]
let cursor=0
await Promise.all(Array.from({length:8},async()=>{while(cursor<urls.length){const url=urls[cursor++];await save(url,path.join(fontsDir,path.basename(new URL(url).pathname)))}}))
for(const url of urls)fontCss=fontCss.split(url).join('./'+path.basename(new URL(url).pathname))
fs.writeFileSync(path.join(fontsDir,'fonts.css'),fontCss)
await save('https://raw.githubusercontent.com/google/fonts/main/ofl/notosanssc/OFL.txt',path.join(fontsDir,'OFL.txt'))
const oldVendor=path.join(path.dirname(root),'.delivery-20261026-mvoneqga/InternalAudit-source/public/vendor')
for(const name of ['remixicon','fontawesome','THIRD_PARTY_NOTICES.txt'])fs.cpSync(path.join(oldVendor,name),path.join(vendor,name),{recursive:true})
for(const name of ['index.html','src/pages/icm/pages/Workplace.tsx','src/pages/login/components/LoginCard.tsx']){
 const file=path.join(root,name);let content=fs.readFileSync(file,'utf8')
 for(const [url,relative]of references)content=content.split(url).join('/'+relative)
 if(name==='index.html'){
  content=content.replace(/\s*<link[^>]*rel="preconnect"[^>]*>/g,'')
  content=content.replace('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;600;700&display=swap','/vendor/noto-sans-sc/fonts.css')
  content=content.replace('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css','/vendor/fontawesome/icons.css').replace('https://cdnjs.cloudflare.com/ajax/libs/remixicon/4.5.0/remixicon.min.css','/vendor/remixicon/icons.css')
  content=content.replace('type="image/svg+xml"','type="image/png"')
 }
 fs.writeFileSync(file,content)
}
fs.writeFileSync(path.join(publicDir,'asset-manifest.json'),JSON.stringify({note:'Original linked image bytes preserved without editing; fonts stored locally with their license.',assets:records},null,2))
console.log(JSON.stringify({images:references.length,fontFiles:urls.length,totalBytes:records.reduce((n,r)=>n+r.bytes,0)}))
