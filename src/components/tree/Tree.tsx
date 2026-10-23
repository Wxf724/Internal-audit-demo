/**
 * 通用树组件 `Tree`：与 Ant Design `Tree`（antd 5.x）API/概念对照（不依赖 antd）。
 *
 * ## 与 antd 5.x `Tree` 设计对照
 *
 * | antd `Tree` | `Tree` | 说明 |
 * |---|---|---|
 * | `treeData: DataNode[]` | `treeData: T[]` | 数据源；可通过 `fieldNames` 映射后端字段名 |
 * | `fieldNames` | `fieldNames` | `{ key, title, children }` 字段名映射，默认即三者 |
 * | `checkable` | `checkable` | 是否显示 checkbox |
 * | `checkStrictly` | `checkStrictly` | true 时父子互不联动 |
 * | `expandedKeys` / `onExpand` | `expandedKeys` / `onExpand` | 受控展开 |
 * | `checkedKeys` / `onCheck` | `checkedKeys` / `onCheck` | 受控勾选；非受控可用 `defaultCheckedKeys` |
 * | `defaultExpandAll` | `defaultExpandAll` | 初次渲染时默认展开全部父节点 |
 * | `titleRender(nodeData)` | `titleRender(node, ctx)` | **完全自定义节点标题**（含 ctx 状态便于条件渲染） |
 * | `disabled` | `node.disabled` | 节点禁用：整行不响应点击 |
 * | `disableCheckbox` | `node.disableCheckbox` | 仅 checkbox 禁用；父节点联动勾选自动跳过 |
 * | `switcherIcon` | （内置）| 默认 `ri-arrow-*-s-line` |
 *
 * 暂未实现：`virtual` / 拖拽 / 多选 selectable / Directory 风格连线 / `loadData` 异步加载。
 *
 * @see https://ant.design/components/tree-cn
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { matchesPinyin } from '@/utils/pinyin'
import { sizePresets, type SizePreset } from '../theme'

export type TreeKey = string | number

/** 节点数据基础结构；可扩展任意业务字段供 `titleRender` 使用 */
export interface TreeNodeData {
  /**
   * 节点唯一 key（与 antd `key` 一致）。
   * 可省略：当 `fieldNames.key` 指向其它字段（如 `data_id`）时，组件会自动按映射取值并注入到 `key` 上。
   */
  key?: TreeKey
  /** 默认标题；如果传 `titleRender` 则被覆盖 */
  title?: ReactNode
  children?: TreeNodeData[]
  /** 整行禁用：不响应点击/勾选 */
  disabled?: boolean
  /** 仅 checkbox 禁用：父节点联动时跳过此叶子 */
  disableCheckbox?: boolean
  /** 强制视为叶子（即便 `children` 为空数组也不显示折叠箭头） */
  isLeaf?: boolean
}

/** 字段名映射：当业务数据用 snake_case 等非默认字段时用此映射，避免转换 */
export interface TreeFieldNames {
  key?: string
  title?: string
  children?: string
}

/** titleRender 第二参：当前节点的运行时状态 + 操作函数 */
export interface TreeNodeContext {
  depth: number
  expanded: boolean
  /** 复选状态（开启 `checkable` 时有效） */
  checked: boolean
  indeterminate: boolean
  /** 单选高亮（开启 `selectable` 时有效） */
  selected: boolean
  hasChildren: boolean
  isLeaf: boolean
  disabled: boolean
  disableCheckbox: boolean
}

export interface TreeSelectionInfo<T extends TreeNodeData = TreeNodeData> {
  node: T
  /** 点击后该节点是否处于选中态 */
  selected: boolean
}

export interface TreeCheckInfo<T extends TreeNodeData = TreeNodeData> {
  /** 操作的节点 */
  node: T
  /** 操作后该节点是否被勾选 */
  checked: boolean
  /** 当前所有勾选 key（与 onCheck 第 1 参一致） */
  checkedKeys: TreeKey[]
  /** 半勾选 key（父节点） */
  halfCheckedKeys: TreeKey[]
}

