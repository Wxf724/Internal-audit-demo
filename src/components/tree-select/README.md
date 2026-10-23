# TreeSelect 树形选择器

C 端风格的**通用**树形下拉选择组件，能力对标 Ant Design `TreeSelect`：树形展开/收起、单选/多选、搜索、标签、清空、懒加载、受控与非受控。  
**不绑定具体业务**：部门、类目、权限树等场景只需传入对应的 `treeData` 即可。

使用 **React 18 + Tailwind CSS**，主色为柔和紫色系，可在组件源码顶部修改 `PRIMARY` 等常量。

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `treeData` | `readonly unknown[]` | 必填 | 树数据；可为标准 `TreeNode[]`，也可传接口原始对象数组并配合 `fieldNames` 使用 |
| `value` | `T \| T[] \| null` | - | 受控值；单选为单个 id，多选为 id 数组 |
| `defaultValue` | `T \| T[] \| null` | `null` | 非受控默认值 |
| `onChange` | `(value, nodes) => void` | - | 选择变化回调；第二参数为当前选中的 `TreeNode`、`TreeNode[]` 或 `null` |
| `mode` | `'single' \| 'multiple'` | `'single'` | 单选或多选模式 |
| `selectLeafOnly` | `boolean` | `true` | **单选**时是否仅叶子可选中；父节点点击仅展开/收起；多选无效 |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `placeholder` | `string` | `'请选择'` | 触发器占位文案 |
| `allowClear` | `boolean` | `true` | 是否允许清空 |
| `searchPlaceholder` | `string` | `'搜索'` | 搜索框占位文案 |
| `loadData` | `(node: TreeNode) => Promise<readonly unknown[]>` | - | 懒加载子节点；返回数据会按 `fieldNames` 归一化 |
| `fieldNames` | `TreeFieldNames` | `{ label: 'title', value: 'id', children: 'children', disabled: 'disabled', isLeaf: 'isLeaf' }` | 节点字段映射 |
| `treeCheckStrictly` | `boolean` | `true` | 多选时父子是否独立选中；`false` 时父子联动 |
| `showCheckedStrategy` | `'SHOW_ALL' \| 'SHOW_PARENT' \| 'SHOW_CHILD'` | `'SHOW_CHILD'` | 多选标签展示策略 |
| `emptyText` | `string` | `'暂无数据'` | 空数据文案 |
| `notFoundText` | `string` | `'无匹配项'` | 无匹配搜索结果文案 |
| `maxTagCount` | `number` | `3` | 多选时最多展示标签数，超出显示 `+N` |
| `className` | `string` | `''` | 根节点类名 |
| `dropdownMatchSelectWidth` | `boolean` | `true` | 下拉宽度是否与触发器一致 |
| `style` | `CSSProperties` | - | 根节点内联样式 |
| `size` | `'sm' \| 'md' \| 'lg'` | `'sm'` | 控件尺寸 |

## 能力概览

- 单选 / 多选
- 搜索过滤整棵树（保留匹配节点及祖先路径）
- 多选标签、`allowClear` 一键清空
- 下拉展开过渡动画
- `loadData` 懒加载子节点（返回数据会按 `fieldNames` 归一化）
- **`fieldNames`**：对标 Ant Design TreeSelect [fieldNames](https://www.antdv.com/components/tree-select-cn)，映射接口字段到内部树结构
- **`treeCheckStrictly`**：对标 Ant Design [treeCheckStrictly](https://www.antdv.com/components/tree-select-cn)，控制多选时父子是否联动（仅 `mode="multiple"` 有效）
- **`showCheckedStrategy`**：对标 Ant Design TreeSelect [showCheckedStrategy](https://www.antdv.com/components/tree-select-cn)，控制多选时已选标签的展示策略

## 引入

```tsx
import { TreeSelect, type TreeNode, type TreeFieldNames } from '@/components'
// 或
import { TreeSelect, type TreeNode } from '@/components/tree-select'
```

## 数据结构（TreeNode）

| 字段 | 说明 |
|------|------|
| `id` | 节点唯一标识，`string \| number` |
| `title` | 展示文案 |
| `children` | 子节点；懒加载时可先不提供 |
| `disabled` | 是否禁止选择 |
| `isLeaf` | 是否叶子；需懒加载且无 `children` 时可设为 `false` |

## 单选（受控）

```tsx
import { useState } from 'react'
import { TreeSelect, type TreeNode } from '@/components'

const tree: TreeNode[] = [
  { id: 1, title: 'A', children: [{ id: 2, title: 'A-1', isLeaf: true }] },
]

const [id, setId] = useState<string | number | null>(null)

<TreeSelect
  treeData={tree}
  value={id}
  onChange={(v) => setId(v as string | number | null)}
  mode="single"
  placeholder="请选择部门"
/>
```

`onChange` 第二参数为当前选中的 `TreeNode` 或 `TreeNode[]`（多选），未选为 `null`。

## 多选

```tsx
const [ids, setIds] = useState<(string | number)[]>([])

<TreeSelect
  treeData={tree}
  mode="multiple"
  value={ids}
  onChange={(v) => setIds((v as (string | number)[]) ?? [])}
  maxTagCount={3}
/>
```

### `treeCheckStrictly`（父子联动）

语义对齐 Ant Design：**仅多选生效**。

| 取值 | 行为 |
|------|------|
| `true`（默认） | 严格模式：每次只切换当前节点 id，父子互不牵连 |
| `false` | 联动模式：点父级会选中/取消整棵子树（跳过 `disabled` 节点）；若该枝上可选节点已全部选中则再次点击父级会整枝取消 |

```tsx
<TreeSelect
  treeData={tree}
  mode="multiple"
  treeCheckStrictly={false}
  value={ids}
  onChange={(v) => setIds((v as (string | number)[]) ?? [])}
/>
```

### `showCheckedStrategy`（已选标签展示策略）

仅影响多选触发器里的标签展示，不改变 `value` 和 `onChange` 返回值。

| 取值 | 行为 |
|------|------|
| `SHOW_ALL` | 展示所有已选节点 |
| `SHOW_PARENT` | 父子同时选中时只展示父节点 |
| `SHOW_CHILD`（默认） | 父子同时选中时只展示子节点 |

```tsx
<TreeSelect
  treeData={tree}
  mode="multiple"
  treeCheckStrictly={false}
  showCheckedStrategy="SHOW_PARENT"
  value={ids}
  onChange={(v) => setIds((v as (string | number)[]) ?? [])}
/>
```

## fieldNames（接口字段映射）

默认等价于 `{ label: 'title', value: 'id', children: 'children', disabled: 'disabled', isLeaf: 'isLeaf' }`。  
若后端为 `label` / `value`：

```tsx
const apiTree = [
  {
    value: '1',
    label: '总部',
    children: [{ value: '1-1', label: '研发部' }],
  },
]

<TreeSelect
  treeData={apiTree}
  fieldNames={{
    label: 'label',
    value: 'value',
    children: 'children',
  }}
  mode="single"
/>
```

内部会归一成 `TreeNode`（`title` / `id` / `children`），搜索与展示均基于归一化结果。

## 懒加载

为需要异步拉取子节点的项设置 `isLeaf: false` 且暂不提供 `children`，并实现 `loadData`：

```tsx
<TreeSelect
  treeData={tree}
  loadData={async (node) => {
    const res = await api.getChildren(node.id)
    return res
  }}
/>
```

## 主题

在 `tree-select/index.tsx` 顶部修改 `PRIMARY`、`PRIMARY_DEEP`、`PRIMARY_SOFT` 等即可换色。
