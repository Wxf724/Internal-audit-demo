# Pagination 组件使用文档

本组件位于 `src/components/pagination/index.tsx`，基于 HeroUI 封装，API 设计参考 Ant Design Pagination。

## 引入方式

```tsx
import { Pagination } from '@/components/pagination'
```

## 基础示例

```tsx
<Pagination
  total={120}
  current={2}
  pageSize={10}
  onChange={(page, size) => {
    console.log(page, size)
  }}
/>
```

## 全

```tsx
<Pagination
  current={page}
  total={total}
  pageSize={pageSize}
  showSizeChanger
  pageSizeOptions={[6, 12, 24, 48]}
  showQuickJumper
  hideOnSinglePage={false}
  disabled={isLoading}
  showTotal={(allTotal, [start, end]) => `第 ${start}-${end} 条 / 共 ${allTotal} 条`}
  onChange={onPageChange}
  onShowSizeChange={onShowSizeChange}
/>
```

## Props 说明

- `total?: number`
  - 数据总条数。
  - 默认值：`0`。

- `current?: number`
  - 当前页（受控模式）。
  - 传入后由外部控制页码变化。

- `defaultCurrent?: number`
  - 默认当前页（非受控模式）。
  - 默认值：`1`。

- `pageSize?: number`
  - 每页条数（受控模式）。
  - 传入后由外部控制每页条数变化。

- `defaultPageSize?: number`
  - 默认每页条数（非受控模式）。
  - 默认值：`10`。

- `size?: 'xs' | 'sm' | 'md' | 'lg'`
  - 尺寸，控制控件高度、字号、间距。
  - 默认值：`'sm'`。

- `disabled?: boolean`
  - 是否禁用分页交互（上一页、下一页、页码、下拉、快速跳转）。
  - 默认值：`false`。

- `hideOnSinglePage?: boolean`
  - 仅有 1 页时是否隐藏组件。
  - 默认值：`false`。

- `showSizeChanger?: boolean`
  - 是否显示每页条数切换（下拉框）。
  - 默认值：`false`。

- `pageSizeOptions?: number[]`
  - 每页条数可选项。
  - 默认值：`[10, 20, 50, 100]`。

- `showQuickJumper?: boolean`
  - 是否显示快速跳页输入框。
  - 默认值：`false`。
  - 交互：输入页码后按回车执行跳转。

- `showTotal?: (total: number, range: [number, number]) => string`
  - 自定义总数文案回调。
  - `range[0]` 为当前页起始序号，`range[1]` 为当前页结束序号。

- `onChange?: (page: number, pageSize: number) => void`
  - 页码变化回调（点击页码、上一页、下一页、快速跳页都会触发）。
  - 当切换 pageSize 时也会触发一次。

- `onShowSizeChange?: (current: number, size: number) => void`
  - 每页条数变化回调（仅 `showSizeChanger=true` 且切换下拉时触发）。

## 事件触发顺序说明

- 切换页码：只触发 `onChange(page, pageSize)`。
- 切换每页条数：先计算新的 `current`，再触发：
  1. `onShowSizeChange(current, size)`
  2. `onChange(current, size)`

## 推荐用法（列表页）

- 服务端分页场景建议使用受控模式：
  - 传入 `current`、`pageSize`、`total`；
  - 在 `onChange` 和 `onShowSizeChange` 中更新 hook 状态并重新请求列表。
