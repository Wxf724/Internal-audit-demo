# DatePicker 组件

基于 `@heroui/react` 的日期选择组件，封装目标对标 Ant Design `DatePicker` 的基础使用方式。

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `value` | `DateValue \| null` | - | 受控值 |
| `defaultValue` | `DateValue \| null` | - | 非受控默认值 |
| `onChange` | `(value: DateValue \| null) => void` | - | 日期变化回调 |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg'` | `'sm'` | 控件尺寸，分别对应 `28/34/38/40px` 高度 |
| `className` | `string` | `''` | 最外层类名 |
| `popoverClassName` | `string` | `''` | 日历弹层类名 |
| `dateFormat` | `string` | `'YYYY-MM-DD'` | 日期展示格式；当前支持分隔符 `-`、`/`、`.` |
| `disabled` | `boolean` | - | Antd 风格禁用配置，内部映射到 HeroUI `isDisabled` |
| `allowClear` | `boolean` | `true` | 是否允许清空已选日期 |
| `onOpenChange` | `(open: boolean) => void` | - | 弹层打开状态变化回调 |
| 其他 HeroUI 属性 | `HeroDatePickerProps<DateValue>` | - | 支持 `isDisabled`、`minValue`、`maxValue`、`isReadOnly` 等原生基础属性 |

## 引入

```tsx
import { DatePicker } from '@/components'
// 或
import { DatePicker } from '@/components/date-picker'
```

## 基础示例（非受控）

```tsx
<DatePicker />
```

## 受控示例

```tsx
import { useState } from 'react'
import type { DateValue } from '@heroui/react/rac'

const [value, setValue] = useState<DateValue | null>(null)

<DatePicker value={value} onChange={setValue} />
```

## 常见配置

```tsx
<DatePicker
  size="md"
  dateFormat="YYYY-MM-DD"
  disabled={false}
  minValue={minDate}
  maxValue={maxDate}
  onOpenChange={(open) => console.log('open:', open)}
/>
```

