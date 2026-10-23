import { forwardRef, useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Spinner } from '@heroui/react'

export type SpinSize = 'sm' | 'md' | 'lg' | 'xl'

export interface SpinProps {
  /** 是否为加载中 */
  spinning?: boolean
  /** 自定义描述，显示在图标下方 */
  tip?: ReactNode
  /** 延迟显示 loading 的时间（毫秒），避免闪烁；为 0 时不延迟 */
  delay?: number
  /** Spinner 尺寸，对应 HeroUI Spinner */
  size?: SpinSize
  /** Spinner 颜色 */
  color?: 'current' | 'accent' | 'success' | 'warning' | 'danger'
  /** 自定义指示器，传入则替换默认 Spinner */
  indicator?: ReactNode
  /** 最外层容器 className */
  className?: string
  /** 有 children 时，包裹内容的容器 className */
  wrapperClassName?: string
  /** 遮罩层 className（仅在有 children 且 spinning 时生效） */
  overlayClassName?: string
  /** 无 children 时，占位区域最小高度（Tailwind 类或任意 class） */
  minHeightClassName?: string
  /** 实际展示 loading 的状态变化回调（含 delay 生效后的结果） */
  onSpinningChange?: (visible: boolean) => void
  children?: ReactNode
}

/**
 * 类似 Ant Design Spin：基于 HeroUI Spinner，支持嵌套内容遮罩、tip、delay。
 */
export const Spin = forwardRef<HTMLDivElement, SpinProps>(function Spin(props, ref) {
  const {
    spinning = false,
    tip,
    delay = 0,
    size = 'lg',
    color = 'accent',
    indicator,
    className = '',
    wrapperClassName = '',
    overlayClassName = '',
    minHeightClassName = 'min-h-[120px]',
    onSpinningChange,
    children,
  } = props

  const [visible, setVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const labelId = useId()

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!spinning) {
      clearTimer()
      setVisible(false)
      return
    }

    if (delay <= 0) {
      setVisible(true)
      return
    }

    timerRef.current = setTimeout(() => {
      timerRef.current = null
      setVisible(true)
    }, delay)

    return clearTimer
  }, [spinning, delay, clearTimer])

  const onSpinningChangeRef = useRef(onSpinningChange)
  onSpinningChangeRef.current = onSpinningChange

  useEffect(() => {
    onSpinningChangeRef.current?.(visible)
  }, [visible])

  const showOverlay = spinning && visible

  const spinnerNode = indicator ?? <Spinner size={size} color={color} aria-hidden />

  const tipNode =
    tip != null && tip !== '' ? (
      <span id={labelId} className="text-xs text-gray-500 text-center max-w-[200px]">
        {tip}
      </span>
    ) : null

  // 仅图标模式（无 children）
  if (children == null) {
    if (!showOverlay) {
      return null
    }
    return (
      <div
        ref={ref}
        role="status"
        aria-busy="true"
        aria-live="polite"
        aria-labelledby={tipNode ? labelId : undefined}
        className={`inline-flex flex-col items-center justify-center gap-2 ${minHeightClassName} ${className}`}
      >
        {spinnerNode}
        {tipNode}
      </div>
    )
  }

  // 嵌套模式：内容 + 遮罩
  return (
    <div
      ref={ref}
      className={`relative block w-full min-h-0 ${wrapperClassName} ${className}`}
      aria-busy={showOverlay ? 'true' : 'false'}
      aria-live="polite"
    >
      <div
        className={
          showOverlay ? 'pointer-events-none select-none opacity-[0.45] transition-opacity' : ''
        }
      >
        {children}
      </div>
      {showOverlay ? (
        <div
          className={`absolute inset-0 z-10 flex items-center justify-center bg-(--surface)/60 backdrop-blur-[1px] ${overlayClassName}`}
          aria-hidden
        >
          <div
            role="status"
            className="flex flex-col items-center justify-center gap-2 px-4"
            aria-labelledby={tipNode ? labelId : undefined}
          >
            {spinnerNode}
            {tipNode}
          </div>
        </div>
      ) : null}
    </div>
  )
})
