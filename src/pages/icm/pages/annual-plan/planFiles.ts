export interface FilePassage { locator: string; text: string }
export interface FileTable { name: string; rows: string[][] }
export interface StoredPlanFile { id: string; name: string; blob: Blob; passages: FilePassage[]; tables?: FileTable[]; at: string }

const openDb = () => new Promise<IDBDatabase>((resolve, reject) => {
  const request = indexedDB.open('audit-plan-files', 1)
  request.onupgradeneeded = () => { request.result.createObjectStore('files', { keyPath: 'id' }) }
  request.onsuccess = () => resolve(request.result)
  request.onerror = () => reject(new Error('附件存储不可用，请检查浏览器存储空间。'))
})
export async function savePlanFile(file: StoredPlanFile) {
  const db = await openDb()
  try { await new Promise<void>((resolve, reject) => { const tx = db.transaction('files', 'readwrite'); tx.objectStore('files').put(file); tx.oncomplete = () => resolve(); tx.onerror = () => reject(new Error('附件保存失败，请检查存储空间。')); tx.onabort = () => reject(new Error('附件保存已中断。')) }) } finally { db.close() }
}
export async function loadPlanFile(id: string) {
  const db = await openDb()
  try { return await new Promise<StoredPlanFile>((resolve, reject) => { const request = db.transaction('files').objectStore('files').get(id); request.onsuccess = () => request.result ? resolve(request.result) : reject(new Error('原文件在当前浏览器中不可用，请重新上传原文件。')); request.onerror = () => reject(new Error('原文件读取失败。')) }) } finally { db.close() }
}
export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob), anchor = document.createElement('a')
  anchor.href = url; anchor.download = name; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 30000)
}

export async function parsePlanFile(file: File, progress: (text: string) => void): Promise<{ passages: FilePassage[]; tables: FileTable[] }> {
  if (file.size > 20 * 1024 * 1024) throw new Error('单个文件限 20 MB，请拆分后上传。')
  const ext = file.name.split('.').at(-1)?.toLowerCase()
  progress('正在解析')
  if (['xlsx', 'xls', 'csv'].includes(ext ?? '')) {
    const xlsx = await import('xlsx')
    const workbook = xlsx.read(await file.arrayBuffer(), { type: 'array', cellDates: true })
    const tables = workbook.SheetNames.map((name) => ({ name, rows: xlsx.utils.sheet_to_json<string[]>(workbook.Sheets[name], { header: 1, raw: false, defval: '', blankrows: true }) }))
    if (tables.reduce((sum, t) => sum + t.rows.length, 0) > 10000) throw new Error('表格超过 10,000 行，请拆分相关范围后上传。')
    return { tables, passages: tables.flatMap((table) => table.rows.map((row, i) => ({ locator: `${table.name} · 第 ${i + 1} 行`, text: row.join(' | ') }))).filter((p) => p.text.trim()) }
  }
  if (ext === 'docx') {
    const mammoth = await import('mammoth')
    const { value } = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })
    return { tables: [], passages: value.split(/\n\s*\n/).filter((t) => t.trim()).map((text, i) => ({ locator: `第 ${i + 1} 段`, text })) }
  }
  let worker: Awaited<ReturnType<typeof import('tesseract.js')['createWorker']>> | undefined
  const recognize = async (image: Blob | HTMLCanvasElement) => {
    progress('正在准备文字识别')
    if (!worker) {
      let timedOut = false
      const pending = (await import('tesseract.js')).createWorker(['chi_sim', 'eng'])
      void pending.then((created) => { if (timedOut) void created.terminate() }).catch(() => {})
      let timer: ReturnType<typeof setTimeout> | undefined
      try { worker = await Promise.race([pending, new Promise<never>((_, reject) => { timer = setTimeout(() => { timedOut = true; reject(new Error('文字识别准备超时，请重试或手动核录。')) }, 45000) })]) } finally { clearTimeout(timer) }
    }
    progress('正在识别文字')
    let timer: ReturnType<typeof setTimeout> | undefined
    try { return (await Promise.race([worker.recognize(image), new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('文字识别超时，请拆分图片或手动核录。')), 60000) })])).data.text } finally { clearTimeout(timer) }
  }
  try {
    if (ext === 'pdf') {
      const pdfjs = await import('pdfjs-dist')
      pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).href
      const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer(), isEvalSupported: false }).promise
      try {
        if (pdf.numPages > 150) throw new Error('PDF 超过 150 页，请按相关章节拆分。')
        const passages: FilePassage[] = []
        for (let i = 1; i <= pdf.numPages; i++) {
          progress(`正在解析第 ${i} / ${pdf.numPages} 页`)
          const page = await pdf.getPage(i), content = await page.getTextContent()
          let text = content.items.map((entry) => 'str' in entry ? entry.str : '').join(' ')
          if (!text.trim()) {
            const viewport = page.getViewport({ scale: 1.5 }), canvas = document.createElement('canvas')
            canvas.width = viewport.width; canvas.height = viewport.height
            await page.render({ canvas, viewport }).promise
            text = await recognize(canvas)
          }
          passages.push({ locator: `第 ${i} 页`, text: text.trim() })
        }
        return { passages, tables: [] }
      } finally { await pdf.destroy() }
    }
    if (['png', 'jpg', 'jpeg', 'webp'].includes(ext ?? '')) return { passages: [{ locator: '图片识别结果', text: await recognize(file) }], tables: [] }
    if (['txt', 'md'].includes(ext ?? '')) return { passages: (await file.text()).split(/\r?\n/).map((text, i) => ({ locator: `第 ${i + 1} 行`, text })).filter((p) => p.text.trim()), tables: [] }
    throw new Error('支持 Excel、CSV、DOCX、PDF、图片及文本文件；旧版 DOC 请另存为 DOCX。')
  } finally { await worker?.terminate() }
}
