/**
 * 下拉面板共享工具函数。
 *
 * tree-select 和 searchable-select 共用：
 * - Portal 容器查找（Modal 内 → dialog + absolute，页面 → body + fixed）
 * - 外部点击判断（兼容 Shadow DOM）
 * - 下拉定位常量和通用计算
 */

/** 下拉最小高度 */
export const DROPDOWN_MIN_HEIGHT = 160

/** 下拉最大高度 */
export const DROPDOWN_MAX_HEIGHT = 360

/** 下拉与触发器间距 */
export const DROPDOWN_GAP = 4

/** 下拉面板 z-index */
export const PANEL_Z_INDEX = 1050

/** 非匹配宽度时下拉最大宽度 */
export const DROPDOWN_PANEL_MAX_WIDTH_UNMATCHED = 400

/** 默认列表最大高度（searchable-select 用） */
export const DEFAULT_LIST_MAX_HEIGHT = 300

/**
 * Portal 容器查找：
 * - 在 Modal 内 → 找到首个非 static 祖先（通常为 Modal.Dialog 的 relative），作为 absolute 定位上下文
 * - 不在 Modal 内 → document.body，使用 fixed 定位
 */
export function resolvePortalContainer(triggerRoot: HTMLElement | null): HTMLElement {
  if (!triggerRoot) return document.body

  const modalScope =
    triggerRoot.closest('[role="dialog"]') ?? triggerRoot.closest('[aria-modal="true"]')

  if (!(modalScope instanceof HTMLElement)) return document.body

  let node: HTMLElement | null = modalScope
  while (node) {
    const pos = window.getComputedStyle(node).position
    if (pos !== 'static') return node
    node = node.parentElement
  }

  return modalScope
}

/**
 * 判断事件目标是否在容器数组内（兼容 Shadow DOM）。
 * 优先使用 composedPath，降级使用 contains。
 */
export function eventTargetsInside(
  e: MouseEvent | PointerEvent,
  containers: readonly (HTMLElement | null)[]
): boolean {
  const path = typeof e.composedPath === 'function' ? (e.composedPath() as unknown[]) : []
  if (path.length > 0) {
    return containers.some((container) => {
      if (!container) return false
      return path.some((node) => {
        if (!(node instanceof Node)) return false
        return node === container || container.contains(node)
      })
    })
  }
  const t = e.target
  return containers.some((c) => c != null && t instanceof Node && c.contains(t))
}

/**
 * 判断鼠标坐标是否落在任一元素的矩形区域内。
 * 用于遮罩在上层、target 不是面板子节点等情况。
 */
export function pointerWithinClientRects(
  e: Pick<PointerEvent, 'clientX' | 'clientY'>,
  elements: readonly (HTMLElement | null)[]
): boolean {
  const { clientX: x, clientY: y } = e
  return elements.some((el) => {
    if (!el) return false
    const r = el.getBoundingClientRect()
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom
  })
}