export interface TreeExpandInfo<T extends TreeNodeData = TreeNodeData> {
  node: T
  expanded: boolean
}

export interface TreeProps<T extends TreeNodeData = TreeNodeData> {
  size?: SizePreset
  treeData: T[]
  /** 字段名映射（默认 `{ key: 'key', title: 'title', children: 'children' }`） */
  fieldNames?: TreeFieldNames
  /**
   * 自定义节点 key，优先级高于 `fieldNames.key`。
   * 适用于原始数据里不同类型节点可能复用同一 id 的场景，例如 `${node.type}:${node.id}`。
   */
  getKey?: (node: T) => TreeKey
  /** 显示 checkbox（多选） */
  checkable?: boolean
  /** 单选高亮，不显示 checkbox；与 `checkable` 互斥，优先 `selectable` */
  selectable?: boolean
  /** 受控单选 key */
  selectedKey?: TreeKey | null
  /** 非受控初始选中 key */
  defaultSelectedKey?: TreeKey | null
  onSelect?: (key: TreeKey | null, info: TreeSelectionInfo<T>) => void
  /** `selectable` 时是否仅叶子可选中，默认 true */
  selectLeafOnly?: boolean
  /** true 时父子互不联动；默认 false（点父勾全部、子未全勾时父显半选） */
  checkStrictly?: boolean
  /** 受控展开 */
  expandedKeys?: TreeKey[]
  /** 非受控初始展开 */
  defaultExpandedKeys?: TreeKey[]
  /**
   * 默认展开全部父节点（非受控）。
   * 未传 `expandedKeys` 时生效；`treeData` 更新后会重新展开全部父节点。
   * 用户仍可手动折叠/展开，搜索时会临时展开命中分支，清空搜索后恢复。
   */
  defaultExpandAll?: boolean
  /** 受控勾选 */
  checkedKeys?: TreeKey[]
  /** 非受控初始勾选 */
  defaultCheckedKeys?: TreeKey[]
  onExpand?: (keys: TreeKey[], info: TreeExpandInfo<T>) => void
  onCheck?: (keys: TreeKey[], info: TreeCheckInfo<T>) => void
  /** 自定义节点标题；不传则渲染 `node.title` */
  titleRender?: (node: T, ctx: TreeNodeContext) => ReactNode
  /** 节点缩进步长（px），默认 16 */
  indent?: number
  /** 行点击行为：父节点是否切换展开（默认 true）；叶子节点是否切换勾选（默认 true，仅 checkable 时） */
  toggleExpandOnTitleClick?: boolean
  toggleCheckOnTitleClick?: boolean
  className?: string
  /**
   * 树列表区域内部滚动（用于弹窗/分栏等固定高度容器）。
   * 默认 false：列表随内容增高，由外层页面滚动。
   */
  scrollable?: boolean
  /** 空数据占位 */
  emptyText?: ReactNode
  /**
   * 按节点动态判断是否禁用（与 `node.disabled` 取或）。
   * 对叶子节点等价于禁止勾选；对父节点同时禁止行点击/展开。
   * 极少数"行可点但 checkbox 禁用"的场景请改用节点字段 `node.disableCheckbox`。
   */
  isDisabled?: (node: T) => boolean
  // ── 内置搜索 ────────────────────────────────────────────────
  /** 显示顶部搜索输入框 */
  searchable?: boolean
  /** 受控搜索值 */
  searchValue?: string
  /** 非受控初始搜索值 */
  defaultSearchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  /**
   * 参与匹配的字段路径数组（支持点号嵌套，如 `'row.user_name'`）；
   * 不传时默认按 `fieldNames.title` 单字段匹配；
   * 任一字段命中即视为匹配（不区分大小写）。
   */
  searchFields?: string[]
  /** 自定义过滤函数（提供时优先于 `searchFields`）；返回 true 表示该节点自身命中 */
  filterNode?: (keyword: string, node: T) => boolean
  /** 搜索无结果时的占位（默认与 `emptyText` 相同） */
  notFoundContent?: ReactNode
  /** 搜索输入框外层 wrapper className */
  searchWrapperClassName?: string
  /** 搜索 input className */
  searchInputClassName?: string
}

