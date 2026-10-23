import { useEffect, useRef, useState } from 'react'

export interface AiFabProps {
  /** 点击悬浮球回调 */
  onClick: () => void
  /** 悬浮提示与 title 文案 */
  title?: string
  /** 最外层定位 className（拖拽后会改用 left/top，默认 right/bottom 失效） */
  className?: string
}

const FAB_SIZE = 56
const DRAG_START_PX = 6

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max)

const toFabPos = (clientX: number, clientY: number, offsetX: number, offsetY: number) => ({
  x: clamp(clientX - offsetX, 0, window.innerWidth - FAB_SIZE),
  y: clamp(clientY - offsetY, 0, window.innerHeight - FAB_SIZE),
})

type DragState = {
  dragging: boolean
  pointerId: number
  startX: number
  startY: number
  offsetX: number
  offsetY: number
}

/** 右下角 AI 对话悬浮入口；按住移动可拖动位置 */
export function AiFab({ onClick, title = 'AI 对话助手', className }: AiFabProps) {
  const [hovered, setHovered] = useState(false)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const [dragging, setDragging] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  // 拖动结束后浏览器可能补发一次 click，这里短暂拦截，避免误打开对话。
  const suppressNextClickRef = useRef(false)
  const suppressClickTimerRef = useRef(0)
  const dragRef = useRef<DragState>({
    dragging: false,
    pointerId: -1,
    startX: 0,
    startY: 0,
    offsetX: FAB_SIZE / 2,
    offsetY: FAB_SIZE / 2,
  })

  useEffect(() => {
    return () => clearTimeout(suppressClickTimerRef.current)
  }, [])

  const resetDrag = () => {
    dragRef.current.dragging = false
    dragRef.current.pointerId = -1
    setDragging(false)
  }

  const suppressNextClick = () => {
    suppressNextClickRef.current = true
    clearTimeout(suppressClickTimerRef.current)
    suppressClickTimerRef.current = window.setTimeout(() => {
      suppressNextClickRef.current = false
    }, 250)
  }

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return
    const rect = e.currentTarget.getBoundingClientRect()
    btnRef.current?.setPointerCapture(e.pointerId)

    // 记录按下点在悬浮球内部的位置，拖动时保持这个偏移，避免球体跳动。
    dragRef.current = {
      dragging: false,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    }
  }

  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = dragRef.current
    if (d.pointerId !== e.pointerId) return

    const moveDistance = Math.hypot(e.clientX - d.startX, e.clientY - d.startY)

    if (!d.dragging) {
      // 小范围移动仍按点击处理，超过阈值才认为用户是在拖动。
      if (moveDistance < DRAG_START_PX) return

      d.dragging = true
      suppressNextClick()
      setDragging(true)
      setHovered(false)
    }

    e.preventDefault()
    setPos(toFabPos(e.clientX, e.clientY, d.offsetX, d.offsetY))
  }

  const onPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = dragRef.current
    if (d.pointerId !== e.pointerId) return

    if (d.dragging) {
      suppressNextClick()
    }

    btnRef.current?.releasePointerCapture(e.pointerId)
    resetDrag()
  }

  const onPointerCancel = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (dragRef.current.pointerId !== e.pointerId) return
    if (dragRef.current.dragging) {
      suppressNextClick()
    }
    btnRef.current?.releasePointerCapture(e.pointerId)
    resetDrag()
  }

  const onButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // 拖动后的合成 click 只负责收尾，不触发业务 onClick。
    if (suppressNextClickRef.current) {
      e.preventDefault()
      e.stopPropagation()
      clearTimeout(suppressClickTimerRef.current)
      suppressNextClickRef.current = false
      return
    }

    onClick()
  }

  const anchored = pos == null

  return (
    <button
      ref={btnRef}
      type="button"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onClick={onButtonClick}
      onMouseEnter={() => !dragging && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`fixed z-40 group h-14 w-14 touch-none select-none ${
        anchored ? 'right-6 bottom-6' : ''
      } ${dragging ? 'cursor-grabbing' : 'cursor-grab'} ${className ?? ''}`}
      style={pos ? { left: pos.x, top: pos.y } : undefined}
      title={title}
    >
      {/* Ripple rings */}
      <span
        className={`absolute inset-0 rounded-full bg-(--accent)/20 ${dragging ? '' : 'animate-ping'}`}
      />
      <span className="absolute inset-[-4px] rounded-full bg-(--focus-ring)/10" />

      {/* Ball */}
      <div
        className="relative flex h-14 w-14 items-center justify-center rounded-full transition-all duration-300"
        style={{
          background: 'linear-gradient(135deg, var(--accent-hover) 0%, var(--accent) 100%)',
          boxShadow: dragging
            ? '0 0 0 8px color-mix(in srgb, var(--accent) 20%, transparent), 0 12px 36px color-mix(in srgb, var(--accent-hover) 45%, transparent)'
            : hovered
              ? '0 0 0 8px color-mix(in srgb, var(--accent) 15%, transparent), 0 8px 32px color-mix(in srgb, var(--accent-hover) 50%, transparent)'
              : '0 0 0 4px color-mix(in srgb, var(--accent) 10%, transparent), 0 4px 20px color-mix(in srgb, var(--accent-hover) 40%, transparent)',
          transform: hovered && !dragging ? 'scale(1.08)' : 'scale(1)',
        }}
      >
        <i className="ri-chat-ai-line text-xl text-white" />
      </div>

      {/* Tooltip */}
      {hovered && !dragging && (
        <div className="pointer-events-none absolute right-full top-1/2 mr-3 -translate-y-1/2 whitespace-nowrap rounded-lg bg-gray-900 px-3 py-1.5 text-xs text-white">
          {title}
          <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-gray-900" />
        </div>
      )}
    </button>
  )
}
