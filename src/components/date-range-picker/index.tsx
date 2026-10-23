import { DateField, DateRangePicker as HeroDateRangePicker, RangeCalendar } from '@heroui/react'
import type { DateRangePickerProps as HeroDateRangePickerProps } from '@heroui/react/date-range-picker'
import type { DateValue, RangeValue } from '@heroui/react/rac'
import { parseDate } from '@internationalized/date'
import type { KeyboardEvent, MouseEvent, PointerEvent } from 'react'
import { useState } from 'react'
import { Dialog } from 'react-aria-components'
import { sizePresets } from '../theme'

export type DateRangePickerSize = 'sm' | 'md' | 'lg'

export interface DateRangePickerProps extends Omit<
  HeroDateRangePickerProps<DateValue>,
  'children' | 'value' | 'defaultValue' | 'onChange' | 'className'
> {
  /** 受控值 */
  value?: RangeValue<DateValue> | null
  /** 非受控默认值 */
  defaultValue?: RangeValue<DateValue> | null
  /** 值变化回调 */
  onChange?: (value: RangeValue<DateValue> | null) => void
  /** 尺寸（参考 Antd 尺寸语义） */
  size?: DateRangePickerSize
  /** 最外层 className */
  className?: string
  /** 弹层 className */
  popoverClassName?: string
  /** 日期展示格式（默认 YYYY-MM-DD，当前支持分隔符字符：- / .） */
  dateFormat?: string
  /** Antd 风格禁用配置（内部映射到 isDisabled） */
  disabled?: boolean
  /** 是否允许清空 */
  allowClear?: boolean
  /** 是否显示“本周 / 本月 / 本季”快捷选择按钮 */
  showShortcuts?: boolean
}

function resolveDateSeparator(dateFormat: string): '-' | '/' | '.' {
  const match = dateFormat.match(/[-/.]/)
  const sep = match?.[0]
  if (sep === '/' || sep === '.') return sep
  return '-'
}

const TRIGGER_PX: Record<DateRangePickerSize, string> = {
  sm: 'px-2.5', md: 'px-3', lg: 'px-3.5',
}

type DateRangeShortcutKey = 'week' | 'month' | 'quarter'

const DATE_RANGE_SHORTCUTS: Array<{ key: DateRangeShortcutKey; label: string }> = [
  { key: 'week', label: '本周' },
  { key: 'month', label: '本月' },
  { key: 'quarter', label: '本季' },
]

function formatNativeDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function toDateValue(date: Date) {
  return parseDate(formatNativeDate(date))
}

function getShortcutRange(key: DateRangeShortcutKey): RangeValue<DateValue> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (key === 'week') {
    // 本周按周一到周日计算；浏览器 getDay() 中周日为 0，需要单独回退 6 天。
    const day = today.getDay()
    const mondayOffset = day === 0 ? -6 : 1 - day
    const start = addDays(today, mondayOffset)
    return { start: toDateValue(start), end: toDateValue(addDays(start, 6)) }
  }

  if (key === 'month') {
    // 本月从 1 号开始，到下个月第 0 天，即当月最后一天。
    const start = new Date(today.getFullYear(), today.getMonth(), 1)
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    return { start: toDateValue(start), end: toDateValue(end) }
  }

  // 本季从当前季度第一个月的 1 号开始，到下一季度第 0 天结束。
  const quarterStartMonth = Math.floor(today.getMonth() / 3) * 3
  const start = new Date(today.getFullYear(), quarterStartMonth, 1)
  const end = new Date(today.getFullYear(), quarterStartMonth + 3, 0)
  return { start: toDateValue(start), end: toDateValue(end) }
}

function clampRangeToBounds(
  range: RangeValue<DateValue>,
  minValue?: DateValue | null,
  maxValue?: DateValue | null
) {
  let start = range.start
  let end = range.end

  // 快捷范围也要遵守组件的可选边界，避免选中 min/max 之外的日期。
  if (minValue && start.compare(minValue) < 0) start = minValue
  if (maxValue && end.compare(maxValue) > 0) end = maxValue

  if (start.compare(end) > 0) return null
  return { start, end }
}

