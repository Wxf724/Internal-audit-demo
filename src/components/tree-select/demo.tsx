import { useMemo, useState } from 'react'
import { TreeSelect, type TreeNode } from '@/components'
import { DEPARTMENTS } from '@/mocks/teamManagement'

/** 将 mock 部门列表挂在一级根节点下（字段与 mock 保持一致） */
function buildDeptTreeDemo(): TreeNode[] {
  return [
    {
      id: 'demo-root',
      title: '示例科技有限公司',
      children: [...DEPARTMENTS]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((d) => ({
          id: d.id,
          title: d.name,
          isLeaf: true,
        })),
    },
  ]
}

/** 供组件总览右侧使用：仅 Demo 区块（外层卡片由总览或独立页包裹） */
export function TreeSelectOverviewDemo() {
  const [demoDeptId, setDemoDeptId] = useState<string | null>(null)
  const [demoDeptIdsStrict, setDemoDeptIdsStrict] = useState<string[] | null>(null)
  const [demoDeptIdsCascade, setDemoDeptIdsCascade] = useState<string[] | null>(null)
  const deptTreeDemo = useMemo(() => buildDeptTreeDemo(), [])

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium text-gray-600 mb-1.5">单选</p>
        <TreeSelect
          className="max-w-md"
          treeData={deptTreeDemo}
          value={demoDeptId}
          onChange={(v) => setDemoDeptId(v != null ? String(v) : null)}
          mode="single"
          placeholder="请选择部门"
          searchPlaceholder="搜索部门"
        />
        <p className="mt-2 text-xs text-gray-500">
          当前选中：
          <span className="font-medium text-gray-700">{demoDeptId ?? '未选择'}</span>
        </p>
      </div>

      <div className="border-t border-gray-100 pt-5">
        <p className="text-xs font-medium text-gray-600 mb-1.5">
          多选 · treeCheckStrictly（逐项，父子独立）
        </p>
        <TreeSelect
          className="max-w-md"
          treeData={deptTreeDemo}
          value={demoDeptIdsStrict}
          onChange={(v) =>
            setDemoDeptIdsStrict(
              Array.isArray(v) ? (v as string[]) : v != null ? [String(v)] : null
            )
          }
          mode="multiple"
          treeCheckStrictly
          placeholder="请选择多个部门"
          searchPlaceholder="搜索部门"
          maxTagCount={4}
        />
        <p className="mt-2 text-xs text-gray-500">
          当前选中 id：
          <span className="font-mono text-gray-700">
            {demoDeptIdsStrict?.length ? demoDeptIdsStrict.join('，') : '未选择'}
          </span>
        </p>
      </div>

      <div className="border-t border-gray-100 pt-5">
        <p className="text-xs font-medium text-gray-600 mb-1.5">
          多选 ·
          父子联动（treeCheckStrictly=false，点根节点「示例科技有限公司」可一次选中/取消全部子部门）
        </p>
        <TreeSelect
          className="w-[280px]"
          treeData={deptTreeDemo}
          value={demoDeptIdsCascade}
          onChange={(v) =>
            setDemoDeptIdsCascade(
              Array.isArray(v) ? (v as string[]) : v != null ? [String(v)] : null
            )
          }
          size="sm"
          mode="multiple"
          treeCheckStrictly={false}
          placeholder="请选择（可联动整枝）"
          searchPlaceholder="搜索部门"
          maxTagCount={4}
        />
        <p className="mt-2 text-xs text-gray-500">
          当前选中 id：
          <span className="font-mono text-gray-700">
            {demoDeptIdsCascade?.length ? demoDeptIdsCascade.join('，') : '未选择'}
          </span>
        </p>
      </div>
    </div>
  )
}

/** 独立路由页：带页面标题与外层卡片 */
export default function TreeSelectDemoPage() {
  return (
    <div className="h-full overflow-y-auto p-5 bg-gray-50/50">
      <div className="space-y-4">
        <div>
          <h1 className="text-lg font-bold text-(--foreground)">TreeSelect 演示</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            数据来自 teamManagement mock；单选、多选（严格）、多选（父子联动）
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-(--surface) p-4">
          <TreeSelectOverviewDemo />
        </div>
      </div>
    </div>
  )
}
