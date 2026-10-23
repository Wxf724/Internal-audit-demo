# AiFab 组件

右下角 AI 对话悬浮入口，带脉冲动画、hover 放大与左侧 tooltip。

- 固定定位在页面右下角（`fixed right-6 bottom-6`）
- hover 时显示 tooltip，并放大悬浮球
- 按住移动超过小阈值后拖动位置，短按触发点击
- 点击触发 `onClick` 回调（如打开对话抽屉 / 跳转对话页）

## 引入

```tsx
import { AiFab } from '@/components'
// 或
import { AiFab } from '@/components/ai-fab'
```

## 基础示例

```tsx
<AiFab onClick={() => setChatOpen(true)} />
```

## 自定义文案

`title` 同时用于浏览器原生 `title` 与 hover tooltip：

```tsx
<AiFab title="智能助手" onClick={handleOpenChat} />
```

## 自定义定位

默认已包含 `fixed right-6 bottom-6 z-40`，可通过 `className` 覆盖或追加：

```tsx
<AiFab className="right-8 bottom-8" onClick={handleOpenChat} />
```

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `onClick` | `() => void` | — | 点击悬浮球回调（必填） |
| `title` | `string` | `'AI 对话助手'` | 提示文案 |
| `className` | `string` | — | 最外层按钮额外 className |

## 使用场景

当前用于 `conv-agent` 布局页，作为全局 AI 对话入口：

```tsx
// src/pages/conv-agent/index.tsx
<AiFab onClick={() => {}} />
```
