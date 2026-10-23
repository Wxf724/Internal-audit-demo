# Tabs 组件

基于 `@heroui/react` 的 Tabs 组件，封装目标对标 Ant Design Tabs 基础能力，并提供“胶囊分段”样式与 icon 支持。

## 引入

```tsx
import { Tabs } from '@/components'
// 或
import { Tabs } from '@/components/tabs'
```

## 基础示例（非受控）

```tsx
<Tabs
  items={[
    { key: 'all', label: '全部' },
    { key: 'done', label: '已完成' },
    { key: 'todo', label: '待开始' },
  ]}
  defaultActiveKey="all"
/>
```

## 受控示例

```tsx
import { useState } from 'react'

const [activeKey, setActiveKey] = useState('list')

<Tabs
  activeKey={activeKey}
  onChange={setActiveKey}
  items={[
    { key: 'list', label: '列表', icon: <i className="ri-list-unordered" /> },
    { key: 'board', label: '看板', icon: <i className="ri-layout-grid-line" /> },
  ]}
/>
```

## 带面板内容

```tsx
<Tabs
  items={[
    { key: 'overview', label: '总览', children: <div>总览内容</div> },
    { key: 'detail', label: '明细', children: <div>明细内容</div> },
  ]}
/>
```

## Props（基础）

- `items: TabsItem[]`
- `activeKey?: string`
- `defaultActiveKey?: string`
- `onChange?: (activeKey: string) => void`
- `size?: 'sm' | 'md' | 'lg'`（默认 `md`）
- `showPanels?: boolean`（默认自动判断：当 `items.children` 存在时显示）
- `className?: string`
- `listContainerClassName?: string`
- `tabClassName?: string`
- `panelClassName?: string`
- `ariaLabel?: string`（默认 `'Tabs'`）

## TabsItem

- `key: string`
- `label: ReactNode`
- `icon?: ReactNode`
- `disabled?: boolean`
- `children?: ReactNode`

