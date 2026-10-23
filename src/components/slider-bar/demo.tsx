import { useState } from 'react'
import { SliderBar } from '@/components/slider-bar'

/** 供组件总览右侧使用 */
export function SliderBarOverviewDemo() {
  const [value1, setValue1] = useState(50)
  const [value2, setValue2] = useState(75)
  const [value3, setValue3] = useState(25)

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium text-gray-600 mb-1.5">基础（sm）</p>
        <SliderBar value={value1} onChange={setValue1} />
        <p className="mt-1 text-xs text-gray-500">当前：{value1}%</p>
      </div>

      <div className="border-t border-gray-100 pt-5">
        <p className="text-xs font-medium text-gray-600 mb-1.5">尺寸 · md</p>
        <SliderBar size="md" value={value2} onChange={setValue2} />
        <p className="mt-1 text-xs text-gray-500">当前：{value2}%</p>
      </div>

      <div className="border-t border-gray-100 pt-5">
        <p className="text-xs font-medium text-gray-600 mb-1.5">尺寸 · lg</p>
        <SliderBar size="lg" value={value3} onChange={setValue3} />
        <p className="mt-1 text-xs text-gray-500">当前：{value3}%</p>
      </div>
    </div>
  )
}

/** 独立演示页 */
export default function SliderBarDemoPage() {
  return (
    <div className="h-full overflow-y-auto p-5 bg-gray-50/50">
      <div className="space-y-4">
        <div>
          <h1 className="text-lg font-bold text-(--foreground)">SliderBar 演示</h1>
          <p className="text-xs text-gray-400 mt-0.5">0–100 进度条 · 紫色主题 · 右侧百分比</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-(--surface) p-4">
          <SliderBarOverviewDemo />
        </div>
      </div>
    </div>
  )
}
