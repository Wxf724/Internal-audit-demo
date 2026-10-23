import { useState } from 'react'
import { Tabs } from '@/components/tabs'

/** 供组件总览右侧使用 */
export function TabsOverviewDemo() {
  const [activeKey, setActiveKey] = useState('tab1')

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium text-gray-600 mb-1.5">基础 · sm（默认）</p>
        <Tabs
          size="sm"
          activeKey={activeKey}
          onChange={setActiveKey}
          items={[
            { key: 'tab1', label: '本周', children: <div className="p-3 text-sm text-gray-600">本周视图内容</div> },
            { key: 'tab2', label: '本月' },
            { key: 'tab3', label: '本季度' },
            { key: 'tab4', label: '全部' },
          ]}
        />
      </div>

      <div className="border-t border-gray-100 pt-5">
        <p className="text-xs font-medium text-gray-600 mb-1.5">尺寸 · md / lg</p>
        <div className="space-y-4">
          <Tabs
            size="md"
            items={[
              { key: 'a', label: '进行中', icon: <i className="ri-play-circle-line" /> },
              { key: 'b', label: '已完成', icon: <i className="ri-checkbox-circle-line" /> },
              { key: 'c', label: '已延期', icon: <i className="ri-error-warning-line" /> },
            ]}
          />
          <Tabs
            size="lg"
            items={[
              { key: 'x', label: '项目' },
              { key: 'y', label: '任务' },
              { key: 'z', label: '事项' },
            ]}
          />
        </div>
      </div>

      <div className="border-t border-gray-100 pt-5">
        <p className="text-xs font-medium text-gray-600 mb-1.5">禁用项</p>
        <Tabs
          size="sm"
          defaultActiveKey="a"
          items={[
            { key: 'a', label: '可用' },
            { key: 'b', label: '禁用', disabled: true },
            { key: 'c', label: '可用' },
          ]}
        />
      </div>
    </div>
  )
}

export default function TabsDemoPage() {
  return (
    <div className="h-full overflow-y-auto p-5 bg-gray-50/50">
      <div className="space-y-4">
        <div>
          <h1 className="text-lg font-bold text-(--foreground)">Tabs 演示</h1>
          <p className="text-xs text-gray-400 mt-0.5">受控/非受控 · 尺寸 · 图标 · 禁用</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-(--surface) p-4">
          <TabsOverviewDemo />
        </div>
      </div>
    </div>
  )
}
