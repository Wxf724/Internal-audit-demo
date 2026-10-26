import { workId, type WorkFile } from '../data/projectWork'
function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('internal-audit-project-files', 1)
    request.onupgradeneeded = () => request.result.createObjectStore('files')
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(new Error('本地文件库无法打开，请检查浏览器存储设置。'))
  })
}
export async function saveProjectFile(file: File, projectId: string, actor: string): Promise<WorkFile> {
  if (file.size > 25 * 1024 * 1024) throw new Error('演示版单文件请控制在 25 MB 以内。')
  const bytes = await file.arrayBuffer()
  const digest = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map((b) => b.toString(16).padStart(2, '0')).join('')
  const result = { id: workId('FILE'), projectId, name: file.name, size: file.size, mime: file.type, at: new Date().toISOString(), by: actor, digest }
  const db = await database()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction('files', 'readwrite'); tx.objectStore('files').put(file, result.id)
    tx.oncomplete = () => resolve(); tx.onerror = tx.onabort = () => reject(new Error('文件保存失败，请检查本地可用空间。'))
  }).finally(() => db.close())
  return result
}
export async function readProjectFile(file: WorkFile): Promise<Blob> {
  const db = await database()
  const blob = await new Promise<Blob | undefined>((resolve, reject) => {
    const request = db.transaction('files', 'readonly').objectStore('files').get(file.id)
    request.onsuccess = () => resolve(request.result); request.onerror = () => reject(new Error('文件读取失败。'))
  }).finally(() => db.close())
  if (!blob) throw new Error('本浏览器没有该文件，请重新上传；历史索引不代表原文件已入库。')
  return blob
}
export async function downloadProjectFile(file: WorkFile) {
  const blob = await readProjectFile(file)
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = file.name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
}