/** 默认字段名 */
const DEFAULT_FIELDS: Required<TreeFieldNames> = {
  key: 'key',
  title: 'title',
  children: 'children',
}

function readField<T>(node: T, name: string): unknown {
  return (node as Record<string, unknown>)[name]
}

/** 按点号路径读取嵌套字段，例如 `'row.user_name'` */
function readByPath(node: unknown, path: string): unknown {
  if (!path) return undefined
  const segs = path.split('.')
  let cur: unknown = node
  for (const seg of segs) {
    if (cur == null || typeof cur !== 'object') return undefined
    cur = (cur as Record<string, unknown>)[seg]
  }
  return cur
}

/** 单节点是否命中关键字（按 searchFields；任一字段子串命中即可，不区分大小写，支持拼音） */
function nodeMatchesKeyword<T>(node: T, keyword: string, fields: string[]): boolean {
  if (!keyword) return true
  for (const path of fields) {
    const v = readByPath(node, path)
    if (v == null) continue
    if (matchesPinyin(String(v), keyword)) return true
  }
  return false
}

/**
 * 按 predicate 过滤树：
 * - 节点自身命中 → 保留，且保留**全部原始子节点**
 * - 节点未命中但有后代命中 → 保留，仅保留命中分支
 * - 都未命中 → 丢弃
 */
function filterTreeByPredicate<T extends TreeNodeData>(
  nodes: T[],
  predicate: (node: T) => boolean,
  childrenKey: string
): T[] {
  const out: T[] = []
  for (const node of nodes) {
    const children = (readField(node, childrenKey) as T[] | undefined) ?? []
    const selfMatch = predicate(node)
    if (selfMatch) {
      out.push(node)
      continue
    }
    if (children.length === 0) continue
    const filtered = filterTreeByPredicate(children, predicate, childrenKey)
    if (filtered.length > 0) {
      out.push({ ...node, [childrenKey]: filtered } as T)
    }
  }
  return out
}

/** 收集所有"可勾选叶子"的 key（用于 checkStrictly=false 下的父子联动） */
function collectEnabledLeafKeys<T extends TreeNodeData>(
  nodes: T[],
  childrenKey: string
): TreeKey[] {
  const out: TreeKey[] = []
  const walk = (list: T[]) => {
    for (const n of list) {
      if (n.disabled || n.disableCheckbox) continue
      const children = (readField(n, childrenKey) as T[] | undefined) ?? []
      if (n.isLeaf || children.length === 0) {
        if (n.key !== undefined) out.push(n.key)
      } else {
        walk(children)
      }
    }
  }
  walk(nodes)
  return out
}

/** 收集所有父节点 key（用于 defaultExpandAll） */
function collectParentKeys<T extends TreeNodeData>(
  nodes: T[],
  childrenKey: string,
  getKey: (node: T) => TreeKey | undefined
): TreeKey[] {
  const out: TreeKey[] = []
  const walk = (list: T[]) => {
    for (const n of list) {
      const children = (readField(n, childrenKey) as T[] | undefined) ?? []
      if (children.length > 0 && !n.isLeaf) {
        const k = getKey(n)
        if (k !== undefined) out.push(k)
        walk(children)
      }
    }
  }
  walk(nodes)
  return out
}

