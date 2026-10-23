import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  TextField,
  InputGroup,
  Description,
} from '@heroui/react'
import { sizePresets, type SizePreset } from '../theme'

/** Textarea 尺寸 */
export type TextareaSize = SizePreset

export interface TextareaAutoSize {
  /** 最小行数 */
  minRows?: number
  /** 最大行数 */
  maxRows?: number
}

export interface TextareaProps {
  /** 受控值 */
  value?: string
  /** 非受控默认值 */
  defaultValue?: string
  /** 值变化回调，参数为新值 */
  onChange?: (value: string) => void
  /** 占位文案 */
  placeholder?: string
  /** 是否禁用 */
  disabled?: boolean
  /** 是否只读 */
  readOnly?: boolean
  /** 辅助说明（输入框下方文案） */
  description?: ReactNode
  /** 左侧图标/内容（显示在 textarea 左上角） */
  leftIcon?: ReactNode
  /** 右侧图标/内容（显示在 textarea 右上角） */
  rightIcon?: ReactNode
  /** 可见行数（不传 autoSize 时生效） */
  rows?: number
  /**
   * 自适应内容高度
   * - `true`：无限制自适应
   * - `{ minRows, maxRows }`：在 min/max 行数间自适应
   */
  autoSize?: boolean | TextareaAutoSize
  /** 最大输入长度（同时影响 showCount 统计） */
  maxLength?: number
  /** 是否展示字数统计，需配合 maxLength 使用 */
  showCount?: boolean
  /**
   * 尺寸（对标 Ant Design Input.TextArea `size`）
   * @default 'sm'
   */
  size?: TextareaSize
  /** 最外层容器 className（加到 TextField 上） */
  className?: string
  /** 输入组容器 className（加到 InputGroup 上） */
  inputGroupClassName?: string
  /** HTML name 属性 */
  name?: string
  /** 自动聚焦 */
  autoFocus?: boolean
  /** 是否必填 */
  isRequired?: boolean
  /** 外部 ref 指向实际 <textarea> 元素 */
  ref?: React.Ref<HTMLTextAreaElement>
}

/** 估算单行高度（px），用于 autoSize 行数↔像素换算 */
const ESTIMATED_LINE_HEIGHT = 22

function resolveAutoSize(
  autoSize: boolean | TextareaAutoSize | undefined
): TextareaAutoSize | null {
  if (autoSize === true) return {}
  if (typeof autoSize === 'object') return autoSize
  return null
}

// ── 尺寸（覆盖 HeroUI 内置的 min-h-9 / py-2，与 searchable-select 对齐） ──
const TEXTAREA_SIZE_CLASS: Record<TextareaSize, { group: string; input: string }> = {
  xs: {
    group: '!min-h-[var(--control-height-xs)]',
    input: '!py-[5px] !text-xs',
  },
  sm: {
    group: '!min-h-[var(--control-height-sm)]',
    input: '!py-1.5',
  },
  md: {
    group: '!min-h-[var(--control-height-md)]',
    input: '',
  },
  lg: {
    group: '!min-h-[var(--control-height-lg)]',
    input: '!py-[7px]',
  },
}

const ICON_SIZE_CLASS: Record<TextareaSize, string> = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
}

