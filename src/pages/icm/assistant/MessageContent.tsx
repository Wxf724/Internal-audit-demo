import { useMemo, type ReactNode } from 'react'

type BlockKind = 'p' | 'h' | 'ul' | 'ol' | 'code'

interface Block {
  kind: BlockKind
  lines: string[]
}

const INLINE_PATTERN = /(\*\*[^*\n]+\*\*|`[^`\n]+`)/g

/** 轻量解析要点、编号、标题与代码片段，避免直接把模型输出当 HTML 注入 */
function parseBlocks(content: string): Block[] {
  const blocks: Block[] = []
  const lines = content.replace(/\r\n?/g, '\n').split('\n')
  let paragraph: string[] = []
  let list: { kind: 'ul' | 'ol'; lines: string[] } | null = null
  let fence: string[] | null = null

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push({ kind: 'p', lines: [paragraph.join('\n')] })
      paragraph = []
    }
  }
  const flushList = () => {
    if (list) {
      blocks.push({ kind: list.kind, lines: list.lines })
      list = null
    }
  }
  const flushAll = () => {
    flushParagraph()
    flushList()
  }

  for (const line of lines) {
    const trimmed = line.trim()
    if (fence) {
      if (trimmed.startsWith('```')) {
        blocks.push({ kind: 'code', lines: [fence.join('\n')] })
        fence = null
      } else {
        fence.push(line)
      }
      continue
    }
    if (trimmed.startsWith('```')) {
      flushAll()
      fence = []
      continue
    }
    if (!trimmed) {
      flushAll()
      continue
    }
    const heading = trimmed.match(/^#{1,6}\s+(.+)$/)
    if (heading) {
      flushAll()
      blocks.push({ kind: 'h', lines: [heading[1]] })
      continue
    }
    const bullet = trimmed.match(/^[-*•·]\s+(.+)$/)
    if (bullet) {
      flushParagraph()
      if (!list || list.kind !== 'ul') {
        flushList()
        list = { kind: 'ul', lines: [] }
      }
      list.lines.push(bullet[1])
      continue
    }
    const ordered = trimmed.match(/^(\d{1,2})[.、)）]\s*(.+)$/)
    if (ordered) {
      flushParagraph()
      if (!list || list.kind !== 'ol') {
        flushList()
        list = { kind: 'ol', lines: [] }
      }
      list.lines.push(`${ordered[1]}. ${ordered[2]}`)
      continue
    }
    flushList()
    paragraph.push(trimmed)
  }
  flushAll()
  if (fence && fence.length) blocks.push({ kind: 'code', lines: [fence.join('\n')] })
  return blocks
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null = null
  INLINE_PATTERN.lastIndex = 0
  while ((match = INLINE_PATTERN.exec(text)) !== null) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index))
    const token = match[0]
    if (token.startsWith('**')) {
      nodes.push(<strong key={`${keyPrefix}-strong-${match.index}`}>{token.slice(2, -2)}</strong>)
    } else {
      nodes.push(<code key={`${keyPrefix}-code-${match.index}`}>{token.slice(1, -1)}</code>)
    }
    lastIndex = match.index + token.length
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex))
  return nodes
}

/** 答复正文渲染：段落、要点、编号、加粗与行内代码 */
export default function MessageContent({ content }: { content: string }) {
  const blocks = useMemo(() => parseBlocks(content), [content])
  return (
    <div className="icm-assistant-rich">
      {blocks.map((block, index) => {
        const key = `${index}-${block.kind}`
        if (block.kind === 'code') {
          return (
            <pre className="icm-assistant-rich-code" key={key}>
              <code>{block.lines[0]}</code>
            </pre>
          )
        }
        if (block.kind === 'h') {
          return (
            <p className="icm-assistant-rich-heading" key={key}>
              {renderInline(block.lines[0], key)}
            </p>
          )
        }
        if (block.kind === 'ul' || block.kind === 'ol') {
          return (
            <ul className={`icm-assistant-rich-list ${block.kind}`} key={key}>
              {block.lines.map((line, lineIndex) => (
                <li key={`${key}-${lineIndex}`}>{renderInline(line, `${key}-${lineIndex}`)}</li>
              ))}
            </ul>
          )
        }
        return <p key={key}>{renderInline(block.lines[0], key)}</p>
      })}
    </div>
  )
}
