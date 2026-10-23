import { useMemo, useState, type ReactNode } from 'react'
import { marked } from 'marked'
import './readme.css'
import { AiFabOverviewDemo } from '@/components/ai-fab/demo'
import { ButtonOverviewDemo } from '@/components/button/demo'
import { DatePickerOverviewDemo } from '@/components/date-picker/demo'
import { DateRangePickerOverviewDemo } from '@/components/date-range-picker/demo'
import { InputOverviewDemo } from '@/components/input/demo'
import { ModalOverviewDemo } from '@/components/modal/demo'
import { PaginationOverviewDemo } from '@/components/pagination/demo'
import { SearchableSelectOverviewDemo } from '@/components/searchable-select/demo'
import { SliderBarOverviewDemo } from '@/components/slider-bar/demo'
import { SpinOverviewDemo } from '@/components/spin/demo'
import { TabsOverviewDemo } from '@/components/tabs/demo'
import { TextareaOverviewDemo } from '@/components/textarea/demo'
import { TreeSelectOverviewDemo } from '@/components/tree-select/demo'
import { TreeOverviewDemo } from '@/components/tree/demo'

// ── README 原文导入（Vite ?raw） ──
import buttonReadme from '@/components/button/README.md?raw'
import modalReadme from '@/components/modal/README.md?raw'
import inputReadme from '@/components/input/README.md?raw'
import textareaReadme from '@/components/textarea/README.md?raw'
import searchableSelectReadme from '@/components/searchable-select/README.md?raw'
import treeSelectReadme from '@/components/tree-select/README.md?raw'
import treeReadme from '@/components/tree/README.md?raw'
import datePickerReadme from '@/components/date-picker/README.md?raw'
import dateRangePickerReadme from '@/components/date-range-picker/README.md?raw'
import paginationReadme from '@/components/pagination/README.md?raw'
import tabsReadme from '@/components/tabs/README.md?raw'
import sliderBarReadme from '@/components/slider-bar/README.md?raw'
import spinReadme from '@/components/spin/README.md?raw'
import aiFabReadme from '@/components/ai-fab/README.md?raw'

export interface OverviewDemoItem {
  id: string
  name: string
  description?: string
  /** 右侧 Demo 区域 */
  render: () => ReactNode
  /** README 原文 */
  readme: string
}

const DEMO_ITEMS: OverviewDemoItem[] = [
  {
    id: 'button', name: 'Button',
    description: '按钮 · solid/soft · 尺寸 · 图标 · 加载态',
    render: () => <ButtonOverviewDemo />,
    readme: buttonReadme,
  },
  {
    id: 'modal', name: 'Modal',
    description: '对话框 · 默认页脚 · 自定义 header/body/footer · 全屏',
    render: () => <ModalOverviewDemo />,
    readme: modalReadme,
  },
  {
    id: 'input', name: 'Input',
    description: '输入框 · 左右图标 · 一键清除 · 字数统计 · size',
    render: () => <InputOverviewDemo />,
    readme: inputReadme,
  },
  {
    id: 'textarea', name: 'Textarea',
    description: '多行输入 · 自适应高度 · 左右图标 · 字数统计 · size',
    render: () => <TextareaOverviewDemo />,
    readme: textareaReadme,
  },
  {
    id: 'searchable-select', name: 'SearchableSelect',
    description: '下拉选择 · 搜索过滤 · 单选/多选 · 分组 · fieldNames',
    render: () => <SearchableSelectOverviewDemo />,
    readme: searchableSelectReadme,
  },
  {
    id: 'tree-select', name: 'TreeSelect',
    description: '树形选择 · fieldNames · 多选 / treeCheckStrictly',
    render: () => <TreeSelectOverviewDemo />,
    readme: treeSelectReadme,
  },
  {
    id: 'tree', name: 'Tree',
    description: '通用树 · 勾选联动 · getKey · 搜索 · defaultExpandAll',
    render: () => <TreeOverviewDemo />,
    readme: treeReadme,
  },
  {
    id: 'date-picker', name: 'DatePicker',
    description: '日期选择 · 尺寸 · 禁用 · 清空',
    render: () => <DatePickerOverviewDemo />,
    readme: datePickerReadme,
  },
  {
    id: 'date-range-picker', name: 'DateRangePicker',
    description: '日期区间选择 · 尺寸 · 禁用 · 清空',
    render: () => <DateRangePickerOverviewDemo />,
    readme: dateRangePickerReadme,
  },
  {
    id: 'pagination', name: 'Pagination',
    description: '分页 · 条数切换 · 快速跳转 · hideOnSinglePage',
    render: () => <PaginationOverviewDemo />,
    readme: paginationReadme,
  },
  {
    id: 'tabs', name: 'Tabs',
    description: '选项卡 · 尺寸 · 图标 · 禁用 · 受控/非受控',
    render: () => <TabsOverviewDemo />,
    readme: tabsReadme,
  },
  {
    id: 'slider-bar', name: 'SliderBar',
    description: '0–100 进度条 · 紫色主题 · 右侧百分比',
    render: () => <SliderBarOverviewDemo />,
    readme: sliderBarReadme,
  },
  {
    id: 'spin', name: 'Spin',
    description: '加载指示器 · 嵌套遮罩 · delay 防闪烁',
    render: () => <SpinOverviewDemo />,
    readme: spinReadme,
  },
  {
    id: 'ai-fab', name: 'AiFab',
    description: 'AI 悬浮入口 · 长按拖动 · 点击唤起对话',
    render: () => <AiFabOverviewDemo />,
    readme: aiFabReadme,
  },
]

