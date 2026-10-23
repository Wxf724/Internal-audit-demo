# Input

基于 [@heroui/react](https://www.heroui.com) 的 `TextField` + `InputGroup` 封装的通用输入框组件，交互对标 **Ant Design `Input`**：支持左右图标、一键清除、字数统计、尺寸。

边框及阴影方案参考 `searchable-select`：`border-(--border)`、焦点态 `border-(--accent)`、`transition-colors duration-200`。

## 引入

```tsx
import { Input } from '@/components'
// 或
import { Input } from '@/components/input'
```

依赖：项目已安装 `@heroui/react`，无需额外安装。

## 基础示例

```tsx
const [value, setValue] = useState('')

<Input
  value={value}
  onChange={setValue}
  placeholder="请输入内容"
/>
```

## 左右图标

```tsx
<Input
  placeholder="搜索关键词"
  leftIcon={<i className="ri-search-line text-gray-400" />}
  rightIcon={<i className="ri-information-line text-gray-400" />}
/>
```

**`allowClear` + `rightIcon` 互斥逻辑**：当 `allowClear` 为 `true` 且输入非空时，右侧优先展示清除按钮，`rightIcon` 被隐藏。

## 一键清除

```tsx
<Input
  allowClear
  placeholder="可一键清空"
  value={value}
  onChange={setValue}
/>
```

## 尺寸

```tsx
<Input size="sm" placeholder="小尺寸" />
<Input size="md" placeholder="默认尺寸" />
<Input size="lg" placeholder="大尺寸" />
```

`size` 基于主题 `sizePresets`（`theme.ts`），控制行高、字号、内边距、圆角及图标大小。

## 字数统计

```tsx
<Input
  maxLength={50}
  showCount
  value={value}
  onChange={setValue}
/>
```

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `value` | `string` | - | 受控值 |
| `defaultValue` | `string` | - | 非受控默认值 |
| `onChange` | `(value: string) => void` | - | 值变化回调，参数为新字符串值 |
| `onKeyDown` | `(e: React.KeyboardEvent<HTMLInputElement>) => void` | - | 键盘按下回调，透传到内部 `<input>` |
| `onKeyUp` | `(e: React.KeyboardEvent<HTMLInputElement>) => void` | - | 键盘抬起回调，透传到内部 `<input>` |
| `onInput` | `(e: React.FormEvent<HTMLInputElement>) => void` | - | 原生 onInput 回调，透传到内部 `<input>` |
| `onFocus` | `(e: React.FocusEvent<HTMLInputElement>) => void` | - | 聚焦回调，透传到内部 `<input>` |
| `onBlur` | `(e: React.FocusEvent<HTMLInputElement>) => void` | - | 失焦回调，透传到内部 `<input>` |
| `placeholder` | `string` | - | 占位文案 |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `readOnly` | `boolean` | `false` | 是否只读 |
| `description` | `ReactNode` | - | 辅助说明（输入框下方文案） |
| `leftIcon` | `ReactNode` | - | 左侧图标/内容 |
| `rightIcon` | `ReactNode` | - | 右侧图标/内容 |
| `search` | `boolean` | `false` | 搜索模式：左侧显示搜索图标（传 `leftIcon` 时被覆盖） |
| `allowClear` | `boolean` | `false` | 是否允许一键清空。有值时右侧显示清除按钮（覆盖 `rightIcon`） |
| `maxLength` | `number` | - | 最大输入长度 |
| `showCount` | `boolean` | `false` | 是否展示字数统计（需配合 `maxLength`） |
| `type` | `string` | `'text'` | HTML input type 属性 |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg'` | `'sm'` | 尺寸。对应主题 `sizePresets`，控制行高、字号、内边距、圆角、图标大小 |
| `inputMode` | `'none' \| 'text' \| 'tel' \| 'url' \| 'email' \| 'numeric' \| 'decimal' \| 'search'` | - | 移动端键盘模式 |
| `className` | `string` | - | 最外层容器 className（加到 TextField 上） |
| `inputGroupClassName` | `string` | - | InputGroup 额外 className |
| `name` | `string` | - | HTML name 属性 |
| `autoFocus` | `boolean` | - | 自动聚焦 |
| `isRequired` | `boolean` | - | 是否必填 |

### Ref

组件使用 `forwardRef`，`ref` 直接指向内部 `<input>` 元素，支持 `ref.current.focus()` / `ref.current.blur()`。

### 无障碍（a11y）

- 清除按钮有 `aria-label="清除输入"`。
- 禁用/只读态通过 `disabled`/`readOnly` 标记。

## 与 Ant Design Input 的差异

| 能力 | Ant Design Input | 本组件 |
|------|------------------|--------|
| `leftIcon` / `rightIcon`（prefix/suffix） | `prefix` / `suffix` | `leftIcon` / `rightIcon` |
| 一键清除 `allowClear` | ✅ | ✅ |
| 字数统计 `showCount` | ✅（含 `maxLength`） | ✅（需配合 `maxLength`） |
| `size` | `small` / `middle` / `large` | `xs` / `sm` / `md` / `lg`（基于主题 `sizePresets`） |
| `addonBefore` / `addonAfter` | ✅ | 未实现，需在外层拼接 |

## 相关文件

- 实现：`src/components/input/index.tsx`
- 导出：通过 `src/components/index.ts` 聚合
