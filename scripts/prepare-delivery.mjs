import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const root = process.cwd()
const stamp = '20261026-' + Date.now().toString(36)
const work = path.join(path.dirname(root), '.delivery-' + stamp)
const source = path.join(work, 'InternalAudit-source')
const preview = path.join(work, 'InternalAudit-preview')
fs.mkdirSync(source, { recursive: true }); fs.mkdirSync(preview, { recursive: true })
const excluded = /^(node_modules|\.git|\.playwright-cli|private-config|dist-saas|\.env(?:\..*)?)$|\.(?:pem|key|dpapi|log|zip)$/i
const copy = (from, to) => {
  if (excluded.test(path.basename(from))) return
  const stat = fs.lstatSync(from)
  if (stat.isSymbolicLink()) throw new Error('Unexpected source symlink: ' + from)
  if (stat.isDirectory()) { fs.mkdirSync(to, {recursive:true}); for (const name of fs.readdirSync(from)) copy(path.join(from,name),path.join(to,name)) }
  else fs.copyFileSync(from,to)
}
for (const name of ['src','public','eslint-rules','package.json','package-lock.json','vite.config.ts','vite-env.d.ts','tsconfig.json','tsconfig.app.json','tsconfig.node.json','tailwind.config.ts','postcss.config.ts','eslint.config.ts','auto-imports.d.ts','.gitignore','.prettierrc.json','.prettierignore']) {
  if(fs.existsSync(path.join(root,name))) copy(path.join(root,name),path.join(source,name))
}
fs.mkdirSync(path.join(source,'scripts'),{recursive:true})
copy(path.join(root,'scripts/vibecoding-guard.mjs'),path.join(source,'scripts/vibecoding-guard.mjs'))
const write = (base, name, value) => fs.writeFileSync(path.join(base,name),value,'utf8')
const vendor = path.join(source,'public/vendor')
for(const name of ['public/images/original-brand.png','public/vendor/noto-sans-sc/fonts.css']) {
  if(!fs.existsSync(path.join(source,name))) throw new Error('Missing preserved asset: '+name)
}
write(source,'index.html',fs.readFileSync(path.join(root,'index.html'),'utf8').replace('<title></title>','<title>内部审计管理平台 · 演示版</title>'))
let config=fs.readFileSync(path.join(source,'vite.config.ts'),'utf8').replace('sourcemap: true','sourcemap: false').replace("host: '0.0.0.0'","host: '127.0.0.1'")
config=config.replace("proxy: {\n", "proxy: proxyTarget ? {\n").replace("proxy: {\r\n", "proxy: proxyTarget ? {\r\n")
config=config.replace(/(secure: false,[\s\S]*?\},\s*)\},/, '$1} : undefined,')
write(source,'vite.config.ts',config)
write(source,'.env.example','# Optional backend configuration. No external AI service enabled.\nBASE_PATH=/\n# VITE_API_BASE_URL=http://127.0.0.1:8080\n')
write(source,'.nvmrc','24\n')
write(source,'启动开发.bat','@echo off\r\ncd /d "%~dp0"\r\nwhere node >nul 2>nul\r\nif errorlevel 1 (echo Please install Node.js 24 first. & pause & exit /b 1)\r\nif not exist node_modules (call npm ci & if errorlevel 1 (pause & exit /b 1))\r\ncall npm run dev -- --host 127.0.0.1 --open\r\npause\r\n')
write(source,'README.txt',`内部审计系统 · 可修改源码包（2026-10-26）

1. 解压到普通目录。安装 Node.js 24（含 npm），然后双击“启动开发.bat”。
   第一次会自动执行 npm ci，需要网络下载依赖；安装完成后启动开发服务并打开浏览器。
   也可以在目录内手动执行：npm ci，然后 npm run dev -- --host 127.0.0.1 --open。
2. 修改 src 中的代码，页面自动刷新。正式构建：npm run build；结果在 dist-saas。
   构建后本机检查：npm run preview -- --host 127.0.0.1 --open。
3. 保留 package-lock.json，确保接收方安装与此项目一致的依赖。不要把 node_modules 发给别人。
4. 此包不包含原电脑的 .env、凭据、私有配置、浏览器存储、node_modules、构建产物、测试截图或 Git 历史。
   .env.example 仅示例，默认本地演示无需后台。真实 AI 服务未启用。
5. 页面初始数据来自源码内置演示记录，不是原电脑浏览器中最近新增的数据。每台电脑/浏览器独立存储。
6. 分发副本关闭 sourcemap。原品牌图片、新闻图片、原字体与图标均以本地资源随包提供，没有替换为示意图。
   页面宽度随可用空间自适应；源码开发版与预览包共用同一套布局和资源。
7. 常规业务页面与本地 AI 演示可离线运行。扫描件 OCR 首次使用需联网下载识别引擎/语言包，未放入轻量包。
   第三方图标授权说明在 public/vendor；项目 npm 依赖的授权文件在安装后的 node_modules 中。
8. 已完成本包构建和浏览器冒烟验证。原工程的 type-check 存量问题不在本次打包范围内。
9. 本包使用 Node.js 24 验证，建议接收方按此版本安装。
`)
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)])
for(const file of walk(source)){
  if(/\.(ts|tsx|js|jsx|json|txt|html|css|mjs)$/.test(file)){
    const content=fs.readFileSync(file,'utf8')
    if(/sk-[A-Za-z0-9_-]{20,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(content)) throw new Error('Secret-like material detected; do not distribute: '+path.relative(source,file))
  }
}
fs.symlinkSync(path.join(root,'node_modules'),path.join(source,'node_modules'),'junction')
try {
 const build=spawnSync(process.execPath,[path.join(root,'node_modules/vite/bin/vite.js'),'build'],{cwd:source,encoding:'utf8',maxBuffer:12*1024*1024})
 fs.writeFileSync(path.join(work,'build.log'),build.stdout+'\n'+build.stderr)
 if(build.status!==0) throw new Error('Build failed; inspect staging build.log')
 fs.renameSync(path.join(source,'dist-saas'),path.join(preview,'site'))
} finally { fs.unlinkSync(path.join(source,'node_modules')) }
write(preview,'启动预览.bat','@echo off\r\ncd /d "%~dp0"\r\npowershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0preview-server.ps1"\r\nif errorlevel 1 pause\r\n')
write(preview,'使用说明.txt',`内部审计系统 · Windows 免安装预览包（2026-10-26）

一、先完整解压，再双击“启动预览.bat”。不用安装 Node.js、Python 或 npm 依赖，不需要管理员权限。
二、浏览器将打开 http://127.0.0.1:4180/ 。保持启动窗口开启；预览结束关闭窗口即可停止服务。
三、不能直接双击 site/index.html；网站必须通过本包启动的本地服务打开。子页面地址可以刷新。
四、常规页面、演示数据及明确标注的本地 AI 演示可离线预览。真实 AI 服务未启用。
    扫描件 OCR 首次使用需联网下载识别引擎/语言模型，未放入轻量包；不会因此影响普通页面浏览。
五、数据保存在接收方浏览器中，各电脑不共享；包内只有源码自带演示数据，不含原电脑浏览器存储或附件。
    清除浏览器站点数据会清除本地修改；请勿把此 demo 当作正式数据备份系统。
六、服务只监听本机 127.0.0.1，不对局域网或公网开放。若 4180 端口占用，先关闭其他预览窗口。
    如必须换端口，在本目录打开终端执行：powershell -NoProfile -ExecutionPolicy Bypass -File .\\preview-server.ps1 -Port 4181
    不同端口的浏览器数据相互独立。如企业策略禁止 PowerShell，请由 IT 将 site 文件部署到内部静态网站。
七、此包针对 Windows 10/11 的 Windows PowerShell 5.1；macOS/Linux 请使用源码包或由开发人员部署 site。
八、页面保留原图片和原字体，均随包提供以支持离线展示；第三方授权文件见 site/vendor。
九、R2 修复版：移除业务页面 1680px 最大宽度限制；在 1440/1920/2560 宽度下核对开发版与预览版一致。
`)
fs.copyFileSync(path.join(root,'scripts/preview-server-template.ps1'),path.join(preview,'preview-server.ps1'))
write(work,'package-info.json',JSON.stringify({root,work,source,preview,stamp},null,2))
console.log(JSON.stringify({work,source,preview,sourceFiles:walk(source).length,previewFiles:walk(preview).length}))
