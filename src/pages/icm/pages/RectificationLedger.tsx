import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FileText } from 'lucide-react'
import { Button, Input } from '@/components'
import { Card, DataTable, PageFrame, Tag, Toolbar } from '../components/IcmPageKit'
import { useWorkflowStore } from '../store/workflowStore'
import { useAuditProjectStore } from '../store/auditProjectStore'
import { issueProjectId, useProjectNavigate, useProjectRecords } from './projectScope'
import { isOverdueRectification } from './workplaceMetrics'
import { rectStage, rectStages } from './rectificationActions'
import { RectificationDrawer } from './RectificationDrawer'
import { projectYear } from './projectRelations'
import './rectification.css'

export default function RectificationLedger() {
  const { rectifications, issues } = useProjectRecords()
  const navigate = useProjectNavigate()
  useWorkflowStore((s) => s.audits)
  const projects = useAuditProjectStore((s) => s.projects)
  const [params, setParams] = useSearchParams()
  const [keyword, setKeyword] = useState('')
  const selected = rectifications.find((r) => r.id === params.get('rect'))
  const filter = params.get('status') ?? '全部'
  const mappedFilter = ({ '整改中': '整改中', '待方案审批': '待制定措施', '已整改': '待复核', '已销号': '已关闭' } as Record<string, string>)[filter] ?? filter
  const year = params.get('year') ?? 'all'
  const yearsByRect = new Map(rectifications.map((r) => {
    const issue = issues.find((i) => i.id === r.issueId)
    const project = projects.find((p) => p.id === (issue && issueProjectId(issue)))
    const value = project ? projectYear(project) : NaN
    return [r.id, Number.isFinite(value) ? String(value) : 'unknown']
  }))
  const years = [...new Set([...yearsByRect.values(), ...(/^\d{4}$/.test(year) ? [year] : [])])].filter((value) => value !== 'unknown').sort((a, b) => Number(b) - Number(a))
  const yearRows = rectifications.filter((r) => year === 'all' || yearsByRect.get(r.id) === year)
  const visible = yearRows.filter((r) => (!keyword || `${r.title}${r.owner}${issues.find((i) => i.id === r.issueId)?.title ?? ''}`.includes(keyword)) && (filter === '全部' || (filter === 'overdue' ? isOverdueRectification(r) : rectStage(r) === mappedFilter)))
  const change = (key: string, value?: string) => setParams((p) => { if (value) p.set(key, value); else p.delete(key); return p }, { replace: true })
  return <div className="rect-compact"><PageFrame title="整改台账" subtitle="" actions={<Button icon={<FileText size={15} />} onClick={() => navigate('/report')}>整改报告</Button>}>
    <div className="rect-flow" aria-label="整改流程筛选">{rectStages.map((stage) => <button type="button" key={stage} className={mappedFilter === stage ? 'active' : ''} aria-pressed={mappedFilter === stage} onClick={() => change('status', mappedFilter === stage ? undefined : stage)}><span>{stage}</span><strong>{yearRows.filter((r) => rectStage(r) === stage).length}</strong></button>)}</div>
    <Toolbar><select className="icm-select" aria-label="来源项目年度" title="来源项目年度" value={year} onChange={(event) => setParams((p) => { p.set('year', event.target.value); p.delete('rect'); return p }, { replace: true })}><option value="all">全部年度</option>{years.map((value) => <option key={value} value={value}>{value} 年</option>)}{([...yearsByRect.values()].includes('unknown') || year === 'unknown') && <option value="unknown">未明确年度</option>}</select><Input aria-label="搜索整改事项" placeholder="搜索问题、整改事项或责任单位" value={keyword} onChange={setKeyword} /><div className="icm-segment"><button className={filter === '全部' ? 'active' : ''} onClick={() => change('status')}>全部</button><button className={filter === 'overdue' ? 'active' : ''} onClick={() => change('status', 'overdue')}>已逾期 {yearRows.filter((r) => isOverdueRectification(r)).length}</button></div><span className="icm-toolbar-spacer" /><span>共 {visible.length} 项</span></Toolbar>
    <Card title="整改事项" note="选择事项直接办理">
      <DataTable columns={['问题与整改事项', '来源项目', '责任单位', '整改期限', '当前环节', '关注']} rows={visible.map((r) => {
        const issue = issues.find((i) => i.id === r.issueId)
        const project = projects.find((p) => p.id === (issue && issueProjectId(issue)))
        return [<button className="icm-link" onClick={() => change('rect', r.id)}>{r.title}</button>, project?.name ?? '待明确项目', r.owner, r.deadline, <Tag tone={rectStage(r) === '已关闭' ? 'green' : 'blue'}>{rectStage(r)}</Tag>, <div className="icm-actions">{issue?.level === '重大' && <Tag tone="red">重大</Tag>}{isOverdueRectification(r) && <Tag tone="red">逾期</Tag>}{r.planStatus === '待审批' && <Tag tone="amber">措施待审核</Tag>}</div>]
      })} onRowClick={(i) => change('rect', visible[i].id)} />
    </Card>
    {params.get('rect') && !selected && <p role="status">当前范围内未找到该整改事项。</p>}
    {selected && <RectificationDrawer key={selected.id} item={selected} issue={issues.find((i) => i.id === selected.issueId)} onClose={() => change('rect')} />}
  </PageFrame></div>
}
