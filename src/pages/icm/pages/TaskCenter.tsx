import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarClock, ChevronRight, ClipboardList, FileCheck2, Search, Send, ShieldCheck, TriangleAlert, UsersRound, X } from 'lucide-react'

import { Input, Tabs } from '@/components'
import { Button, Card, DataTable, DetailLine, Kpi, PageFrame, Tag, Toolbar, type Tone } from '../components/IcmPageKit'
import { plans, toneByStatus } from '../data'
import { useTaskDispatchStore } from '../store/taskDispatchStore'

type TaskStatus = '全部状态' | '待启动' | '进行中' | '待复核' | '已完成' | '已归档'
type TaskType = '全部类型' | '检查任务' | '取证任务'

const lifecycle = ['待启动', '进行中', '待复核', '已完成', '已归档']

function TwoColumnLayout({ side, main }: { side: React.ReactNode; main: React.ReactNode }) {
  return (
    <div className="icm-workflow-layout icm-workflow-layout-wide">
      <div className="icm-workflow-side">{side}</div>
      <div className="icm-workflow-main">{main}</div>
    </div>
  )
}

export default function TaskCenter() {
  const navigate = useNavigate()
  const taskItems = useTaskDispatchStore((state) => state.tasks)
  const addTask = useTaskDispatchStore((state) => state.addTask)
  const [selectedTaskId, setSelectedTaskId] = useState('')
  const [selectedPlanId, setSelectedPlanId] = useState<string>('all')
  const [expandedPlanIds, setExpandedPlanIds] = useState<string[]>([])
  const [keyword, setKeyword] = useState('')
  const [planSearch, setPlanSearch] = useState('')
  const [status, setStatus] = useState<TaskStatus>('全部状态')
  const [taskType, setTaskType] = useState<TaskType>('全部类型')
  const [showCreateTask, setShowCreateTask] = useState(false)
  const [newTaskName, setNewTaskName] = useState('')
  const [newTaskType, setNewTaskType] = useState<TaskType>('检查任务')

  const planList = useMemo(() => {
    const map = new Map<string, { id: string; name: string; status: string; unit: string }>()
    plans.forEach((plan) => map.set(plan.id, plan))
    taskItems.forEach((task) => {
      if (task.planId && !map.has(task.planId)) {
        map.set(task.planId, { id: task.planId, name: task.planId, status: '已派发', unit: task.unit })
      }
    })
    const search = planSearch.trim()
    return Array.from(map.values()).filter((plan) => !search || `${plan.id}${plan.name}${plan.unit}`.includes(search))
  }, [taskItems, planSearch])

  const selectedPlan = selectedPlanId === 'all' ? null : planList.find((plan) => plan.id === selectedPlanId)

  const filteredTasks = useMemo(() => taskItems.filter((item) => {
    const matchesPlan = selectedPlanId === 'all' || item.planId === selectedPlanId
    const matchesKeyword = !keyword.trim() || `${item.id}${item.name}${item.unit}${item.owner}`.includes(keyword.trim())
    return matchesPlan && matchesKeyword && (status === '全部状态' || item.status === status) && (taskType === '全部类型' || item.type === taskType)
  }), [keyword, status, taskItems, taskType, selectedPlanId])

  const selectedTask = taskItems.find((item) => item.id === selectedTaskId)

  const runningCount = filteredTasks.filter((item) => item.status === '进行中').length
  const reviewCount = filteredTasks.filter((item) => item.status === '待复核').length
  const blockerCount = filteredTasks.filter((item) => item.blockers.length > 0).length
  const averageProgress = Math.round(filteredTasks.reduce((total, item) => total + item.progress, 0) / Math.max(filteredTasks.length, 1))

  const createTask = () => {
    const name = newTaskName.trim()
    if (!name) return
    const task = { id: `TK-${String(taskItems.length + 1).padStart(3, '0')}`, type: newTaskType === '全部类型' ? '检查任务' : newTaskType, name, unit: selectedPlan?.unit ?? taskItems[0]?.unit ?? '待分配', owner: '待分配', reviewer: '待指定', start: '待排期', end: '待排期', status: '待启动', progress: 0, outputs: ['检查任务书'], blockers: [] }
    addTask(task)
    setSelectedTaskId(task.id)
    setNewTaskName('')
    setNewTaskType('检查任务')
    setShowCreateTask(false)
  }

  const planTaskCount = (planId: string) => taskItems.filter((task) => task.planId === planId).length
  const togglePlan = (planId: string) => setExpandedPlanIds((ids) => ids.includes(planId) ? ids.filter((id) => id !== planId) : [...ids, planId])
  const selectPlan = (planId: string) => {
    setSelectedPlanId(planId)
    setSelectedTaskId('')
    if (!expandedPlanIds.includes(planId)) setExpandedPlanIds((ids) => [...ids, planId])
  }

  return <PageFrame title="检查任务中心" subtitle="左侧计划树可展开查看计划下已分解的检查任务，右侧展示任务执行与进度，详情在抽屉处理。" actions={<><Button type="primary" icon={<ClipboardList size={15} />} onClick={() => navigate('/plan-workbench?view=create')}>新建计划</Button><Button type="primary-soft" icon={<CalendarClock size={15} />} onClick={() => setShowCreateTask(true)}>新建任务</Button></>}>
    <TwoColumnLayout
      side={
        <Card title="计划 / 任务树" note={`${planList.length} 个计划 · ${taskItems.length} 个任务`}>
          <div className="icm-modal-search" style={{ marginBottom: 8 }}><Search size={14} /><input value={planSearch} onChange={(event) => setPlanSearch(event.target.value)} placeholder="搜索计划编号、名称或单位" /></div>
          <div className="icm-task-tree">
            <button className={`icm-plan-tree-item ${selectedPlanId === 'all' ? 'active' : ''}`} type="button" onClick={() => { setSelectedPlanId('all'); setSelectedTaskId('') }}>
              <span>全部计划</span>
              <Tag tone="blue">{taskItems.length}</Tag>
            </button>
            {planList.map((plan) => {
              const planTasks = taskItems.filter((task) => task.planId === plan.id)
              const open = expandedPlanIds.includes(plan.id)
              return (
                <div className="icm-task-tree-group" key={plan.id}>
                  <div className={`icm-task-tree-plan ${selectedPlanId === plan.id ? 'active' : ''}`}>
                    <button className="icm-task-tree-caret" type="button" aria-label={open ? '收起' : '展开'} onClick={() => togglePlan(plan.id)}><ChevronRight className={open ? 'open' : ''} size={15} /></button>
                    <button className="icm-task-tree-plan-main" type="button" onClick={() => selectPlan(plan.id)}>
                      <span className="icm-task-tree-plan-name">{plan.name}</span>
                      <span className="icm-task-tree-plan-meta">{plan.id}</span>
                    </button>
                    <Tag tone={planTasks.length ? 'green' : 'gray'}>{planTasks.length}</Tag>
                  </div>
                  {open ? (
                    <div className="icm-task-tree-children">
                      {planTasks.length ? planTasks.map((task) => (
                        <button className={`icm-task-tree-task ${selectedTaskId === task.id ? 'active' : ''}`} key={task.id} type="button" onClick={() => { setSelectedPlanId(plan.id); setSelectedTaskId(task.id) }}>
                          <span className="icm-task-tree-task-name">{task.name}</span>
                          <Tag tone={toneByStatus(task.status) as Tone}>{task.status}</Tag>
                        </button>
                      )) : <div className="icm-task-tree-empty">该计划暂未分解任务</div>}
                    </div>
                  ) : null}
                </div>
              )
            })}
            {!planList.length ? <div className="icm-empty-inline">暂无计划</div> : null}
          </div>
        </Card>
      }
      main={
        <>
          <div className="icm-task-kpi-row">
            <Kpi value={filteredTasks.length.toString()} label="任务总数" note={selectedPlan ? `${selectedPlan.id} 当前任务数` : '全部计划任务总数'} tone="blue" />
            <Kpi value={runningCount.toString()} label="执行中" note="已进入检查阶段" tone="green" />
            <Kpi value={reviewCount.toString()} label="待复核" note="需复核人处理" tone="amber" />
            <Kpi value={`${averageProgress}%`} label="总体进度" note={blockerCount ? `${blockerCount} 项存在阻塞` : '暂无阻塞事项'} tone={blockerCount ? 'amber' : 'green'} />
          </div>

          <Toolbar>
            <Input search className="min-w-[280px]" value={keyword} onChange={setKeyword} placeholder="搜索任务编号、任务名称、受检单位或负责人" />
            <select className="icm-select" value={status} onChange={(event) => setStatus(event.target.value as TaskStatus)}><option>全部状态</option><option>待启动</option><option>进行中</option><option>待复核</option><option>已完成</option><option>已归档</option></select>
            <select className="icm-select" value={taskType} onChange={(event) => setTaskType(event.target.value as TaskType)}><option>全部类型</option><option>检查任务</option><option>取证任务</option></select>
            <span className="icm-toolbar-spacer" />
            {selectedPlan ? <Tag tone={toneByStatus(selectedPlan.status) as Tone}>{selectedPlan.id} · {selectedPlan.status}</Tag> : <Tag tone="blue">全部计划</Tag>}
          </Toolbar>

          {showCreateTask ? <Card title="新建检查任务" note="创建后再配置检查组、资料需求和任务书。" action={<button className="icm-link" type="button" onClick={() => setShowCreateTask(false)}>取消</button>}><div className="icm-task-create"><Input value={newTaskName} onChange={setNewTaskName} placeholder="输入任务名称" /><select className="icm-select" value={newTaskType} onChange={(event) => setNewTaskType(event.target.value as TaskType)}><option>检查任务</option><option>取证任务</option></select><Button type="primary" onClick={createTask}>创建任务</Button></div></Card> : null}

          <Card title="任务执行与进度" note={selectedPlan ? `${selectedPlan.name} 下已分解任务` : '全部已分解任务'}>
            <Tabs size="sm" defaultActiveKey="overview" items={[
              { key: 'overview', label: '任务列表', children: <DataTable columns={['任务编号', '任务名称', '任务类型', '负责人', '检查期间', '状态', '进度', '阻塞事项']} rows={filteredTasks.map((item) => [item.id, <button className="icm-link" type="button" onClick={() => setSelectedTaskId(item.id)}>{item.name}</button>, item.type, item.owner, `${item.start} 至 ${item.end}`, <Tag tone={toneByStatus(item.status) as Tone}>{item.status}</Tag>, `${item.progress}%`, item.blockers.length ? <span className="icm-text-warn">{item.blockers.join('；')}</span> : '无'])} onRowClick={(index) => setSelectedTaskId(filteredTasks[index].id)} /> },
              { key: 'gantt', label: '进度排程', children: <div className="icm-task-gantt">{filteredTasks.map((item, index) => <div className="icm-task-gantt-row" key={item.id}><button type="button" onClick={() => setSelectedTaskId(item.id)}>{item.name}</button><div className="icm-task-gantt-track"><span style={{ width: `${Math.max(8, item.progress - index * 4)}%` }} /></div><b>{item.progress}%</b></div>)}</div> },
            ]} />
          </Card>
        </>
      }
    />

    {selectedTask ? <aside className="icm-task-drawer" role="dialog" aria-label="任务详情"><div className="icm-task-drawer-head"><div><strong>任务详情</strong><span>{selectedTask.id}</span></div><button type="button" onClick={() => setSelectedTaskId('')} aria-label="关闭任务详情"><X size={17} /></button></div><div className="icm-task-drawer-body"><Tag tone={toneByStatus(selectedTask.status) as Tone}>{selectedTask.status}</Tag><DetailLine label="任务类型" value={selectedTask.type} /><DetailLine label="所属计划" value={selectedTask.planId ?? '-'} /><DetailLine label="受检单位" value={selectedTask.unit} /><DetailLine label="检查期间" value={`${selectedTask.start} 至 ${selectedTask.end}`} /><DetailLine label="检查负责人" value={selectedTask.owner} /><DetailLine label="复核人" value={selectedTask.reviewer} /><DetailLine label="预期输出" value={selectedTask.outputs.join(' / ')} /><div className="icm-task-lifecycle">{lifecycle.map((item) => <span className={lifecycle.indexOf(item) <= lifecycle.indexOf(selectedTask.status) ? 'done' : ''} key={item}>{item}</span>)}</div><div className="icm-task-check-list"><div><span className="icm-task-check-icon pass"><ShieldCheck size={15} /></span><p><strong>回避校验</strong><em>人员与受检单位无冲突。</em></p><Tag tone="green">通过</Tag></div><div><span className="icm-task-check-icon pass"><UsersRound size={15} /></span><p><strong>检查小组</strong><em>已完成组建与分工。</em></p><Tag tone="green">已组建</Tag></div><div><span className={`icm-task-check-icon ${selectedTask.blockers.length ? 'warn' : 'pass'}`}>{selectedTask.blockers.length ? <TriangleAlert size={15} /> : <ShieldCheck size={15} />}</span><p><strong>推进情况</strong><em>{selectedTask.blockers.length ? selectedTask.blockers.join('；') : '无阻塞事项。'}</em></p><Tag tone={selectedTask.blockers.length ? 'amber' : 'green'}>{selectedTask.blockers.length ? '需跟踪' : '正常'}</Tag></div></div><div className="icm-task-close-rule">关闭前需完成底稿、取证及问题整改状态回写。</div></div><div className="icm-task-drawer-foot"><Button type="default-soft" onClick={() => navigate(`/dispatch-center?task=${selectedTask.id}`)}>任务派发</Button><Button type="primary-soft" icon={<FileCheck2 size={14} />} onClick={() => navigate('/review-workbench?view=execute')}>进入审查</Button><Button type="primary" icon={<Send size={14} />} onClick={() => navigate('/walkthrough-workbench')}>流程核验</Button></div></aside> : null}
  </PageFrame>
}
