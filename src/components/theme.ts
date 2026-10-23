/**
 * 组件库 Design Token — JS 入口
 *
 * 颜色值全部引用 CSS 变量（定义在 src/index.css :root），
 * 语义色使用 HeroUI 原生变量名，改色只需改 index.css。
 *
 * 两种用法：
 *
 *   自研组件（需要 JS 编程访问）：
 *     import { colors, sizePresets } from '@/components/theme'
 *     style={{ color: colors.primary.base }}
 *     className={`hover:bg-[${colors.primary.light}]`}
 *
 *   HeroUI / 任意位置（声明式）：
 *     不需要 import，直接用 CSS 变量
 *     className="bg-(--accent) text-(--foreground)"
 */

// ═══════════════════════════════════
// 颜色（全部引用 CSS 变量）
// ═══════════════════════════════════

export const colors = {
  primary: {
    base: 'var(--accent)',
    hover: 'var(--accent-hover)',
    soft: 'var(--accent-soft)',
    light: 'var(--accent-light)',
    subtle: 'var(--accent-subtle)',
    strong: 'var(--accent-strong)',
  },
  success: {
    base: 'var(--success)',
    hover: 'var(--success)',
    soft: 'var(--success-soft)',
    light: 'var(--success-light)',
  },
  danger: {
    base: 'var(--danger)',
    hover: 'var(--danger)',
    soft: 'var(--danger-soft)',
    light: 'var(--danger-light)',
  },
  warning: {
    base: 'var(--warning)',
    hover: 'var(--warning)',
    soft: 'var(--warning-soft)',
    light: 'var(--warning-light)',
  },
  neutral: {
    textPrimary: 'var(--foreground)',
    textSecondary: 'var(--text-secondary)',
    textTertiary: 'var(--text-tertiary)',
    textInverse: 'var(--accent-foreground)',
    bgBase: 'var(--background)',
    bgSoft: 'var(--bg-soft)',
    bgHover: 'var(--bg-hover)',
    border: 'var(--border)',
    borderLight: 'var(--border-light)',
  },
  focusRing: 'var(--accent)',
} as const

// ═══════════════════════════════════
// Size 预设
// ═══════════════════════════════════

export type SizePreset = 'xs' | 'sm' | 'md' | 'lg'

export const sizePresets = {
  xs: {
    h: 'h-[var(--control-height-xs)]',
    minH: 'min-h-[var(--control-height-xs)]',
    font: 'text-xs leading-4',
    padding: 'px-1.5 py-0.5',
    gap: 'gap-1',
    rounded: 'rounded-md',
    icon: 'text-xs',
    searchInput:
      'h-[var(--control-height-xs)] min-h-[var(--control-height-xs)] py-0 pl-8 pr-2.5 text-xs leading-4 rounded-md',
  },
  sm: {
    h: 'h-[var(--control-height-sm)]',
    minH: 'min-h-[var(--control-height-sm)]',
    font: 'text-xs leading-5',
    padding: 'px-2.5 py-1',
    gap: 'gap-1.5',
    rounded: 'rounded-xl',
    icon: 'text-sm',
    searchInput:
      'h-[var(--control-height-sm)] min-h-[var(--control-height-sm)] py-0 pl-9 pr-3 text-xs leading-5 rounded-lg',
  },
  md: {
    h: 'h-[var(--control-height-md)]',
    minH: 'min-h-[var(--control-height-md)]',
    font: 'text-sm leading-5',
    padding: 'px-3 py-1.5',
    gap: 'gap-2',
    rounded: 'rounded-2xl',
    icon: 'text-base',
    searchInput:
      'h-[var(--control-height-md)] min-h-[var(--control-height-md)] py-0 pl-10 pr-3 text-sm leading-5 rounded-xl',
  },
  lg: {
    h: 'h-[var(--control-height-lg)]',
    minH: 'min-h-[var(--control-height-lg)]',
    font: 'text-base leading-6',
    padding: 'px-3.5 py-1.5',
    gap: 'gap-2.5',
    rounded: 'rounded-2xl',
    icon: 'text-lg',
    searchInput:
      'h-[var(--control-height-lg)] min-h-[var(--control-height-lg)] py-0 pl-11 pr-3 text-base leading-6 rounded-xl',
  },
} as const

// ═══════════════════════════════════
// 阴影
// ═══════════════════════════════════

export const shadows = {
  surface: 'var(--surface-shadow)',
  overlay: 'var(--overlay-shadow)',
  field: 'var(--field-shadow)',
  /** @deprecated use overlay */
  dropdown: 'var(--overlay-shadow)',
} as const
