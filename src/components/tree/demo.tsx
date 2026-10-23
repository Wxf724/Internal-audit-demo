import { useMemo, useState } from 'react'
import { Tree, type TreeKey, type TreeNodeData } from '@/components/tree'

type BasicNode = TreeNodeData & {
  key: string
  title: string
  children?: BasicNode[]
}

type ApiNode = {
  data_type: 'depart' | 'user'
  data_id: string | number
  data_name: string
  job_title?: string
  children?: ApiNode[]
}

const BASIC_TREE: BasicNode[] = [
  {
    key: 'd1',
    title: '研发中心',
    children: [
      { key: 'u1', title: '张三', isLeaf: true },
      { key: 'u2', title: '李四', isLeaf: true },
    ],
  },
  {
    key: 'd2',
    title: '产品中心',
    children: [{ key: 'u3', title: '王五', isLeaf: true }],
  },
]

const API_TREE: ApiNode[] = [
  {
    data_type: 'depart',
    data_id: '1',
    data_name: '乾知智能',
    children: [
      {
        data_type: 'depart',
        data_id: '1-1',
        data_name: '智能产品',
        children: [
          {
            data_type: 'user',
            data_id: 101,
            data_name: '王小菲',
            job_title: '产品专员',
            children: [],
          },
          {
            data_type: 'user',
            data_id: 102,
            data_name: '李明',
            job_title: '前端开发',
            children: [],
          },
        ],
      },
    ],
  },
]

const apiKey = (n: ApiNode) => `${n.data_type}:${n.data_id}`

/** 供组件总览右侧使用 */
export function TreeOverviewDemo() {
  const [checkedBasic, setCheckedBasic] = useState<TreeKey[]>([])
  const [selectedKey, setSelectedKey] = useState<TreeKey | null>(null)
  const [checkedApi, setCheckedApi] = useState<TreeKey[]>([])
  const [checkedStrict, setCheckedStrict] = useState<TreeKey[]>(['u1'])
  const [search, setSearch] = useState('')
  const existingUserIds = useMemo(() => new Set([102]), [])

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium text-gray-600 mb-1.5">单选 · selectable（无 checkbox）</p>
        <Tree<BasicNode>
          className="max-w-md rounded-lg border border-gray-100 p-2"
          treeData={BASIC_TREE}
          selectable
          defaultExpandAll
          selectedKey={selectedKey}
          onSelect={(key) => setSelectedKey(key)}
        />
        <p className="mt-2 text-xs text-gray-500">
          当前选中：
          <span className="font-mono text-gray-700">{selectedKey ?? '未选择'}</span>
        </p>
      </div>

      <div className="border-t border-gray-100 pt-5">
        <p className="text-xs font-medium text-gray-600 mb-1.5">多选 · 父子联动</p>
        <Tree<BasicNode>
          className="max-w-md rounded-lg border border-gray-100 p-2"
          treeData={BASIC_TREE}
          checkable
          defaultExpandAll
          checkedKeys={checkedBasic}
          onCheck={(keys) => setCheckedBasic(keys)}
        />
        <p className="mt-2 text-xs text-gray-500">
          checkedKeys：
          <span className="font-mono text-gray-700">
            {checkedBasic.length ? checkedBasic.join('，') : '未选择'}
          </span>
        </p>
      </div>

      <div className="border-t border-gray-100 pt-5">
        <p className="text-xs font-medium text-gray-600 mb-1.5">checkStrictly · 父子独立勾选</p>
        <Tree<BasicNode>
          className="max-w-md rounded-lg border border-gray-100 p-2"
          treeData={BASIC_TREE}
          checkable
          checkStrictly
          defaultExpandAll
          checkedKeys={checkedStrict}
          onCheck={(keys) => setCheckedStrict(keys)}
        />
        <p className="mt-2 text-xs text-gray-500">初始勾选 u1；点父节点不会联动子节点</p>
      </div>

      <div className="border-t border-gray-100 pt-5">
        <p className="text-xs font-medium text-gray-600 mb-1.5">
          fieldNames + getKey · 搜索 · isDisabled（user:102 已添加）
        </p>
        <Tree<ApiNode>
          className="max-w-md rounded-lg border border-gray-100 p-2"
          treeData={API_TREE}
          fieldNames={{ title: 'data_name', children: 'children' }}
          getKey={apiKey}
          checkable
          defaultExpandAll
          isDisabled={(n) => n.data_type === 'user' && existingUserIds.has(n.data_id as number)}
          checkedKeys={checkedApi}
          onCheck={(keys) => setCheckedApi(keys)}
          searchable
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="搜索姓名、职位..."
          searchFields={['data_name', 'job_title']}
          titleRender={(node) =>
            node.data_type === 'depart' ? (
              <span className="text-sm font-medium text-gray-700">{node.data_name}</span>
            ) : (
              <span className="text-sm text-gray-800">
                {node.data_name}
                {node.job_title ? (
                  <span className="ml-1.5 rounded bg-violet-50 px-1.5 py-0.5 text-[10px] text-violet-600">
                    {node.job_title}
                  </span>
                ) : null}
              </span>
            )
          }
        />
        <p className="mt-2 text-xs text-gray-500">
          checkedKeys：
          <span className="font-mono text-gray-700">
            {checkedApi.length ? checkedApi.join('，') : '未选择'}
          </span>
        </p>
      </div>
    </div>
  )
}

/** 独立演示页 */
export default function TreeDemoPage() {
  return (
    <div className="min-h-screen overflow-y-auto p-5 bg-gray-50/50">
      <div className="space-y-4">
        <div>
          <h1 className="text-lg font-bold text-(--foreground)">Tree 演示</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            通用树：展开/勾选、fieldNames、getKey、搜索、defaultExpandAll
          </p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-(--surface) p-4">
          <TreeOverviewDemo />
        </div>
      </div>
    </div>
  )
}
