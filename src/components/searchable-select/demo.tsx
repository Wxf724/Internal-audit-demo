import { useState } from 'react'
import { SearchableSelect, type SearchableSelectValue } from '@/components/searchable-select'

const OPTIONS = [
  {
    label: '研发部',
    options: [
      { label: '张三', value: 'u1' },
      { label: '李四', value: 'u2' },
      { label: '王五', value: 'u3' },
    ],
  },
  {
    label: '产品部',
    options: [
      { label: '赵六', value: 'u4' },
      { label: '钱七', value: 'u5', disabled: true },
    ],
  },
  { label: '孙八', value: 'u6' },
]

/** 供组件总览右侧使用 */
export function SearchableSelectOverviewDemo() {
  const [single, setSingle] = useState<SearchableSelectValue | null>(null)
  const [multi, setMulti] = useState<SearchableSelectValue[] | null>(['u1'])

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium text-gray-600 mb-1.5">单选 + 搜索</p>
        <SearchableSelect
          className="max-w-xs"
          options={OPTIONS}
          value={single}
          onChange={(v) => setSingle(v as string)}
          showSearch
          searchPlaceholder="搜索成员"
          placeholder="请选择成员"
        />
        <p className="mt-1 text-xs text-gray-500">
          选中：{String(single ?? '未选择')}
        </p>
      </div>

      <div className="border-t border-gray-100 pt-5">
        <p className="text-xs font-medium text-gray-600 mb-1.5">多选</p>
        <SearchableSelect
          className="max-w-xs"
          options={OPTIONS}
          value={multi}
          onChange={(v) => setMulti(v as string[])}
          multiple
          showSearch
          placeholder="可选择多个成员"
        />
        <p className="mt-1 text-xs text-gray-500">
          已选：{multi?.length ? multi.join('，') : '无'}
        </p>
      </div>

      <div className="border-t border-gray-100 pt-5">
        <p className="text-xs font-medium text-gray-600 mb-1.5">尺寸 · md / lg</p>
        <div className="space-y-3 max-w-xs">
          <SearchableSelect size="sm" options={OPTIONS} placeholder="sm（默认）" />
          <SearchableSelect size="md" options={OPTIONS} placeholder="md" />
          <SearchableSelect size="lg" options={OPTIONS} placeholder="lg" />
        </div>
      </div>

      <div className="border-t border-gray-100 pt-5">
        <p className="text-xs font-medium text-gray-600 mb-1.5">禁用 / 无搜索</p>
        <div className="space-y-3 max-w-xs">
          <SearchableSelect disabled options={OPTIONS} value="u1" placeholder="禁用态" />
          <SearchableSelect options={OPTIONS} showSearch={false} placeholder="普通下拉（无搜索）" />
        </div>
      </div>
    </div>
  )
}

export default function SearchableSelectDemoPage() {
  return (
    <div className="h-full overflow-y-auto p-5 bg-gray-50/50">
      <div className="space-y-4">
        <div>
          <h1 className="text-lg font-bold text-(--foreground)">SearchableSelect 演示</h1>
          <p className="text-xs text-gray-400 mt-0.5">单选/多选 · 搜索过滤 · 分组 · 尺寸</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-(--surface) p-4">
          <SearchableSelectOverviewDemo />
        </div>
      </div>
    </div>
  )
}
