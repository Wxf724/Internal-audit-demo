# Tree 通用树组件

对标 Ant Design `Tree`（antd 5.x）的**通用树形展示与勾选**组件，不依赖 antd。适用于部门人员树、权限树、类目树等需要**展开/折叠 + 多选勾选 + 搜索过滤**的场景。

与 `TreeSelect` 的区别：`Tree` 是**内联树**（非下拉），适合弹窗左右分栏、侧边组织树等布局。

## 引入

```tsx
import {
  Tree,
  type TreeProps,
  type TreeNodeData,
  type TreeKey,
  type TreeFieldNames,
  type TreeNodeContext,
  type TreeCheckInfo,
  type TreeExpandInfo,
} from '@/components/tree'
```

## 能力概览

- 受控 / 非受控的 `expandedKeys`、`checkedKeys`、`selectedKey`、搜索词
- `checkable` 多选勾选 + 父子联动（半选态），或 `checkStrictly` 独立勾选
- `selectable` 单选高亮（无 checkbox），`selectLeafOnly` 控制是否仅叶子可选
- `fieldNames` / `getKey` 映射后端字段，无需改数据结构
- `defaultExpandAll` 默认展开全部父节点
- `titleRender(node, ctx)` 自定义节点内容
- 内置搜索：`searchable` + `searchFields`（支持点号路径）或 `filterNode`
- `isDisabled` 按节点动态禁用

## Props（`TreeProps`）

### 数据与字段


| 属性           | 类型                     | 默认值                                                    | 说明                                                                          |
| ------------ | ---------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------- |
| `treeData`   | `T[]`                  | **必填**                                                 | 树数据源                                                                        |
| `fieldNames` | `TreeFieldNames`       | `{ key: 'key', title: 'title', children: 'children' }` | 将业务字段映射为内部 `key` / `title` / `children`                                     |
| `getKey`     | `(node: T) => TreeKey` | —                                                      | 自定义节点 key，**优先级高于** `fieldNames.key`；不同类型节点 id 可能重复时使用（如 ``${type}:${id}``） |


### 多选勾选（`checkable`）


| 属性                   | 类型                     | 默认值     | 说明                                                                                |
| -------------------- | ---------------------- | ------- | --------------------------------------------------------------------------------- |
| `checkable`          | `boolean`              | `false` | 显示 checkbox，开启多选勾选                                                                |
| `checkStrictly`      | `boolean`              | `false` | `true`：父子勾选互不联动；`false`：点父勾选全部子孙，子未全选时父为半选                                        |
| `checkedKeys`        | `TreeKey[]`            | —       | 受控：当前勾选的 key 列表                                                                   |
| `defaultCheckedKeys` | `TreeKey[]`            | —       | 非受控：初始勾选的 key 列表                                                                  |
| `onCheck`            | `(keys, info) => void` | —       | 勾选变化；`info` 为 `TreeCheckInfo`（含 `node`、`checked`、`checkedKeys`、`halfCheckedKeys`） |


> `checkable` 与 `selectable` 同时传入时，**以 `selectable` 为准**（不显示 checkbox）。

### 单选（`selectable`）


| 属性                   | 类型                    | 默认值     | 说明                                                                         |
| -------------------- | --------------------- | ------- | -------------------------------------------------------------------------- |
| `selectable`         | `boolean`             | `false` | 单选高亮，不显示 checkbox                                                          |
| `selectedKey`        | `TreeKey | null`      | —       | 受控：当前选中的 key                                                               |
| `defaultSelectedKey` | `TreeKey | null`      | —       | 非受控：初始选中的 key                                                              |
| `onSelect`           | `(key, info) => void` | —       | 选中变化；`key` 为 `null` 表示取消；`info` 为 `TreeSelectionInfo`（含 `node`、`selected`） |
| `selectLeafOnly`     | `boolean`             | `true`  | 仅 `selectable` 时有效：`true` 时只有叶子可点选，父节点点击仅展开/收起                             |


### 展开


| 属性                    | 类型                     | 默认值 | 说明                                                  |
| --------------------- | ---------------------- | --- | --------------------------------------------------- |
| `expandedKeys`        | `TreeKey[]`            | —   | 受控：当前展开的 key 列表                                     |
| `defaultExpandedKeys` | `TreeKey[]`            | —   | 非受控：初始展开的 key 列表                                    |
| `defaultExpandAll`    | `boolean`              | —   | 非受控：初次渲染展开全部父节点；`treeData` 更新后重算；用户仍可手动折叠           |
| `onExpand`            | `(keys, info) => void` | —   | 展开变化；`info` 为 `TreeExpandInfo`（含 `node`、`expanded`） |


### 展示与交互


| 属性                         | 类型                         | 默认值      | 说明                                                    |
| -------------------------- | -------------------------- | -------- | ----------------------------------------------------- |
| `titleRender`              | `(node, ctx) => ReactNode` | —        | 自定义节点标题；不传则渲染 `node.title`（或 `fieldNames.title` 对应字段） |
| `indent`                   | `number`                   | `16`     | 每级缩进步长（px）                                            |
| `toggleExpandOnTitleClick` | `boolean`                  | `true`   | 点击标题行时，父节点是否切换展开/收起                                   |
| `toggleCheckOnTitleClick`  | `boolean`                  | `true`   | 点击标题行时，是否切换勾选（仅 `checkable` 时）                        |
| `className`                | `string`                   | `''`     | 根容器 className                                         |
| `scrollable`               | `boolean`                  | `false`  | `true`：树列表在 `flex-1 min-h-0` 容器内滚动，适合弹窗/分栏固定高度        |
| `emptyText`                | `ReactNode`                | `'暂无数据'` | `treeData` 为空时的占位                                     |
| `isDisabled`               | `(node: T) => boolean`     | —        | 动态禁用，与节点 `disabled` **取或**；叶子禁止勾选，父节点禁止行点击与展开         |


