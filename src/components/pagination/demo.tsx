import { useState } from 'react'
import { Pagination } from '@/components/pagination'

/** 供组件总览右侧使用 */
export function PaginationOverviewDemo() {
  const [page, setPage] = useState(1)
  const [page2, setPage2] = useState(5)

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium text-gray-600 mb-1.5">基础分页 · sm（默认）</p>
        <Pagination
          total={100}
          current={page}
          onChange={setPage}
        />
        <p className="mt-1 text-xs text-gray-500">第 {page} 页</p>
      </div>

      <div className="border-t border-gray-100 pt-5">
        <p className="text-xs font-medium text-gray-600 mb-1.5">显示总数 + 每页条数切换</p>
        <Pagination
          total={256}
          current={page2}
          onChange={setPage2}
          showTotal={(total, [from, to]) => `第 ${from}-${to} 条，共 ${total} 条`}
          showSizeChanger
          pageSizeOptions={[10, 20, 50]}
        />
      </div>

      <div className="border-t border-gray-100 pt-5">
        <p className="text-xs font-medium text-gray-600 mb-1.5">尺寸 · md / lg</p>
        <div className="space-y-4">
          <Pagination size="md" total={50} />
          <Pagination size="lg" total={50} />
        </div>
      </div>

      <div className="border-t border-gray-100 pt-5">
        <p className="text-xs font-medium text-gray-600 mb-1.5">快速跳转 · 隐藏单页</p>
        <div className="space-y-4">
          <Pagination total={200} showQuickJumper />
          <Pagination total={5} hideOnSinglePage />
        </div>
      </div>
    </div>
  )
}

export default function PaginationDemoPage() {
  return (
    <div className="h-full overflow-y-auto p-5 bg-gray-50/50">
      <div className="space-y-4">
        <div>
          <h1 className="text-lg font-bold text-(--foreground)">Pagination 演示</h1>
          <p className="text-xs text-gray-400 mt-0.5">分页 · 条数切换 · 快速跳转 · 尺寸</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-(--surface) p-4">
          <PaginationOverviewDemo />
        </div>
      </div>
    </div>
  )
}
