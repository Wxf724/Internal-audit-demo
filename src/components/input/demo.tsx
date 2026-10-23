import { useState } from 'react'
import { Input } from '@/components/input'

/** 供组件总览右侧使用：仅 Demo 区块（外层卡片由总览包裹） */
export function InputOverviewDemo() {
  const [basicValue, setBasicValue] = useState('')
  const [clearValue, setClearValue] = useState('可一键清空')
  const [countValue, setCountValue] = useState('')

  return (
    <div className="space-y-6">
      {/* 基础输入 */}
      <div>
        <p className="text-xs font-medium text-gray-600 mb-1.5">基础输入</p>
        <Input
          className="max-w-sm"
          value={basicValue}
          onChange={setBasicValue}
          placeholder="请输入内容"
        />
        <p className="mt-1.5 text-xs text-gray-500">
          当前值：
          <span className="font-mono text-gray-700">
            {basicValue || '（空）'}
          </span>
        </p>
      </div>

      {/* 尺寸 */}
      <div className="border-t border-gray-100 pt-5">
        <p className="text-xs font-medium text-gray-600 mb-1.5">
          尺寸 · size（xs / sm / md / lg，默认 sm）
        </p>
        <div className="space-y-4 max-w-sm">
          <Input size="xs" placeholder="超小尺寸 (xs)" />
          <Input size="sm" placeholder="小尺寸 (sm · 默认)" />
          <Input size="md" placeholder="中等尺寸 (md)" />
          <Input size="lg" placeholder="大尺寸 (lg)" />
        </div>
      </div>

      {/* 左右图标 */}
      <div className="border-t border-gray-100 pt-5">
        <p className="text-xs font-medium text-gray-600 mb-1.5">
          左右图标 · leftIcon + rightIcon
        </p>
        <Input
          className="max-w-sm"
          placeholder="搜索关键词"
          leftIcon={<i className="ri-search-line text-gray-400 text-base" />}
          rightIcon={
            <i className="ri-information-line text-gray-400 text-base" />
          }
        />
      </div>

      {/* allowClear */}
      <div className="border-t border-gray-100 pt-5">
        <p className="text-xs font-medium text-gray-600 mb-1.5">
          一键清除 · allowClear（与 rightIcon 互斥）
        </p>
        <Input
          className="max-w-sm"
          allowClear
          value={clearValue}
          onChange={setClearValue}
          rightIcon={<i className="ri-search-line text-gray-400 text-base" />}
          placeholder="输入内容后右侧出现清除按钮"
        />
      </div>

      {/* 字数统计 */}
      <div className="border-t border-gray-100 pt-5">
        <p className="text-xs font-medium text-gray-600 mb-1.5">
          字数统计 · showCount + maxLength
        </p>
        <Input
          className="max-w-sm"
          maxLength={30}
          showCount
          value={countValue}
          onChange={setCountValue}
          placeholder="最多输入 30 个字符"
        />
      </div>

      {/* 辅助说明 */}
      <div className="border-t border-gray-100 pt-5">
        <p className="text-xs font-medium text-gray-600 mb-1.5">
          辅助说明 · description
        </p>
        <Input
          className="max-w-sm"
          description="支持中英文及数字，长度 4-20 位"
          placeholder="请输入用户名"
        />
      </div>

      {/* 禁用 / 只读 */}
      <div className="border-t border-gray-100 pt-5">
        <p className="text-xs font-medium text-gray-600 mb-1.5">
          禁用 · disabled / readOnly
        </p>
        <div className="space-y-4 max-w-sm">
          <Input
            disabled
            value="不可编辑"
            description="该字段已被禁用"
          />
          <Input
            readOnly
            value="只读内容"
            description="该字段为只读"
          />
        </div>
      </div>
    </div>
  )
}

/** 独立演示页 */
export default function InputDemoPage() {
  return (
    <div className="h-full overflow-y-auto p-5 bg-gray-50/50">
      <div className="space-y-4">
        <div>
          <h1 className="text-lg font-bold text-(--foreground)">Input 演示</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            左右图标 · 一键清除 · 字数统计 · 尺寸 · 辅助说明
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-(--surface) p-4">
          <InputOverviewDemo />
        </div>
      </div>
    </div>
  )
}
