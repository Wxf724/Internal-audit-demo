/**
 * TreeSelect — C 端通用树形选择器（对标 Ant Design TreeSelect）
 * 业务上可用于部门、类目等任意树数据；传入对应 treeData 即可。
 * 视觉为轻奢紫系 + Tailwind，主题色通过 HeroUI CSS 变量统一管理。
 */
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { matchesPinyin } from '@/utils/pinyin'
import { colors, shadows, sizePresets } from '../theme'
import { useThemeClass } from '../theme-class-context'
import {
  resolvePortalContainer,
  eventTargetsInside,
  pointerWithinClientRects,
  DROPDOWN_MIN_HEIGHT,
  DROPDOWN_MAX_HEIGHT,
  DROPDOWN_GAP,
  PANEL_Z_INDEX,
} from '../dropdown-utils'

export type TreeNodeId = string | number

export interface TreeNode {
  id: TreeNodeId
  /** 展示名称 */
  title: string
  children?: TreeNode[]
  /** 禁止选择该节点 */
  disabled?: boolean
  /** 是否为叶子（配合懒加载：无 children 且非叶子时表示可加载） */
  isLeaf?: boolean
}

export type TreeSelectMode = 'single' | 'multiple'
export type TreeSelectShowCheckedStrategy = 'SHOW_ALL' | 'SHOW_PARENT' | 'SHOW_CHILD'

/** 对标 Ant Design TreeSelect `size`：控件与下拉行高 */
export type TreeSelectSize = 'sm' | 'md' | 'lg'

const TREE_SELECT_SIZE: Record<
  TreeSelectSize,
  {
    rowBtn: string
    expandWrap: string
    expandSpacerW: string
    expandIcon: string
    checkWrap: string
    checkIcon: string
    searchIconLeft: string
    searchSection: string
    tagText: string
    placeholderCls: string
  }
> = {
  sm: {
    rowBtn: 'min-h-[30px] py-1 px-2 text-xs leading-5',
    expandWrap: 'h-7 w-6 min-h-7',
    expandSpacerW: 'w-6',
    expandIcon: 'text-sm',
    checkWrap: 'h-4 w-4',
    checkIcon: 'text-sm',
    searchIconLeft: 'left-2.5',
    searchSection: 'border-b border-gray-100 px-2.5 pt-2 pb-2',
    tagText: 'text-xs',
    placeholderCls: 'text-xs leading-5',
  },
  md: {
    rowBtn: 'min-h-[34px] py-1.5 px-2 text-sm leading-5',
    expandWrap: 'h-8 w-7 min-h-8',
    expandSpacerW: 'w-7',
    expandIcon: 'text-base',
    checkWrap: 'h-4 w-4',
    checkIcon: 'text-base',
    searchIconLeft: 'left-3',
    searchSection: 'border-b border-gray-100 px-3 pt-2.5 pb-2',
    tagText: 'text-xs',
    placeholderCls: 'text-sm leading-5',
  },
  lg: {
    rowBtn: 'min-h-[36px] py-2 px-2.5 text-base leading-6',
    expandWrap: 'h-9 w-8 min-h-9',
    expandSpacerW: 'w-8',
    expandIcon: 'text-lg',
    checkWrap: 'h-5 w-5',
    checkIcon: 'text-lg',
    searchIconLeft: 'left-3.5',
    searchSection: 'border-b border-gray-100 px-3.5 pt-2.5 pb-2.5',
    tagText: 'text-sm',
    placeholderCls: 'text-base leading-6',
  },
}

/** 自定义节点字段名（对标 Ant Design TreeSelect `fieldNames`） */
export interface TreeFieldNames {
  /** 展示文案字段，默认 `title` */
  label?: string
  /** 唯一标识字段，默认 `id` */
  value?: string
  /** 子节点字段，默认 `children` */
  children?: string
  /** 禁用字段，默认 `disabled` */
  disabled?: string
  /** 是否叶子，默认 `isLeaf` */
  isLeaf?: string
}

const DEFAULT_FIELD_NAMES: Required<TreeFieldNames> = {
  label: 'title',
  value: 'id',
  children: 'children',
  disabled: 'disabled',
  isLeaf: 'isLeaf',
}

