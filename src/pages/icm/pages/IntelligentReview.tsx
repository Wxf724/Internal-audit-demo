import { useState } from 'react'
import { Navigate, useLocation, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Bot, FileUp, Play, Settings2 } from 'lucide-react'
import { Button, Input } from '@/components'
import { PageFrame, Tag, DataTable } from '../components/IcmPageKit'
import { useIcmDemoRole } from '../AppShell'
import { useTaskDispatchStore } from '../store/taskDispatchStore'
import { useAuditProjectStore } from '../store/auditProjectStore'
import { useProjectDocumentStore } from '../store/projectDocumentStore'
import { useResourceStore } from '../store/resourceStore'
import { currentVersion, usableResource } from '../data/resourceModel'
import { defaultReviewConfig } from '../data/reviewConfig'
import { useAgentRuntimeStore } from '../agents/store'
import type { AuditProject } from '../data/auditProjects'
import type { Task } from '../data/types'
import { canViewProject } from './workplaceMetrics'
import { useProjectNavigate, useProjectScope } from './projectScope'
import { reviewTaskProject, startReview } from './intelligentReviewActions'
import { ReviewClueDrawer } from './ReviewClueDrawer'
import './intelligent-review.css'

export default function IntelligentReview() {
  const [params, setParams] = useSearchParams()
  const { projectId } = useProjectScope()
  const { role } = useIcmDemoRole()
  const navigate = useProjectNavigate()
  const projects = useAuditProjectStore((s) => s.projects).filter((p) => canViewProject(p, role))
  const tasks = useTaskDispatchStore((s) => s.tasks)
  const [search, setSearch] = useState('')
  const scope = projectId ?? params.get('scope') ?? 'all'
  const scoped = tasks.map((task) => ({ task, project: reviewTaskProject(task, projects) })).filter((x): x is { task: Task; project: AuditProject } => Boolean(x.project) && (scope === 'all' || x.project?.id === scope))
  const selected = params.has('task') ? scoped.find((x) => x.task.id === params.get('task')) : scoped[0]
  const visible = scoped.filter(({ task, project }) => `${task.name}${task.id}${project.name}`.includes(search.trim()))
  if (params.get('view') === 'agents') {
    const back = new URLSearchParams(params); back.delete('view')
    return <Navigate replace to={`/audit-resources?category=tools&type=${encodeURIComponent('智能体')}&reviewReturn=${encodeURIComponent('/review-workbench?' + back)}`} />
  }
  const choose = (id: string) => setParams((p) => { p.set('task', id); for (const key of ['run', 'clue', 'file']) p.delete(key); return p })
  return <div className="review-workspace"><PageFrame title="智能审查" subtitle="按项目任务选择资料，运行分析并核验线索。" actions={<><Button icon={<ArrowLeft size={14} />} onClick={() => navigate(projectId ? `/projects/${projectId}?tab=execution` : '/projects')}>{projectId ? '返回项目实施' : '项目台账'}</Button><Button icon={<Settings2 size={14} />} onClick={() => navigate(`/audit-resources?category=tools&type=${encodeURIComponent('智能体')}&reviewReturn=${encodeURIComponent('/review-workbench?' + params)}`)}>智能体配置</Button></>}>
    <div className="review-columns"><aside className="review-task-directory"><header><strong>执行任务</strong><span>{scoped.length} 项</span></header>{!projectId && <select aria-label="智能审查项目范围" className="icm-select" value={scope} onChange={(e) => setParams((p) => { p.set('scope', e.target.value); for (const k of ['task', 'run', 'clue', 'file']) p.delete(k); return p })}><option value="all">全部项目</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>}<Input aria-label="搜索审查任务" value={search} onChange={setSearch} placeholder="搜索任务或项目" /><div className="review-task-scroll">{visible.map(({ task, project }) => <button className={selected?.task.id === task.id ? 'active' : ''} key={task.id} onClick={() => choose(task.id)} aria-pressed={selected?.task.id === task.id}><strong>{task.name}</strong><small>{project.name}</small><span>{task.id} · {task.owner} · {task.status}</span></button>)}</div>{!visible.length && <p className="review-empty">当前范围没有匹配的执行任务。</p>}</aside>
      {selected ? <ReviewTask key={selected.task.id} task={selected.task} project={selected.project} /> : <div className="review-empty">{params.has('task') ? '未找到当前项目下的指定任务，请重新选择。' : '请先在项目中建立执行任务，再选择资料开展审查。'}</div>}
    </div>
  </PageFrame></div>
}

