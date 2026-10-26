import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useProjectScope, useProjectNavigate } from './projectScope'
import {
  Check,
  ChevronRight,
  ClipboardCheck,
  FileCheck2,
  FolderCheck,
  KeyRound,
  MailCheck,
  PlayCircle,
  Search,
  Send,
  ShieldCheck,
  UserCheck,
  UsersRound,
} from 'lucide-react'

import { Button, Card, DataTable, PageFrame, Tag, Toolbar, type Tone } from '../components/IcmPageKit'
import { dispatch, overview } from '../data'
import { useTaskDispatchStore, type DispatchStage } from '../store/taskDispatchStore'

type DispatchPhase = 'prepare' | 'release' | 'entry'

type ChecklistItem = {
  key: string
  title: string
  detail: string
  complete: boolean
}

const stages: Array<{ id: DispatchStage; title: string }> = [
  { id: 'confirm', title: '确认核查任务' },
  { id: 'team', title: '配置检查组' },
  { id: 'materials', title: '配置作业资料与权限' },
  { id: 'release', title: '分派下达' },
  { id: 'entry', title: '进场确认' },
]

const phaseDefinitions: Array<{ id: DispatchPhase; title: string; detail: string }> = [
  { id: 'prepare', title: '分派准备', detail: '通知单、人员、作业资料与权限' },
  { id: 'release', title: '分派下达', detail: '通知单送达与对象告知' },
  { id: 'entry', title: '进场确认', detail: '会议、联系人与资料接收' },
]

function getPhase(stage: DispatchStage, entered: boolean): DispatchPhase {
  if (entered || stage === 'entry') return 'entry'
  return stage === 'release' ? 'release' : 'prepare'
}

function phaseTone(phase: DispatchPhase, entered: boolean): Tone {
  if (entered) return 'green'
  return phase === 'prepare' ? 'blue' : 'amber'
}

function phaseLabel(phase: DispatchPhase, entered: boolean) {
  if (entered) return '已进场'
  return phaseDefinitions.find((item) => item.id === phase)?.title ?? '待办理'
}

function timelineItems(stageIndex: number, entered: boolean) {
  return [
    { title: '任务已生成', detail: '来自计划分解结果', complete: true },
    { title: '任务范围确认', detail: '检查对象、期间与预期输出', complete: stageIndex > 0 },
    { title: '检查组与资料准备', detail: '回避校验、资料清单与临时权限', complete: stageIndex > 2 },
    { title: '核查任务分派下达', detail: '通知单及分派结果已送达相关责任人', complete: stageIndex > 3 },
    { title: '进场登记', detail: '首次会议、联系人与资料接收确认', complete: entered },
  ]
}

