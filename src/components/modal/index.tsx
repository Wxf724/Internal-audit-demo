import { useCallback, type MouseEvent, type ReactNode } from 'react'
import { Modal as HeroModal, useOverlayState } from '@heroui/react'
import { Button } from '@/components/button'
import { useThemeClass } from '@/components/theme-class-context'

export interface ModalProps {
  /** 是否显示 */
  open: boolean
  /** 关闭回调 */
  onClose: () => void
  /** 标题（设为 null 可隐藏标题栏） */
  title?: ReactNode | null
  /** 内容 */
  children?: ReactNode
  /**
   * 自定义页脚
   * - `undefined`：使用默认页脚（取消 + 确定）
   * - `null`：隐藏页脚
   * - `ReactNode`：自定义页脚内容
   */
  footer?: ReactNode | null
  /** 宽度。数字为 px，字符串可带单位 */
  width?: number | string
  /** 是否全屏铺满 */
  fullscreen?: boolean
  /** 是否显示关闭按钮（右上角 ×），默认 true */
  closable?: boolean
  /** 点击遮罩是否关闭，默认 true */
  maskClosable?: boolean
  /** 确定按钮文案，默认 "确定" */
  okText?: string
  /** 取消按钮文案，默认 "取消" */
  cancelText?: string
  /** 是否为删除类操作，确认按钮变为 danger 色 */
  danger?: boolean
  /** 确定按钮 loading */
  confirmLoading?: boolean
  /** 确定按钮回调 */
  onOk?: (e: MouseEvent<HTMLButtonElement>) => void | Promise<void>
  /** 取消按钮回调 */
  onCancel?: (e: MouseEvent<HTMLButtonElement>) => void
  /** 关闭后销毁 DOM，默认 true */
  destroyOnClose?: boolean
  /** 垂直居中 */
  centered?: boolean
  /** 右侧抽屉模式（贴右、全高、无圆角） */
  drawer?: boolean
  /** 最外层 className */
  className?: string
  /** 手动指定主题 class（用于 Portal 弹窗脱离 Context 时）；不传则取 Context 值 */
  themeClass?: string
}

/**
 * 通用 Modal 组件
 *
 * 基于 HeroUI Modal 封装，对标 Ant Design Modal 常用能力：
 * - 标题 / 内容 / 页脚三区域
 * - 默认页脚：取消 + 确定
 * - 自定义 header / body / footer
 * - 全屏铺满（fullscreen）
 * - 点击遮罩关闭 / 右上角关闭按钮
 */
export function Modal(props: ModalProps) {
  const {
    open,
    onClose,
    title,
    children,
    footer,
    width,
    fullscreen = false,
    closable = true,
    maskClosable = true,
    okText = '确定',
    cancelText = '取消',
    danger = false,
    confirmLoading = false,
    onOk,
    onCancel,
    destroyOnClose = true,
    centered,
    drawer = false,
    className = '',
    themeClass: themeClassProp,
  } = props

  const contextThemeClass = useThemeClass()
  const themeClass = themeClassProp ?? contextThemeClass

  const state = useOverlayState({
    isOpen: open,
    onOpenChange: (nextOpen) => {
      if (!nextOpen) onClose()
    },
  })

  const handleCancel = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      onCancel?.(e)
      onClose()
    },
    [onCancel, onClose]
  )

  const handleOk = useCallback(
    async (e: MouseEvent<HTMLButtonElement>) => {
      try {
        await onOk?.(e)
      } catch (err) {
        // 用户 onOk 中的错误由调用方自行处理，此处防止 Unhandled Rejection
        console.error('[Modal] onOk error:', err)
      }
    },
    [onOk]
  )

  // 自定义宽度：直接作用到 Dialog，同时设置 width + maxWidth 确保生效
  const dialogStyle: Record<string, string> = {}
  if (width != null && !fullscreen) {
    const w = typeof width === 'number' ? `${width}px` : width
    dialogStyle.width = w
    dialogStyle.maxWidth = w
  }

  // 如果不渲染（destroyOnClose + 已关闭），返回 null
  if (destroyOnClose && !open && !state.isOpen) {
    return null
  }

  return (
    <HeroModal.Root state={state}>
      <HeroModal.Backdrop isDismissable={maskClosable}>
        <HeroModal.Container
            placement={centered ? 'center' : 'auto'}
            className={
              drawer
                ? '!m-0 !w-full !max-w-none h-screen !flex !flex-row !items-stretch !justify-end !p-0'
                : ''
            }
          >
          <HeroModal.Dialog
            className={`${themeClass} ${className}${drawer ? ' h-full overflow-y-auto rounded-none m-0' : ''}`}
            style={dialogStyle}
          >
            {/* 关闭按钮 */}
            {closable && (
              <HeroModal.CloseTrigger className="absolute right-4 top-4 z-10 rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer">
                <i className="ri-close-line text-lg leading-none" />
              </HeroModal.CloseTrigger>
            )}

            {/* 标题 */}
            {title !== null && (
              <HeroModal.Header>
                <HeroModal.Heading>{title}</HeroModal.Heading>
              </HeroModal.Header>
            )}

            {/* 内容 */}
            <HeroModal.Body>{children}</HeroModal.Body>

            {/* 页脚 */}
            {footer !== null && (
              <HeroModal.Footer>
                {footer === undefined ? (
                  // 默认页脚：两按钮各占一半
                  <div className="flex items-center gap-3 w-full">
                    <Button
                      type="default"
                      size="md"
                      className="flex-1 rounded-lg"
                      onClick={handleCancel}
                    >
                      {cancelText}
                    </Button>
                    <Button
                      type={danger ? 'danger' : 'primary'}
                      size="md"
                      loading={confirmLoading}
                      className="flex-1 rounded-lg"
                      onClick={handleOk}
                    >
                      {okText}
                    </Button>
                  </div>
                ) : (
                  footer
                )}
              </HeroModal.Footer>
            )}
          </HeroModal.Dialog>
        </HeroModal.Container>
      </HeroModal.Backdrop>
    </HeroModal.Root>
  )
}

export default Modal
