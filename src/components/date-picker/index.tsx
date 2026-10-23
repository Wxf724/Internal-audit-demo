import { Calendar, DateField, DatePicker as HeroDatePicker } from '@heroui/react'
import type { DatePickerProps as HeroDatePickerProps } from '@heroui/react/date-picker'
import type { DateValue } from '@heroui/react/rac'
import type { KeyboardEvent, MouseEvent, PointerEvent } from 'react'
import { useState } from 'react'
import { Dialog } from 'react-aria-components'
import { sizePresets } from '../theme'

export type DatePickerSize = 'xs' | 'sm' | 'md' | 'lg'

export interface DatePickerProps extends Omit<
  HeroDatePickerProps<DateValue>,
  'children' | 'value' | 'defaultValue' | 'onChange' | 'className'
> {
  /** 受控值 */
  value?: DateValue | null
  /** 非受控默认值 */
  defaultValue?: DateValue | null
  /** 值变化回调 */
  onChange?: (value: DateValue | null) => void
  /** 尺寸（参考 Antd 尺寸语义） */
  size?: DatePickerSize
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
}

function resolveDateSeparator(dateFormat: string): '-' | '/' | '.' {
  const match = dateFormat.match(/[-/.]/)
  const sep = match?.[0]
  if (sep === '/' || sep === '.') return sep
  return '-'
}

const TRIGGER_PX: Record<DatePickerSize, string> = {
  xs: 'px-1.5', sm: 'px-2.5', md: 'px-3', lg: 'px-3.5',
}

/**
 * 通用日期选择器（基础版）
 * - 基于 HeroUI DatePicker 组合 DateField + Calendar
 * - 对标 Ant Design DatePicker 的常用能力：value/defaultValue/onChange/dateFormat/disabled
 */
export function DatePicker(props: DatePickerProps) {
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
    isDisabled,
    onOpenChange,
    /** 与 RAC DatePicker 一致；必须同时传给弹层内 Calendar，否则 Calendar 会回退默认 min=1900，导致禁用区间不生效 */
    minValue,
    maxValue,
    ...restProps
  } = props

  const sz = sizePresets[size]
  const dateSeparator = resolveDateSeparator(dateFormat)
  const mergedDisabled = disabled ?? isDisabled
  const isControlled = value !== undefined
  const [innerValue, setInnerValue] = useState<DateValue | null>(() => defaultValue ?? null)
  const mergedValue = isControlled ? value : innerValue
  const hasValue = mergedValue != null
  const handleChange = (next: DateValue | null) => {
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

  return (
    <HeroDatePicker
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
          <DateField.Input>
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
            <HeroDatePicker.Trigger
              className={`${TRIGGER_PX[size]} ${sz.icon} h-full text-gray-500 transition-colors outline-none ring-0 shadow-none hover:text-(--accent) data-[focus-visible=true]:outline-none data-[focus-visible=true]:ring-0 data-[focus-visible=true]:shadow-none`}
            >
              <HeroDatePicker.TriggerIndicator />
            </HeroDatePicker.Trigger>
          )}
        </DateField.Suffix>
      </DateField.Group>

      <HeroDatePicker.Popover
        className={`rounded-2xl border border-white/80 bg-(--surface) ring-1 ring-black/5 ${popoverClassName}`}
        style={{ boxShadow: 'var(--overlay-shadow)' }}
      >
        <Dialog className="outline-none">
          <Calendar
            aria-label="选择日期"
            minValue={minValue}
            maxValue={maxValue}
            className="**:data-today:text-(--accent-hover)! **:data-[today=true]:text-(--accent-hover)! **:data-[hovered=true]:bg-(--accent-soft) **:data-[selected=true]:bg-(--accent) **:data-[selected=true]:text-white! **:data-[selected=true]:data-[today=true]:text-white! **:data-[focus-visible=true]:ring-2 **:data-[focus-visible=true]:ring-(--focus-ring)"
          >
            <Calendar.Header>
              <Calendar.NavButton
                slot="previous"
                className="text-(--accent-hover) hover:bg-(--accent-soft) hover:text-(--accent-hover) data-[focus-visible=true]:ring-2 data-[focus-visible=true]:ring-(--focus-ring)"
              />
              <Calendar.Heading />
              <Calendar.NavButton
                slot="next"
                className="text-(--accent-hover) hover:bg-(--accent-soft) hover:text-(--accent-hover) data-[focus-visible=true]:ring-2 data-[focus-visible=true]:ring-(--focus-ring)"
              />
            </Calendar.Header>
            <Calendar.Grid>
              <Calendar.GridHeader>
                {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
              </Calendar.GridHeader>
              <Calendar.GridBody>
                {(date) => (
                  <Calendar.Cell
                    date={date}
                    className="data-today:text-(--accent-hover)! data-[today=true]:text-(--accent-hover)! data-[selected=true]:bg-(--accent) data-[selected=true]:text-white! data-[selected=true]:data-[today=true]:text-white!"
                  />
                )}
              </Calendar.GridBody>
            </Calendar.Grid>
          </Calendar>
        </Dialog>
      </HeroDatePicker.Popover>
    </HeroDatePicker>
  )
}

export default DatePicker
