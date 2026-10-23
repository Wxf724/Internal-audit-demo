import { forwardRef, useMemo, type CSSProperties, type MouseEvent, type ReactNode } from 'react'
import { Button as HeroButton } from '@heroui/react'
import type { SizePreset } from '../theme'

export type ButtonType =
  | 'primary'
  | 'info'
  | 'warn'
  | 'success'
  | 'danger'
  | 'default'
  | 'primary-soft'
  | 'info-soft'
  | 'warn-soft'
  | 'success-soft'
  | 'danger-soft'
  | 'default-soft'
  | 'outline'
  | 'ghost'

export type ButtonSize = SizePreset

export interface ButtonProps {
  /** 按钮内容 */
  children?: ReactNode
  /**
   * 按钮类型，颜色引用 :root 中定义的 CSS 变量。
   * 不传时可通过 `className` 完全自定义样式。
   */
  type?: ButtonType
  /**
   * 尺寸，默认 `sm`
   */
  size?: ButtonSize
  /** 是否禁用 */
  disabled?: boolean
  /** 加载中，显示 loading 指示器并禁用点击 */
  loading?: boolean
  /** 左侧图标 */
  icon?: ReactNode
  /** 右侧图标 */
  rightIcon?: ReactNode
  /** HTML button type */
  htmlType?: 'button' | 'submit' | 'reset'
  /** 是否撑满容器宽度 */
  fullWidth?: boolean
  /** 自定义样式（不传 `type` 时可自由控制） */
  className?: string
  /** 点击回调 */
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void
  ref?: React.Ref<HTMLButtonElement>
}

/**
 * solid 类型配置：
 * - primary / danger 直接用 HeroUI 原生 variant
 * - warn / success 基于 primary 结构 + CSS 自定义属性覆盖颜色
 */
function resolveSolid(type: ButtonType): {
  variant: 'primary' | 'danger'
  style?: CSSProperties
} {
  switch (type) {
    case 'primary':
      return {
        variant: 'primary',
        style: {
          '--button-bg': 'var(--accent)',
          '--button-bg-hover': 'var(--btn-primary-hover)',
          '--button-bg-pressed': 'var(--accent-hover)',
          '--button-fg': 'var(--accent-foreground)',
        } as CSSProperties,
      }
    case 'danger':
      return { variant: 'danger' }
    case 'info':
      return {
        variant: 'primary',
        style: {
          '--button-bg': 'var(--info)',
          '--button-bg-hover': 'var(--btn-info-hover)',
          '--button-bg-pressed': 'var(--btn-info-hover)',
          '--button-fg': '#ffffff',
        } as CSSProperties,
      }
    case 'default':
      return {
        variant: 'primary',
        style: {
          '--button-bg': 'var(--border-light)',
          '--button-bg-hover': 'var(--border)',
          '--button-bg-pressed': 'var(--border)',
          '--button-fg': 'var(--btn-default-text)',
        } as CSSProperties,
      }
    case 'warn':
      return {
        variant: 'primary',
        style: {
          '--button-bg': 'var(--warning)',
          '--button-bg-hover': 'var(--btn-warn-hover)',
          '--button-bg-pressed': 'var(--btn-warn-hover)',
          '--button-fg': '#ffffff',
        } as CSSProperties,
      }
    case 'success':
      return {
        variant: 'primary',
        style: {
          '--button-bg': 'var(--success)',
          '--button-bg-hover': 'var(--btn-success-hover)',
          '--button-bg-pressed': 'var(--btn-success-hover)',
          '--button-fg': '#ffffff',
        } as CSSProperties,
      }
    default:
      return { variant: 'primary' }
  }
}

/**
 * soft 类型 className：
 * 普通态：border + 半透明背景 + 彩色文字
 * hover：背景/边框变为实色，文字变白
 */
