# Modal

基于 [@heroui/react](https://www.heroui.com) 的 `Modal` 封装的通用对话框组件，对标 **Ant Design Modal**：支持标题/内容/页脚三区域、自定义各区域、全屏铺满。

## 引入

```tsx
import { Modal } from '@/components'
// 或
import { Modal } from '@/components/modal'
```

## 基础示例

```tsx
const [open, setOpen] = useState(false)

<Modal
  open={open}
  onClose={() => setOpen(false)}
  title="创建项目"
  onOk={() => setOpen(false)}
>
  <p>项目内容表单...</p>
</Modal>
```

## 默认页脚

不传 `footer` 时，默认渲染 取消 + 确定 按钮。通过 `okText` / `cancelText` / `confirmLoading` / `onOk` / `onCancel` 控制：

```tsx
<Modal
  open={open}
  onClose={() => setOpen(false)}
  title="确认操作"
  okText="提交"
  cancelText="返回"
  confirmLoading={submitting}
  onOk={handleSubmit}
>
  确定要执行此操作吗？
</Modal>
```

## 自定义 header / body / footer

```tsx
{/* 隐藏标题 */}
<Modal open={open} onClose={onClose} title={null}>
  无标题对话框
</Modal>

{/* 自定义页脚 */}
<Modal
  open={open}
  onClose={onClose}
  title="自定义"
  footer={
    <Button type="danger" onClick={onClose}>关闭</Button>
  }
>
  自定义页脚内容
</Modal>

{/* 隐藏页脚 */}
<Modal open={open} onClose={onClose} title="无页脚" footer={null}>
  纯内容展示
</Modal>
```

## 全屏铺满

```tsx
<Modal open={open} onClose={onClose} title="全屏" fullscreen>
  全屏内容...
</Modal>
```

## 尺寸

```tsx
<Modal size="sm" ... />   {/* 小 */}
<Modal size="md" ... />   {/* 中（默认） */}
<Modal size="lg" ... />   {/* 大 */}
<Modal size="full" ... /> {/* 全屏 */}
```

也可通过 `width` 自定义像素宽度（覆盖 `size`）。

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `open` | `boolean` | - | 是否显示 |
| `onClose` | `() => void` | - | 关闭回调 |
| `title` | `ReactNode \| null` | - | 标题；`null` 隐藏标题栏 |
| `children` | `ReactNode` | - | 内容 |
| `footer` | `ReactNode \| null` | `undefined` | 页脚；`undefined`=默认按钮，`null`=隐藏，`ReactNode`=自定义 |
| `okText` | `string` | `'确定'` | 确定按钮文案 |
| `cancelText` | `string` | `'取消'` | 取消按钮文案 |
| `onOk` | `(e) => void \| Promise` | - | 确定回调，支持 async |
| `onCancel` | `(e) => void` | - | 取消回调 |
| `danger` | `boolean` | `false` | 是否为删除操作，确认按钮变为 danger 色 |
| `confirmLoading` | `boolean` | `false` | 确定按钮加载态 |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'full'` | `'md'` | 尺寸 |
| `fullscreen` | `boolean` | `false` | 全屏铺满（等同 `size="full"`） |
| `width` | `number \| string` | - | 自定义宽度（px 或带单位字符串） |
| `closable` | `boolean` | `true` | 是否显示右上角关闭按钮 |
| `maskClosable` | `boolean` | `true` | 点击遮罩是否关闭 |
| `centered` | `boolean` | - | 垂直居中 |
| `destroyOnClose` | `boolean` | `true` | 关闭后销毁 DOM |
| `className` | `string` | - | Modal 容器 className |

## 相关文件

- 实现：`src/components/modal/index.tsx`
- 导出：通过 `src/components/index.ts` 聚合
