import { useState } from 'react'
import { Card, DataTable, DetailLine, PageFrame, Tag, Toolbar, type Tone } from '../components/IcmPageKit'
import { useProjectDocumentStore } from '../store/projectDocumentStore'
import { toneByStatus } from '../data'
import { useProjectScope } from './projectScope'
import { useSearchParams } from 'react-router-dom'

const owners: Record<string, string> = { 'EV-0312': 'AUD-PL-2026-001', 'EV-0316': 'AUD-PL-2026-001', 'EV-0321': 'AUD-PL-2026-001', 'EV-0318': 'AUD-PL-2026-021' }
export default function ProjectEvidenceLedger() {
  const evidences = useProjectDocumentStore((s) => s.evidences)
  const { projectId } = useProjectScope()
  const [keyword, setKeyword] = useState('')
  const [method, setMethod] = useState('all')
  const [params] = useSearchParams()
  const [selectedId, setSelectedId] = useState(params.get('evidence') ?? '')
  const records = evidences.filter((e) => (!projectId || (e.projectId ?? owners[e.id]) === projectId) && (!keyword.trim() || `${e.title}${e.id}${e.link}`.includes(keyword.trim())) && (method === 'all' || e.type === method))
  const selected = records.find((e) => e.id === selectedId)
  return <PageFrame title="取证台账" subtitle="证据来源、引用关系与取证记录。"><Toolbar><input className="icm-input" aria-label="搜索取证记录" placeholder="取证编号 / 事项 / 底稿" value={keyword} onChange={(e) => setKeyword(e.target.value)} /><select className="icm-select" aria-label="取证方式" value={method} onChange={(e) => setMethod(e.target.value)}><option value="all">全部方式</option>{['调阅', '截图', '系统取数', '访谈'].map((v) => <option key={v}>{v}</option>)}</select></Toolbar>
    <Card title="取证记录">{records.length ? <DataTable columns={['编号', '方式', '取证事项', '经办人', '来源索引', '状态']} rows={records.map((e) => [<button className="icm-link" onClick={() => setSelectedId(e.id)}>{e.id}</button>, e.type, e.title, e.owner, e.link, <Tag tone={toneByStatus(e.status) as Tone}>{e.status}</Tag>])} onRowClick={(i) => setSelectedId(records[i].id)} /> : <div className="icm-empty-inline">当前范围内暂无取证记录。</div>}</Card>
    {selected && <Card title={selected.title}><DetailLine label="编号" value={selected.id} /><DetailLine label="证据类型" value={selected.type} /><DetailLine label="来源索引" value={selected.link} /><DetailLine label="采集时间" value={selected.capturedAt} /><DetailLine label="来源系统" value={selected.sourceSystem} /></Card>}
  </PageFrame>
}