function normalizeTreeNodes(raw: readonly unknown[], fn: Required<TreeFieldNames>): TreeNode[] {
  const out: TreeNode[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const o = item as Record<string, unknown>
    const idVal = o[fn.value]
    if (idVal === undefined || idVal === null) continue
    const id = idVal as TreeNodeId
    const title = String(o[fn.label] ?? '')
    const disabled = Boolean(o[fn.disabled])
    const leafRaw = o[fn.isLeaf]
    const isLeaf = leafRaw !== undefined ? Boolean(leafRaw) : undefined
    const rawChildren = o[fn.children]
    const children =
      Array.isArray(rawChildren) && rawChildren.length > 0
        ? normalizeTreeNodes(rawChildren, fn)
        : undefined
    out.push({ id, title, disabled, isLeaf, children })
  }
  return out
}

/** 自身 + 所有子孙节点 id（用于 treeCheckStrictly=false 时父子联动） */
function collectSelfAndDescendantIds(node: TreeNode): string[] {
  const out: string[] = [String(node.id)]
  if (node.children?.length) {
    for (const c of node.children) {
      out.push(...collectSelfAndDescendantIds(c))
    }
  }
  return out
}

function collectDescendantIds(node: TreeNode): string[] {
  return collectSelfAndDescendantIds(node).slice(1)
}

/** 搜索结果只保留匹配路径；搜索态需要展开这些路径上的父节点，避免命中项被折叠隐藏。 */
function collectExpandableIds(nodes: TreeNode[], out = new Set<string>()): Set<string> {
  for (const node of nodes) {
    if (!node.children?.length) continue
    out.add(String(node.id))
    collectExpandableIds(node.children, out)
  }
  return out
}

/** 单选 `selectLeafOnly`：与 Tree 一致，无子节点视为叶子；懒加载且未标叶子时可展开 */
function isTreeSelectLeaf(node: TreeNode, lazyLoad: boolean): boolean {
  if (node.isLeaf === true) return true
  if (node.isLeaf === false) return false
  const hasChildren = (node.children?.length ?? 0) > 0
  if (hasChildren) return false
  return !lazyLoad
}

function hasSelectedAncestor(
  nodes: TreeNode[],
  targetKey: string,
  selectedIds: ReadonlySet<string>,
  ancestorSelected = false
): boolean {
  for (const node of nodes) {
    const key = String(node.id)
    if (key === targetKey) return ancestorSelected
    if (node.children?.length) {
      const found = hasSelectedAncestor(
        node.children,
        targetKey,
        selectedIds,
        ancestorSelected || selectedIds.has(key)
      )
      if (found) return true
    }
  }
  return false
}

function syncCascadeParentSelection(
  nodes: TreeNode[],
  selectedIds: Set<string>,
  flatMap: Map<string, TreeNode>
) {
  for (const node of nodes) {
    if (node.children?.length) syncCascadeParentSelection(node.children, selectedIds, flatMap)

    const key = String(node.id)
    const childKeys = collectDescendantIds(node).filter(
      (childKey) => !flatMap.get(childKey)?.disabled
    )
    if (!childKeys.length || flatMap.get(key)?.disabled) continue

    if (childKeys.every((childKey) => selectedIds.has(childKey))) {
      selectedIds.add(key)
    } else {
      selectedIds.delete(key)
    }
  }
}