function ReviewTask({ task, project }: { task: Task; project: AuditProject }) {
  const [params, setParams] = useSearchParams()
  const location = useLocation()
  const navigate = useProjectNavigate()
  const { role } = useIcmDemoRole()
  const files = useProjectDocumentStore((s) => s.files).filter((f) => f.projectId === project.id)
  const runs = useAgentRuntimeStore((s) => s.runs).filter((r) => r.projectId === project.id && r.reviewContext?.taskId === task.id)
  const agent = useResourceStore((s) => s.assets.find((a) => a.id === 'AG02'))
  const version = agent && currentVersion(agent)
  const ready = agent && usableResource(agent)
  const run = params.has('run') ? runs.find((r) => r.id === params.get('run')) : runs[0]
  const clue = run?.outputs.find((c) => c.id === params.get('clue'))
  const [selectedFiles, setSelectedFiles] = useState<string[]>(files.some((f) => f.id === params.get('file')) ? [params.get('file')!] : [])
  const [running, setRunning] = useState(false)
  const [notice, setNotice] = useState('')
  const [filter, setFilter] = useState('全部')
  const locked = Boolean(project.archivedAt || project.archivePending || project.auditReport?.status === '已签发')
  const visible = (run?.outputs ?? []).filter((c) => filter === '全部' || c.reviewDisposition === filter)
  const configRoute = `/audit-resources?category=tools&resource=AG02&reviewReturn=${encodeURIComponent(location.pathname + location.search)}`
  const start = async () => {
    setRunning(true); setNotice('正在读取所选资料…')
    try { const id = await startReview(task.id, selectedFiles, role.name, setNotice); setParams((p) => { p.set('task', task.id); p.set('run', id); p.delete('clue'); return p }); setNotice('审查完成，点击线索核对原件后办理。') } catch (e) { setNotice((e as Error).message) } finally { setRunning(false) }
  }
  return <section className="review-task-main">
    <header className="review-task-context"><div><button className="icm-link" onClick={() => navigate(`/projects/${project.id}`)}>{project.name}</button><h2>{task.name}</h2><span>{task.id} · 责任人 {task.owner} · {project.subject}</span></div><Tag tone={locked ? 'gray' : 'blue'}>{locked ? '已封存' : task.status}</Tag></header>
    <section className="review-input-section"><div className="review-section-heading"><strong>01 选择审查资料</strong><Button size="sm" icon={<FileUp size={14} />} onClick={() => navigate(`/projects/${project.id}?tab=execution&section=data&reviewTask=${task.id}`)}>管理项目资料</Button></div>
      <div className="review-file-choices">{files.map((f) => <label key={f.id}><input type="checkbox" checked={selectedFiles.includes(f.id)} disabled={running || locked} onChange={(e) => setSelectedFiles(e.target.checked ? [...selectedFiles, f.id] : selectedFiles.filter((id) => id !== f.id))} /><span>{f.name}<small>{Math.ceil(f.size / 1024)} KB · {f.by}</small></span></label>)}{!files.length && <p className="review-empty">本项目尚未导入原始资料。导入后选择本任务需要核查的文件。</p>}</div>
      <div className="review-run-toolbar"><Bot size={17} /><span>{version?.snapshot.title ?? '审计数据分析'} · {version ? `V${version.version}` : '未发布'}<small>所选资料 → 待核实线索 → 人工核验 → 底稿</small></span><button className="icm-link" onClick={() => navigate(configRoute)}>查看配置</button><span className="icm-toolbar-spacer" /><Button type="primary" icon={<Play size={14} />} loading={running} disabled={locked || !ready || !selectedFiles.length} onClick={() => void start()}>开始审查</Button></div>
      {!ready && <p className="review-notice">智能体配置当前不可用，请核对发布版本及适用状态。</p>}
    </section>
    <section className="review-results"><div className="review-section-heading"><strong>02 核验审查线索</strong><select aria-label="审查运行记录" className="icm-select" value={run?.id ?? ''} onChange={(e) => setParams((p) => { p.set('task', task.id); p.set('run', e.target.value); p.delete('clue'); return p })}><option value="" disabled>暂无运行记录</option>{runs.map((r) => <option key={r.id} value={r.id}>{new Date(r.startedAt).toLocaleString()} · {r.outputs.length} 条线索</option>)}</select></div>
      {run ? <><div className="review-result-summary"><span>{run.reviewContext?.sources.length} 份资料 · {run.reviewContext?.agent.title} V{run.reviewContext?.agent.version}</span><select aria-label="线索处理状态" className="icm-select" value={filter} onChange={(e) => setFilter(e.target.value)}>{['全部', '待核实', '已转底稿', '已排除'].map((v) => <option key={v}>{v}</option>)}</select></div>
        {visible.length ? <DataTable columns={['线索与原文位置', '关注词', '处理状态', '']} rows={visible.map((c) => [<div><strong>{c.title}</strong><p>{c.reviewEvidence?.locator} · {c.summary.slice(0, 140)}</p></div>, c.reviewEvidence?.term ?? '待核对', <Tag tone={c.reviewDisposition === '待核实' ? 'amber' : 'green'}>{c.reviewDisposition ?? '待核实'}</Tag>, <Button size="sm" onClick={() => setParams((p) => { p.set('task', task.id); p.set('run', run.id); p.set('clue', c.id); return p })}>{c.paperId ? '查看底稿' : '核验'}</Button>])} /> : <p className="review-empty">{run.outputs.length ? '当前处理状态下没有线索。' : '所选资料未命中关注词；请结合实际测试继续核查。'}</p>}
        <details className="review-run-sources"><summary>本次资料与配置快照</summary>{run.reviewContext?.sources.map((s) => <p key={s.fileId}>{s.name} · 文件校验 {s.digest.slice(0, 12)}</p>)}<p>关注词：{(run.reviewContext?.agent.config ?? defaultReviewConfig).terms.join('、')}</p><p>线索上限：{run.reviewContext?.agent.config.maxClues}；本次仅对资料中的相关表述定位，实际事实及风险等级须人工核实。</p></details>
      </> : <p className="review-empty">{params.has('run') ? '指定运行记录不属于当前任务。' : '选择本任务需要的资料并开始审查，结果保留资料和配置版本。'}</p>}
    </section>
    {notice && <p role="status" className="review-notice">{notice}</p>}
    {params.has('clue') && !clue && <p role="status" className="review-notice">未找到本次运行中的指定线索。</p>}
    {run && clue && <ReviewClueDrawer key={clue.id} run={run} clue={clue} locked={locked} onClose={() => setParams((p) => { p.delete('clue'); return p })} />}
  </section>
}
