import { useState } from 'react'
import { DateRangePicker } from '@/components/date-range-picker'
import { type DateValue, type RangeValue } from '@heroui/react/rac'
import { parseDate } from '@internationalized/date'

/** 供组件总览右侧使用 */
export function DateRangePickerOverviewDemo() {
  const [range, setRange] = useState<RangeValue<DateValue> | null>({
    start: parseDate('2026-06-01'),
    end: parseDate('2026-06-08'),
  })

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium text-gray-600 mb-1.5">基础 · sm（默认）</p>
        <DateRangePicker
          value={range}
          onChange={setRange}
          showShortcuts
          aria-label="选择日期区间"
        />
        <p className="mt-1 text-xs text-gray-500">
          区间：{range?.start?.toString()} ~ {range?.end?.toString()}
        </p>
      </div>

      <div className="border-t border-gray-100 pt-5">
        <p className="text-xs font-medium text-gray-600 mb-1.5">尺寸 · md / lg</p>
        <div className="space-y-3 max-w-xs">
          <DateRangePicker size="sm" aria-label="sm" />
          <DateRangePicker size="md" aria-label="md" />
          <DateRangePicker size="lg" aria-label="lg" />
        </div>
      </div>

      <div className="border-t border-gray-100 pt-5">
        <p className="text-xs font-medium text-gray-600 mb-1.5">禁用 / 允许清空</p>
        <div className="space-y-3 max-w-xs">
          <DateRangePicker disabled aria-label="禁用" />
          <DateRangePicker
            allowClear
            showShortcuts
            value={range}
            onChange={setRange}
            aria-label="可清空"
          />
        </div>
      </div>
    </div>
  )
}

export default function DateRangePickerDemoPage() {
  return (
    <div className="h-full overflow-y-auto p-5 bg-gray-50/50">
      <div className="space-y-4">
        <div>
          <h1 className="text-lg font-bold text-(--foreground)">DateRangePicker 演示</h1>
          <p className="text-xs text-gray-400 mt-0.5">日期区间选择 · 尺寸 · 禁用 · 清空</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-(--surface) p-4">
          <DateRangePickerOverviewDemo />
        </div>
      </div>
    </div>
  )
}
