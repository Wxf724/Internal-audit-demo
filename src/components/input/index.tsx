import { forwardRef, useCallback, useRef, useState, type ReactNode } from 'react'
import { TextField, InputGroup, Description } from '@heroui/react'
import { sizePresets, type SizePreset } from '../theme'

/** Input 尺寸 */
export type InputSize = SizePreset

export interface InputProps {
  /** 受控值 */
  value?: string
  /** 非受控默认值 */
  defaultValue?: string
  /** 值变化回调，参数为新值 */
  onChange?: (value: string) => void
  /** 键盘按下回调 */
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
  /** 键盘抬起回调 */
  onKeyUp?: (e: React.KeyboardEvent<HTMLInputElement>) => void
  /** 聚焦回调 */
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void
  /** 失焦回调 */
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void
  /** 输入回调（原生 onInput） */
  onInput?: (e: React.FormEvent<HTMLInputElement>) => void
  /** 占位文案 */
  placeholder?: string
  /** 是否禁用 */
  disabled?: boolean
  /** 是否只读 */
  readOnly?: boolean
  /** 辅助说明（输入框下方文案） */
  description?: ReactNode
  /** 搜索模式：左侧显示搜索图标（传 `leftIcon` 时优先） */
  search?: boolean
  /** 左侧图标/内容 */
  leftIcon?: ReactNode
  /** 右侧图标/内容（allowClear 生效且输入非空时会被清除按钮覆盖） */
  rightIcon?: ReactNode
  /** 是否允许一键清空，默认 false */
  allowClear?: boolean
  /** 最大输入长度（同时影响 showCount 统计） */
  maxLength?: number
  /** 是否展示字数统计，需配合 maxLength 使用 */
  showCount?: boolean
  /** HTML input type */
  type?: string
  /** 最小值（type="number" 时生效） */
  min?: number | string
  /** 最大值（type="number" 时生效） */
  max?: number | string
  /** 步长（type="number" 时生效） */
  step?: number | string
  /** 输入框模式 */
  inputMode?: 'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search'
  /**
   * 尺寸（对标 Ant Design Input `size`）
   * @default 'sm'
   */
  size?: InputSize
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
  /** 外部 ref 指向实际 <input> 元素 */
  ref?: React.Ref<HTMLInputElement>
}

// ── 尺寸（覆盖 HeroUI 内置的 min-h-9 / py-2，与 searchable-select 对齐） ──
const INPUT_SIZE_CLASS: Record<InputSize, { group: string; input: string }> = {
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

const ICON_SIZE_CLASS: Record<InputSize, string> = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
}

/**
 * 通用 Input 组件
 *
 * 基于 HeroUI TextField + InputGroup 封装，对标 Ant Design Input 常用能力：
 * - 左右图标（leftIcon / rightIcon）
 * - 一键清除（allowClear）
 * - 字数统计（showCount + maxLength）
 * - 尺寸（size：xs / sm / md / lg）
 * - 辅助说明（description）
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(props, ref) {
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
    search = false,
    allowClear = false,
    maxLength,
    showCount = false,
    type = 'text',
    min,
    max,
    step,
    inputMode,
    size = 'sm',
    className = '',
    inputGroupClassName = '',
    name,
    autoFocus,
    isRequired,
    onKeyDown,
    onKeyUp,
    onFocus,
    onBlur,
    onInput,
  } = props

  const inputRef = useRef<HTMLInputElement>(null)

  // 将外部 ref 同时绑定到内部 inputRef
  const mergedInputRef = useCallback(
    (node: HTMLInputElement | null) => {
      ;(inputRef as React.MutableRefObject<HTMLInputElement | null>).current = node
      if (typeof ref === 'function') {
        ref(node)
      } else if (ref) {
        ;(ref as React.MutableRefObject<HTMLInputElement | null>).current = node
      }
    },
    [ref]
  )

  const sz = sizePresets[size]
  const isControlled = value !== undefined
  const [innerValue, setInnerValue] = useState(defaultValue ?? '')
  const currentValue = isControlled ? value : innerValue
  const hasValue = (currentValue?.length ?? 0) > 0

  const handleChange = useCallback(
    (newValue: string) => {
      if (!isControlled) setInnerValue(newValue)
      onChange?.(newValue)
    },
    [isControlled, onChange]
  )

  const handleClear = useCallback(() => {
    if (!isControlled) setInnerValue('')
    onChange?.('')
    inputRef.current?.focus()
  }, [isControlled, onChange])

  const showClearButton = allowClear && hasValue && !disabled && !readOnly

  // 字符计数文案
  const countNode =
    showCount && maxLength != null ? (
      <span className="text-[11px] text-gray-400 ml-auto">
        {currentValue?.length ?? 0}/{maxLength}
      </span>
    ) : null

  const isz = INPUT_SIZE_CLASS[size]

  // ── InputGroup 样式（对标 searchable-select 触发器） ──
  const inputGroupBorderClass = 'border border-(--border) bg-(--surface) transition-colors duration-200'
  const inputGroupHoverClass = !disabled ? 'hover:border-(--accent)' : ''
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
      type={type}
      inputMode={inputMode}
      className={`flex flex-col gap-1 ${className}`}
    >
      <InputGroup
        variant="primary"
        className={`${inputGroupBorderClass} ${inputGroupHoverClass} ${inputGroupDisabledClass} ${sz.rounded} ${isz.group} ${inputGroupClassName}`}
        style={{
          borderWidth: 1,
          borderStyle: 'solid',
        }}
      >
        {(leftIcon || search) && (
          <InputGroup.Prefix
            className={`${ICON_SIZE_CLASS[size]} text-gray-400`}
          >
            {leftIcon || <i className="ri-search-line" />}
          </InputGroup.Prefix>
        )}

        <InputGroup.Input
          ref={mergedInputRef}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          onKeyDown={onKeyDown}
          onKeyUp={onKeyUp}
          onFocus={onFocus}
          onBlur={onBlur}
          onInput={onInput}
          className={`${sz.font} ${isz.input} text-(--foreground) placeholder:text-gray-400`}
        />

        {showClearButton && (
          <InputGroup.Suffix>
            <button
              type="button"
              onClick={handleClear}
              tabIndex={-1}
              aria-label="清除输入"
              className={`inline-flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors p-0.5 cursor-pointer focus:outline-none ${sz.icon}`}
            >
              <i className="ri-close-circle-line leading-none" />
            </button>
          </InputGroup.Suffix>
        )}

        {!showClearButton && rightIcon && (
          <InputGroup.Suffix
            className={`${ICON_SIZE_CLASS[size]}`}
          >
            {rightIcon}
          </InputGroup.Suffix>
        )}
      </InputGroup>

      {/* 辅助说明 & 字数统计 */}
      {(description || countNode) && (
        <div className="flex items-center gap-2">
          {description && <Description>{description}</Description>}
          {countNode}
        </div>
      )}
    </TextField>
  )
})

export default Input