function resolveSoftClass(type: ButtonType): string {
  switch (type) {
    case 'primary-soft':
      return [
        'border',
        'border-[var(--btn-primary-soft-border)]',
        'bg-[var(--accent-soft)]',
        'text-[var(--btn-primary-soft-text)]',
        'hover:border-[var(--accent)]',
        'hover:bg-[var(--accent)]',
        'hover:text-white',
      ].join(' ')
    case 'info-soft':
      return [
        'border',
        'border-[var(--btn-info-soft-border)]',
        'bg-[var(--info-soft)]',
        'text-[var(--btn-info-soft-text)]',
        'hover:border-[var(--btn-info-hover)]',
        'hover:bg-[var(--btn-info-hover)]',
        'hover:text-white',
      ].join(' ')
    case 'warn-soft':
      return [
        'border',
        'border-[var(--btn-warn-soft-border)]',
        'bg-[var(--warning-soft)]',
        'text-[var(--btn-warn-soft-text)]',
        'hover:border-[var(--btn-warn-hover)]',
        'hover:bg-[var(--btn-warn-hover)]',
        'hover:text-white',
      ].join(' ')
    case 'success-soft':
      return [
        'border',
        'border-[var(--btn-success-soft-border)]',
        'bg-[var(--success-soft)]',
        'text-[var(--btn-success-soft-text)]',
        'hover:border-[var(--btn-success-hover)]',
        'hover:bg-[var(--btn-success-hover)]',
        'hover:text-white',
      ].join(' ')
    case 'danger-soft':
      return [
        'border',
        'border-[var(--btn-danger-soft-border)]',
        'bg-[var(--danger-soft)]',
        'text-[var(--btn-danger-soft-text)]',
        'hover:border-[var(--danger)]',
        'hover:bg-[var(--danger)]',
        'hover:text-white',
      ].join(' ')
    case 'default-soft':
      return [
        'border',
        'border-[var(--border)]',
        'bg-(--surface)',
        'text-[var(--btn-default-text)]',
        'hover:border-[var(--text-tertiary)]',
        'hover:bg-[var(--border-light)]',
        'hover:text-[var(--btn-default-text)]',
      ].join(' ')
    default:
      return ''
  }
}

function isSoft(type: ButtonType): boolean {
  return type.endsWith('-soft')
}

/** 将 ButtonType 映射为 HeroUI variant */
function resolveVariant(type?: ButtonType): 'primary' | 'danger' | 'outline' | 'ghost' {
  if (!type) return 'primary'
  if (type === 'outline') return 'outline'
  if (type === 'ghost') return 'ghost'
  if (isSoft(type)) return 'primary'
  return resolveSolid(type).variant
}

/** xs 尺寸：HeroUI Button 只有 sm/md/lg，xs 需自定义 */
const XS_CLASS = '!h-6.5 !min-h-6.5 !px-2  [&>svg]:!size-3.5'

/** 覆盖 HeroUI 默认 rounded-3xl(24px) 和 text-sm(14px)，与项目控件统一 */
const SIZE_RADIUS: Record<ButtonSize, string> = {
  xs: 'rounded-lg',
  sm: 'rounded-xl',
  md: 'rounded-2xl',
  lg: 'rounded-2xl',
}
const SIZE_FONT: Record<ButtonSize, string> = {
  xs: 'text-xs',
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
}

/**
 * 通用 Button 组件
 *
 * 基于 HeroUI Button 封装：
 * - solid：primary / info / warn / success / danger / default
 * - soft：对应 -soft 后缀，边框 + 半透明背景，hover 反转为实底白字
 * - outline / ghost：直接对应 HeroUI outline / ghost 变体
 * - 颜色引用 :root CSS 变量
 * - 尺寸：xs / sm / md / lg（默认 sm）
 * - 加载态 / 图标 / className 自定义
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(props, ref) {
  const {
    children,
    type,
    size = 'sm',
    disabled = false,
    loading = false,
    icon,
    rightIcon,
    htmlType = 'button',
    fullWidth = false,
    className = '',
    onClick,
  } = props

  const resolvedType = type || 'primary'
  const solidConfig = useMemo(() => (!isSoft(resolvedType) ? resolveSolid(resolvedType) : null), [resolvedType])
  const softClass = useMemo(() => (isSoft(resolvedType) ? resolveSoftClass(resolvedType) : ''), [resolvedType])

  const isDisabled = disabled || loading

  const sizeClass = size === 'xs' ? XS_CLASS : ''
  const heroSize = size === 'xs' ? 'sm' : size

  const loadingNode = loading ? (
    <svg
      className="animate-spin size-4 shrink-0"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      data-slot="spinner"
      aria-hidden
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  ) : null

  return (
    <HeroButton
      ref={ref}
      type={htmlType}
      variant={resolveVariant(resolvedType)}
      size={heroSize}
      isDisabled={isDisabled}
      data-pending={loading ? 'true' : undefined}
      onClick={onClick}
      style={solidConfig?.style}
      className={`${sizeClass} ${SIZE_RADIUS[size]} ${SIZE_FONT[size]} ${softClass} ${className}`}
    >
      {loading ? loadingNode : icon}
      {children}
      {!loading && rightIcon}
    </HeroButton>
  )
})

export default Button
