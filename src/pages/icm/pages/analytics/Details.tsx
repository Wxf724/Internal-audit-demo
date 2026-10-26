import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input, Modal } from '@/components'
import type { AnalyticsRow } from './model'

export interface DetailSelection { title: string; rows: AnalyticsRow[]; description?: string }
export function AnalyticsDetails({ selection, onClose }: { selection: DetailSelection; onClose: () => void }) {
  const [search, setSearch] = useState('')
  const navigate = useNavigate()
  const rows = selection.rows.filter((r) => `${r.id} ${r.name} ${r.unit} ${r.status}`.includes(search.trim()))
  return <Modal open centered width="min(760px, calc(100vw - 32px))" title={selection.title} onClose={onClose} footer={<Button onClick={onClose}>关闭</Button>}>
    <div className="analysis-detail"><div className="analysis-detail-top"><span>{selection.rows.length} 条记录</span><Input search value={search} onChange={setSearch} aria-label="搜索统计明细" placeholder="名称、单位或编号" /></div>{selection.description && <p>{selection.description}</p>}
      {rows.map((r) => <article key={`${r.kind}:${r.id}`}><div><span>{r.kind} · {r.id}</span><b>{r.status}</b></div><h3>{r.name}</h3><p>{r.unit}</p><p>{r.detail}</p><Button type="ghost" onClick={() => navigate(r.route)}>查看详情</Button></article>)}{!rows.length && <div className="analysis-empty">当前范围没有匹配记录</div>}
    </div>
  </Modal>
}