/** Checkbox 视觉：未选 / 全选 / 半选 / 禁用 */
function TreeCheckbox(props: {
  checked: boolean
  indeterminate: boolean
  disabled: boolean
  onClick: (e: React.MouseEvent) => void
  ariaLabel?: string
}) {
  const { checked, indeterminate, disabled, onClick, ariaLabel } = props
  const base =
    'flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-colors'
  const cls = disabled
    ? 'border-(--border) bg-gray-200 cursor-not-allowed'
    : checked
      ? 'border-(--accent-hover) bg-(--accent-hover) cursor-pointer'
      : indeterminate
        ? 'border-(--accent) bg-(--accent-soft) cursor-pointer'
        : 'border-(--border) bg-(--surface) cursor-pointer hover:border-(--focus-ring)'
  return (
    <span
      role="checkbox"
      aria-checked={indeterminate ? 'mixed' : checked}
      aria-disabled={disabled || undefined}
      aria-label={ariaLabel}
      onClick={disabled ? undefined : onClick}
      className={`${base} ${cls}`}
    >
      {checked && <i className="ri-check-line text-[10px] text-white" />}
      {!checked && indeterminate && <span className="h-0.5 w-2 rounded bg-(--accent-hover)" />}
      {disabled && checked && <i className="ri-check-line text-[10px] text-white" />}
    </span>
  )
}

/** Switcher（展开/折叠箭头）。无 children 时渲染占位保持对齐 */
function TreeSwitcher(props: {
  expanded: boolean
  visible: boolean
  onClick: (e: React.MouseEvent) => void
}) {
  const { expanded, visible, onClick } = props
  if (!visible) {
    return <span className="inline-block h-4 w-4 shrink-0" aria-hidden />
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={expanded ? '收起' : '展开'}
      className="inline-flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded text-gray-400 hover:bg-gray-100"
    >
      <i
        className={`${expanded ? 'ri-arrow-down-s-line' : 'ri-arrow-right-s-line'} text-base leading-none`}
      />
    </button>
  )
}

/**
 * `Tree` —— 通用树组件。
 *
 * 用法示例：
 * ```tsx
 * <Tree
 *   treeData={data}
 *   checkable
 *   defaultExpandAll
 *   checkedKeys={keys}
 *   onCheck={(keys, info) => setKeys(keys)}
 *   titleRender={(node) => <CustomRow node={node} />}
 * />
 * ```
 */