/** 将 markdown 转为 HTML */
function renderMarkdown(raw: string): string {
  return marked.parse(raw) as string
}

/**
 * 组件总览：左侧组件名，右侧 Demo + 手册
 */
export default function ComponentOverview() {
  const [activeId, setActiveId] = useState(DEMO_ITEMS[0]?.id ?? '')
  const active = useMemo(
    () => DEMO_ITEMS.find((i) => i.id === activeId) ?? DEMO_ITEMS[0],
    [activeId]
  )

  return (
    <div className="flex h-screen min-h-0 w-full overflow-hidden bg-gray-50/50">
      {/* ── 左侧列表 ── */}
      <aside className="flex h-full min-h-0 w-52 shrink-0 flex-col border-r border-(--border) bg-(--surface)">
        <div className="shrink-0 px-3 py-3 border-b border-gray-100">
          <h1 className="text-sm font-semibold text-(--foreground)">组件总览</h1>
          <p className="text-xs text-gray-400 mt-0.5 leading-snug">左侧选型 · 右侧预览</p>
        </div>
        <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2 space-y-0.5">
          {DEMO_ITEMS.map((item) => {
            const isActive = item.id === active?.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveId(item.id)}
                className={`w-full text-left rounded-xl px-3 py-2.5 transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-(--accent-subtle) text-(--accent-hover) ring-1 ring-(--focus-ring)/30'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div
                  className={`text-xs font-semibold ${isActive ? 'text-(--accent-hover)' : 'text-(--foreground)'}`}
                >
                  {item.name}
                </div>
                {item.description ? (
                  <div className="text-[11px] text-gray-400 mt-0.5 leading-snug line-clamp-2">
                    {item.description}
                  </div>
                ) : null}
              </button>
            )
          })}
        </nav>
      </aside>

      {/* ── 右侧内容：Demo + 手册 ── */}
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 space-y-5">
          {active ? (
            <>
              {/* 标题 */}
              <div className="shrink-0">
                <h2 className="text-base font-bold text-(--foreground)">{active.name}</h2>
                {active.description ? (
                  <p className="text-xs text-gray-400 mt-1">{active.description}</p>
                ) : null}
              </div>

              {/* Demo 区域 */}
              <section>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">示例</h3>
                <div className="rounded-2xl border border-gray-100 bg-(--surface) p-4">
                  {active.render()}
                </div>
              </section>

              {/* README 手册 */}
              <section>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">使用手册</h3>
                <div
                  className="prose-readme rounded-2xl border border-gray-100 bg-(--surface) p-6"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(active.readme) }}
                />
              </section>
            </>
          ) : (
            <p className="text-sm text-gray-400">请从左侧选择一个组件</p>
          )}
        </div>
      </main>
    </div>
  )
}
