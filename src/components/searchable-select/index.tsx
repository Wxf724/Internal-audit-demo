import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { matchesPinyin } from '@/utils/pinyin'
import { colors, sizePresets } from '../theme'
import { useThemeClass } from '../theme-class-context'
import {
  resolvePortalContainer,
  eventTargetsInside,
  pointerWithinClientRects,
  DROPDOWN_MIN_HEIGHT,
  DROPDOWN_MAX_HEIGHT,
  DROPDOWN_GAP,
  PANEL_Z_INDEX,
  DROPDOWN_PANEL_MAX_WIDTH_UNMATCHED,
  DEFAULT_LIST_MAX_HEIGHT,
} from '../dropdown-utils'

export type SearchableSelectValue = string | number

export interface SearchableSelectFieldNames {
  label?: string
  value?: string
  options?: string
  disabled?: string
}

export interface SearchableSelectOption {
  [key: string]: unknown
}

export interface NormalizedSearchableOption {
  key: string
  label: ReactNode
  value: SearchableSelectValue
  disabled: boolean
  raw: SearchableSelectOption
}

export interface SearchableSelectProps {
  value?: SearchableSelectValue | SearchableSelectValue[] | null
  defaultValue?: SearchableSelectValue | SearchableSelectValue[] | null
  options?: SearchableSelectOption[]
  fieldNames?: SearchableSelectFieldNames
  placeholder?: string
  searchPlaceholder?: string
  /** 是否展示顶部搜索并启用选项过滤，默认 true；为 false 时等价于普通下拉列表 */
  showSearch?: boolean
  emptyText?: ReactNode
  disabled?: boolean
  multiple?: boolean
  size?: 'sm' | 'md' | 'lg'
  /** 下拉弹框整体最大高度（含顶部搜索区，px），默认 300；选项列表在剩余空间内滚动 */
  listMaxHeight?: number
  /** 下拉宽度是否与触发器一致；为 `false` 时宽度在「触发器宽度～400px」间随内容自适应，超出 400px 时折行 */
  dropdownMatchSelectWidth?: boolean
  /** 是否展示清空按钮，默认 true */
  allowClear?: boolean
  /** 触发器回显区左侧图标 */
  prefixIcon?: ReactNode
  className?: string
  onChange?: (
    value: SearchableSelectValue | SearchableSelectValue[] | null,
    option: NormalizedSearchableOption | NormalizedSearchableOption[] | null
  ) => void
  onOpenChange?: (open: boolean) => void
  onSelect?: (value: SearchableSelectValue, option: NormalizedSearchableOption) => void
  onDeselect?: (value: SearchableSelectValue, option: NormalizedSearchableOption) => void
}

interface NormalizedGroup {
  key: string
  label: ReactNode
  options: NormalizedSearchableOption[]
}

/** 多选：统一成数组（兼容受控端误传单个 string / number） */
function normalizeMultiSelection(
  v: SearchableSelectValue | SearchableSelectValue[] | null | undefined
): SearchableSelectValue[] {
  if (v == null || v === '') return []
  if (Array.isArray(v)) return v.filter((x) => x != null && x !== '')
  return [v]
}

const DEFAULT_FIELD_NAMES: Required<SearchableSelectFieldNames> = {
  label: 'label',
  value: 'value',
  options: 'options',
  disabled: 'disabled',
}

const SIZE_MAP: Record<
  NonNullable<SearchableSelectProps['size']>,
  {
    row: string
    searchIconLeft: string
    searchSection: string
    section: string
    checkWrap: string
    checkIcon: string
  }
