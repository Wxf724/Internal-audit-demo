import { useMemo, useRef, useState } from 'react'
import { UploadCloud } from 'lucide-react'
import { Button, Modal } from '@/components'
import type { AnnualPlan } from './model'
import { newId, now } from './model'
import type { ResourceCategory } from './conversationTypes'
import { RESOURCE_CATEGORIES } from './planResourceData'
import { parsePlanFile, savePlanFile } from './planFiles'
import type { FilePassage, FileTable } from './planFiles'
import { usePlanningLibraryStore } from '../../store/planningLibraryStore'
import type { LibraryResource } from '../../store/planningLibraryStore'

export function ResourceUpload({ plan, onClose, onAdded }: { plan: AnnualPlan; onClose: () => void; onAdded: (ids: string[]) => void }) {
  const library = usePlanningLibraryStore((s) => s.resources)
  const add = usePlanningLibraryStore((s) => s.add)
  const fileInput = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [passages, setPassages] = useState<FilePassage[]>([])
  const [tables, setTables] = useState<FileTable[]>([])
  const [busy, setBusy] = useState(false), [status, setStatus] = useState(''), [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)
  const [name, setName] = useState(''), [category, setCategory] = useState<ResourceCategory>('年度风险评估结果')
  const [source, setSource] = useState(''), [year, setYear] = useState(plan.year), [shared, setShared] = useState(false)
  const [subject, setSubject] = useState(''), [capacity, setCapacity] = useState('')
  const [text, setText] = useState(''), [locator, setLocator] = useState(''), [confirmed, setConfirmed] = useState(false)
  const [sheet, setSheet] = useState(''), [header, setHeader] = useState(1), [rowsMode, setRowsMode] = useState(false)
  const [mapping, setMapping] = useState<Record<string, string>>({}), [replace, setReplace] = useState(false)
  const example = plan.id === 'EXAMPLE-ANNUAL-2027'
  const duplicate = library.find((r) => (r.documentName ?? r.name) === name && r.year === year && (r.planId === plan.id || (!example && r.planId !== 'EXAMPLE-ANNUAL-2027' && r.shared)) && !r.archived)
  const table = tables.find((t) => t.name === sheet)
  const columns = table?.rows[header - 1] ?? []
  const fieldList = useMemo(() => category === '年度风险评估结果' ? [['name', '风险主题'], ['subject', '审计对象'], ['likelihood', '可能性（1—5）'], ['impact', '影响程度（1—5）'], ['workdays', '预计人天'], ['recommendation', '建议项目'], ['required', '必审（可选）']] : category === '资源台账' ? [['name', '资源名称'], ['capacity', '可用人天']] : [['name', '名称'], ['subject', '审计对象']], [category])
  const read = async (picked: File) => {
    setFile(picked); setName(picked.name); setSource(picked.name); setConfirmed(false); setError(''); setBusy(true); setPassages([]); setTables([]); setText(''); setMapping({}); setReplace(false)
    try {
      const result = await parsePlanFile(picked, setStatus)
      setPassages(result.passages); setTables(result.tables); setSheet(result.tables[0]?.name ?? '')
      const fullText = result.passages.map((p) => `【${p.locator}】\n${p.text}`).join('\n\n')
      setLocator(fullText.length <= 30000 ? '全文' : (result.passages[0]?.locator ?? '人工核录')); setText(fullText.length <= 30000 ? fullText : (result.passages[0]?.text ?? ''))
      if (!result.passages.some((p) => p.text.trim())) throw new Error('未识别到文字，请核对原文件并手动录入引用内容。')
      setStatus('待核对')
    } catch (e) { setStatus('解析失败'); setError(`${(e as Error).message} 可重试或手动核录。`); setLocator('人工核录') }
    finally { setBusy(false) }
  }
  const save = async () => {
    if (!file || !confirmed) return
    setError('')
    try {
      if (!name.trim() || !source.trim() || !Number.isInteger(year) || year < 2000 || year > 2100) throw new Error('请核对资料名称、来源及适用年度。')
      if (file.size > 20 * 1024 * 1024) throw new Error('单个文件限 20 MB，请拆分后上传。')
      const fileId = newId(), groupId = replace && duplicate?.groupId ? duplicate.groupId : newId()
      const versionNumber = library.filter((r) => r.groupId === groupId).reduce((n, r) => Math.max(n, Number(r.version.replace('V', '')) || 0), 0) + 1
      const base = { category, source: source.trim(), year, fileId, groupId, documentName: name.trim(), version: `V${versionNumber}`, confirmedAt: now(), planId: plan.id, shared: !example && shared }
      const resources: LibraryResource[] = []
      if (rowsMode && table) {
        if (fieldList.filter(([key]) => key !== 'required').some(([key]) => mapping[key] === undefined || mapping[key] === '')) throw new Error('请完成表格字段对应关系。')
        const data = table.rows.slice(header).map((row, index) => ({ row, index: header + index + 1 })).filter(({ row }) => row.some((v) => v.trim()))
        if (!data.length || data.length > 200) throw new Error('每次导入 1—200 条资料，请按相关范围拆分。')
        for (const { row, index } of data) {
          const get = (key: string) => row[Number(mapping[key])] ?? ''
          const id = `file:${fileId}:${index}`, rowName = get('name').trim(), rowSubject = get('subject').trim()
          if (!rowName || (category !== '资源台账' && !rowSubject)) throw new Error(`第 ${index} 行缺少名称或审计对象。`)
          const entry: LibraryResource = { ...base, id, name: rowName, subject: rowSubject || undefined, locator: `${sheet} · 第 ${index} 行`, summary: columns.map((col, i) => `${col}：${row[i] ?? ''}`).join('；') }
          if (category === '资源台账') {
            entry.capacity = Number(get('capacity')); if (!Number.isFinite(entry.capacity) || entry.capacity <= 0) throw new Error(`第 ${index} 行可用人天无效。`)
          }
          if (category === '年度风险评估结果') {
            const likelihood = Number(get('likelihood')), impact = Number(get('impact')), workdays = Number(get('workdays'))
            if (![1, 2, 3, 4, 5].includes(likelihood) || ![1, 2, 3, 4, 5].includes(impact) || !Number.isFinite(workdays) || workdays <= 0 || !get('recommendation').trim()) throw new Error(`第 ${index} 行的风险评分、人天或建议项目不完整。`)
            entry.risk = { id: `risk:${groupId}:${encodeURIComponent(`${rowSubject}/${rowName}`)}`, title: rowName, subject: rowSubject, domain: '上传评估', likelihood, impact, workdays, recommendation: get('recommendation'), required: mapping.required !== undefined && ['是', '必审', 'true', '1'].includes(get('required').trim()), evidenceIds: [`chat:${id}`], lastAudit: '' }
          }
          resources.push(entry)
        }
      } else {
        if (!text.trim() || text.length > 30000) throw new Error('请核录引用内容，单份引用内容限 30,000 字；原文件完整保留。')
        const amount = capacity.trim() ? Number(capacity) : undefined
        if (amount !== undefined && (!Number.isFinite(amount) || amount <= 0)) throw new Error('可用人天须大于零。')
        resources.push({ ...base, id: `file:${fileId}`, name: name.trim(), subject: subject.trim() || undefined, summary: text.trim(), locator: locator || '人工核录', capacity: category === '资源台账' ? amount : undefined })
      }
      setBusy(true); setStatus('正在保存')
      await savePlanFile({ id: fileId, name: file.name, blob: file, passages, tables, at: now() })
      add(resources, replace ? duplicate?.groupId : undefined)
      onAdded(resources.map((r) => r.id)); onClose()
    } catch (e) { setError((e as Error).message); setBusy(false) }
  }
  return <Modal className="annual-overlay plan-upload" open centered width="min(850px, calc(100vw - 32px))" title="添加编制资料" onClose={() => { if (!busy) onClose() }} footer={<><Button disabled={busy} onClick={onClose}>取消</Button><Button type="primary" disabled={busy || !confirmed || !file} onClick={() => void save()}>确认并加入引用</Button></>}>
    <input ref={fileInput} hidden type="file" aria-label="上传编制资料" disabled={busy} accept=".xlsx,.xls,.csv,.docx,.pdf,.png,.jpg,.jpeg,.webp,.txt,.md" onChange={(e) => { const picked = e.target.files?.[0]; e.target.value = ''; if (picked) void read(picked) }} />
    <button type="button" className={`plan-upload-drop${dragging ? ' is-dragging' : ''}`} aria-label="选择编制文件" disabled={busy} onClick={() => fileInput.current?.click()} onDragOver={(e) => { e.preventDefault(); if (!busy) setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={(e) => { e.preventDefault(); setDragging(false); if (!busy && e.dataTransfer.files[0]) void read(e.dataTransfer.files[0]) }}>
      <UploadCloud size={28} aria-hidden="true" /><strong>{busy ? '正在解析文件' : file ? '点击更换文件' : '点击上传文件，或拖拽到此处'}</strong>{file && <span className="plan-upload-filename">{file.name}</span>}<span>Excel / CSV · Word · PDF · 图片 · 文本，单个文件不超过 20 MB</span>
    </button>
    {status && <div role="status" className="plan-upload-status">{status}{file && !busy && <Button onClick={() => void read(file)}>重新解析</Button>}</div>}
    {error && <p role="alert" className="annual-error">{error}</p>}
    {file && !busy && <div className="annual-form plan-upload-fields">
      <div className="annual-form-grid"><label>资料名称<input className="icm-input" value={name} onChange={(e) => { setName(e.target.value); setReplace(false) }} /></label><label>分类<select className="icm-select" value={category} onChange={(e) => { setCategory(e.target.value as ResourceCategory); setMapping({}); setConfirmed(false) }}>{RESOURCE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></label></div>
      <div className="annual-form-grid"><label>资料来源<input className="icm-input" value={source} onChange={(e) => setSource(e.target.value)} /></label><label>适用年度<input className="icm-input" type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} /></label></div>
      {Boolean(tables.length) && <><label className="annual-checkbox"><input type="checkbox" checked={rowsMode} onChange={(e) => { setRowsMode(e.target.checked); setConfirmed(false) }} />按表格逐行导入</label>{rowsMode && <><div className="annual-form-grid"><label>工作表<select className="icm-select" value={sheet} onChange={(e) => { setSheet(e.target.value); setMapping({}) }}>{tables.map((t) => <option key={t.name}>{t.name}</option>)}</select></label><label>表头所在行<input className="icm-input" type="number" min="1" max={table?.rows.length ?? 1} value={header} onChange={(e) => { setHeader(Number(e.target.value)); setMapping({}) }} /></label></div><div className="plan-column-mapping">{fieldList.map(([key, label]) => <label key={key}>{label}<select className="icm-select" value={mapping[key] ?? ''} onChange={(e) => setMapping({ ...mapping, [key]: e.target.value })}><option value="">选择列</option>{columns.map((col, index) => <option key={index} value={index}>{index + 1}. {col || '空表头'}</option>)}</select></label>)}</div><pre className="plan-file-extract">{table?.rows.slice(header - 1, header + 5).map((row) => row.join(' | ')).join('\n')}</pre></>}</>}
      {!rowsMode && <><div className="annual-form-grid"><label>关联审计对象<input className="icm-input" value={subject} onChange={(e) => setSubject(e.target.value)} /></label>{category === '资源台账' && <label>可用人天<input className="icm-input" type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} /></label>}</div><label>引用位置<select className="icm-select" value={locator} onChange={(e) => { setLocator(e.target.value); setText(e.target.value === '全文' ? passages.map((p) => `【${p.locator}】\n${p.text}`).join('\n\n') : (passages.find((p) => p.locator === e.target.value)?.text ?? '')); setConfirmed(false) }}><option value="全文">全文</option><option value="人工核录">人工核录</option>{passages.map((p, i) => <option key={i} value={p.locator}>{p.locator}</option>)}</select></label><label>核录内容<textarea className="icm-input" aria-label="核录内容" rows={8} value={text} onChange={(e) => { setText(e.target.value); setConfirmed(false) }} /></label></>}
      {duplicate && <label className="annual-checkbox"><input type="checkbox" checked={replace} onChange={(e) => setReplace(e.target.checked)} />作为同名资料的新版本，保留旧引用</label>}
      {!example && <label className="annual-checkbox"><input type="checkbox" checked={shared} onChange={(e) => setShared(e.target.checked)} />同时保存到公共资源库</label>}
      <label className="annual-checkbox"><input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />已核对原文件、引用内容、年度及字段对应关系</label>
    </div>}
  </Modal>
}