export interface TreeSelectProps<T extends TreeNodeId = TreeNodeId> {
  /**
   * 树数据；可为标准 `TreeNode[]`，也可为接口原始对象数组并配合 `fieldNames`（内部 `normalizeTreeNodes` 归一化）。
   */
  treeData: readonly unknown[]
  /** 受控：单选为单个 id，多选为 id 数组 */
  value?: T | T[] | null
  /** 非受控默认值 */
  defaultValue?: T | T[] | null
  onChange?: (value: T | T[] | null, nodes: TreeNode | TreeNode[] | null) => void
  mode?: TreeSelectMode
  /**
   * 单选时是否仅叶子可选中（对标 Ant Design TreeSelect `treeNodeFilterProp` 选叶场景）。
   * 父节点点击仅展开/收起，不写入 value；多选模式下无效。默认 `true`。
   */
  selectLeafOnly?: boolean
  disabled?: boolean
  placeholder?: string
  allowClear?: boolean
  /** 搜索占位 */
  searchPlaceholder?: string
  /**
   * 懒加载子节点；返回的数组会按 `fieldNames` 归一化（与 `treeData` 一致）。
   */
  loadData?: (node: TreeNode) => Promise<readonly unknown[]>
  /**
   * 节点字段映射（对标 Ant Design `fieldNames`）
   * @default { label: 'title', value: 'id', children: 'children', disabled: 'disabled', isLeaf: 'isLeaf' }
   */
  fieldNames?: TreeFieldNames
  /**
   * 多选时是否严格独立选点（对标 Ant Design `treeCheckStrictly`）。
   * - `true`：只切换当前节点，父子互不影响
   * - `false`：选/取消父级时，同时选/取消其所有子孙（跳过 `disabled` 节点）
   * 单选模式下无效。默认 `true`，与历史行为一致；需父子联动多选时设为 `false`。
   */
  treeCheckStrictly?: boolean
  /**
   * 多选标签展示策略（对标 Ant Design `showCheckedStrategy`）。
   * - `SHOW_ALL`：展示所有已选节点
   * - `SHOW_PARENT`：父子同时选中时只展示父节点
   * - `SHOW_CHILD`：父子同时选中时只展示子节点（默认）
   */
  showCheckedStrategy?: TreeSelectShowCheckedStrategy
  /** 空数据文案 */
  emptyText?: string
  /** 无匹配搜索文案 */
  notFoundText?: string
  /** 多选时最多展示标签数，超出显示 +N */
  maxTagCount?: number
  className?: string
  /** 下拉宽度是否与触发器一致 */
  dropdownMatchSelectWidth?: boolean
  style?: CSSProperties
  /**
   * 尺寸（对标 Ant Design TreeSelect `size`）
   * @default 'sm'
   */
  size?: TreeSelectSize
}

function nodeMap(nodes: TreeNode[], map = new Map<string, TreeNode>()): Map<string, TreeNode> {
  for (const n of nodes) {
    map.set(String(n.id), n)
    if (n.children?.length) nodeMap(n.children, map)
  }
  return map
}

/** 搜索：保留匹配节点及其祖先路径，支持拼音首字母、简化声母、全拼连续匹配 */
function filterTree(nodes: TreeNode[], keyword: string): TreeNode[] {
  const q = keyword.trim().toLowerCase()
  if (!q) return nodes

  const matchesTitle = (title: string): boolean => {
    if (!title) return false
    return matchesPinyin(title, q)
  }

  const loop = (list: TreeNode[]): TreeNode[] => {
    const out: TreeNode[] = []
    for (const n of list) {
      const titleMatch = matchesTitle(n.title)
      const children = n.children ? loop(n.children) : []
      if (titleMatch || children.length > 0) {
        out.push({
          ...n,
          children: children.length ? children : n.children,
        })
      }
    }
    return out
  }
  return loop(nodes)
}

/** 合并懒加载子节点：优先使用 treeData 中的 children，否则使用 loadData 写入的缓存 */
function mergeLoaded(nodes: TreeNode[], loaded: Map<string, TreeNode[]>): TreeNode[] {
  return nodes.map((node) => {
    const id = String(node.id)
    const injected = loaded.get(id)
    const rawChildren = node.children ?? injected
    return {
      ...node,
      children:
        rawChildren && rawChildren.length > 0 ? mergeLoaded(rawChildren, loaded) : rawChildren,
    }
  })
}

