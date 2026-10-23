# Spin

基于 [@heroui/react](https://www.heroui.com) 的 `Spinner` 封装的加载组件，交互与 **Ant Design `Spin`** 相近：支持嵌套内容遮罩、`tip` 文案、**延迟显示**（减轻短请求闪烁）。

## 引入

```tsx
import { Spin } from '@/components'
// 或
import { Spin } from '@/components/spin/Spin'
```

依赖：项目已安装 `@heroui/react`，无需额外安装。

## 两种模式

### 1. 嵌套模式（有 `children`）

在内容区域上方显示半透明遮罩 + 居中 Spinner，加载时子内容会**变暗**且**不可点击**（`pointer-events-none`）。

适用于：表格、卡片列表、表单区域等整块内容的加载态。

### 2. 仅指示器模式（无 `children`）

不渲染子内容，仅在 `spinning === true` 且经过 `delay`（若有）后显示 Spinner（及可选 `tip`）。

**注意**：`spinning === false` 时组件返回 `null`，不占位。若需要占位，请在外层包一层容器或使用嵌套模式。

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `spinning` | `boolean` | `false` | 是否处于加载中 |
| `tip` | `ReactNode` | - | 显示在 Spinner 下方的说明文字 |
| `delay` | `number` | `0` | 延迟多少毫秒后再显示 loading；`0` 表示立即显示。用于避免 100～300ms 内结束的请求反复闪屏 |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | 对应 HeroUI `Spinner` 尺寸 |
| `color` | `'current' \| 'accent' \| 'success' \| 'warning' \| 'danger'` | `'accent'` | HeroUI Spinner 颜色变体 |
| `indicator` | `ReactNode` | - | 自定义指示器；传入则**不再**渲染默认 `Spinner` |
| `className` | `string` | - | 最外层容器 `className` |
| `wrapperClassName` | `string` | - | **仅嵌套模式**：包裹层额外样式（如 `min-h-[320px]`） |
| `overlayClassName` | `string` | - | **仅嵌套模式**：遮罩层额外样式 |
| `minHeightClassName` | `string` | `'min-h-[120px]'` | **仅无 children 模式**：占位最小高度 |
| `onSpinningChange` | `(visible: boolean) => void` | - | **实际展示** loading 的状态变化（已考虑 `delay`）。`visible === true` 表示遮罩/指示器已显示 |

### 事件说明

- **`onSpinningChange(visible)`**  
  - `visible` 为内部是否**真正展示** loading（`spinning && 已过 delay`）。  
  - 用于埋点、联动其他 UI 等；回调通过 ref 保存，避免因父组件内联函数导致多余触发。

### Ref

组件使用 `forwardRef`，`ref` 指向最外层 `div`。

## 无障碍（a11y）

- 嵌套模式：根节点 `aria-busy` 随遮罩显示切换。
- Spinner 区域使用 `role="status"`、`aria-live="polite"`；有 `tip` 时与文案通过 `aria-labelledby` 关联。

## 示例

### 列表区域加载（智能体商店）

```tsx
<Spin spinning={isLoading} tip="加载中..." delay={200} size="lg" wrapperClassName="min-h-[320px]">
  <AgentGrid {...props} />
</Spin>
```

### 仅全局小块加载

```tsx
{showFetch && (
  <Spin spinning={loading} tip="请稍候" delay={150} minHeightClassName="min-h-[80px]" />
)}
```

### 自定义指示器

```tsx
<Spin spinning indicator={<span className="text-sm text-gray-500">加载中…</span>} />
```

## 与 Ant Design Spin 的差异（简要）

| 能力 | Ant Design Spin | 本组件 |
|------|-----------------|--------|
| `spinning` / `tip` / `delay` | 支持 | 支持 |
| `size` | `small` / `default` / `large` | 映射为 HeroUI `sm` / `md` / `lg` / `xl` |
| `indicator` | 支持 | 支持 |
| `fullscreen` / `percent` | 部分版本有 | 未实现，需要时可在外层加全屏容器 |

## 相关文件

- 实现：`src/components/spin/Spin.tsx`
- 导出：通过 `src/components/index.ts` 聚合，或直接从 `Spin.tsx` 导入