/**
 * 通用 Textarea 组件
 *
 * 基于 HeroUI TextField + InputGroup.TextArea 封装，对标 Ant Design Input.TextArea：
 * - 左右图标（leftIcon / rightIcon）
 * - 自适应高度（autoSize）
 * - 字数统计（showCount + maxLength）
 * - 尺寸（size：xs / sm / md / lg）
 * - 辅助说明（description）
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(props, ref) {
    const {
      value,
      defaultValue,
      onChange,
      placeholder,
      disabled = false,
      readOnly = false,
      description,
      leftIcon,
      rightIcon,
      rows = 3,
      autoSize,
      maxLength,
      showCount = false,
      size = 'sm',
      className = '',
      inputGroupClassName = '',
      name,
      autoFocus,
      isRequired,
    } = props

    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const autoSizeKey =
      autoSize === true
        ? 'true'
        : typeof autoSize === 'object'
          ? `${autoSize.minRows ?? '*'}-${autoSize.maxRows ?? '*'}`
          : 'false'
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const autoSizeConfig = useMemo(() => resolveAutoSize(autoSize), [autoSizeKey])
    const sz = sizePresets[size]
    const isControlled = value !== undefined
    const [innerValue, setInnerValue] = useState(defaultValue ?? '')
    const currentValue = isControlled ? value : innerValue

    const handleChange = useCallback(
      (newValue: string) => {
        if (!isControlled) setInnerValue(newValue)
        onChange?.(newValue)
      },
      [isControlled, onChange]
    )

    // 将外部 ref 同时绑定到内部 textareaRef
    const mergedTextareaRef = useCallback(
      (node: HTMLTextAreaElement | null) => {
        (textareaRef as React.MutableRefObject<HTMLTextAreaElement | null>).current =
          node
        if (typeof ref === 'function') {
          ref(node)
        } else if (ref) {
          ;(ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = node
        }
      },
      [ref]
    )

    // ── autoSize：监听输入变化，动态调整高度 ──
    useEffect(() => {
      const el = textareaRef.current
      if (!el || !autoSizeConfig) return

      const adjustHeight = () => {
        // 重置高度以获取准确的 scrollHeight
        el.style.height = 'auto'

        const computed = window.getComputedStyle(el)
        const lineHeight = parseFloat(computed.lineHeight) || ESTIMATED_LINE_HEIGHT
        const minH = autoSizeConfig.minRows
          ? autoSizeConfig.minRows * lineHeight +
            parseFloat(computed.paddingTop || '0') +
            parseFloat(computed.paddingBottom || '0') +
            parseFloat(computed.borderTopWidth || '0') +
            parseFloat(computed.borderBottomWidth || '0')
          : 0
        const maxH = autoSizeConfig.maxRows
          ? autoSizeConfig.maxRows * lineHeight +
            parseFloat(computed.paddingTop || '0') +
            parseFloat(computed.paddingBottom || '0') +
            parseFloat(computed.borderTopWidth || '0') +
            parseFloat(computed.borderBottomWidth || '0')
          : Infinity

        el.style.height = `${Math.max(minH, Math.min(el.scrollHeight, maxH))}px`
      }

      adjustHeight()

      el.addEventListener('input', adjustHeight)
      return () => el.removeEventListener('input', adjustHeight)
    }, [autoSizeConfig, value])

    // 字符计数文案
    const countNode =
      showCount && maxLength != null ? (
        <span className="text-[11px] text-gray-400">
          {currentValue?.length ?? 0}/{maxLength}
        </span>
      ) : null

    const tsz = TEXTAREA_SIZE_CLASS[size]

    // ── InputGroup 样式（对标 searchable-select 触发器） ──
    const inputGroupBorderClass =
      'border border-(--border) bg-(--surface) transition-colors duration-200'
    const inputGroupHoverClass = !disabled
      ? 'hover:border-(--accent)'
      : ''
    const inputGroupDisabledClass = disabled
      ? 'cursor-not-allowed bg-gray-50 text-gray-500 opacity-50'
      : 'cursor-text'

    return (
      <TextField
        value={value}
        defaultValue={defaultValue}
        onChange={handleChange}
        isDisabled={disabled}
        isReadOnly={readOnly}
        isRequired={isRequired}
        name={name}
        autoFocus={autoFocus}
        maxLength={maxLength}
        className={`flex flex-col gap-1 ${className}`}
      >
        <InputGroup
          variant="primary"
          className={`${inputGroupBorderClass} ${inputGroupHoverClass} ${inputGroupDisabledClass} ${sz.rounded} ${tsz.group} ${inputGroupClassName}`}
          style={{
            borderWidth: 1,
            borderStyle: 'solid',
          }}
        >
          {leftIcon && (
            <InputGroup.Prefix className={`self-start pt-2 ${ICON_SIZE_CLASS[size]}`}>
              {leftIcon}
            </InputGroup.Prefix>
          )}

          <InputGroup.TextArea
            ref={mergedTextareaRef}
            placeholder={placeholder}
            rows={autoSizeConfig ? undefined : rows}
            className={`${sz.font} ${tsz.input} text-(--foreground) placeholder:text-gray-400`}
          />

          {rightIcon && (
            <InputGroup.Suffix className={`self-start pt-2 ${ICON_SIZE_CLASS[size]}`}>
              {rightIcon}
            </InputGroup.Suffix>
          )}
        </InputGroup>

        {/* 辅助说明 & 字数统计 */}
        {(description || countNode) && (
          <div className="flex items-center justify-between gap-2">
            {description && <Description>{description}</Description>}
            {countNode}
          </div>
        )}
      </TextField>
    )
  }
)

export default Textarea
