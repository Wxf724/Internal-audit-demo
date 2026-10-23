# Textarea

基于 [@heroui/react](https://www.heroui.com) 的 `TextField` + `InputGroup.TextArea` 封装的通用多行文本输入组件，交互对标 **Ant Design `Input.TextArea`**：支持左右图标、自适应高度、状态反馈、字数统计、尺寸。

边框及阴影方案参考 `searchable-select`：`border-(--border)`、焦点态 `border-(--accent)`、`transition-colors duration-200`。

## 引入

```tsx
import { Textarea } from '@/components'
// 或
import { Textarea } from '@/components/textarea'
```

依赖：项目已安装 `@heroui/react`，无需额外安装。

## 基础示例

```tsx
const [value, setValue] = useState('')

<Textarea
  value={value}
  onChange={setValue}
  placeholder="请输入描述"
  label="备注"
  rows={4}
/>
```

## 自适应高度（autoSize）

```tsx
{/* 无限制自适应 */}
<Textarea autoSize placeholder="自动扩高" />

{/* 限定行数范围 */}
<Textarea
  autoSize={{ minRows: 2, maxRows: 6 }}
  placeholder="最少 2 行，最多 6 行"
/>
```

工作原理：
- 监听 `input` 事件，动态计算 `scrollHeight`
- 每次输入前重置 `height: auto` 以获取真实内容高度
- 约束在 `minRows` / `maxRows`（按实际 `line-height` 折算像素）之间

## 左右图标

```tsx
<Textarea
  placeholder="填写备注"
  leftIcon={<i className="ri-edit-line text-gray-400" />}
  rightIcon={<i className="ri-emotion-line text-gray-400" />}
/>
```

图标通过 `InputGroup.Prefix` / `InputGroup.Suffix` 渲染，带 `self-start pt-2` 使其顶部对齐首行文字。

## 尺寸

```tsx
<Textarea size="sm" placeholder="小尺寸" rows={2} />
<Textarea size="md" placeholder="默认尺寸" rows={3} />
<Textarea size="lg" placeholder="大尺寸" rows={3} />
```

`size` 基于主题 `sizePresets`（`theme.ts`），控制行高、字号、内边距、圆角及图标大小。

## 状态反馈（错误 / 警告）

```tsx
<Textarea
  status="error"
  statusMessage="描述不能超过 200 字"
  value={value}
  onChange={setValue}
/>

<Textarea
  status="warning"
  statusMessage="建议补充更多细节"
  value={value}
  onChange={setValue}
/>
```

## 字数统计

```tsx
<Textarea
  maxLength={200}
  showCount
  placeholder="请输入内容（200 字以内）"
/>
```

字数统计显示在底部右侧，格式为 `{当前}/{上限}`。

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `value` | `string` | - | 受控值 |
| `defaultValue` | `string` | - | 非受控默认值 |
| `onChange` | `(value: string) => void` | - | 值变化回调，参数为新字符串值 |
| `placeholder` | `string` | - | 占位文案 |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `readOnly` | `boolean` | `false` | 是否只读 |
| `description` | `ReactNode` | - | 辅助说明（输入框下方文案） |
| `leftIcon` | `ReactNode` | - | 左侧图标/内容（顶部对齐） |
| `rightIcon` | `ReactNode` | - | 右侧图标/内容（顶部对齐） |
| `rows` | `number` | `3` | 可见行数（未设置 `autoSize` 时生效） |
| `autoSize` | `boolean \| { minRows?: number; maxRows?: number }` | - | 自适应内容高度 |
| `maxLength` | `number` | - | 最大输入长度 |
| `showCount` | `boolean` | `false` | 是否展示字数统计（需配合 `maxLength`） |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg'` | `'sm'` | 尺寸。对应主题 `sizePresets`，控制行高、字号、内边距、圆角、图标大小 |
| `className` | `string` | - | 最外层容器 className（加到 TextField 上） |
| `inputGroupClassName` | `string` | - | InputGroup 额外 className |
| `name` | `string` | - | HTML name 属性 |
| `autoFocus` | `boolean` | - | 自动聚焦 |
| `isRequired` | `boolean` | - | 是否必填 |

### Ref

组件使用 `forwardRef`，`ref` 直接指向内部 `<textarea>` 元素，支持 `ref.current.focus()` / `ref.current.blur()` 及直接 DOM 操作。

### 无障碍（a11y）

- 禁用/只读态通过 `isDisabled`/`isReadOnly` 标记。

## 与 Ant Design Input.TextArea 的差异

| 能力 | Ant Design Input.TextArea | 本组件 |
|------|---------------------------|--------|
| `leftIcon` / `rightIcon` | ❌（无内置） | ✅ |
| 自适应高度 `autoSize` | ✅ `boolean \| { minRows, maxRows }` | ✅ |
| 字数统计 `showCount` | ✅（含 `maxLength`） | ✅ |
| `size` | `small` / `middle` / `large` | `xs` / `sm` / `md` / `lg`（基于主题 `sizePresets`） |

## 相关文件

- 实现：`src/components/textarea/index.tsx`
- 导出：通过 `src/components/index.ts` 聚合
