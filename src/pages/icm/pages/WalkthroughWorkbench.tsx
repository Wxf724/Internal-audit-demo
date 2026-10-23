import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, FileCheck2, FilePlus2, FileText, Search, ShieldCheck } from 'lucide-react'

import { Button, Card, DataTable, DetailLine, PageFrame, Tag, Toolbar, type Tone } from '../components/IcmPageKit'
import { walkthrough } from '../data'

type TestResult = '待核验' | '通过' | '部分符合' | '不符合' | '待补证' | '不适用'

type TestTask = {
  id: string
  name: string
  unit: string
  period: string
  owner: string
  status: string
  template: string
  samples: Array<{ id: string; title: string; reference: string; reason: string }>
}

const testTasks: TestTask[] = [
  {
    id: 'WT-2026-001',
    name: '采购到付款流程核验',
    unit: '华北装备制造集团西北分公司',
    period: '2026-01-01 至 2026-06-30',
    owner: '李娜',
    status: '进行中',
    template: '采购到付款穿行测试模板 V2026.05',
    samples: [
      { id: 'S-HT-1182', title: '工程物资采购合同', reference: 'HT-1182 · 390 万', reason: '金额接近招标阈值' },
      { id: 'S-HT-1183', title: '同类物资补充合同', reference: 'HT-1183 · 395 万', reason: '同供应商短期连续签订' },
      { id: 'S-PAY-0620', title: '预付款审批单', reference: 'PAY-0620 · 620 万', reason: '付款比例高于合同约定' },
    ],
  },
  {
    id: 'WT-2026-002',
    name: '合同签订流程核验',
    unit: '华北装备制造集团西北分公司',
    period: '2026-01-01 至 2026-06-30',
    owner: '王锐',
    status: '待启动',
    template: '合同签订穿行测试模板 V2026.03',
    samples: [
      { id: 'S-CT-0944', title: '设备采购补充协议', reference: 'SP-2026-044 · 86 万', reason: '补充协议审批记录待核验' },
    ],
  },
]

function resultTone(value: TestResult): Tone {
  if (value === '不符合') return 'red'
  if (value === '部分符合' || value === '待补证') return 'amber'
  if (value === '通过') return 'green'
  return 'gray'
}

