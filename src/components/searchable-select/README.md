# SearchableSelect 组件

基于 `@heroui/react` 的 **Button + Input** 组装的带搜索下拉（自定义浮层），与 `Select` 使用相同的 **options / 分组 / fieldNames** 约定，便于与后端字段映射对齐。

- 支持：单选 / 多选
- 支持：option 以及可分组选项
- 支持：`fieldNames` 字段映射
- 支持：`value`、`defaultValue`、`disabled`、`size`、`listMaxHeight`、`dropdownMatchSelectWidth`、`allowClear`、`prefixIcon`、事件回调
- 分组下拉：分组标题浅色展示，分组内选项左缩进，层级更清晰

## Props

| 属性                       | 类型                                                                      | 默认值                                                                         | 说明                                                                                                                     |
| -------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `value`                    | `string \| number \| Array<string \| number> \| null`                     | -                                                                              | 受控值；单选为单个值，多选为数组                                                                                         |
| `defaultValue`             | `string \| number \| Array<string \| number> \| null`                     | `null`                                                                         | 非受控默认值                                                                                                             |
| `options`                  | `Record<string, unknown>[]`                                               | `[]`                                                                           | 选项数据；支持普通选项和带 `options` 子数组的分组                                                                        |
| `fieldNames`               | `{ label?: string; value?: string; options?: string; disabled?: string }` | `{ label: 'label', value: 'value', options: 'options', disabled: 'disabled' }` | 字段映射                                                                                                                 |
| `placeholder`              | `string`                                                                  | `'请选择'`                                                                     | 触发器占位文案                                                                                                           |
| `searchPlaceholder`        | `string`                                                                  | `'搜索'`                                                                       | 搜索框占位文案                                                                                                           |
| `showSearch`               | `boolean`                                                                 | `false`                                                                        | 是否展示顶部搜索并启用选项过滤                                                                                           |
| `emptyText`                | `ReactNode`                                                               | `'暂无数据'`                                                                   | 空数据文案                                                                                                               |
| `disabled`                 | `boolean`                                                                 | `false`                                                                        | 是否禁用                                                                                                                 |
| `multiple`                 | `boolean`                                                                 | `false`                                                                        | 是否多选                                                                                                                 |
| `size`                     | `'sm' \| 'md' \| 'lg'`                                                    | `'sm'`                                                                         | 控件尺寸，和 `TreeSelect` 一致                                                                                           |
| `listMaxHeight`            | `number`                                                                  | `300`                                                                          | 下拉弹框整体最大高度，包含搜索区                                                                                         |
| `dropdownMatchSelectWidth` | `boolean`                                                                 | `true`                                                                         | 下拉宽度是否与触发器一致；为 `false` 时宽度在触发器与 400px 间随内容自适应（`max-content` 封顶 400），选项与分组标题折行 |
| `allowClear`               | `boolean`                                                                 | `true`                                                                         | 有选中值时是否在触发器右侧展示清空按钮（`ri-close-circle-line`）；点击后 `onChange(null, null)`，与 `TreeSelect` / `DatePicker` 行为一致 |
| `prefixIcon`               | `ReactNode`                                                               | -                                                                              | 触发器回显区左侧图标，显示在选中值 / placeholder 文字之前                                                                 |
| `className`                | `string`                                                                  | `''`                                                                           | 根节点类名                                                                                                               |
| `onChange`                 | `(value, option) => void`                                                 | -                                                                              | 选择变化回调                                                                                                             |
| `onOpenChange`             | `(open: boolean) => void`                                                 | -                                                                              | 下拉打开状态变化回调                                                                                                     |
| `onSelect`                 | `(value, option) => void`                                                 | -                                                                              | 选中单项时触发                                                                                                           |
| `onDeselect`               | `(value, option) => void`                                                 | -                                                                              | 多选取消单项时触发                                                                                                       |

## 引入

```tsx
import { SearchableSelect } from '@/components'
// 或
import { SearchableSelect } from '@/components/searchable-select'
```

## 基础示例（单选）

```tsx
const options = [
  { label: '选项 A', value: 'a' },
  { label: '选项 B', value: 'b' },
]

<SearchableSelect
  size="sm"
  value={code}
  options={options}
  placeholder="请选择"
  searchPlaceholder="搜索"
  onChange={(next) => setCode(next == null ? '' : String(next))}
/>
```

## 分组选项

结构与普通 `Select` 一致：分组项带 `options` 子数组。

```tsx
const options = [
  {
    label: '华东',
    options: [
      { label: '上海', value: 'sh' },
      { label: '杭州', value: 'hz' },
    ],
  },
  {
    label: '华北',
    options: [{ label: '北京', value: 'bj' }],
  },
]

<SearchableSelect options={options} placeholder="请选择城市" />
```

分组样式约定：

- 分组标题：`text-gray-400`、`font-medium`，与选项区分
- 分组内选项：相对标题左缩进 `pl-3`，体现从属关系

## 回显区左侧图标（prefixIcon）

在触发器边框内、选中文字左侧展示图标，适用于模型选择等场景：

```tsx
<SearchableSelect
  size="sm"
  allowClear={false}
  showSearch
  value={modelId}
  options={modelGroups}
  placeholder="选择模型"
  className="w-[168px]"
  prefixIcon={<i className="ri-cpu-line text-sm text-violet-600" />}
  onChange={(value) => setModelId(typeof value === 'string' ? value : null)}
/>
```

`prefixIcon` 传入任意 `ReactNode`（Remix Icon、SVG、自定义组件均可）。

## 多选

`multiple` 时 **`value` 请使用数组或 `null`**（表示未选）。若误传单个 `string` / `number`，组件会按「仅一项」参与多选逻辑，避免勾选失效。

```tsx
<SearchableSelect
  multiple
  size="md"
  options={options}
  value={selected}
  onChange={(next) => setSelected(Array.isArray(next) ? next : [])}
  onSelect={(v) => console.log('select', v)}
  onDeselect={(v) => console.log('deselect', v)}
/>
```

## 可清空（allowClear）

默认开启。有选中值且未禁用时，触发器右侧箭头左侧显示清空图标；点击清空不会展开下拉，并触发 `onChange(null, null)`。单选、多选均会清空全部已选项。

```tsx
<SearchableSelect
  size="sm"
  showSearch={false}
  value={riskLevel}
  options={[
    { value: '低', label: '低' },
    { value: '中', label: '中' },
    { value: '高', label: '高' },
  ]}
  placeholder="风险等级"
  onChange={(next) => setRiskLevel(next == null ? '' : String(next))}
/>

// 不需要清空时
<SearchableSelect allowClear={false} options={options} />
```

## 字段映射（fieldNames）

```tsx
<SearchableSelect
  options={apiRows}
  fieldNames={{
    label: 'name',
    value: 'id',
    options: 'children',
    disabled: 'isDisabled',
  }}
/>
```

## 交互说明

- 点击外部或按 **Esc** 关闭下拉；关闭时会清空搜索关键字。
- **清空**：`allowClear` 为 `true`（默认）且有值时，点击 `ri-close-circle-line` 清空；事件会 `stopPropagation`，避免误触发展开下拉。
- 下拉通过 Portal 挂载，层级高于常见全屏 Modal / Backdrop，避免遮罩抢点击导致误判「外部关闭」。
- 在 Modal 内会优先挂载到 `role="dialog"` / `aria-modal` 的定位祖先，减少全屏弹窗内定位偏移。