/**
 * 通用日期区间选择器（基础版）
 * - 基于 HeroUI DateRangePicker 组合 DateInputGroup + RangeCalendar
 * - 对标 Ant Design RangePicker 的常用能力：value/defaultValue/onChange/disabled/最小最大日期/打开状态
 */
export function DateRangePicker(props: DateRangePickerProps) {
  const {
    value,
    defaultValue,
    onChange,
    size = 'sm',
    className = '',
    popoverClassName = '',
    dateFormat = 'YYYY-MM-DD',
    disabled,
    allowClear = true,
    showShortcuts = true,
    isDisabled,
    onOpenChange,
    /** 必须同时传给弹层内 RangeCalendar，否则日历回退到默认范围 */
    minValue,
    maxValue,
    ...restProps
  } = props

  const sz = sizePresets[size]
  const dateSeparator = resolveDateSeparator(dateFormat)
  const mergedDisabled = disabled ?? isDisabled
  const isControlled = value !== undefined
  const [innerValue, setInnerValue] = useState<RangeValue<DateValue> | null>(
    () => defaultValue ?? null
  )
  const mergedValue = isControlled ? value : innerValue
  const hasValue = mergedValue != null
  const handleChange = (next: RangeValue<DateValue> | null) => {
    if (!isControlled) setInnerValue(next)
    onChange?.(next)
  }
  const stopClearEvent = (e: MouseEvent | PointerEvent | KeyboardEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }
  const clearValue = (e: MouseEvent | KeyboardEvent) => {
    stopClearEvent(e)
    handleChange(null)
  }
  const applyShortcut = (key: DateRangeShortcutKey) => {
    const next = clampRangeToBounds(getShortcutRange(key), minValue, maxValue)
    if (next) handleChange(next)
  }

  return (
    <HeroDateRangePicker
      {...restProps}
      className={className}
      value={mergedValue ?? null}
      minValue={minValue}
      maxValue={maxValue}
      isDisabled={mergedDisabled}
      shouldForceLeadingZeros
      onOpenChange={onOpenChange}
      onChange={(next) => handleChange(next ?? null)}
    >
      <DateField.Group
        className={`${sz.h} ${sz.minH} ${sz.rounded} box-border border border-(--border) bg-(--surface) pl-2 transition-colors outline-none ring-0 shadow-none hover:border-(--border) data-[focus-within=true]:border-(--accent) data-[focus-within=true]:outline-none data-[focus-within=true]:ring-0 data-[focus-within=true]:shadow-none data-[focus-visible=true]:outline-none data-[focus-visible=true]:ring-0 data-[focus-visible=true]:shadow-none`}
        style={{
          borderWidth: 1,
          borderStyle: 'solid',
        }}
      >
        <DateField.InputContainer className={`h-full items-center ${sz.font} flex-1`}>
          <DateField.Input slot="start">
            {(segment) => {
              if (segment.type !== 'literal') {
                return <DateField.Segment segment={segment} className={sz.font} />
              }
              const normalized = segment.text.replace(/\s/g, '')
              if (/^[-/.]+$/.test(normalized)) {
                return <span className={`text-gray-400 ${sz.font}`}>{dateSeparator}</span>
              }
              return <DateField.Segment segment={segment} className={sz.font} />
            }}
          </DateField.Input>
          <HeroDateRangePicker.RangeSeparator
            className={`px-1.5 text-gray-400 ${sz.font}`}
          >
            至
          </HeroDateRangePicker.RangeSeparator>
          <DateField.Input slot="end">
            {(segment) => {
              if (segment.type !== 'literal') {
                return <DateField.Segment segment={segment} className={sz.font} />
              }
              const normalized = segment.text.replace(/\s/g, '')
              if (/^[-/.]+$/.test(normalized)) {
                return <span className={`text-gray-400 ${sz.font}`}>{dateSeparator}</span>
              }
              return <DateField.Segment segment={segment} className={sz.font} />
            }}
          </DateField.Input>
        </DateField.InputContainer>
        <DateField.Suffix>
          {allowClear && hasValue && !mergedDisabled ? (
            <span
              role="button"
              tabIndex={0}
              className="inline-flex h-full items-center px-1 text-gray-400 transition-colors hover:text-gray-600"
              aria-label="清空"
              onPointerDown={stopClearEvent}
              onMouseDown={stopClearEvent}
              onClick={clearValue}
              onKeyDown={(e) => {
                if (e.key !== 'Enter' && e.key !== ' ') return
                clearValue(e)
              }}
            >
              <i className="ri-close-circle-line text-sm leading-none" />
            </span>
          ) : (
            <HeroDateRangePicker.Trigger
              className={`${TRIGGER_PX[size]} ${sz.icon} h-full text-gray-500 transition-colors outline-none ring-0 shadow-none hover:text-(--accent) data-[focus-visible=true]:outline-none data-[focus-visible=true]:ring-0 data-[focus-visible=true]:shadow-none`}
            >
              <HeroDateRangePicker.TriggerIndicator />
            </HeroDateRangePicker.Trigger>
          )}
        </DateField.Suffix>
      </DateField.Group>

      <HeroDateRangePicker.Popover
        className={`rounded-2xl border border-white/80 bg-(--surface) ring-1 ring-black/5 ${popoverClassName}`}
        style={{ boxShadow: 'var(--overlay-shadow)' }}
      >
        <Dialog className="outline-none">
          {showShortcuts && (
            <div className="flex items-center gap-1.5 border-b border-gray-100 px-3 py-2">
              {DATE_RANGE_SHORTCUTS.map((shortcut) => (
                <button
                  key={shortcut.key}
                  type="button"
                  className="rounded-md px-2 py-1 text-xs font-medium text-(--text-secondary) transition-colors hover:bg-(--accent-soft) hover:text-(--accent-hover) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus-ring)"
                  onClick={() => applyShortcut(shortcut.key)}
                >
                  {shortcut.label}
                </button>
              ))}
            </div>
          )}
          <RangeCalendar
            aria-label="选择时间范围"
            minValue={minValue}
            maxValue={maxValue}
            className="**:data-[selected=true]:bg-(--accent) **:data-[selected=true]:text-white **:data-[selection-start=true]:bg-(--accent-hover) **:data-[selection-end=true]:bg-(--accent-hover) **:data-[today=true]:text-(--accent-hover) **:data-[hovered=true]:bg-(--accent-soft) **:data-[focus-visible=true]:ring-2 **:data-[focus-visible=true]:ring-(--focus-ring)"
          >
            <RangeCalendar.Header>
              <RangeCalendar.NavButton
                slot="previous"
                className="text-(--accent-hover) hover:bg-(--accent-soft) hover:text-(--accent-hover) data-[focus-visible=true]:ring-2 data-[focus-visible=true]:ring-(--focus-ring)"
              />
              <RangeCalendar.Heading />
              <RangeCalendar.NavButton
                slot="next"
                className="text-(--accent-hover) hover:bg-(--accent-soft) hover:text-(--accent-hover) data-[focus-visible=true]:ring-2 data-[focus-visible=true]:ring-(--focus-ring)"
              />
            </RangeCalendar.Header>
            <RangeCalendar.Grid>
              <RangeCalendar.GridHeader>
                {(day) => <RangeCalendar.HeaderCell>{day}</RangeCalendar.HeaderCell>}
              </RangeCalendar.GridHeader>
              <RangeCalendar.GridBody>
                {(date) => <RangeCalendar.Cell date={date} />}
              </RangeCalendar.GridBody>
            </RangeCalendar.Grid>
          </RangeCalendar>
        </Dialog>
      </HeroDateRangePicker.Popover>
    </HeroDateRangePicker>
  )
}

export default DateRangePicker