export default function WalkthroughWorkbench() {
  const navigate = useNavigate()
  const [taskId, setTaskId] = useState(testTasks[0].id)
  const [sampleId, setSampleId] = useState(testTasks[0].samples[0].id)
  const [nodeIndex, setNodeIndex] = useState(0)
  const [keyword, setKeyword] = useState('')
  const [notice, setNotice] = useState('')
  const [results, setResults] = useState<Record<string, TestResult>>(() => Object.fromEntries(walkthrough.map((item) => [item.node, item.result === '异常' ? '不符合' : item.result === '关注' ? '待补证' : '通过'])))

  const task = testTasks.find((item) => item.id === taskId) ?? testTasks[0]
  const sample = task.samples.find((item) => item.id === sampleId) ?? task.samples[0]
  const activeNode = walkthrough[nodeIndex]
  const filteredTasks = testTasks.filter((item) => !keyword.trim() || `${item.id}${item.name}${item.unit}`.includes(keyword.trim()))
  const resultSummary = useMemo(() => {
    const values = Object.values(results)
    return {
      completed: values.filter((item) => item !== '待核验').length,
      noncompliant: values.filter((item) => item === '不符合' || item === '部分符合').length,
      evidencePending: values.filter((item) => item === '待补证').length,
    }
  }, [results])

  const selectTask = (nextTask: TestTask) => {
    setTaskId(nextTask.id)
    setSampleId(nextTask.samples[0].id)
    setNodeIndex(0)
  }
  const setResult = (result: TestResult) => setResults((items) => ({ ...items, [activeNode.node]: result }))
  const saveRecord = () => {
    setNotice('测试记录已暂存')
    window.setTimeout(() => setNotice(''), 1800)
  }
  const createWorkpaper = () => {
    const target = resultSummary.noncompliant ? '问题底稿' : '合规底稿'
    setNotice(`已生成${target}草稿，正在进入审查记录`)
    window.setTimeout(() => navigate(`/workpaper?source=walkthrough&test=${task.id}`), 450)
  }

  return (
    <PageFrame title="穿行测试" subtitle="围绕检查任务抽取业务样本，逐节点核验控制执行，形成可复核的审查记录。" actions={<><Button type="default-soft" icon={<FileText size={15} />} onClick={saveRecord}>暂存记录</Button><Button type="primary" icon={<FileCheck2 size={15} />} onClick={createWorkpaper}>生成底稿</Button></>}>
      <Toolbar>
        <div className="icm-modal-search" style={{ width: 290 }}><Search size={14} /><input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索测试任务或受检单位" /></div>
        <span className="icm-toolbar-spacer" />
        <span className="icm-walkthrough-path">检查任务<ChevronRight size={14} />穿行测试<ChevronRight size={14} />审查记录</span>
      </Toolbar>

      <div className="icm-walkthrough-layout">
        <Card title="测试任务" note="从当前检查任务发起流程核验">
          <div className="icm-walkthrough-task-list">
            {filteredTasks.map((item) => <button className={`icm-walkthrough-task ${item.id === task.id ? 'active' : ''}`} key={item.id} type="button" onClick={() => selectTask(item)}><span><strong>{item.name}</strong><em>{item.id} · {item.unit}</em></span><Tag tone={item.status === '进行中' ? 'green' : 'gray'}>{item.status}</Tag></button>)}
          </div>
          <div className="icm-walkthrough-task-info"><DetailLine label="检查期间" value={task.period} /><DetailLine label="测试人员" value={task.owner} /><DetailLine label="调用模板" value={task.template} /></div>
        </Card>

        <Card title="样本与节点核验" note={`${sample.id} · ${sample.title}`} action={<Tag tone="blue">样本 {task.samples.findIndex((item) => item.id === sample.id) + 1}/{task.samples.length}</Tag>}>
          <div className="icm-walkthrough-samples">{task.samples.map((item) => <button className={item.id === sample.id ? 'active' : ''} key={item.id} type="button" onClick={() => setSampleId(item.id)}><strong>{item.id}</strong><span>{item.title}</span><em>{item.reason}</em></button>)}</div>
          <div className="icm-walkthrough-node-list">{walkthrough.map((item, index) => <button className={`icm-walkthrough-node ${index === nodeIndex ? 'active' : ''}`} key={item.node} type="button" onClick={() => setNodeIndex(index)}><span>{index + 1}</span><div><strong>{item.node}</strong><em>{item.control}</em></div><Tag tone={resultTone(results[item.node])}>{results[item.node]}</Tag></button>)}</div>
          <div className="icm-walkthrough-check-panel">
            <div className="icm-walkthrough-check-head"><div><strong>{activeNode.node}</strong><span>{activeNode.type}控制 · 样本：{sample.reference}</span></div><Tag tone={resultTone(results[activeNode.node])}>{results[activeNode.node]}</Tag></div>
            <DetailLine label="核验控制点" value={activeNode.control} />
            <DetailLine label="应取材料" value={activeNode.evidence} />
            <DetailLine label="通过标准" value={activeNode.passStandard} />
            <DetailLine label="不符合情形" value={activeNode.failStandard} />
            <div className="icm-walkthrough-result-actions">{(['通过', '部分符合', '不符合', '待补证', '不适用'] as TestResult[]).map((result) => <button className={results[activeNode.node] === result ? 'active' : ''} key={result} type="button" onClick={() => setResult(result)}>{result}</button>)}</div>
          </div>
        </Card>

        <Card title="测试结论" note="结论和取证将随底稿一并留痕">
          <div className="icm-walkthrough-summary"><div><b>{resultSummary.completed}</b><span>已核验节点</span></div><div><b>{resultSummary.noncompliant}</b><span>需形成问题记录</span></div><div><b>{resultSummary.evidencePending}</b><span>待补充证据</span></div></div>
          <DetailLine label="当前样本" value={sample.title} />
          <DetailLine label="抽样依据" value={sample.reason} />
          <DetailLine label="输出规则" value={resultSummary.noncompliant ? '存在不符合项，生成问题底稿草稿' : '未见不符合项，生成合规底稿草稿'} />
          <div className="icm-walkthrough-evidence"><ShieldCheck size={16} /><span>取证材料将关联至对应节点；待补证节点不能提交测试结论。</span></div>
          <div className="icm-actions" style={{ marginTop: 14 }}><Button type="primary-soft" icon={<FilePlus2 size={14} />} onClick={() => setNotice('已创建取证单草稿')}>创建取证单</Button><Button type="primary" onClick={createWorkpaper}>生成底稿</Button></div>
          {notice ? <div className="icm-walkthrough-notice">{notice}</div> : null}
        </Card>
      </div>

      <Card title="测试记录" note="测试实例、样本和底稿输出均可追溯。">
        <DataTable columns={['测试编号', '关联检查任务', '样本数', '不符合节点', '状态', '输出']} rows={[
          [task.id, task.name, `${task.samples.length} 个`, `${resultSummary.noncompliant} 个`, <Tag tone={resultSummary.evidencePending ? 'amber' : 'green'}>{resultSummary.evidencePending ? '待补证' : '可生成底稿'}</Tag>, <button className="icm-link" type="button" onClick={createWorkpaper}>查看/生成底稿</button>],
          ['WT-2026-000', '采购管理专项检查', '2 个', '0 个', <Tag tone="green">已归档</Tag>, 'WP-0460 合规底稿'],
        ]} />
      </Card>
    </PageFrame>
  )
}