export function Tree<T extends TreeNodeData = TreeNodeData>(props: TreeProps<T>) {
  const {
    size = 'sm',
    treeData,
    fieldNames,
    getKey,
    checkable = false,
    selectable = false,
    selectedKey: selectedKeyProp,
    defaultSelectedKey,
    onSelect,
    selectLeafOnly = true,
    checkStrictly = false,
    expandedKeys,
    defaultExpandedKeys,
    defaultExpandAll,
    checkedKeys,
    defaultCheckedKeys,
    onExpand,
    onCheck,
    titleRender,
    indent = 16,
    toggleExpandOnTitleClick = true,
    toggleCheckOnTitleClick = true,
    className = '',
    scrollable = false,
    emptyText = '暂无数据',
    isDisabled,
    searchable = false,
    searchValue,
    defaultSearchValue,
    onSearchChange,
    searchPlaceholder = '搜索',
    searchFields,
    filterNode,
    notFoundContent,
    searchWrapperClassName = '',
    searchInputClassName = '',
  } = props

  const sz = sizePresets[size]
  const fields = { ...DEFAULT_FIELDS, ...fieldNames }
  const resolveKey = (node: T): TreeKey | undefined => {
    if (getKey) return getKey(node)
    return readField(node, fields.key) as TreeKey | undefined
  }

  // ── 搜索状态（受控/非受控） ──────────────────────────────────
  const [innerSearch, setInnerSearch] = useState(defaultSearchValue ?? '')
  const activeSearch = searchValue !== undefined ? searchValue : innerSearch
  const handleSearchChange = (val: string) => {
    if (searchValue === undefined) setInnerSearch(val)
    onSearchChange?.(val)
  }

  // 过滤后的数据：搜索为空时直接返回原 treeData
  const filteredTreeData = useMemo(() => {
    const kw = activeSearch.trim()
    if (!kw) return treeData
    const fieldsToSearch = searchFields && searchFields.length > 0 ? searchFields : [fields.title]
    const predicate = filterNode
      ? (n: T) => filterNode(kw, n)
      : (n: T) => nodeMatchesKeyword(n, kw, fieldsToSearch)
    return filterTreeByPredicate(treeData, predicate, fields.children)
  }, [treeData, activeSearch, searchFields, filterNode, fields.title, fields.children])

  const isSearching = activeSearch.trim().length > 0

  /**
   * 装饰一层：
   * 1. 通过 `getKey` / `fields.key` 把节点 key 统一注入到 `node.key` 上；
   * 2. 应用 `isDisabled` 的外部判断结果（写入到节点 `disabled` 字段）；
   * 不污染原数据（仅当确有改动时返回新对象）
   */
  const displayedTreeData = useMemo(() => {
    if (!getKey && fields.key === 'key' && !isDisabled) return filteredTreeData
    const walk = (list: T[]): T[] =>
      list.map((n) => {
        const ed = isDisabled?.(n)
        const children = (readField(n, fields.children) as T[] | undefined) ?? []
        const decoratedChildren = children.length > 0 ? walk(children) : children
        const mappedKey = resolveKey(n)
        const changed =
          (mappedKey !== undefined && n.key !== mappedKey) ||
          (ed && !n.disabled) ||
          decoratedChildren !== children
        if (!changed) return n
        return {
          ...n,
          key: mappedKey ?? n.key,
          disabled: n.disabled || ed,
          [fields.children]: decoratedChildren,
        } as T
      })
    return walk(filteredTreeData)
  }, [filteredTreeData, getKey, isDisabled, fields.key, fields.children])

  // ── 内部状态：未提供受控时使用 ─────────────────────────────────
  const [innerExpanded, setInnerExpanded] = useState<Set<TreeKey>>(() => {
    if (defaultExpandedKeys) return new Set(defaultExpandedKeys)
    if (defaultExpandAll) return new Set(collectParentKeys(treeData, fields.children, resolveKey))
    return new Set()
  })
  const [innerChecked, setInnerChecked] = useState<Set<TreeKey>>(
    () => new Set(defaultCheckedKeys ?? [])
  )
  const [innerSelected, setInnerSelected] = useState<TreeKey | null>(defaultSelectedKey ?? null)
  const selectedKey = selectedKeyProp !== undefined ? selectedKeyProp : innerSelected
  const showCheckbox = checkable && !selectable

  // 受控展开/勾选 → 同步至内部 Set 便于查询
  const baseExpandedSet = useMemo(
    () => (expandedKeys ? new Set<TreeKey>(expandedKeys) : innerExpanded),
    [expandedKeys, innerExpanded]
  )
  // 搜索激活时，自动展开过滤后的全部父节点；搜索清空后恢复原展开
  const expandedSet = useMemo(() => {
    if (!isSearching) return baseExpandedSet
    return new Set<TreeKey>(collectParentKeys(displayedTreeData, fields.children, (n) => n.key))
  }, [isSearching, baseExpandedSet, displayedTreeData, fields.children])
  const checkedSet = useMemo(
    () => (checkedKeys ? new Set<TreeKey>(checkedKeys) : innerChecked),
    [checkedKeys, innerChecked]
  )

  // defaultExpandAll：treeData 变化时若未受控且当前为空，重算
  const lastTreeRef = useRef(treeData)
  useEffect(() => {
    if (expandedKeys) return
    if (defaultExpandedKeys) return
    if (!defaultExpandAll) return
    if (lastTreeRef.current === treeData) return
    lastTreeRef.current = treeData
    setInnerExpanded(new Set(collectParentKeys(treeData, fields.children, resolveKey)))
  }, [
    treeData,
    expandedKeys,
    defaultExpandedKeys,
    defaultExpandAll,
    fields.children,
    fields.key,
    getKey,
  ])

  // ── 计算每个节点的 checked / indeterminate ─────────────────────
  const { checkedMap, indeterminateMap } = useMemo(() => {
    const c = new Map<TreeKey, boolean>()
    const i = new Map<TreeKey, boolean>()
    if (!checkable) return { checkedMap: c, indeterminateMap: i }

    const walk = (node: T): { total: number; checked: number } => {
      const children = (readField(node, fields.children) as T[] | undefined) ?? []
      if (node.isLeaf || children.length === 0) {
        const total = node.disabled || node.disableCheckbox ? 0 : 1
        const isChecked = checkedSet.has(node.key)
        c.set(node.key, isChecked)
        i.set(node.key, false)
        return { total, checked: isChecked && total > 0 ? 1 : 0 }
      }
      if (checkStrictly) {
        c.set(node.key, checkedSet.has(node.key))
        i.set(node.key, false)
        children.forEach(walk)
        return { total: 0, checked: 0 }
      }
      let total = 0
      let checked = 0
      for (const child of children) {
        const r = walk(child)
        total += r.total
        checked += r.checked
      }
      const allChecked = total > 0 && checked === total
      const someChecked = checked > 0 && checked < total
      c.set(node.key, allChecked)
      i.set(node.key, someChecked)
      return { total, checked }
    }

    displayedTreeData.forEach(walk)
    return { checkedMap: c, indeterminateMap: i }
  }, [displayedTreeData, checkedSet, checkable, checkStrictly, fields.children])

  // ── 操作：展开 / 勾选 ─────────────────────────────────────────
  const setExpanded = (next: Set<TreeKey>, info: TreeExpandInfo<T>) => {
    const keys = Array.from(next)
    if (!expandedKeys) setInnerExpanded(next)
    onExpand?.(keys, info)
  }

  const handleToggleExpand = (node: T) => {
    const next = new Set(expandedSet)
    const isOpen = next.has(node.key)
    if (isOpen) next.delete(node.key)
    else next.add(node.key)
    setExpanded(next, { node, expanded: !isOpen })
  }

  const setChecked = (next: Set<TreeKey>, info: TreeCheckInfo<T>) => {
    const keys = Array.from(next)
    if (!checkedKeys) setInnerChecked(next)
    onCheck?.(keys, info)
  }

  const handleSelect = (node: T) => {
    if (node.disabled || node.key === undefined) return
    const children = (readField(node, fields.children) as T[] | undefined) ?? []
    const isLeaf = node.isLeaf || children.length === 0
    if (selectLeafOnly && !isLeaf) return
    const next = selectedKey === node.key ? null : node.key
    if (selectedKeyProp === undefined) setInnerSelected(next)
    onSelect?.(next, { node, selected: next === node.key })
  }

  const handleToggleCheck = (node: T) => {
    if (node.disabled || node.disableCheckbox) return
    const children = (readField(node, fields.children) as T[] | undefined) ?? []
    const isLeaf = node.isLeaf || children.length === 0

    const next = new Set(checkedSet)

    if (checkStrictly || isLeaf) {
      // 叶子或严格模式：仅切换自身
      const wasChecked = next.has(node.key)
      if (wasChecked) next.delete(node.key)
      else next.add(node.key)
      const half = computeHalfCheckedKeys(displayedTreeData, next, fields.children, checkStrictly)
      setChecked(next, {
        node,
        checked: !wasChecked,
        checkedKeys: Array.from(next),
        halfCheckedKeys: half,
      })
      return
    }

    // 父节点 + 非严格：联动**当前可见子树**下所有可勾选叶子（与 indeterminate 计算保持一致）
    const leaves = collectEnabledLeafKeys([node], fields.children)
    if (leaves.length === 0) return
    const allChecked = leaves.every((k) => next.has(k))
    if (allChecked) leaves.forEach((k) => next.delete(k))
    else leaves.forEach((k) => next.add(k))
    const half = computeHalfCheckedKeys(displayedTreeData, next, fields.children, checkStrictly)
    setChecked(next, {
      node,
      checked: !allChecked,
      checkedKeys: Array.from(next),
      halfCheckedKeys: half,
    })
  }

  // ── 渲染 ─────────────────────────────────────────────────────
  const searchBar = searchable ? (
    <div className={`relative mb-2 ${searchWrapperClassName}`}>
      <i className="ri-search-line pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base text-gray-400" />
      <input
        type="text"
        value={activeSearch}
        onChange={(e) => handleSearchChange(e.target.value)}
        placeholder={searchPlaceholder}
        className={
          searchInputClassName ||
          `${sz.h} w-full rounded-lg border border-(--border) bg-(--surface) pl-9 pr-3 ${sz.font} outline-none transition-colors placeholder:text-gray-400 hover:border-(--focus-ring) focus:border-(--accent)`
        }
      />
    </div>
  ) : null

  // 内容区（在 flex 容器下可独立滚动；非 flex 容器则自然展开）
  let body: ReactNode
  if (!treeData || treeData.length === 0) {
    body = (
      <div className="flex h-32 items-center justify-center text-xs text-gray-400">{emptyText}</div>
    )
  } else if (displayedTreeData.length === 0) {
    body = (
      <div className="flex h-32 items-center justify-center text-xs text-gray-400">
        {notFoundContent ?? emptyText}
      </div>
    )
  } else {
    body = (
      <div
        role="tree"
        className={scrollable ? 'min-h-0 flex-1 overflow-y-auto overscroll-contain' : undefined}
      >
        {displayedTreeData.map((node) => (
          <TreeItem
            key={node.key}
            node={node}
            depth={0}
            fields={fields}
            indent={indent}
            sz={sz}
            checkable={showCheckbox}
            selectable={selectable}
            selectedKey={selectedKey}
            selectLeafOnly={selectLeafOnly}
            expandedSet={expandedSet}
            checkedMap={checkedMap}
            indeterminateMap={indeterminateMap}
            titleRender={titleRender}
            onToggleExpand={handleToggleExpand}
            onToggleCheck={handleToggleCheck}
            onSelect={handleSelect}
            toggleExpandOnTitleClick={toggleExpandOnTitleClick}
            toggleCheckOnTitleClick={toggleCheckOnTitleClick}
          />
        ))}
      </div>
    )
  }

  const rootCls = scrollable
    ? [className, 'flex min-h-0 flex-col'].filter(Boolean).join(' ')
    : className
  return (
    <div className={rootCls || undefined}>
      {searchBar}
      {body}
    </div>
  )
}

