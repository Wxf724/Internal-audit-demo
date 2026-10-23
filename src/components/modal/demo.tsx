import { useState } from 'react'
import { Modal } from '@/components/modal'
import { Button } from '@/components/button'

/** 供组件总览右侧使用 */
export function ModalOverviewDemo() {
  const [basicOpen, setBasicOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [fullscreenOpen, setFullscreenOpen] = useState(false)
  const [noFooterOpen, setNoFooterOpen] = useState(false)
  const [dangerOpen, setDangerOpen] = useState(false)
  const [customTitleOpen, setCustomTitleOpen] = useState(false)

  return (
    <div className="space-y-6">
      {/* 基础 + 自定义 */}
      <div>
        <p className="text-xs font-medium text-gray-600 mb-1.5">
          默认页脚 · 全屏 · 无页脚 · 自定义标题
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="primary" onClick={() => setBasicOpen(true)}>
            基础 Modal
          </Button>
          <Button onClick={() => setConfirmOpen(true)}>
            确认对话框
          </Button>
          <Button type="danger" onClick={() => setDangerOpen(true)}>
            删除确认
          </Button>
          <Button onClick={() => setCustomTitleOpen(true)}>
            自定义标题
          </Button>
          <Button onClick={() => setNoFooterOpen(true)}>
            无页脚
          </Button>
          <Button onClick={() => setFullscreenOpen(true)}>
            全屏铺满
          </Button>
        </div>
      </div>

      {/* 基础 Modal */}
      <Modal
        open={basicOpen}
        onClose={() => setBasicOpen(false)}
        title="创建项目"
        onOk={() => setBasicOpen(false)}
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">项目名称</label>
            <input className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-(--accent)" placeholder="请输入项目名称" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">描述</label>
            <textarea className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-(--accent)" rows={3} placeholder="请输入项目描述" />
          </div>
        </div>
      </Modal>

      {/* 确认对话框 */}
      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="确认删除"
        okText="确认删除"
        cancelText="再想想"
        onOk={() => setConfirmOpen(false)}
      >
        <p className="text-sm text-gray-600">
          确定要删除该项目吗？此操作不可撤销。
        </p>
      </Modal>

      {/* 删除确认 */}
      <Modal
        open={dangerOpen}
        onClose={() => setDangerOpen(false)}
        title="确认删除"
        danger
        okText="确认删除"
        onOk={() => setDangerOpen(false)}
      >
        <p className="text-sm text-gray-600">
          确定要删除该项目吗？此操作<strong className="text-red-600">不可撤销</strong>。
        </p>
      </Modal>

      {/* 无页脚 */}
      <Modal
        open={noFooterOpen}
        onClose={() => setNoFooterOpen(false)}
        title="通知详情"
        footer={null}
      >
        <div className="text-sm text-gray-600 space-y-2">
          <p>项目「智能客服系统」已成功部署。</p>
          <p>部署时间：2026-06-08 15:30</p>
          <p>版本号：v2.3.1</p>
        </div>
      </Modal>

      {/* 自定义标题 */}
      <Modal
        open={customTitleOpen}
        onClose={() => setCustomTitleOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <i className="ri-settings-3-line text-lg text-(--accent)" />
            <span>高级设置</span>
            <span className="ml-2 rounded bg-(--accent-soft) px-1.5 py-0.5 text-[10px] text-(--accent-hover)">v2.0</span>
          </div>
        }
        onOk={() => setCustomTitleOpen(false)}
      >
        <p className="text-sm text-gray-600">自定义标题支持任意 ReactNode，可加入图标、标签等。</p>
      </Modal>

      {/* 全屏 */}
      <Modal
        open={fullscreenOpen}
        onClose={() => setFullscreenOpen(false)}
        title="全屏编辑"
        fullscreen
        okText="保存"
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">标题</label>
            <input className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-(--accent)" placeholder="请输入标题" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">内容</label>
            <textarea className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-(--accent)" rows={10} placeholder="请输入内容" />
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default function ModalDemoPage() {
  return (
    <div className="h-full overflow-y-auto p-5 bg-gray-50/50">
      <div className="space-y-4">
        <div>
          <h1 className="text-lg font-bold text-(--foreground)">Modal 演示</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            默认页脚 · 确认对话框 · 无页脚 · 全屏铺满 · 自定义 header/body/footer
          </p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-(--surface) p-4">
          <ModalOverviewDemo />
        </div>
      </div>
    </div>
  )
}