### 搜索


| 属性                       | 类型                           | 默认值                  | 说明                                                        |
| ------------------------ | ---------------------------- | -------------------- | --------------------------------------------------------- |
| `searchable`             | `boolean`                    | `false`              | 显示顶部搜索框                                                   |
| `searchValue`            | `string`                     | —                    | 受控搜索关键字                                                   |
| `defaultSearchValue`     | `string`                     | —                    | 非受控初始搜索关键字                                                |
| `onSearchChange`         | `(value: string) => void`    | —                    | 搜索词变化                                                     |
| `searchPlaceholder`      | `string`                     | `'搜索'`               | 搜索框占位文案                                                   |
| `searchFields`           | `string[]`                   | `[fieldNames.title]` | 参与匹配的字段路径，支持点号嵌套（如 `'row.user_name'`）；任一字段子串命中即匹配（不区分大小写） |
| `filterNode`             | `(keyword, node) => boolean` | —                    | 自定义过滤；**提供时优先于** `searchFields`；返回 `true` 表示该节点自身命中       |
| `notFoundContent`        | `ReactNode`                  | 同 `emptyText`        | 有数据但搜索无匹配时的占位                                             |
| `searchWrapperClassName` | `string`                     | `''`                 | 搜索区外层 className                                           |
| `searchInputClassName`   | `string`                     | `''`                 | 搜索 input className                                        |


## 节点数据（`TreeNodeData`）

业务节点可扩展任意字段供 `titleRender` / `searchFields` 使用：


| 字段                | 类型               | 说明                                   |
| ----------------- | ---------------- | ------------------------------------ |
| `key`             | `TreeKey`        | 唯一 key；可省略，由 `fieldNames.key` 映射字段注入 |
| `title`           | `ReactNode`      | 默认标题                                 |
| `children`        | `TreeNodeData[]` | 子节点                                  |
| `disabled`        | `boolean`        | 整行禁用：不响应点击/勾选/展开                     |
| `disableCheckbox` | `boolean`        | 仅 checkbox 禁用；父子联动勾选时跳过该节点           |
| `isLeaf`          | `boolean`        | 强制视为叶子（无子节点时也隐藏展开箭头）                 |


## 回调类型


| 类型                  | 字段                                                                                                          |
| ------------------- | ----------------------------------------------------------------------------------------------------------- |
| `TreeNodeContext`   | `depth`、`expanded`、`checked`、`indeterminate`、`selected`、`hasChildren`、`isLeaf`、`disabled`、`disableCheckbox` |
| `TreeCheckInfo`     | `node`、`checked`、`checkedKeys`、`halfCheckedKeys`                                                            |
| `TreeExpandInfo`    | `node`、`expanded`                                                                                           |
| `TreeSelectionInfo` | `node`、`selected`                                                                                           |


完整定义见 `Tree.tsx`。

## 单选（无 checkbox）

```tsx
const [selectedKey, setSelectedKey] = useState<TreeKey | null>(null)

<Tree
  treeData={tree}
  selectable
  selectedKey={selectedKey}
  onSelect={(key) => setSelectedKey(key)}
/>
```

默认仅叶子可点选（`selectLeafOnly`，默认 `true`）；再次点击同一项可取消选中。

## 基础用法

```tsx
const tree = [
  {
    key: 'd1',
    title: '研发中心',
    children: [
      { key: 'u1', title: '张三', isLeaf: true },
      { key: 'u2', title: '李四', isLeaf: true },
    ],
  },
]

const [checkedKeys, setCheckedKeys] = useState<TreeKey[]>([])

<Tree
  treeData={tree}
  checkable
  defaultExpandAll
  checkedKeys={checkedKeys}
  onCheck={(keys) => setCheckedKeys(keys)}
/>
```

## 直接传后端原始树（fieldNames + getKey）

部门 `data_id` 为 string、人员为 number 时，建议用 `getKey` 避免 key 冲突：

```tsx
type Node = { data_type: 'depart' | 'user'; data_id: string | number; data_name: string; children?: Node[] }

const getKey = (n: Node) => `${n.data_type}:${n.data_id}`

<Tree<Node>
  treeData={apiTree}
  fieldNames={{ title: 'data_name', children: 'children' }}
  getKey={getKey}
  checkable
  defaultExpandAll
  checkedKeys={checkedKeys}
  onCheck={setCheckedKeys}
  isDisabled={(n) => n.data_type === 'user' && existingIds.has(n.data_id as number)}
/>
```

`onCheck` 返回的 `keys` 可能同时包含部门 key 与人员 key；业务侧用 `getKey` 过滤出人员行即可。

## 搜索

```tsx
<Tree
  treeData={tree}
  searchable
  searchPlaceholder="搜索姓名、职位..."
  searchFields={['data_name', 'job_title', 'skill_info']}
/>
```

- 节点自身命中：保留该节点及**全部**子节点
- 仅子节点命中：保留祖先路径 + 命中分支
- 搜索中会临时展开过滤结果的父节点；清空搜索后恢复用户之前的展开状态

## titleRender 与 ctx

```tsx
titleRender={(node, ctx) => (
  <div className={ctx.disabled ? 'opacity-50' : ''}>
    {node.data_name}
    {ctx.indeterminate && <span>（部分选中）</span>}
  </div>
)}
```

`ctx` 含 `expanded`、`checked`、`indeterminate`、`isLeaf`、`disabled` 等，便于按状态渲染。

## Demo

- 组件总览：`/conv-agent/component-overview` → 左侧选 **Tree**
- 演示源码：`src/components/tree/demo.tsx`（`TreeOverviewDemo` / `TreeDemoPage`）

