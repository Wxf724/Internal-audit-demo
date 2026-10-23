import { useState } from 'react'
import { DatePicker } from '@/components/date-picker'
import { type DateValue } from '@heroui/react/rac'
import { parseDate } from '@internationalized/date'

/** 供组件总览右侧使用 */
export function DatePickerOverviewDemo() {
  const [date, setDate] = useState<DateValue | null>(
    parseDate('2026-06-08')
  )

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium text-gray-600 mb-1.5">基础 · sm（默认）</p>
        <DatePicker
          value={date}
          onChange={setDate}
          aria-label="选择日期"
        />
        <p className="mt-1 text-xs text-gray-500">
          选中：{date?.toString() ?? '未选择'}
        </p>
      </div>

      <div className="border-t border-gray-100 pt-5">
        <p className="text-xs font-medium text-gray-600 mb-1.5">尺寸 · xs / md / lg</p>
        <div className="space-y-3 max-w-xs">
          <DatePicker size="xs" aria-label="xs" />
          <DatePicker size="sm" aria-label="sm" />
          <DatePicker size="md" aria-label="md" />
          <DatePicker size="lg" aria-label="lg" />
        </div>
      </div>

      <div className="border-t border-gray-100 pt-5">
        <p className="text-xs font-medium text-gray-600 mb-1.5">禁用 / 允许清空</p>
        <div className="space-y-3 max-w-xs">
          <DatePicker disabled value={parseDate('2026-01-15')} aria-label="禁用" />
          <DatePicker allowClear value={date} onChange={setDate} aria-label="可清空" />
        </div>
      </div>
    </div>
  )
}

export default function DatePickerDemoPage() {
  return (
    <div className="h-full overflow-y-auto p-5 bg-gray-50/50">
      <div className="space-y-4">
        <div>
          <h1 className="text-lg font-bold text-(--foreground)">DatePicker 演示</h1>
          <p className="text-xs text-gray-400 mt-0.5">日期选择 · 尺寸 · 禁用 · 清空</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-(--surface) p-4">
          <DatePickerOverviewDemo />
        </div>
      </div>
    </div>
  )
}
