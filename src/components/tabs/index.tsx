import { Tabs as HeroTabs } from '@heroui/react'
import { useMemo, useState, type Key, type ReactNode } from 'react'

export type TabsSize = 'sm' | 'md' | 'lg'

export interface TabsItem {
  /** 唯一标识（对标 Antd item.key） */
  key: string
  /** 标签文案/节点（对标 Antd item.label） */
  label: ReactNode
  /** 可选图标 */
  icon?: ReactNode
  /** 是否禁用 */
  disabled?: boolean
  /** 面板内容（对标 Antd item.children） */
  children?: ReactNode
}

export interface TabsProps {
  /** 选项数组（对标 Antd items） */
  items: TabsItem[]
  /** 受控值（对标 Antd activeKey） */
  activeKey?: string
  /** 非受控默认值（对标 Antd defaultActiveKey） */
  defaultActiveKey?: string
  /** 切换回调（对标 Antd onChange） */
  onChange?: (activeKey: string) => void
  /** 尺寸 */
  size?: TabsSize
  /** 根容器 className */
  className?: string
  /** 列表容器 className */
  listContainerClassName?: string
  /** 单个 Tab 额外 className */
  tabClassName?: string
  /** 面板容器 className */
  panelClassName?: string
  /** aria-label */
  ariaLabel?: string
  /** 是否渲染面板：默认 items 中存在 children 时渲染 */
  showPanels?: boolean
}

const SIZE_STYLE_MAP: Record<TabsSize, { tab: string; icon: string; panel: string }> = {
  sm: {
    tab: 'h-7 px-2.5 text-xs rounded-md',
    icon: 'text-xs',
    panel: 'pt-2 text-xs',
  },
  md: {
    tab: 'h-8 px-3 text-sm rounded-lg',
    icon: 'text-sm',
    panel: 'pt-3 text-sm',
  },
  lg: {
    tab: 'h-10 px-3.5 text-base rounded-lg',
    icon: 'text-base',
    panel: 'pt-3 text-base',
  },
}

/**
 * 通用 Tabs（基础版）
 * - 对标 Antd Tabs 常用配置：items / activeKey / defaultActiveKey / onChange
 * - 支持图标、禁用、受控/非受控
 */
export function Tabs(props: TabsProps) {
  const {
    items,
    activeKey,
    defaultActiveKey,
    onChange,
    size = 'md',
    className = '',
    listContainerClassName = '',
    tabClassName = '',
    panelClassName = '',
    ariaLabel = 'Tabs',
    showPanels,
  } = props

  const firstEnabledKey = useMemo(
    () => items.find((item) => !item.disabled)?.key ?? items[0]?.key ?? '',
    [items]
  )
  const [innerActiveKey, setInnerActiveKey] = useState(defaultActiveKey ?? firstEnabledKey)
  const isControlled = activeKey !== undefined
  const mergedActiveKey = isControlled ? activeKey : innerActiveKey
  const shouldShowPanels = showPanels ?? items.some((item) => item.children !== undefined)
  const sizeStyle = SIZE_STYLE_MAP[size]

  const handleSelectionChange = (key: Key) => {
    const next = String(key)
    if (!isControlled) setInnerActiveKey(next)
    onChange?.(next)
  }

  return (
    <HeroTabs
      selectedKey={mergedActiveKey}
      onSelectionChange={handleSelectionChange}
      className={className}
    >
      <HeroTabs.ListContainer className={`inline-flex rounded-lg p-0.5 ${listContainerClassName}`}>
        <HeroTabs.List aria-label={ariaLabel} className="flex items-center gap-1 rounded-md">
          {items.map((item) => (
            <HeroTabs.Tab
              key={item.key}
              id={item.key}
              isDisabled={item.disabled}
              className={`${sizeStyle.tab} inline-flex items-center gap-1.5 font-medium text-gray-600 outline-none ring-0 shadow-none whitespace-nowrap transition-colors data-[hovered=true]:text-gray-800 data-[selected=true]:bg-(--surface) data-[selected=true]:text-(--foreground) data-[selected=true]:shadow-none data-[focus-visible=true]:outline-none data-[focus-visible=true]:ring-0 ${tabClassName}`}
            >
              {item.icon ? (
                <span className={`${sizeStyle.icon} leading-none`}>{item.icon}</span>
              ) : null}
              <span className="leading-none">{item.label}</span>
            </HeroTabs.Tab>
          ))}
        </HeroTabs.List>
      </HeroTabs.ListContainer>

      {shouldShowPanels
        ? items.map((item) => (
            <HeroTabs.Panel
              key={item.key}
              id={item.key}
              className={`${sizeStyle.panel} ${panelClassName}`}
            >
              {item.children ?? null}
            </HeroTabs.Panel>
          ))
        : null}
    </HeroTabs>
  )
}

export default Tabs
