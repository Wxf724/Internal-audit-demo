import { AiFab } from '@/components/ai-fab'

/** 供组件总览右侧使用 */
export function AiFabOverviewDemo() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium text-gray-600 mb-1.5">AI 悬浮球 · 右下角固定</p>
        <p className="text-xs text-gray-400 mb-3">
          按住可拖动位置 · 点击打开 AI 对话
        </p>
        <div className="relative h-48 bg-gray-100 rounded-xl border border-gray-200 flex items-center justify-center">
          <span className="text-xs text-gray-400">预览区域</span>
        </div>
      </div>

      <AiFab
        onClick={() => alert('AI 对话')}
        title="AI 对话助手"
      />
    </div>
  )
}

export default function AiFabDemoPage() {
  return (
    <div className="h-full overflow-y-auto p-5 bg-gray-50/50">
      <div className="space-y-4">
        <div>
          <h1 className="text-lg font-bold text-(--foreground)">AiFab 演示</h1>
          <p className="text-xs text-gray-400 mt-0.5">AI 悬浮入口 · 按住拖动 · 点击唤起</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-(--surface) p-4">
          <AiFabOverviewDemo />
        </div>
      </div>
    </div>
  )
}