function computeHalfCheckedKeys<T extends TreeNodeData>(
  nodes: T[],
  checkedSet: Set<TreeKey>,
  childrenKey: string,
  checkStrictly: boolean
): TreeKey[] {
  if (checkStrictly) return []
  const half: TreeKey[] = []
  const walk = (node: T): { total: number; checked: number } => {
    const children = (readField(node, childrenKey) as T[] | undefined) ?? []
    if (node.isLeaf || children.length === 0) {
      const total = node.disabled || node.disableCheckbox ? 0 : 1
      const isChecked = checkedSet.has(node.key) && total > 0 ? 1 : 0
      return { total, checked: isChecked }
    }
    let total = 0
    let checked = 0
    for (const child of children) {
      const r = walk(child)
      total += r.total
      checked += r.checked
    }
    if (checked > 0 && checked < total) half.push(node.key)
    return { total, checked }
  }
  nodes.forEach(walk)
  return half
}

// ── 单行 ────────────────────────────────────────────────────────
interface TreeItemProps<T extends TreeNodeData> {
  node: T
  depth: number
  fields: Required<TreeFieldNames>
  indent: number
  sz: (typeof sizePresets)['sm']
  checkable: boolean
  selectable: boolean
  selectedKey: TreeKey | null
  selectLeafOnly: boolean
  expandedSet: Set<TreeKey>
  checkedMap: Map<TreeKey, boolean>
  indeterminateMap: Map<TreeKey, boolean>
  titleRender?: (node: T, ctx: TreeNodeContext) => ReactNode
  onToggleExpand: (node: T) => void
  onToggleCheck: (node: T) => void
  onSelect: (node: T) => void
  toggleExpandOnTitleClick: boolean
  toggleCheckOnTitleClick: boolean
}

