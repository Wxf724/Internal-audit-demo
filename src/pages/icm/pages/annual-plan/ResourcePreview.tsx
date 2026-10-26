import { useEffect, useState } from 'react'
import { Button, Modal } from '@/components'
import type { PlanResource } from './conversationTypes'
import { downloadBlob, loadPlanFile } from './planFiles'
import type { StoredPlanFile } from './planFiles'

export function ResourcePreview({ resource, onClose, footer }: { resource: PlanResource; onClose: () => void; footer?: React.ReactNode }) {
  const [file, setFile] = useState<StoredPlanFile | null>(null), [error, setError] = useState('')
  const [location, setLocation] = useState(resource.locator ?? ''), [url, setUrl] = useState('')
  useEffect(() => {
    let active = true, objectUrl = ''
    if (resource.fileId) void loadPlanFile(resource.fileId).then((f) => { if (active) { setFile(f); objectUrl = URL.createObjectURL(f.blob); setUrl(objectUrl) } }).catch((e) => { if (active) setError((e as Error).message) })
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [resource.fileId])
  const passage = file?.passages.find((p) => p.locator === location)
  return <Modal className="annual-overlay" open drawer width="min(750px, 100vw)" title={resource.name} onClose={onClose} footer={<><Button onClick={onClose}>关闭</Button>{file && <Button onClick={() => downloadBlob(file.blob, file.name)}>下载原文件</Button>}{resource.sourceRoute && <Button onClick={() => window.open(resource.sourceRoute, '_blank', 'noopener')}>查看来源台账</Button>}{footer}</>}>
    <div className="plan-resource-preview"><p>{resource.category} · {resource.version} · {resource.source}</p><strong>{resource.locator ?? '来源摘要'}</strong><p>{resource.summary}</p>
      {error && <p role="alert" className="annual-error">{error}</p>}
      {file && <><label>原文定位<select className="icm-select" value={location} onChange={(e) => setLocation(e.target.value)}><option value="">选择位置</option>{file.passages.map((p, i) => <option key={i} value={p.locator}>{p.locator}</option>)}</select></label><pre className="plan-file-extract">{passage?.text ?? '请选择页码、段落或行号'}</pre>{file.name.toLowerCase().endsWith('.pdf') && <iframe title="原始 PDF" className="plan-source-frame" src={`${url}#page=${location.match(/第 (\d+) 页/)?.[1] ?? 1}`} />}{/\.(png|jpg|jpeg|webp)$/i.test(file.name) && <img alt={file.name} src={url} className="plan-source-image" />}</>}
    </div>
  </Modal>
}
