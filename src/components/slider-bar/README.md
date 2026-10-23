# SliderBar

基于 [@heroui/react](https://www.heroui.com) 的 `Slider` 封装的 0–100 进度条组件，紫色主题，右侧显示百分比。

## 引入

```tsx
import { SliderBar } from '@/components'
// 或
import { SliderBar } from '@/components/slider-bar'
```

## 基础示例

```tsx
const [progress, setProgress] = useState(50)

<SliderBar value={progress} onChange={setProgress} />
```

## 尺寸

```tsx
<SliderBar size="sm" value={30} onChange={setProgress} />
<SliderBar size="md" value={50} onChange={setProgress} />
<SliderBar size="lg" value={70} onChange={setProgress} />
```

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `value` | `number` | - | 当前值（0–100），自动 clamp 到合法范围 |
| `onChange` | `(value: number) => void` | - | 值变化回调 |
| `size` | `SizePreset` | `'sm'` | 尺寸（控制右侧百分比字号） |
| `ariaLabel` | `string` | `'进度'` | 无障碍标签 |
| `className` | `string` | - | 最外层容器 className |

## 相关文件

- 实现：`src/components/slider-bar/index.tsx`
- 导出：通过 `src/components/index.ts` 聚合
