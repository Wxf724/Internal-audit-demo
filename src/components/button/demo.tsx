import { useState } from 'react'
import { Button } from '@/components/button'

/** 供组件总览右侧使用：仅 Demo 区块（外层卡片由总览包裹） */
export function ButtonOverviewDemo() {
  const [loading, setLoading] = useState(false)

  return (
    <div className="space-y-6">
      {/* 类型 — solid */}
      <div>
        <p className="text-xs font-medium text-gray-600 mb-1.5">
          类型 · solid（primary / info / warn / success / danger / default）
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="primary" icon={<i className="ri-add-line" />}>
            创建项目
          </Button>
          <Button type="info">信息</Button>
          <Button type="warn">警告</Button>
          <Button type="success">成功</Button>
          <Button type="danger">危险</Button>
          <Button type="default">取消</Button>
        </div>
      </div>

      {/* 类型 — soft */}
      <div className="border-t border-gray-100 pt-5">
        <p className="text-xs font-medium text-gray-600 mb-1.5">
          类型 · soft（primary-soft / info-soft / warn-soft / success-soft / danger-soft / default-soft）
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="primary-soft" icon={<i className="ri-add-line" />}>
            primary-soft
          </Button>
          <Button type="info-soft">info-soft</Button>
          <Button type="warn-soft">warn-soft</Button>
          <Button type="success-soft">success-soft</Button>
          <Button type="danger-soft">danger-soft</Button>
          <Button type="default-soft">default-soft</Button>
        </div>
      </div>

      {/* 类型 — outline / ghost */}
      <div className="border-t border-gray-100 pt-5">
        <p className="text-xs font-medium text-gray-600 mb-1.5">
          类型 · outline / ghost
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="outline">outline</Button>
          <Button type="outline" icon={<i className="ri-add-line" />}>
            带图标
          </Button>
          <Button type="ghost">ghost</Button>
          <Button type="ghost" icon={<i className="ri-close-line" />}>
            关闭
          </Button>
        </div>
      </div>

      {/* 尺寸 */}
      <div className="border-t border-gray-100 pt-5">
        <p className="text-xs font-medium text-gray-600 mb-1.5">
          尺寸 · size（xs / sm / md / lg，默认 sm）
        </p>
        <div className="flex flex-wrap items-end gap-2">
          <Button size="xs">超小</Button>
          <Button size="sm">小</Button>
          <Button size="md">中</Button>
          <Button size="lg">大</Button>
        </div>
      </div>

      {/* 图标 */}
      <div className="border-t border-gray-100 pt-5">
        <p className="text-xs font-medium text-gray-600 mb-1.5">
          图标 · icon / rightIcon
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="primary"
            icon={<i className="ri-add-line" />}
          >
            创建项目
          </Button>
          <Button
            icon={<i className="ri-magic-line" />}
          >
            AI辅助定义任务
          </Button>
          <Button
            rightIcon={<i className="ri-arrow-right-line" />}
          >
            下一步
          </Button>
        </div>
      </div>

      {/* AI 风格按钮 */}
      <div className="border-t border-gray-100 pt-5">
        <p className="text-xs font-medium text-gray-600 mb-1.5">
          AI 风格 · 渐变 + icon
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            className="!bg-linear-to-r from-violet-500 to-purple-600 hover:!from-violet-600 hover:!to-purple-700 !text-white !shadow-lg !shadow-violet-500/25"
            icon={<i className="ri-magic-line" />}
          >
            AI辅助定义任务
          </Button>
          <Button
            className="!bg-linear-to-r from-blue-500 to-cyan-500 hover:!from-blue-600 hover:!to-cyan-600 !text-white !shadow-lg !shadow-blue-500/25"
            icon={<i className="ri-robot-2-line" />}
          >
            AI进度更新
          </Button>
        </div>
      </div>

      {/* 加载态 */}
      <div className="border-t border-gray-100 pt-5">
        <p className="text-xs font-medium text-gray-600 mb-1.5">
          加载态 · loading
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="primary" loading>
            保存中...
          </Button>
          <Button
            type="primary"
            loading={loading}
            onClick={() => {
              setLoading(true)
              setTimeout(() => setLoading(false), 2000)
            }}
          >
            点击模拟加载
          </Button>
        </div>
      </div>

      {/* 禁用 */}
      <div className="border-t border-gray-100 pt-5">
        <p className="text-xs font-medium text-gray-600 mb-1.5">
          禁用 · disabled
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="primary" disabled>
            禁用
          </Button>
          <Button disabled>禁用</Button>
        </div>
      </div>
    </div>
  )
}

/** 独立演示页 */
export default function ButtonDemoPage() {
  return (
    <div className="h-full overflow-y-auto p-5 bg-gray-50/50">
      <div className="space-y-4">
        <div>
          <h1 className="text-lg font-bold text-(--foreground)">Button 演示</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            类型 · 尺寸 · 图标 · AI 风格 · 加载态
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-(--surface) p-4">
          <ButtonOverviewDemo />
        </div>
      </div>
    </div>
  )
}
