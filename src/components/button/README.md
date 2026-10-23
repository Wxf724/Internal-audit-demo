# Button

基于 [@heroui/react](https://www.heroui.com) 的 `Button` 封装的通用按钮组件，对标 **Ant Design Button**：支持类型、尺寸、图标、加载态。

## 引入

```tsx
import { Button } from '@/components'
// 或
import { Button } from '@/components/button'
```

## 基础示例

```tsx
<Button type="primary" onClick={() => console.log('clicked')}>
  创建项目
</Button>
```

## 类型（type）

```tsx
<Button type="primary">主要</Button>
<Button type="warn">警告</Button>
<Button type="success">成功</Button>
<Button type="danger">危险</Button>
```

- `primary`：主题色（`--accent`）
- `warn`：琥珀色
- `success`：翠绿色
- `danger`：红色（HeroUI danger）
- `outline`：带边框、透明背景（HeroUI bordered）
- `ghost`：透明无边框、hover 显示背景（HeroUI ghost）

不传 `type` 时通过 `className` 完全自定义样式：

```tsx
<Button className="!bg-violet-500 hover:!bg-violet-600 !text-white">
  自定义
</Button>
```

## 尺寸（size）

```tsx
<Button size="xs">超小</Button>
<Button size="sm">小（默认）</Button>
<Button size="md">中</Button>
<Button size="lg">大</Button>
```

- `xs`：28px 高，基于 HeroUI `sm` 结构 + 自定义高度/内边距
- `sm` / `md` / `lg`：HeroUI 原生尺寸

## 图标

```tsx
<Button type="primary" icon={<i className="ri-add-line" />}>
  创建项目
</Button>

<Button rightIcon={<i className="ri-arrow-right-line" />}>
  下一步
</Button>
```

## 加载态

```tsx
<Button type="primary" loading>
  提交中...
</Button>
```

`loading` 为 `true` 时：显示旋转动画、禁用点击、隐藏 `icon` / `rightIcon`。

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `children` | `ReactNode` | - | 按钮内容 |
| `type` | `'primary' \| 'info' \| 'warn' \| 'success' \| 'danger' \| 'default' \| '{...}-soft' \| 'outline' \| 'ghost'` | - | 按钮类型。solid 6 种 + soft 6 种 + outline / ghost，不传时通过 `className` 自定义 |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg'` | `'sm'` | 尺寸 |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `loading` | `boolean` | `false` | 加载中，显示 loading 指示器 |
| `icon` | `ReactNode` | - | 左侧图标 |
| `rightIcon` | `ReactNode` | - | 右侧图标 |
| `htmlType` | `'button' \| 'submit' \| 'reset'` | `'button'` | HTML button type |
| `fullWidth` | `boolean` | `false` | 是否撑满容器宽度 |
| `className` | `string` | - | 自定义样式 |
| `onClick` | `(e: MouseEvent) => void` | - | 点击回调 |

## 相关文件

- 实现：`src/components/button/index.tsx`
- 导出：通过 `src/components/index.ts` 聚合