function TreeItem<T extends TreeNodeData>(props: TreeItemProps<T>) {
  const {
    node,
    depth,
    fields,
    indent,
    sz,
    checkable,
    selectable,
    selectedKey,
    selectLeafOnly,
    expandedSet,
    checkedMap,
    indeterminateMap,
    titleRender,
    onToggleExpand,
    onToggleCheck,
    onSelect,
    toggleExpandOnTitleClick,
    toggleCheckOnTitleClick,
  } = props

  const children = (readField(node, fields.children) as T[] | undefined) ?? []
  const isLeaf = !!node.isLeaf || children.length === 0
  const hasChildren = !isLeaf
  const expanded = expandedSet.has(node.key)
  const checked = !!checkedMap.get(node.key)
  const indeterminate = !!indeterminateMap.get(node.key)
  const selected = selectable && node.key !== undefined && selectedKey === node.key
  const disabled = !!node.disabled
  const disableCheckbox = !!(node.disableCheckbox || disabled)
  const canSelect = selectable && (!selectLeafOnly || isLeaf) && !disabled

  const ctx: TreeNodeContext = {
    depth,
    expanded,
    checked,
    indeterminate,
    selected,
    hasChildren,
    isLeaf,
    disabled,
    disableCheckbox,
  }

  const handleRowClick = () => {
    if (disabled) return
    if (canSelect) {
      onSelect(node)
      return
    }
    if (hasChildren && toggleExpandOnTitleClick) {
      onToggleExpand(node)
      return
    }
    if (isLeaf && checkable && toggleCheckOnTitleClick && !disableCheckbox) {
      onToggleCheck(node)
    }
  }

  const titleNode = titleRender
    ? titleRender(node, ctx)
    : ((readField(node, fields.title) as ReactNode) ?? null)

  return (
    <div role="treeitem" aria-expanded={hasChildren ? expanded : undefined}>
      <div
        onClick={handleRowClick}
        className={`flex items-center ${sz.gap} rounded-lg ${sz.padding} transition-colors ${
          disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-gray-50'
        } ${selected || (checkable && checked && isLeaf) ? 'bg-(--accent-subtle) hover:bg-(--accent-subtle)' : ''}`}
        style={{ paddingLeft: 8 + depth * indent }}
      >
        {checkable && (
          <TreeCheckbox
            checked={checked}
            indeterminate={indeterminate}
            disabled={disableCheckbox}
            onClick={(e) => {
              e.stopPropagation()
              onToggleCheck(node)
            }}
          />
        )}
        <TreeSwitcher
          expanded={expanded}
          visible={hasChildren}
          onClick={(e) => {
            e.stopPropagation()
            onToggleExpand(node)
          }}
        />
        <div className={`min-w-0 flex-1 ${sz.font} text-gray-700`}>{titleNode}</div>
      </div>
      {hasChildren && expanded && (
        <div role="group">
          {children.map((child) => (
            <TreeItem
              key={child.key}
              node={child}
              depth={depth + 1}
              fields={fields}
              indent={indent}
              sz={sz}
              checkable={checkable}
              selectable={selectable}
              selectedKey={selectedKey}
              selectLeafOnly={selectLeafOnly}
              expandedSet={expandedSet}
              checkedMap={checkedMap}
              indeterminateMap={indeterminateMap}
              titleRender={titleRender as TreeItemProps<T>['titleRender']}
              onToggleExpand={onToggleExpand}
              onToggleCheck={onToggleCheck}
              onSelect={onSelect}
              toggleExpandOnTitleClick={toggleExpandOnTitleClick}
              toggleCheckOnTitleClick={toggleCheckOnTitleClick}
            />
          ))}
        </div>
      )}
    </div>
  )
}
