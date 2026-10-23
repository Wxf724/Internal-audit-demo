# DateRangePicker 组件

基于 `@heroui/react` 的日期区间选择组件，封装目标对标 Ant Design `RangePicker` 的基础使用方式。

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `value` | `RangeValue<DateValue> \| null` | - | 受控值 |
| `defaultValue` | `RangeValue<DateValue> \| null` | - | 非受控默认值 |
| `onChange` | `(value: RangeValue<DateValue> \| null) => void` | - | 日期区间变化回调 |
| `size` | `'sm' \| 'md' \| 'lg'` | `'sm'` | 控件尺寸，分别对应 `34/38/40px` 高度 |
| `className` | `string` | `''` | 最外层类名 |
| `popoverClassName` | `string` | `''` | 日历弹层类名 |
| `dateFormat` | `string` | `'YYYY-MM-DD'` | 日期展示格式；当前支持分隔符 `-`、`/`、`.` |
| `disabled` | `boolean` | - | Antd 风格禁用配置，内部映射到 HeroUI `isDisabled` |
| `allowClear` | `boolean` | `true` | 是否允许清空已选日期区间 |
| `showShortcuts` | `boolean` | `true` | 是否显示“本周 / 本月 / 本季”快捷选择按钮 |
| `onOpenChange` | `(open: boolean) => void` | - | 弹层打开状态变化回调 |
| 其他 HeroUI 属性 | `HeroDateRangePickerProps<DateValue>` | - | 支持 `isDisabled`、`minValue`、`maxValue`、`isReadOnly` 等原生基础属性 |

## 引入

```tsx
import { DateRangePicker } from '@/components'
// 或
import { DateRangePicker } from '@/components/date-range-picker'
```

## 基础示例（非受控）

```tsx
<DateRangePicker />
```

## 受控示例

```tsx
import { useState } from 'react'
import type { DateValue, RangeValue } from '@heroui/react/rac'

const [value, setValue] = useState<RangeValue<DateValue> | null>(null)

<DateRangePicker value={value} onChange={setValue} />
```

## 常见配置

```tsx
<DateRangePicker
  size="md"
  dateFormat="YYYY-MM-DD"
  disabled={false}
  showShortcuts
  minValue={minDate}
  maxValue={maxDate}
  onOpenChange={(open) => console.log('open:', open)}
/>
```

## 快捷选择

默认会在弹层顶部显示“本周 / 本月 / 本季”。如需关闭，可传 `showShortcuts={false}`。

- 本周：本周一到本周日
- 本月：当月 1 号到当月最后一天
- 本季：当前季度第一天到当前季度最后一天

```tsx
<DateRangePicker showShortcuts value={value} onChange={setValue} />
```

## 样式说明

- 输入框默认 `1px` 边框
- hover 边框高亮，focus-within 边框色为 `#8690FF`
- 触发按钮在右侧，支持尺寸联动（`sm/md/lg`）