export default function DispatchCenter() {
  const navigate = useProjectNavigate()
  const { project, projectId } = useProjectScope()
  const [searchParams] = useSearchParams()
  const allTasks = useTaskDispatchStore((state) => state.tasks)
  const taskItems = useMemo(() => projectId ? allTasks.filter((task) => task.projectId === projectId || project?.taskIds.includes(task.id)) : allTasks, [allTasks, project, projectId])
  const stageByTask = useTaskDispatchStore((state) => state.stageByTask)
  const enteredTaskIds = useTaskDispatchStore((state) => state.enteredTaskIds)
  const advanceDispatch = useTaskDispatchStore((state) => state.advanceDispatch)
  const confirmDispatch = useTaskDispatchStore((state) => state.confirmDispatch)
  const confirmEntry = useTaskDispatchStore((state) => state.confirmEntry)
  const [keyword, setKeyword] = useState('')
  const requestedTaskId = searchParams.get('task')
  const syncedPlanId = searchParams.get('synced') === '1' ? searchParams.get('fromPlan') : null
  const [selectedTaskId, setSelectedTaskId] = useState(() => taskItems.some((item) => item.id === requestedTaskId) ? requestedTaskId as string : 'TK-003')

  useEffect(() => {
    if (requestedTaskId && taskItems.some((item) => item.id === requestedTaskId)) setSelectedTaskId(requestedTaskId)
  }, [requestedTaskId, taskItems])

  const filteredTasks = useMemo(() => taskItems.filter((item) => !keyword.trim() || `${item.id}${item.name}${item.unit}${item.owner}`.includes(keyword.trim())), [keyword, taskItems])
  const selectedTask = taskItems.find((item) => item.id === selectedTaskId) ?? (!requestedTaskId ? taskItems[0] : undefined)
  if (!selectedTask) return <PageFrame title="任务派发" subtitle="当前项目暂无可办理任务，或指定任务不属于此项目。"><Button onClick={() => navigate('/task-center')}>返回执行任务</Button></PageFrame>

  const currentStage = stageByTask[selectedTask.id] ?? 'confirm'
  const stageIndex = stages.findIndex((item) => item.id === currentStage)
  const entered = enteredTaskIds.includes(selectedTask.id)
  const currentPhase = getPhase(currentStage, entered)
  const currentPhaseIndex = phaseDefinitions.findIndex((item) => item.id === currentPhase)
  const enteredCount = taskItems.filter((task) => enteredTaskIds.includes(task.id)).length

  const chooseTask = (taskId: string) => {
    setSelectedTaskId(taskId)
    navigate(`/dispatch-center?task=${taskId}`, { replace: true })
  }

  const preparationItems: ChecklistItem[] = [
    { key: 'scope', title: '任务范围与核查任务通知单', detail: `${selectedTask.start} 至 ${selectedTask.end} · ${selectedTask.outputs.join(' / ')}`, complete: stageIndex > 0 },
    { key: 'team', title: '检查组与回避校验', detail: `检查负责人：${selectedTask.owner}；复核人：${selectedTask.reviewer}`, complete: stageIndex > 1 },
    { key: 'materials', title: '资料清单与临时权限', detail: `资料责任部门和系统访问权限有效期截至 ${selectedTask.end}`, complete: stageIndex > 2 },
  ]

  const renderPreparation = () => {
    const action = currentStage === 'confirm'
      ? { label: '确认任务范围', onClick: () => advanceDispatch(selectedTask.id, 'team'), icon: <ClipboardCheck size={15} /> }
      : currentStage === 'team'
        ? { label: '确认检查组配置', onClick: () => advanceDispatch(selectedTask.id, 'materials'), icon: <UsersRound size={15} /> }
        : { label: '完成分派准备', onClick: () => advanceDispatch(selectedTask.id, 'release'), icon: <FolderCheck size={15} /> }

    return <Card title="分派准备" note="完成当前任务的必备校验后，方可执行核查任务分派下达。" action={<Tag tone="blue">待办理</Tag>}>
      <div className="icm-dispatch-checklist">
        {preparationItems.map((item) => <div className={item.complete ? 'complete' : 'current'} key={item.key}><span>{item.complete ? <Check size={15} /> : <ChevronRight size={15} />}</span><div><strong>{item.title}</strong><em>{item.detail}</em></div><Tag tone={item.complete ? 'green' : 'amber'}>{item.complete ? '已完成' : '待确认'}</Tag></div>)}
      </div>
      {currentStage === 'team' ? <div className="icm-dispatch-inline-section"><div className="icm-dispatch-inline-title">检查组配置</div><DataTable columns={['成员', '承担职责', '当前负荷', '回避校验']} rows={dispatch.resourceCalendar.map((member) => [member.name, member.role, `${member.load}%`, <Tag tone={member.conflict === '无冲突' ? 'green' : 'amber'}>{member.conflict}</Tag>])} /></div> : null}
      {currentStage === 'materials' ? <div className="icm-dispatch-inline-section"><div className="icm-dispatch-inline-title">资料与权限</div><div className="icm-dispatch-materials">{dispatch.materials.map((material) => <span key={material}><Check size={14} />{material}</span>)}</div><div className="icm-dispatch-permission"><KeyRound size={15} /><span>已申请最小必要访问权限：业务台账、合同影像和审批记录；权限到期日为 {selectedTask.end}。</span></div></div> : null}
      <div className="icm-dispatch-action"><Button type="primary" icon={action.icon} onClick={action.onClick}>{action.label}</Button></div>
    </Card>
  }

  const renderRelease = () => <Card title="核查任务分派下达" note="确认后生成分派记录，并向检查组、受检单位及资料责任部门送达通知单。" action={<Tag tone="amber">待派发</Tag>}>
    <div className="icm-dispatch-document"><FileCheck2 size={17} /><div><strong>内控核查任务通知单</strong><span>编号：{selectedTask.notificationNo ?? `内控核查〔2026〕${selectedTask.id.replace('TK-', '')}号`} · 已关联核查范围、检查组和作业资料</span></div><button className="icm-link" type="button" onClick={() => navigate(`/plan-workbench?view=split&plan=${selectedTask.planId ?? ''}`)}>查看拆解依据</button></div>
    <div className="icm-dispatch-inline-section"><div className="icm-dispatch-inline-title">送达对象</div><DataTable columns={['对象', '送达内容', '送达方式', '状态']} rows={[
      ['检查组成员', '核查任务通知单、职责分工、保密与回避要求', '系统通知', <Tag tone="blue">待派发</Tag>],
      ['受检单位联系人', '进场通知、检查范围、首次会议安排', '系统通知', <Tag tone="blue">待派发</Tag>],
      ['资料责任部门', '资料清单、提交时限与补正要求', '系统通知', <Tag tone="blue">待派发</Tag>],
      ['系统管理员', '临时权限申请单与使用期限', '系统工单', <Tag tone="blue">待派发</Tag>],
    ]} /></div>
    <div className="icm-dispatch-action"><Button type="primary" icon={<Send size={15} />} onClick={() => confirmDispatch(selectedTask.id)}>确认分派下达</Button></div>
  </Card>

  const renderEntry = () => <Card title={entered ? '进场登记已完成' : '进场确认'} note={entered ? '该任务已具备执行条件，可进入审查工作区。' : '确认通知送达、受检单位联系人和首次会议安排后，完成进场登记。'} action={<Tag tone={entered ? 'green' : 'amber'}>{entered ? '已进场' : '待确认'}</Tag>}>
    <div className="icm-dispatch-entry-grid">{dispatch.entries.map((entry) => <div className={entered ? 'complete' : ''} key={entry.item}><span>{entered ? <Check size={15} /> : <MailCheck size={15} />}</span><div><strong>{entry.item}</strong><em>责任人：{entry.owner}</em></div><Tag tone={entered ? 'green' : 'amber'}>{entered ? '已确认' : entry.status}</Tag></div>)}</div>
    <div className="icm-dispatch-entry-scope"><ShieldCheck size={15} /><span>本次进场范围：{overview.scope}</span></div>
    <div className="icm-dispatch-action">{entered ? <Button type="primary" icon={<PlayCircle size={15} />} onClick={() => navigate(`/review-workbench?view=execute&task=${selectedTask.id}`)}>进入执行审查</Button> : <Button type="primary" icon={<UserCheck size={15} />} onClick={() => confirmEntry(selectedTask.id)}>完成进场确认</Button>}</div>
  </Card>

  const currentWorkspace = currentPhase === 'prepare' ? renderPreparation() : currentPhase === 'release' ? renderRelease() : renderEntry()

  return <PageFrame title="核查任务分派下达" subtitle="围绕单项内控现场核查任务完成分派准备、通知单送达和进场登记；完成进场后方可进入现场实施核查。">
    <Toolbar>{syncedPlanId ? <Tag tone="green">已同步计划 {syncedPlanId}</Tag> : null}<Search size={16} color="#607089" /><input className="icm-input" value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索任务编号、名称、受检单位或负责人" aria-label="搜索派发任务" /><span className="icm-toolbar-spacer" /><Tag tone="blue">待派发 {taskItems.length - enteredCount}</Tag><Tag tone="green">已进场 {enteredCount}</Tag></Toolbar>
    <div className="icm-dispatch-console">
      <aside className="icm-dispatch-queue" aria-label="派发任务列表"><div className="icm-dispatch-queue-head"><div><strong>任务列表</strong><span>选择任务后办理分派下达与进场</span></div><Tag tone="gray">{filteredTasks.length} 项</Tag></div><div className="icm-dispatch-queue-list">{filteredTasks.map((task) => { const taskEntered = enteredTaskIds.includes(task.id); const taskPhase = getPhase(stageByTask[task.id] ?? 'confirm', taskEntered); return <button className={`icm-dispatch-task ${task.id === selectedTask.id ? 'active synced' : ''}`} key={task.id} type="button" onClick={() => chooseTask(task.id)}><span className="icm-dispatch-task-icon"><ClipboardCheck size={15} /></span><span><strong>{task.name}</strong><em>{task.id} · {task.owner}</em></span><Tag tone={phaseTone(taskPhase, taskEntered)}>{phaseLabel(taskPhase, taskEntered)}</Tag></button> })}{!filteredTasks.length ? <div className="icm-empty-inline">未找到匹配任务</div> : null}</div></aside>
      <section className="icm-dispatch-workbench" aria-label="核查任务分派办理区">
        <div className="icm-dispatch-summary"><div className="icm-dispatch-summary-main"><span>当前办理任务</span><strong>{selectedTask.name}</strong><em>{selectedTask.id} · {selectedTask.type}</em></div><div><span>关联计划</span><strong>{overview.planName}</strong><em>{overview.taskId}</em></div><div><span>受检单位</span><strong>{selectedTask.unit}</strong><em>{selectedTask.start} 至 {selectedTask.end}</em></div><div><span>检查负责人</span><strong>{selectedTask.owner}</strong><em>复核人：{selectedTask.reviewer}</em></div></div>
        <section className="icm-dispatch-phasebar" aria-label="派发进场进度">{phaseDefinitions.map((phase, index) => { const done = index < currentPhaseIndex || entered; const active = index === currentPhaseIndex && !entered; return <div className={`${done ? 'done' : ''} ${active ? 'active' : ''}`} key={phase.id}><span>{done ? <Check size={14} /> : index + 1}</span><p><strong>{phase.title}</strong><em>{phase.detail}</em></p></div> })}</section>
        <div className="icm-dispatch-content-grid"><div className="icm-dispatch-current">{currentWorkspace}</div><aside className="icm-dispatch-trace"><Card title="办理记录" note="本任务的关键操作按时间留痕。"><div className="icm-dispatch-timeline">{timelineItems(stageIndex, entered).map((item) => <div className={item.complete ? 'complete' : ''} key={item.title}><span>{item.complete ? <Check size={13} /> : ''}</span><p><strong>{item.title}</strong><em>{item.detail}</em></p></div>)}</div></Card></aside></div>
      </section>
    </div>
  </PageFrame>
}
