import { useMemo, useState } from 'react'
import { FileText, Sparkles, UploadCloud } from 'lucide-react'
import { Button, Modal } from '@/components'
import MessageContent from '../../assistant/MessageContent'
import { ConversationDraft } from './ConversationDraft'
import { ResourcePreview } from './ResourcePreview'
import { downloadBlob } from './planFiles'
import { EXAMPLE_STEPS, createConversationExample, exampleChangeMessage, exampleSupplementText } from './planningExample'
import { exampleMessages, exampleResources } from './conversationExampleData'
import type { PlanResource } from './conversationTypes'
import './conversation-example.css'

interface ConversationExampleProps {
  onClose: () => void
  onUsePrompt?: (prompt: string) => void
  onUpload?: () => void
}

export function ConversationExample({ onClose, onUsePrompt, onUpload }: ConversationExampleProps) {
  const [step, setStep] = useState(3)
  const [draft, setDraft] = useState<number | null>(null)
  const [changes, setChanges] = useState(false)
  const [resource, setResource] = useState<PlanResource | null>(null)
  const plan = useMemo(() => createConversationExample(draft ?? 3), [draft])
  const changeMessage = useMemo(exampleChangeMessage, [])
  const current = EXAMPLE_STEPS[step]
  const messages = current.round === undefined ? [] : exampleMessages.slice(current.round * 2, current.round * 2 + 2)
  const supplement = exampleResources.find((entry) => entry.id === 'example:supplement')!
  const openDraft = (version: number, showChanges = false) => { setDraft(version); setChanges(showChanges) }
  return <>
    <Modal className="annual-overlay plan-example-overlay" open drawer width="min(1080px, 100vw)" title="编制示例 · 2027 年度" onClose={onClose} footer={<><Button onClick={onClose}>返回编制</Button><Button disabled={step === 0} onClick={() => setStep(step - 1)}>上一步</Button><Button disabled={step === EXAMPLE_STEPS.length - 1} onClick={() => setStep(step + 1)}>下一步</Button></>}>
      <div className="plan-example-heading"><span><strong>6 个项目</strong>270 / 300 人天 · 草案 V3</span><Button onClick={() => openDraft(3)}>查看最终草案</Button></div>
      <div className="plan-example-layout">
        <nav className="plan-example-nav" aria-label="编制示例步骤">{EXAMPLE_STEPS.map((entry, index) => <button key={entry.name} aria-current={index === step ? 'step' : undefined} onClick={() => setStep(index)}><span>{String(index + 1).padStart(2, '0')}</span>{entry.name}</button>)}</nav>
        <section className="plan-example-content" key={step} aria-label={current.name}>
          <h2>{current.name}</h2><p className="plan-example-action">{current.action}</p>
          {step === 0 && <><div className="plan-example-tools"><dl><dt>选择推荐资源</dt><dd>快速勾选风险、关联对象、必审事项和预算。</dd><dt>已选 / 查看全部</dt><dd>切换本轮引用与全部资料，不改变勾选结果。</dd><dt>历史版本</dt><dd>查阅旧版资料，核对依据变化。</dd></dl></div><div className="plan-example-resources">{exampleResources.filter((entry) => entry.id !== supplement.id).map((entry) => <button key={entry.id} onClick={() => setResource(entry)}><FileText size={14} /><span>{entry.name}<small>{entry.category}</small></span></button>)}</div></>}
          {step === 2 && <><div className="plan-example-file"><UploadCloud size={24} /><div><strong>{supplement.name}</strong><span>已核对并加入引用 · {supplement.category}</span></div></div><p className="plan-example-file-text">{exampleSupplementText}</p><div className="annual-actions"><Button onClick={() => downloadBlob(new Blob([exampleSupplementText], { type: 'text/plain;charset=utf-8' }), supplement.name)}>下载示例文件</Button>{onUpload && <Button type="primary" onClick={onUpload}>去上传文件</Button>}</div></>}
          {messages.map((message, index) => <article key={index} className={`plan-chat-message ${message.role}`}><div className="plan-message-meta">{message.role === 'user' ? '内审机构' : <><Sparkles size={13} />编制助手 · 已生成示例</>}</div><div className="plan-message-text"><MessageContent content={message.text} /></div>{message.role === 'user' && onUsePrompt && <button className="plan-text-action plan-example-use" onClick={() => onUsePrompt(message.text)}>填入对话</button>}{message.role === 'assistant' && <details className="plan-message-resources"><summary>引用 {step === 1 ? 14 : 15} 项资源</summary>{exampleResources.filter((entry) => step !== 1 || entry.id !== supplement.id).map((entry) => <button className="plan-reference-link" key={entry.id} onClick={() => setResource(entry)}>{entry.name}</button>)}</details>}</article>)}
          {step === 3 && <div className="plan-example-result"><FileText size={22} /><div><strong>已采用为草案 V1</strong><span>6 个项目 · 270 人天</span></div><Button type="primary" onClick={() => openDraft(1)}>查看草案 V1</Button></div>}
          {step === 4 && <div className="plan-example-result"><FileText size={22} /><div><strong>已采用为草案 V2</strong><span>采购开始、结束日期调整 · 其他项目不变</span></div><Button type="primary" onClick={() => openDraft(2, true)}>查看变更</Button></div>}
          {step === 5 && <><table className="plan-example-versions"><thead><tr><th>草案版本</th><th>采购实施窗口</th><th>操作</th></tr></thead><tbody>{[1, 2, 3].map((version) => { const item = createConversationExample(version).content.items[0]; return <tr key={version}><td>V{version} · {['首次采用', '对话调整', '人工修改'][version - 1]}</td><td>{item.start} 至 {item.end}</td><td><button className="plan-text-action" onClick={() => openDraft(version)}>查看</button></td></tr> })}</tbody></table><Button type="primary" onClick={() => openDraft(3)}>查看草案 V3</Button></>}
          {step === 6 && <div className="plan-example-review"><strong>送审前确认</strong><ul><li>2026 年未完成项目是否结转，剩余人天是多少。</li><li>必审事项正式期限、覆盖期间及专业人员投入。</li><li>批准主体、本单位制度条款和适用的审议环节。</li></ul><strong>本例的审议安排</strong><p>内审机构负责人审核 → 党委前置研究 → 董事会批准</p><p>以本单位制度为准。示例尚未提交审议。</p></div>}
          <div className="plan-example-outcome">{current.result}</div>
        </section>
      </div>
    </Modal>
    {draft !== null && <ConversationDraft key={`${draft}-${changes}`} plan={plan} message={changes ? changeMessage : undefined} title={changes ? '示例草案 · V1 → V2' : '示例草案'} closeLabel="返回示例" availableResources={exampleResources} editable={false} onClose={() => setDraft(null)} onAccept={() => {}} onAsk={() => {}} />}
    {resource && <ResourcePreview resource={resource} onClose={() => setResource(null)} />}
  </>
}
