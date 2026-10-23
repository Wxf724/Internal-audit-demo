import { useState } from 'react'
import { Spin } from '@/components/spin'

/** 供组件总览右侧使用 */
export function SpinOverviewDemo() {
  const [spinning, setSpinning] = useState(true)

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium text-gray-600 mb-1.5">基础 · 仅指示器 + tip</p>
        <Spin spinning={spinning} tip="加载中..." size="lg" />
        <button
          className="mt-2 text-xs text-(--accent) cursor-pointer hover:underline"
          onClick={() => setSpinning(!spinning)}
        >
          切换 spinning（当前：{String(spinning)}）
        </button>
      </div>

      <div className="border-t border-gray-100 pt-5">
        <p className="text-xs font-medium text-gray-600 mb-1.5">嵌套模式 · 卡片内容遮罩</p>
        <Spin spinning delay={0} tip="数据加载中..." size="md" wrapperClassName="min-h-[120px]">
          <div className="border border-gray-100 rounded-xl p-4 space-y-2">
            <div className="h-4 bg-gray-100 rounded w-3/4" />
            <div className="h-4 bg-gray-100 rounded w-1/2" />
            <div className="h-4 bg-gray-100 rounded w-5/6" />
          </div>
        </Spin>
      </div>

      <div className="border-t border-gray-100 pt-5">
        <p className="text-xs font-medium text-gray-600 mb-1.5">延迟显示（200ms 防闪烁）</p>
        <Spin spinning tip="快速加载..." delay={200} size="sm" />
      </div>
    </div>
  )
}

export default function SpinDemoPage() {
  return (
    <div className="h-full overflow-y-auto p-5 bg-gray-50/50">
      <div className="space-y-4">
        <div>
          <h1 className="text-lg font-bold text-(--foreground)">Spin 演示</h1>
          <p className="text-xs text-gray-400 mt-0.5">嵌套遮罩 · 延迟显示 · tip 文案</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-(--surface) p-4">
          <SpinOverviewDemo />
        </div>
      </div>
    </div>
  )
}