export function TreeSelect<T extends TreeNodeId = TreeNodeId>(props: TreeSelectProps<T>) {
  const {
    treeData,
    value: valueProp,
    defaultValue = null,
    onChange,
    mode = 'single',
    selectLeafOnly = false,
    disabled = false,
    placeholder = '请选择',
    allowClear = true,
    searchPlaceholder = '搜索',
    loadData,
    emptyText = '暂无数据',
    notFoundText = '无匹配项',
    maxTagCount = 3,
    className = '',
    dropdownMatchSelectWidth = true,
    style,
    fieldNames,
    treeCheckStrictly = true,
    showCheckedStrategy = 'SHOW_CHILD',
    size = 'sm',
  } = props

  const sz = { ...sizePresets[size], ...(TREE_SELECT_SIZE[size] ?? TREE_SELECT_SIZE.md) }

  const mergedFieldNames = useMemo(() => ({ ...DEFAULT_FIELD_NAMES, ...fieldNames }), [fieldNames])

  const normalizedTreeData = useMemo(
    () => normalizeTreeNodes(treeData as unknown[], mergedFieldNames),
    [treeData, mergedFieldNames]
  )

  const listId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const isMultiple = mode === 'multiple'
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(() => new Set())
  const [loadedMap, setLoadedMap] = useState<Map<string, TreeNode[]>>(() => new Map())
  const [loadingIds, setLoadingIds] = useState<Set<string>>(() => new Set())
  const themeClass = useThemeClass()

  const isControlled = valueProp !== undefined
  const [innerValue, setInnerValue] = useState<T | T[] | null>(defaultValue as T | T[] | null)
  const value = isControlled ? valueProp : innerValue

  const mergedTree = useMemo(
    () => mergeLoaded(normalizedTreeData, loadedMap),
    [normalizedTreeData, loadedMap]
  )
  const flatMap = useMemo(() => nodeMap(mergedTree), [mergedTree])
  const displayTree = useMemo(() => filterTree(mergedTree, search), [mergedTree, search])
  // 有搜索词时临时展开过滤结果中的父节点；清空搜索后保留用户原本的手动展开状态。
  const visibleExpandedKeys = useMemo(() => {
    if (!search.trim()) return expandedKeys
    return collectExpandableIds(displayTree, new Set(expandedKeys))
  }, [displayTree, expandedKeys, search])

  const selectedIds = useMemo(() => {
    if (value == null) return new Set<string>()
    if (isMultiple && Array.isArray(value)) return new Set(value.map((v) => String(v)))
    if (!isMultiple) return new Set([String(value)])
    return new Set<string>()
  }, [value, isMultiple])

  const emitChange = useCallback(
    (next: T | T[] | null, nodes: TreeNode | TreeNode[] | null) => {
      if (!isControlled) setInnerValue(next)
      onChange?.(next, nodes)
    },
    [isControlled, onChange]
  )

  const toggleExpand = useCallback((id: string) => {
    setExpandedKeys((prev) => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }, [])

  const handleLoadChildren = useCallback(
    async (node: TreeNode) => {
      if (!loadData || node.isLeaf) return
      const hasKids = (node.children?.length ?? 0) > 0
      if (hasKids) return
      const id = String(node.id)
      if (loadingIds.has(id)) return
      setLoadingIds((s) => new Set(s).add(id))
      try {
        const raw = await loadData(node)
        const list = Array.isArray(raw) ? raw : []
        const children = normalizeTreeNodes(list as unknown[], mergedFieldNames)
        setLoadedMap((m) => new Map(m).set(id, children))
      } finally {
        setLoadingIds((s) => {
          const n = new Set(s)
          n.delete(id)
          return n
        })
      }
    },
    [loadData, loadingIds, mergedFieldNames]
  )

  const selectNode = useCallback(
    (node: TreeNode) => {
      if (node.disabled) return
      if (!isMultiple && selectLeafOnly && !isTreeSelectLeaf(node, !!loadData)) return
      const id = node.id as T
      if (isMultiple) {
        const arr = Array.isArray(value) ? [...value] : value == null ? [] : [value as T]
        const set = new Set(arr.map(String))
        const key = String(node.id)
        const isSelected = set.has(key)

        if (treeCheckStrictly) {
          if (isSelected) set.delete(key)
          else set.add(key)
        } else {
          const keys = collectSelfAndDescendantIds(node)
          const selectableKeys = keys.filter((k) => !flatMap.get(k)?.disabled)
          const allSelected = selectableKeys.length > 0 && selectableKeys.every((k) => set.has(k))
          if (allSelected) {
            selectableKeys.forEach((k) => set.delete(k))
          } else {
            selectableKeys.forEach((k) => set.add(k))
          }
          syncCascadeParentSelection(mergedTree, set, flatMap)
        }

        const nextArr = [...set] as T[]
        const nodes = nextArr.map((k) => flatMap.get(String(k))).filter(Boolean) as TreeNode[]
        emitChange(nextArr.length ? nextArr : null, nextArr.length ? nodes : null)
      } else {
        emitChange(id, node)
        setOpen(false)
        setSearch('')
      }
    },
    [
      isMultiple,
      selectLeafOnly,
      loadData,
      value,
      emitChange,
      flatMap,
      treeCheckStrictly,
      mergedTree,
    ]
  )

  const clearAll = useCallback(
    (e?: React.MouseEvent | React.KeyboardEvent) => {
      e?.stopPropagation()
      e?.preventDefault()
      emitChange(null, null)
    },
    [emitChange]
  )

  const removeTag = useCallback(
    (tagId: TreeNodeId, e: React.MouseEvent | React.KeyboardEvent) => {
      e.stopPropagation()
      if ('key' in e && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault()
      }
      if (!isMultiple || !Array.isArray(value)) return
      const node = flatMap.get(String(tagId))
      if (!node) return

      const set = new Set(value.map(String))
      if (treeCheckStrictly) {
        set.delete(String(tagId))
      } else {
        collectSelfAndDescendantIds(node).forEach((k) => set.delete(k))
        syncCascadeParentSelection(mergedTree, set, flatMap)
      }

      const next = [...set] as T[]
      const nodes = next.map((k) => flatMap.get(String(k))).filter(Boolean) as TreeNode[]
      emitChange(next.length ? next : null, next.length ? nodes : null)
    },
    [isMultiple, value, emitChange, flatMap, treeCheckStrictly, mergedTree]
  )

  const tags = useMemo(() => {
    if (!isMultiple || !Array.isArray(value) || value.length === 0) return []
    const selectedNodes = value.map((id) => flatMap.get(String(id))).filter(Boolean) as TreeNode[]
    if (showCheckedStrategy === 'SHOW_ALL') return selectedNodes

    return selectedNodes.filter((node) => {
      const key = String(node.id)
      if (showCheckedStrategy === 'SHOW_PARENT') {
        return !hasSelectedAncestor(mergedTree, key, selectedIds)
      }
      return !collectDescendantIds(node).some((childKey) => selectedIds.has(childKey))
    })
  }, [isMultiple, value, flatMap, showCheckedStrategy, mergedTree, selectedIds])

  const triggerLabel = useMemo(() => {
    if (isMultiple) return null
    if (value == null) return null
    return flatMap.get(String(value))?.title ?? String(value)
  }, [isMultiple, value, flatMap])

  const hasValue = isMultiple
    ? Array.isArray(value) && value.length > 0
    : value != null && value !== ''

  const [dropdownStyle, setDropdownStyle] = useState<CSSProperties | null>(null)

  const updateDropdownPosition = useCallback(() => {
    const el = triggerRef.current
    const wrap = containerRef.current
    if (!el || typeof document === 'undefined') return

    const rect = el.getBoundingClientRect()
    const mount = resolvePortalContainer(wrap)
    const boundary =
      mount === document.body
        ? { top: 0, bottom: window.innerHeight }
        : mount.getBoundingClientRect()
    const spaceBelow = Math.max(0, boundary.bottom - rect.bottom - DROPDOWN_GAP)
    const spaceAbove = Math.max(0, rect.top - boundary.top - DROPDOWN_GAP)
    const shouldOpenUp = spaceBelow < DROPDOWN_MAX_HEIGHT && spaceAbove > spaceBelow
    const maxHeight = Math.max(
      DROPDOWN_MIN_HEIGHT,
      Math.min(DROPDOWN_MAX_HEIGHT, shouldOpenUp ? spaceAbove : spaceBelow)
    )
    const baseStyle: CSSProperties = {
      width: dropdownMatchSelectWidth ? rect.width : undefined,
      minWidth: dropdownMatchSelectWidth ? undefined : 320,
      maxHeight,
      zIndex: PANEL_Z_INDEX,
      display: 'flex',
      flexDirection: 'column',
    }

    if (mount === document.body) {
      setDropdownStyle({
        ...baseStyle,
        position: 'fixed',
        top: shouldOpenUp ? rect.top - DROPDOWN_GAP : rect.bottom + DROPDOWN_GAP,
        left: rect.left,
        transform: shouldOpenUp ? 'translateY(-100%)' : undefined,
      })
      return
    }

    const mr = mount.getBoundingClientRect()
    const cs = window.getComputedStyle(mount)
    const borderLeft = parseFloat(cs.borderLeftWidth) || 0
    const borderTop = parseFloat(cs.borderTopWidth) || 0
    const originLeft = mr.left + borderLeft
    const originTop = mr.top + borderTop

    setDropdownStyle({
      ...baseStyle,
      position: 'absolute',
      top:
        (shouldOpenUp ? rect.top : rect.bottom) -
        originTop +
        (shouldOpenUp ? -DROPDOWN_GAP : DROPDOWN_GAP),
      left: rect.left - originLeft,
      transform: shouldOpenUp ? 'translateY(-100%)' : undefined,
    })
  }, [dropdownMatchSelectWidth])

  /** 下拉定位：Modal 内 Portal 到 dialog + absolute；页面上仍为 body + fixed。打开后多帧测量避免首次偏移 */
  useLayoutEffect(() => {
    if (!open || typeof document === 'undefined') {
      setDropdownStyle(null)
      return
    }

    updateDropdownPosition()

    let cancelled = false
    let frame2 = 0
    const frame1 = requestAnimationFrame(() => {
      if (cancelled) return
      updateDropdownPosition()
      frame2 = requestAnimationFrame(() => {
        if (!cancelled) updateDropdownPosition()
      })
    })

    const el = triggerRef.current
    let ro: ResizeObserver | null = null
    if (typeof ResizeObserver !== 'undefined' && el) {
      ro = new ResizeObserver(() => {
        if (!cancelled) updateDropdownPosition()
      })
      ro.observe(el)
      const mount = containerRef.current ? resolvePortalContainer(containerRef.current) : null
      if (mount && mount !== document.body) ro.observe(mount)
    }

    const onScrollOrResize = () => updateDropdownPosition()
    window.addEventListener('resize', onScrollOrResize)
    window.addEventListener('scroll', onScrollOrResize, true)

    return () => {
      cancelled = true
      cancelAnimationFrame(frame1)
      cancelAnimationFrame(frame2)
      ro?.disconnect()
      window.removeEventListener('resize', onScrollOrResize)
      window.removeEventListener('scroll', onScrollOrResize, true)
    }
  }, [open, updateDropdownPosition, value])

  /** 打开后搜索框聚焦（双 rAF：等 Portal 挂到 dialog 后再 focus，避免焦点陷阱抢回） */
  useLayoutEffect(() => {
    if (!open) return
    let cancelled = false
    let frame2 = 0
    const frame1 = requestAnimationFrame(() => {
      frame2 = requestAnimationFrame(() => {
        if (!cancelled) searchRef.current?.focus()
      })
    })
    return () => {
      cancelled = true
      cancelAnimationFrame(frame1)
      cancelAnimationFrame(frame2)
    }
  }, [open])

  /** 点击外部关闭：兼容 Shadow DOM；仅在打开时监听 */
  useEffect(() => {
    if (!open) return

    const handleOutside = (e: PointerEvent | MouseEvent) => {
      const root = containerRef.current
      const panel = dropdownRef.current
      if (eventTargetsInside(e, [root, panel])) return
      if (pointerWithinClientRects(e, [root, panel])) return
      setOpen(false)
      setSearch('')
    }

    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        setSearch('')
      }
    }

    // 使用捕获阶段：避免 Modal / FocusScope 等在 document 冒泡前 stopPropagation 导致收不到外部点击
    document.addEventListener('pointerdown', handleOutside, true)
    document.addEventListener('mousedown', handleOutside, true)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', handleOutside, true)
      document.removeEventListener('mousedown', handleOutside, true)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const renderNodes = (nodes: TreeNode[], depth = 0): ReactNode => {
    if (!nodes.length)
      return (
        <div className={`py-10 text-center text-gray-400 ${sz.font}`}>
          {search ? notFoundText : emptyText}
        </div>
      )

    return (
      <ul className="py-1" role="tree">
        {nodes.map((node) => {
          const id = String(node.id)
          const expanded = visibleExpandedKeys.has(id)
          const children = node.children
          const hasChildren = (children?.length ?? 0) > 0
          const showExpand = hasChildren || (!node.isLeaf && loadData)
          const selected = selectedIds.has(id)
          const isLoading = loadingIds.has(id)
          const selectableKeys = collectSelfAndDescendantIds(node).filter(
            (key) => !flatMap.get(key)?.disabled
          )
          const childKeys = collectDescendantIds(node).filter((key) => !flatMap.get(key)?.disabled)
          const childCheckedCount = childKeys.filter((key) => selectedIds.has(key)).length
          const checkboxIndeterminate =
            isMultiple &&
            !treeCheckStrictly &&
            childKeys.length > 0 &&
            childCheckedCount > 0 &&
            childCheckedCount < childKeys.length
          const checkboxChecked =
            isMultiple &&
            (treeCheckStrictly
              ? selected
              : childKeys.length > 0
                ? childCheckedCount === childKeys.length
                : selected)
          const rowActive = selected || checkboxIndeterminate
          const isLeafNode = isTreeSelectLeaf(node, !!loadData)
          const canSelectSingle = !selectLeafOnly || isLeafNode

          return (
            <li key={id} role="treeitem" aria-expanded={showExpand ? expanded : undefined}>
              <div
                className="flex items-center gap-0.5 rounded-lg pr-2 transition-colors"
                style={{ paddingLeft: 8 + depth * 16 }}
              >
                {showExpand ? (
                  <button
                    type="button"
                    tabIndex={-1}
                    disabled={disabled}
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleExpand(id)
                      if (!hasChildren && loadData) void handleLoadChildren(node)
                    }}
                    className={`flex shrink-0 items-center justify-center rounded-md text-gray-400 transition-transform hover:bg-black/4 hover:text-gray-600 disabled:opacity-40 ${sz.expandWrap}`}
                    style={{ transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}
                  >
                    <i className={`ri-arrow-down-s-line leading-none ${sz.expandIcon}`} />
                  </button>
                ) : (
                  <span className={`inline-block shrink-0 ${sz.expandSpacerW}`} />
                )}

                <button
                  type="button"
                  disabled={disabled || node.disabled}
                  onClick={() => {
                    if (showExpand && !hasChildren && loadData && !expanded) {
                      toggleExpand(id)
                      void handleLoadChildren(node)
                      return
                    }
                    if (!isMultiple && selectLeafOnly && !isLeafNode) {
                      if (showExpand) toggleExpand(id)
                      return
                    }
                    selectNode(node)
                  }}
                  className={`flex flex-1 rounded-lg text-left transition-colors ${sz.rowBtn} disabled:cursor-not-allowed disabled:opacity-40 ${
                    rowActive && (isMultiple || canSelectSingle)
                      ? isMultiple
                        ? 'font-medium text-(--foreground) bg-(--accent-subtle) hover:bg-(--accent-light)'
                        : 'font-medium bg-(--accent-soft) hover:bg-(--accent-strong)'
                      : 'text-gray-700 hover:bg-(--accent-light)'
                  }`}
                  style={
                    selected && !isMultiple && canSelectSingle
                      ? { color: colors.primary.hover }
                      : undefined
                  }
                >
                  <span className="flex min-w-0 flex-1 items-center gap-2">
                    {isMultiple ? (
                      <span
                        className={`flex shrink-0 items-center justify-center rounded border transition-colors ${sz.checkWrap} ${
                          checkboxChecked || checkboxIndeterminate
                            ? 'border-transparent text-white'
                            : 'border-(--border) bg-(--surface) text-transparent'
                        }`}
                        style={
                          checkboxChecked || checkboxIndeterminate
                            ? {
                                backgroundColor: colors.primary.base,
                                borderColor: colors.primary.base,
                              }
                            : undefined
                        }
                        aria-hidden
                      >
                        <i
                          className={`${
                            checkboxIndeterminate ? 'ri-subtract-line' : 'ri-check-line'
                          } leading-none ${sz.checkIcon}`}
                        />
                      </span>
                    ) : null}
                    <span className="min-w-0 flex-1 truncate">{node.title}</span>
                    {isLoading && (
                      <i
                        className={`ri-loader-4-line ml-auto shrink-0 animate-spin text-(--accent) ${sz.expandIcon}`}
                      />
                    )}
                  </span>
                </button>
              </div>

              {showExpand && expanded && children?.length ? (
                <div className="ml-1">{renderNodes(children, depth + 1)}</div>
              ) : null}
              {showExpand && expanded && !hasChildren && !isLoading && loadData && (
                <div
                  className="text-xs text-gray-400 py-1"
                  style={{ paddingLeft: 24 + depth * 16 }}
                >
                  点击展开以加载
                </div>
              )}
            </li>
          )
        })}
      </ul>
    )
  }

  const onTriggerKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setOpen((o) => !o)
    }
    if (e.key === 'Escape') {
      setOpen(false)
      setSearch('')
    }
  }

  const rootStyle = {
    ...style,
  } as CSSProperties

  return (
    <div
      ref={containerRef}
      className={`relative box-border w-full min-w-0 ${className}`}
      style={rootStyle}
    >
      <button
        ref={triggerRef}
        type="button"
        id={listId}
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={onTriggerKeyDown}
        className={`box-border flex w-full gap-2 border text-left outline-none transition-colors duration-200 ${sz.minH} ${sz.padding} ${sz.rounded} ${
          isMultiple && tags.length > 0 ? 'items-start' : 'items-center'
        } ${
          disabled
            ? 'cursor-not-allowed border-(--border) bg-gray-50 text-gray-500 opacity-50'
            : 'cursor-pointer border-(--border) bg-(--surface)'
        } ${sz.font}`}
        style={{
          borderWidth: 1,
          borderStyle: 'solid',
          ...(open && !disabled ? { borderColor: colors.primary.base } : {}),
        }}
      >
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          {isMultiple && tags.length > 0 ? (
            <>
              {tags.slice(0, maxTagCount).map((n) => (
                <span
                  key={String(n.id)}
                  className={`inline-flex max-w-[140px] items-center gap-1 rounded-lg px-2 py-0.5 font-medium text-(--accent-hover) ${sz.tagText}`}
                  style={{ backgroundColor: colors.primary.soft }}
                >
                  <span className="truncate">{n.title}</span>
                  {!disabled && (
                    <span
                      role="button"
                      tabIndex={0}
                      className="rounded p-0.5 hover:bg-black/5 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-(--focus-ring) focus-visible:ring-offset-0"
                      onClick={(e) => removeTag(n.id, e)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') removeTag(n.id, e)
                      }}
                      aria-label="移除"
                    >
                      <i className="ri-close-line text-sm leading-none opacity-70" />
                    </span>
                  )}
                </span>
              ))}
              {tags.length > maxTagCount && (
                <span className="text-xs font-medium text-(--accent)">
                  +{tags.length - maxTagCount}
                </span>
              )}
            </>
          ) : !isMultiple && triggerLabel ? (
            <span
              className={`truncate ${disabled ? 'font-normal text-gray-500' : 'font-medium text-(--foreground)'} ${sz.font}`}
            >
              {triggerLabel}
            </span>
          ) : (
            <span className={`truncate text-gray-400 ${sz.placeholderCls}`}>{placeholder}</span>
          )}
        </div>

        <div
          className={`flex shrink-0 items-center gap-1 ${isMultiple && tags.length > 0 ? 'self-start pt-0.5' : ''}`}
        >
          {allowClear && hasValue && !disabled ? (
            <span
              role="button"
              tabIndex={0}
              className="rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              onClick={clearAll}
              onKeyDown={(e) => {
                if (e.key !== 'Enter' && e.key !== ' ') return
                clearAll(e)
              }}
              aria-label="清空"
            >
              <i className={`ri-close-circle-line leading-none ${sz.expandIcon}`} />
            </span>
          ) : (
            <i
              className={`ri-arrow-down-s-line text-gray-400 transition-transform duration-200 ${sz.expandIcon} ${
                open ? 'rotate-180' : ''
              }`}
            />
          )}
        </div>
      </button>

      {open &&
        typeof document !== 'undefined' &&
        dropdownStyle &&
        createPortal(
          <div
            ref={dropdownRef}
            className={`${themeClass} pointer-events-auto relative overflow-hidden border border-white/80 bg-(--surface) ring-1 ring-black/5 ${sz.rounded}`}
            style={{ ...dropdownStyle, boxShadow: 'var(--overlay-shadow)' }}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className={sz.searchSection}>
              <div className="relative">
                <i
                  className={`ri-search-line pointer-events-none absolute top-1/2 -translate-y-1/2 text-gray-400 ${sz.searchIconLeft} ${sz.expandIcon}`}
                />
                <input
                  ref={searchRef}
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={searchPlaceholder}
                  className={`w-full border-0 bg-gray-50 text-gray-800 placeholder:text-gray-400 outline-none ring-0 transition-colors focus:bg-(--surface) ${sz.searchInput}`}
                  style={{ boxShadow: `inset 0 0 0 1px transparent` }}
                  onFocus={(e) => {
                    e.target.style.boxShadow = `inset 0 0 0 1px ${colors.primary.base}`
                  }}
                  onBlur={(e) => {
                    e.target.style.boxShadow = `inset 0 0 0 1px transparent`
                  }}
                />
              </div>
            </div>

            <div
              className={`min-h-0 flex-1 overflow-y-auto overscroll-contain pb-3 pt-1 ${
                size === 'sm' ? 'px-1.5' : size === 'lg' ? 'px-2.5' : 'px-2'
              }`}
            >
              {renderNodes(displayTree)}
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3 bg-linear-to-t from-white/90 via-white/35 to-transparent" />
          </div>,
          containerRef.current ? resolvePortalContainer(containerRef.current) : document.body
        )}
    </div>
  )
}

export default TreeSelect
