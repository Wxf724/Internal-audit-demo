import { Input, ListBox, Pagination as HeroPagination, Select } from '@heroui/react'
import { sizePresets, type SizePreset } from '../theme'
import { useEffect, useMemo, useState } from 'react'

/**
 * 分页组件参数（参考 Ant Design Pagination 设计）。
 * 支持受控/非受控两种使用方式。
 */
export interface UIPaginationProps {
  size?: SizePreset
  total?: number
  current?: number
  defaultCurrent?: number
  pageSize?: number
  defaultPageSize?: number
  disabled?: boolean
  hideOnSinglePage?: boolean
  showSizeChanger?: boolean
  pageSizeOptions?: number[]
  showQuickJumper?: boolean
  showTotal?: (total: number, range: [number, number]) => string
  onChange?: (page: number, pageSize: number) => void
  onShowSizeChange?: (current: number, size: number) => void
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

export function Pagination(props: UIPaginationProps) {
  const {
    size = 'sm',
    total = 0,
    current,
    defaultCurrent = 1,
    pageSize,
    defaultPageSize = 10,
    disabled = false,
    hideOnSinglePage = false,
    showSizeChanger = false,
    pageSizeOptions = [10, 20, 50, 100],
    showQuickJumper = false,
    showTotal,
    onChange,
    onShowSizeChange,
  } = props

  const isCurrentControlled = typeof current === 'number'
  const isPageSizeControlled = typeof pageSize === 'number'

  // 非受控模式下的内部状态
  const [innerCurrent, setInnerCurrent] = useState(defaultCurrent)
  const [innerPageSize, setInnerPageSize] = useState(defaultPageSize)
  const [quickPage, setQuickPage] = useState('')

  const mergedCurrent = isCurrentControlled ? (current as number) : innerCurrent
  const sz = sizePresets[size]
  const mergedPageSize = isPageSizeControlled ? (pageSize as number) : innerPageSize

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((total || 0) / Math.max(1, mergedPageSize))),
    [total, mergedPageSize]
  )

  const safeCurrent = clamp(mergedCurrent, 1, totalPages)
  const rangeStart = total === 0 ? 0 : (safeCurrent - 1) * mergedPageSize + 1
  const rangeEnd = total === 0 ? 0 : Math.min(total, safeCurrent * mergedPageSize)

  useEffect(() => {
    // 当总页数变化导致当前页越界时，自动回收至合法页码
    if (!isCurrentControlled && innerCurrent !== safeCurrent) {
      setInnerCurrent(safeCurrent)
    }
  }, [innerCurrent, isCurrentControlled, safeCurrent])

  const pages = useMemo(() => {
    // 页码过多时按“首尾 + 当前附近 + 省略号”显示
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    const result: Array<number | '...'> = [1]
    const left = Math.max(2, safeCurrent - 1)
    const right = Math.min(totalPages - 1, safeCurrent + 1)

    if (left > 2) result.push('...')
    for (let i = left; i <= right; i += 1) result.push(i)
    if (right < totalPages - 1) result.push('...')

    result.push(totalPages)
    return result
  }, [safeCurrent, totalPages])

  const emitChange = (nextPage: number, nextPageSize = mergedPageSize) => {
    // 统一页码变更出口，保证页码始终在有效范围内
    const finalPage = clamp(nextPage, 1, Math.max(1, Math.ceil(total / Math.max(1, nextPageSize))))
    if (!isCurrentControlled) setInnerCurrent(finalPage)
    onChange?.(finalPage, nextPageSize)
  }

  const handlePageSizeChange = (nextSize: number) => {
    // 切换每页条数后重算总页数，并修正当前页
    if (!isPageSizeControlled) setInnerPageSize(nextSize)
    const nextTotalPages = Math.max(1, Math.ceil(total / nextSize))
    const nextPage = clamp(safeCurrent, 1, nextTotalPages)
    if (!isCurrentControlled) setInnerCurrent(nextPage)
    onShowSizeChange?.(nextPage, nextSize)
    onChange?.(nextPage, nextSize)
  }

  const handleQuickPageChange = (value: string) => {
    // 仅保留数字，支持手动输入场景
    setQuickPage(value.replace(/\D+/g, ''))
  }

  const handleQuickJump = () => {
    // 快速跳页：输入页码后按回车触发
    const value = Number(quickPage)
    if (!Number.isNaN(value)) emitChange(value)
    setQuickPage('')
  }

  if (hideOnSinglePage && totalPages <= 1) return null

  return (
    <div className="flex flex-nowrap items-center gap-3 whitespace-nowrap">
      {showTotal && (
        <span className={`${sz.font} text-gray-500 whitespace-nowrap`}>
          {showTotal(total, [rangeStart, rangeEnd])}
        </span>
      )}

      <HeroPagination className="gap-1">
        <HeroPagination.Content className="gap-1">
          <HeroPagination.Item>
            <HeroPagination.Previous
              isDisabled={disabled || safeCurrent <= 1}
              onPress={() => emitChange(safeCurrent - 1)}
            >
              <i className={`ri-arrow-left-s-line ${sz.icon}`} />
            </HeroPagination.Previous>
          </HeroPagination.Item>

          {pages.map((item, index) =>
            item === '...' ? (
              <HeroPagination.Item key={`ellipsis-${index}`}>
                <HeroPagination.Ellipsis />
              </HeroPagination.Item>
            ) : (
              <HeroPagination.Item key={item}>
                <HeroPagination.Link
                  isActive={item === safeCurrent}
                  isDisabled={disabled}
                  className={
                    item === safeCurrent
                      ? 'border border-(--accent) bg-(--surface) text-(--accent) hover:bg-(--accent-light)'
                      : ''
                  }
                  onPress={() => emitChange(item)}
                >
                  {item}
                </HeroPagination.Link>
              </HeroPagination.Item>
            )
          )}

          <HeroPagination.Item>
            <HeroPagination.Next
              isDisabled={disabled || safeCurrent >= totalPages}
              onPress={() => emitChange(safeCurrent + 1)}
            >
              <i className={`ri-arrow-right-s-line ${sz.icon}`} />
            </HeroPagination.Next>
          </HeroPagination.Item>
        </HeroPagination.Content>
      </HeroPagination>

      {showSizeChanger && (
        <div className="flex items-center gap-2">
          <Select
            key={String(mergedPageSize)}
            aria-label="每页条数"
            isDisabled={disabled}
            defaultSelectedKey={String(mergedPageSize)}
            onSelectionChange={(key) => {
              const value = Number(key)
              if (!Number.isNaN(value)) handlePageSizeChange(value)
            }}
            className="w-[92px]"
          >
            <Select.Trigger className={`${sz.h} ${sz.rounded} border-0 bg-(--surface) px-2 ${sz.font} text-gray-700 shadow-sm ring-0 transition-shadow data-[focus-visible=true]:shadow-md`}>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox className="min-w-[92px]">
                {pageSizeOptions.map((size) => (
                  <ListBox.Item key={String(size)} id={String(size)}>
                    {size}/页
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
        </div>
      )}

      {showQuickJumper && (
        <div className="flex items-center gap-2">
          <span className={`${sz.font} text-gray-500`}>跳至</span>
          <Input
            value={quickPage}
            inputMode="numeric"
            pattern="[0-9]*"
            onChange={(e) => handleQuickPageChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleQuickJump()
            }}
            className={`w-20 ${sz.minH} ${sz.h}`}
          />
          <span className={`${sz.font} text-gray-500`}>页</span>
        </div>
      )}
    </div>
  )
}

export default Pagination
