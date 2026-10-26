import { useEffect, useRef, useState } from 'react'
import { Sparkles, Send } from 'lucide-react'
import { Button, Textarea } from '@/components'
import type { AuditProject, ProjectPreparation } from '../data/auditProjects'
import { buildPreparationDraft, preparationChapters, preparationChecks, preparationText, type PreparationChapter, type PreparationText } from './preparationDraft'

interface Proposal { text: Partial<PreparationText>; before: string }
export function PreparationComposer({ project, draft, locked, onChange, chapter, setChapter }: { project: AuditProject; draft: ProjectPreparation; locked: boolean; onChange: (value: ProjectPreparation) => void; chapter: PreparationChapter; setChapter: (value: PreparationChapter) => void }) {
  const [input, setInput] = useState(''), [proposal, setProposal] = useState<Proposal>()
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([])
  const [undo, setUndo] = useState<{ before: PreparationText; after: string }>()
  const log = useRef<HTMLDivElement>(null)
  useEffect(() => { if (log.current) log.current.scrollTop = log.current.scrollHeight }, [messages])
  const fingerprint = JSON.stringify({ text: preparationText(draft), scope: project.scope, refs: project.resourceRefs, version: project.preparation?.version })
  const stale = Boolean(proposal && proposal.before !== fingerprint)
  const current = preparationChapters.find(c => c.key === chapter)!
  const say = (text: string) => setMessages(m => [...m, { role: 'assistant', text }])
  const run = (request: string) => {
    const command = request.trim(); if (!command || locked) return
    setInput(''); setMessages(m => [...m, { role: 'user', text: command }])
    if (/^(检查|核对).*(缺项|方案)/.test(command)) {
      const missing = preparationChecks(draft).filter(c => !c.complete).map(c => c.title)
      say((missing.length ? '提交前还需补充：' + missing.join('、') + '。' : '五项必填内容已填写。') + (project.resourceRefs?.length ? '' : '尚未引用审计依据，可在下方选用资源。') + '请核实抽样总体、样本量、人员职责和时间安排。本地检查仅识别字段缺项，不能替代专业复核。'); return
    }
    if (stale) { say('正文或引用资料已变化，请先放弃旧提案，再重新生成，避免覆盖新内容。'); return }
    const named = preparationChapters.find(c => command.includes(c.title) || command.includes(c.label))
    const key = named?.key ?? chapter
    const keys = /全部|完整/.test(command) ? preparationChapters.map(c => c.key) : [key]
    const base = { ...preparationText(draft), ...proposal?.text }
    const next: Partial<PreparationText> = { ...proposal?.text }
    const replace = command.match(/将[“"](.+?)[”"]替换为[“"](.+?)[”"]/)
    const append = command.match(/(?:补充|追加)[：:]\s*([\s\S]+)/)
    if (replace) {
      if (!keys.some(k => base[k].includes(replace[1]))) { say('在所选章节中没有找到需要替换的原文，请核对引号内的内容。'); return }
      keys.forEach(k => { next[k] = base[k].split(replace[1]).join(replace[2]) })
    } else if (append) keys.forEach(k => { next[k] = [base[k], append[1]].filter(Boolean).join('\n') })
    else if (/^(生成|起草)/.test(command)) { const generated = buildPreparationDraft(project); keys.forEach(k => { next[k] = generated[k] }) }
    else if (/条目|分段|删除重复/.test(command)) {
      if (keys.some(k => !base[k].trim())) { say('所选章节尚无正文，请先生成初稿或手动填写。'); return }
      keys.forEach(k => { const lines = base[k].split(/\n+/).map(s => s.trim()).filter(Boolean); next[k] = /删除重复/.test(command) ? [...new Set(lines)].join('\n') : /条目/.test(command) ? lines.map((s, i) => `${i + 1}. ${s.replace(/^\d+[.、]\s*/, '')}`).join('\n') : lines.join('\n\n') })
    }
    else { say('本地演示支持：生成完整初稿、生成当前章节、改成条目、分段、删除重复行、补充：具体文字，以及将“原文”替换为“新文”。复杂专业修改请在右侧直接编辑。'); return }
    setChapter(keys[0]); setProposal({ text: next, before: fingerprint })
    say('已更新右侧修改预览：' + keys.map(k => preparationChapters.find(c => c.key === k)!.title).join('、') + '。可继续提出修改要求，核对后采纳到方案草稿。')
  }
  const accept = () => {
    if (!proposal || stale || locked) return
    if (Object.values(proposal.text).some(v => !v.trim())) { say('提案中存在空章节，请补充后再采纳。'); return }
    const next = { ...draft, ...proposal.text }
    setUndo({ before: preparationText(draft), after: JSON.stringify(preparationText(next)) })
    onChange(next); setProposal(undefined); say('已采纳到右侧方案草稿，尚未提交审核。请核对内容，并点击下方“保存方案”。')
  }
  const restore = () => {
    if (!undo || JSON.stringify(preparationText(draft)) !== undo.after) { say('正文已继续修改，不能直接撤销覆盖；请手动调整。'); return }
    onChange({ ...draft, ...undo.before }); setUndo(undefined); setProposal(undefined); say('已撤销上次采纳，恢复之前的方案正文。')
  }
  return <div className={'prep-writing' + (locked ? ' is-readonly' : '')}>
    {!locked && <aside className="prep-assistant" aria-label="方案编制助手">
      <div className="prep-assistant-head"><strong><Sparkles size={16} /> AI 方案助手</strong><span>本地演示 · 不外发</span></div>
      <div className="prep-conversation" ref={log} role="log" aria-label="方案对话记录" aria-live="polite">
        <div className="prep-intro"><b>先生成，再核对</b><p>已带入本项目对象、范围、期间和引用依据。先生成三章初稿，再按章节修改右侧内容。</p><Button type="primary" onClick={() => run('生成完整初稿')}>生成完整初稿</Button><small>本地模板生成与规则修改；人员、样本量和送达情况须据实确认。</small></div>
        {messages.map((m, i) => <div key={i} className={'prep-message ' + m.role}><strong>{m.role === 'user' ? '你' : '方案助手'}</strong><p>{m.text}</p></div>)}
      </div>
      <div className="prep-composer">
        <div className="prep-quick"><button onClick={() => run('生成当前章节')}>生成本章</button><button onClick={() => run('当前章节改成条目')}>改成条目</button><button onClick={() => run('检查方案缺项')}>检查缺项</button></div>
        <label htmlFor={'prep-request-' + project.id}>修改对象：{current.title}</label>
        <textarea id={'prep-request-' + project.id} aria-label="方案修改要求" value={input} onChange={e => setInput(e.target.value)} placeholder="例如：补充：对重复发生的问题扩大抽样范围" rows={3} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); run(input) } }} />
        <div className="prep-send"><small>Enter 发送 · Shift + Enter 换行</small><Button disabled={!input.trim()} icon={<Send size={14} />} onClick={() => run(input)}>发送要求</Button></div>
      </div>
    </aside>}
    <section className="prep-document" aria-label="方案正文">
      <div className="prep-document-head"><strong>{proposal ? '修改预览 · 待采纳' : locked ? '项目审计方案' : '方案草稿 · 可直接编辑'}</strong>{!locked && undo && !proposal && <button className="icm-link" onClick={restore}>撤销上次采纳</button>}</div>
      <div className="prep-chapters" role="group" aria-label="方案章节">{preparationChapters.map(c => <button key={c.key} aria-label={c.title} aria-pressed={chapter === c.key} onClick={() => setChapter(c.key)}>{c.title}{proposal?.text[c.key] !== undefined && <i aria-label="有修改">·</i>}</button>)}</div>
      <div className="prep-document-body"><h3>{current.label}</h3><p className="prep-muted">{current.hint}</p>
        {stale && <p role="alert" className="project-error">正文或引用资料已变化。请放弃旧提案，重新生成。</p>}
        {proposal?.text[chapter] !== undefined && <details className="prep-original"><summary>查看修改前正文</summary><pre>{draft[chapter] || '尚未填写'}</pre></details>}
        {locked ? <div className="prep-readonly">{draft[chapter] || '未填写'}</div> : <Textarea aria-label={proposal?.text[chapter] !== undefined ? '方案修改预览' : current.label} value={proposal?.text[chapter] ?? draft[chapter]} onChange={value => proposal?.text[chapter] !== undefined ? setProposal({ ...proposal, text: { ...proposal.text, [chapter]: value } }) : onChange({ ...draft, [chapter]: value })} rows={10} placeholder={current.hint} />}
      </div>
      {proposal && <div className="prep-proposal-actions"><span>{Object.keys(proposal.text).length} 章待采纳</span><Button type="default" onClick={() => { setProposal(undefined); say('已放弃提案，方案正文保持原样。') }}>放弃提案</Button><Button type="primary" disabled={stale || locked} onClick={accept}>采纳到方案</Button></div>}
    </section>
  </div>
}