> = {
  sm: {
    row: 'min-h-[30px] py-1 px-2 text-xs leading-5 rounded-lg',
    searchIconLeft: 'left-2.5',
    searchSection: 'border-b border-gray-100 px-2.5 pt-2 pb-2',
    section: 'px-2 pt-1.5 pb-0.5 text-xs font-medium text-gray-400',
    checkWrap: 'h-4 w-4',
    checkIcon: 'text-sm',
  },
  md: {
    row: 'min-h-[34px] py-1.5 px-2 text-sm leading-5 rounded-lg',
    searchIconLeft: 'left-3',
    searchSection: 'border-b border-gray-100 px-3 pt-2.5 pb-2',
    section: 'px-2 pt-1.5 pb-0.5 text-xs font-medium text-gray-400',
    checkWrap: 'h-4 w-4',
    checkIcon: 'text-base',
  },
  lg: {
    row: 'min-h-[36px] py-2 px-2.5 text-base leading-6 rounded-lg',
    searchIconLeft: 'left-3.5',
    searchSection: 'border-b border-gray-100 px-3.5 pt-2.5 pb-2.5',
    section: 'px-2.5 pt-1.5 pb-0.5 text-sm font-medium text-gray-400',
    checkWrap: 'h-5 w-5',
    checkIcon: 'text-lg',
  },
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/** 与 Select 一致的 options / 分组 / fieldNames 归一化 */
function normalizeSearchableOptions(
  source: SearchableSelectOption[],
  fieldNames: Required<SearchableSelectFieldNames>
): { groups: NormalizedGroup[]; flat: NormalizedSearchableOption[] } {
  const groups: NormalizedGroup[] = []
  const flat: NormalizedSearchableOption[] = []

  source.forEach((item, index) => {
    if (!isObject(item)) return

    const children = item[fieldNames.options]
    if (Array.isArray(children)) {
      const opts = children
        .filter(isObject)
        .map((child): NormalizedSearchableOption | null => {
          const value = child[fieldNames.value]
          if (typeof value !== 'string' && typeof value !== 'number') return null
          return {
            key: String(value),
            label: (child[fieldNames.label] as ReactNode) ?? value,
            value,
            disabled: Boolean(child[fieldNames.disabled]),
            raw: child as SearchableSelectOption,
          }
        })
        .filter((o): o is NormalizedSearchableOption => o !== null)

      if (opts.length > 0) {
        groups.push({
          key: `group-${index}`,
          label: (item[fieldNames.label] as ReactNode) ?? `分组 ${index + 1}`,
          options: opts,
        })
        flat.push(...opts)
      }
      return
    }

    const value = item[fieldNames.value]
    if (typeof value !== 'string' && typeof value !== 'number') return
    const opt: NormalizedSearchableOption = {
      key: String(value),
      label: (item[fieldNames.label] as ReactNode) ?? value,
      value,
      disabled: Boolean(item[fieldNames.disabled]),
      raw: item as SearchableSelectOption,
    }
    groups.push({ key: `group-${index}`, label: '', options: [opt] })
    flat.push(opt)
  })

  return { groups, flat }
}

function matchesQuery(option: NormalizedSearchableOption, q: string): boolean {
  if (!q) return true
  const labelStr = String(option.label ?? '')
  const valueStr = String(option.value)
  // 原文匹配
  if (labelStr.toUpperCase().includes(q.trim().toUpperCase())) return true
  if (valueStr.toUpperCase().includes(q.trim().toUpperCase())) return true
  // 拼音匹配（首字母 / 简化声母 / 全拼连续）
  return matchesPinyin(labelStr, q)
}

function filterGroups(groups: NormalizedGroup[], q: string): NormalizedGroup[] {
  return groups
    .map((g) => ({
      ...g,
      options: g.options.filter((o) => matchesQuery(o, q)),
    }))
    .filter((g) => g.options.length > 0)
}

/**
 * 带搜索框的下拉选择（自定义浮层，非 HeroUI Select）
 * — 适用于选项较多、需要就地过滤的场景。
 */
export function SearchableSelect(props: SearchableSelectProps) {
  const {
    value,
    defaultValue = null,
    options = [],
    fieldNames,
    placeholder = '请选择',
    searchPlaceholder = '搜索',
    showSearch = false,
    emptyText = '暂无数据',
    disabled = false,
    multiple = false,
    size = 'sm',
    listMaxHeight = DEFAULT_LIST_MAX_HEIGHT,
    dropdownMatchSelectWidth = true,
    allowClear = true,
    prefixIcon,
    className = '',
    onChange,
    onOpenChange,
    onSelect,
    onDeselect,
  } = props

  const rootRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [open, setOpenState] = useState(false)
  const [search, setSearch] = useState('')
  const [panelStyle, setPanelStyle] = useState<CSSProperties | null>(null)
  const themeClass = useThemeClass()

  const setOpen = useCallback(
    (next: boolean) => {
      setOpenState(next)
      onOpenChange?.(next)
      if (!next) setSearch('')
    },
    [onOpenChange]
  )

  const mergedFieldNames = useMemo(() => ({ ...DEFAULT_FIELD_NAMES, ...fieldNames }), [fieldNames])

  const { groups, flat } = useMemo(
    () => normalizeSearchableOptions(options, mergedFieldNames),
    [options, mergedFieldNames]
  )

  const displayedGroups = useMemo(
    () => (showSearch ? filterGroups(groups, search) : groups),
    [showSearch, groups, search]
  )

  const keyToOption = useMemo(() => {
    const m = new Map<string, NormalizedSearchableOption>()
    flat.forEach((o) => m.set(o.key, o))
    return m
  }, [flat])

  const isControlled = value !== undefined
  const [innerValue, setInnerValue] = useState<
    SearchableSelectValue | SearchableSelectValue[] | null
  >(() => {
    if (multiple) {
      const initial = normalizeMultiSelection(defaultValue ?? null)
      return initial.length > 0 ? initial : null
    }
    return defaultValue ?? null
  })
  const mergedValue = isControlled ? value : innerValue

  const selectedSingle =
    !multiple && (typeof mergedValue === 'string' || typeof mergedValue === 'number')
      ? mergedValue
      : null

  const multiKeys = useMemo(() => {
    if (!multiple) return null
    return new Set(normalizeMultiSelection(mergedValue).map(String))
  }, [multiple, mergedValue])

  const triggerLabel = useMemo(() => {
    if (!multiple) {
      if (selectedSingle == null || selectedSingle === '') return null
      const opt = flat.find((o) => o.value === selectedSingle)
      return opt?.label ?? String(selectedSingle)
    }
    const arr = normalizeMultiSelection(mergedValue)
    if (arr.length === 0) return null
    if (arr.length === 1) {
      const opt = flat.find((o) => o.value === arr[0])
      return opt?.label ?? String(arr[0])
    }
    return `已选 ${arr.length} 项`
  }, [multiple, mergedValue, flat, selectedSingle])

  const hasValue = useMemo(() => {
    if (multiple) return normalizeMultiSelection(mergedValue).length > 0
    return selectedSingle != null && selectedSingle !== ''
  }, [multiple, mergedValue, selectedSingle])

  const clearValue = useCallback(
    (e: MouseEvent | KeyboardEvent) => {
      e.stopPropagation()
      e.preventDefault()
      if (!isControlled) setInnerValue(null)
      onChange?.(null, null)
      setOpen(false)
    },
    [isControlled, onChange, setOpen]
  )

  const updatePanelPosition = useCallback(() => {
    const el = rootRef.current
    if (!el || typeof document === 'undefined') return
    const mount = resolvePortalContainer(el)
    const rect = el.getBoundingClientRect()
    const boundary =
      mount === document.body
        ? { top: 0, bottom: window.innerHeight }
        : mount.getBoundingClientRect()
    const maxPanelHeight = Math.min(DROPDOWN_MAX_HEIGHT, listMaxHeight)
    const spaceBelow = Math.max(0, boundary.bottom - rect.bottom - DROPDOWN_GAP)
    const spaceAbove = Math.max(0, rect.top - boundary.top - DROPDOWN_GAP)
    const shouldOpenUp = spaceBelow < maxPanelHeight && spaceAbove > spaceBelow
    const maxH = Math.max(
      DROPDOWN_MIN_HEIGHT,
      Math.min(maxPanelHeight, shouldOpenUp ? spaceAbove : spaceBelow)
    )
    const cap = DROPDOWN_PANEL_MAX_WIDTH_UNMATCHED
    const widthFloor = Math.min(rect.width, cap)
    const baseStyle: CSSProperties = {
      maxHeight: maxH,
      zIndex: PANEL_Z_INDEX,
      display: 'flex',
      flexDirection: 'column',
    }
    if (dropdownMatchSelectWidth) {
      baseStyle.width = rect.width
    } else {
      baseStyle.width = `min(max(${widthFloor}px, max-content), ${cap}px)`
      baseStyle.maxWidth = cap
    }

    if (mount === document.body) {
      setPanelStyle({
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
    setPanelStyle({
      ...baseStyle,
      position: 'absolute',
      top:
        (shouldOpenUp ? rect.top : rect.bottom) -
        originTop +
        (shouldOpenUp ? -DROPDOWN_GAP : DROPDOWN_GAP),
      left: rect.left - originLeft,
      transform: shouldOpenUp ? 'translateY(-100%)' : undefined,
    })
  }, [listMaxHeight, dropdownMatchSelectWidth])

  useLayoutEffect(() => {
    if (!open || typeof document === 'undefined') {
      setPanelStyle(null)
      return
    }

    updatePanelPosition()

    let cancelled = false
    let frame2 = 0

    const frame1 = requestAnimationFrame(() => {
      if (cancelled) return
      updatePanelPosition()
      if (cancelled) return
      frame2 = requestAnimationFrame(() => {
        if (cancelled) return
        updatePanelPosition()
      })
    })

    const el = rootRef.current
    let ro: ResizeObserver | null = null
    if (typeof ResizeObserver !== 'undefined' && el) {
      ro = new ResizeObserver(() => {
        if (!cancelled) updatePanelPosition()
      })
      ro.observe(el)
      const mount = resolvePortalContainer(el)
      if (mount !== document.body) ro.observe(mount)
    }

    return () => {
      cancelled = true
      cancelAnimationFrame(frame1)
      cancelAnimationFrame(frame2)
      ro?.disconnect()
    }
  }, [open, updatePanelPosition, displayedGroups.length, search, showSearch])

  useEffect(() => {
    if (!open || typeof document === 'undefined') return
    updatePanelPosition()
    const onScrollOrResize = () => updatePanelPosition()
    window.addEventListener('resize', onScrollOrResize)
    window.addEventListener('scroll', onScrollOrResize, true)
    return () => {
      window.removeEventListener('resize', onScrollOrResize)
      window.removeEventListener('scroll', onScrollOrResize, true)
    }
  }, [open, updatePanelPosition])

  useEffect(() => {
    if (!open) return
    const handleOutsideClose = (e: Event) => {
      if (!(e instanceof MouseEvent)) return
      const root = rootRef.current
      const panel = panelRef.current
      if (eventTargetsInside(e, [root, panel])) return
      if (pointerWithinClientRects(e, [root, panel])) return
      setOpen(false)
    }
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    // 使用捕获阶段：避免 Modal / FocusScope 等在 document 冒泡前 stopPropagation 导致收不到外部点击
    document.addEventListener('pointerdown', handleOutsideClose, true)
    document.addEventListener('mousedown', handleOutsideClose, true)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', handleOutsideClose, true)
      document.removeEventListener('mousedown', handleOutsideClose, true)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, setOpen])

  const sz = { ...sizePresets[size], ...SIZE_MAP[size] }

  const commitSingle = (opt: NormalizedSearchableOption) => {
    if (opt.disabled) return
    if (!isControlled) setInnerValue(opt.value)
    onChange?.(opt.value, opt)
    onSelect?.(opt.value, opt)
    setOpen(false)
  }

  const toggleMulti = (opt: NormalizedSearchableOption) => {
    if (opt.disabled) return
    const prev = normalizeMultiSelection(mergedValue)
    const i = prev.findIndex((v) => String(v) === String(opt.value))
    let next: SearchableSelectValue[]
    if (i >= 0) {
      next = prev.filter((_, idx) => idx !== i)
      onDeselect?.(opt.value, opt)
    } else {
      next = [...prev, opt.value]
      onSelect?.(opt.value, opt)
    }
    if (!isControlled) setInnerValue(next.length > 0 ? next : null)
    const opts =
      next.length > 0
        ? (next
            .map((v) => keyToOption.get(String(v)))
            .filter(Boolean) as NormalizedSearchableOption[])
        : null
    onChange?.(next.length ? next : null, opts)
  }

  const isRowSelected = (opt: NormalizedSearchableOption) => {
    if (multiple && multiKeys) return multiKeys.has(String(opt.value))
    return selectedSingle !== null && selectedSingle === opt.value
  }

  const dropdownPanel =
    open &&
    !disabled &&
    typeof document !== 'undefined' &&
    panelStyle &&
    createPortal(
      <div
        ref={panelRef}
        className={`${themeClass} pointer-events-auto relative overflow-hidden border border-white/80 bg-(--surface) ring-1 ring-black/5 ${sz.rounded}`}
        style={{ ...panelStyle, boxShadow: 'var(--overlay-shadow)' }}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {showSearch ? (
          <div className={sz.searchSection}>
            <div className="relative">
              <i
                className={`ri-search-line pointer-events-none absolute top-1/2 -translate-y-1/2 text-gray-400 ${sz.searchIconLeft} ${sz.icon}`}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                autoComplete="off"
                aria-label={searchPlaceholder}
                className={`w-full border-0 bg-gray-50 text-gray-800 placeholder:text-gray-400 outline-none ring-0 transition-colors focus:bg-(--surface) ${sz.searchInput}`}
                style={{ boxShadow: 'inset 0 0 0 1px transparent' }}
                onFocus={(e) => {
                  e.target.style.boxShadow = `inset 0 0 0 1px ${colors.primary.base}`
                }}
                onBlur={(e) => {
                  e.target.style.boxShadow = 'inset 0 0 0 1px transparent'
                }}
              />
            </div>
          </div>
        ) : null}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-3 pt-1">
          {displayedGroups.length === 0 ? (
            <div className={`py-10 text-center text-gray-400 ${sz.font}`}>{emptyText}</div>
          ) : (
            displayedGroups.map((group) => {
              const isLabeledGroup = group.label !== ''
              return (
                <div key={group.key} className={isLabeledGroup ? 'mb-1.5 last:mb-0' : ''}>
                  {isLabeledGroup && (
                    <div
                      className={`${sz.section}${
                        dropdownMatchSelectWidth ? '' : ' wrap-anywhere whitespace-normal'
                      }`}
                    >
                      {group.label}
                    </div>
                  )}
                  <div className={isLabeledGroup ? 'pl-3' : ''}>
                    {group.options.map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        disabled={opt.disabled}
                        onClick={() => (multiple ? toggleMulti(opt) : commitSingle(opt))}
                        className={`flex w-full min-w-0 justify-start text-left font-normal transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                          dropdownMatchSelectWidth ? 'items-center' : 'items-start'
                        } ${sz.row} ${
                          isRowSelected(opt)
                            ? 'font-medium bg-(--accent-soft) hover:bg-(--accent-strong)'
                            : 'bg-transparent text-gray-700 hover:bg-(--accent-light)'
                        }`}
                        style={isRowSelected(opt) ? { color: colors.primary.hover } : undefined}
                      >
                        <span
                          className={`flex min-w-0 flex-1 gap-2 ${
                            dropdownMatchSelectWidth ? 'items-center' : 'items-start'
                          }`}
                        >
                          {multiple && (
                            <span
                              className={`flex shrink-0 items-center justify-center rounded border transition-colors ${sz.checkWrap} ${
                                isRowSelected(opt)
                                  ? 'border-transparent text-white'
                                  : 'border-(--border) bg-(--surface) text-transparent'
                              }`}
                              style={
                                isRowSelected(opt)
                                  ? {
                                      backgroundColor: colors.primary.base,
                                      borderColor: colors.primary.base,
                                    }
                                  : undefined
                              }
                            >
                              <i className={`ri-check-line leading-none ${sz.checkIcon}`} />
                            </span>
                          )}
                          <span
                            className={
                              dropdownMatchSelectWidth
                                ? 'truncate'
                                : 'min-w-0 flex-1 wrap-anywhere whitespace-normal'
                            }
                          >
                            {opt.label}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )
            })
          )}
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3 bg-linear-to-t from-white/90 via-white/35 to-transparent" />
      </div>,
      resolvePortalContainer(rootRef.current)
    )

  return (
    <div
      ref={rootRef}
      className={`relative box-border min-w-[100px] max-w-full ${className}`.trim()}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(!open)}
        className={`box-border flex w-full min-w-0 max-w-full items-center justify-between gap-2 overflow-hidden border text-left font-normal outline-none transition-colors duration-200 ${sz.minH} ${sz.padding} ${sz.rounded} ${sz.font} ${
          disabled
            ? 'cursor-not-allowed border-(--border) bg-gray-50 text-gray-500 opacity-50'
            : 'cursor-pointer border-(--border) bg-(--surface)'
        }`}
        style={{
          borderWidth: 1,
          borderStyle: 'solid',
          ...(open && !disabled ? { borderColor: colors.primary.base } : {}),
        }}
      >
        <span className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
          {prefixIcon ? (
            <span className="flex shrink-0 items-center leading-none">{prefixIcon}</span>
          ) : null}
          <span
            className={`min-w-0 flex-1 truncate text-left ${
              triggerLabel ? (disabled ? 'text-gray-500' : 'text-(--foreground)') : 'text-gray-400'
            }`}
          >
            {triggerLabel ?? placeholder}
          </span>
        </span>
        <div className="flex shrink-0 items-center gap-1">
          {allowClear && hasValue && !disabled ? (
            <span
              role="button"
              tabIndex={0}
              className="rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              onClick={clearValue}
              onKeyDown={(e) => {
                if (e.key !== 'Enter' && e.key !== ' ') return
                clearValue(e)
              }}
              aria-label="清空"
            >
              <i className={`ri-close-circle-line leading-none ${sz.icon}`} />
            </span>
          ) : (
            <i
              className={`ri-arrow-down-s-line shrink-0 text-gray-400 transition-transform duration-200 ${sz.icon} ${open ? 'rotate-180' : ''}`}
            />
          )}
        </div>
      </button>

      {dropdownPanel}
    </div>
  )
}

export default SearchableSelect
