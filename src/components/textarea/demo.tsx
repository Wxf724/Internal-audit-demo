import { useState } from 'react'
import { Textarea } from '@/components/textarea'

/** 供组件总览右侧使用：仅 Demo 区块（外层卡片由总览包裹） */
export function TextareaOverviewDemo() {
  const [basicValue, setBasicValue] = useState('')
  const [autoValue, setAutoValue] = useState('')
  const [limitedAutoValue, setLimitedAutoValue] = useState('')
  const [countValue, setCountValue] = useState('')

  return (
    <div className="space-y-6">
      {/* 基础多行输入 */}
      <div>
        <p className="text-xs font-medium text-gray-600 mb-1.5">
          基础多行输入 · rows=3
        </p>
        <Textarea
          className="max-w-md"
          value={basicValue}
          onChange={setBasicValue}
          placeholder="请输入描述信息"
          rows={3}
        />
        <p className="mt-1.5 text-xs text-gray-500">
          当前字符数：
          <span className="font-mono text-gray-700">
            {basicValue.length}
          </span>
        </p>
      </div>

      {/* 尺寸 */}
      <div className="border-t border-gray-100 pt-5">
        <p className="text-xs font-medium text-gray-600 mb-1.5">
          尺寸 · size（xs / sm / md / lg，默认 sm）
        </p>
        <div className="space-y-4 max-w-md">
          <Textarea size="xs" placeholder="超小尺寸 (xs)" rows={2} />
          <Textarea size="sm" placeholder="小尺寸 (sm · 默认)" rows={2} />
          <Textarea size="md" placeholder="中等尺寸 (md)" rows={3} />
          <Textarea size="lg" placeholder="大尺寸 (lg)" rows={3} />
        </div>
      </div>

      {/* 自适应高度 */}
      <div className="border-t border-gray-100 pt-5">
        <p className="text-xs font-medium text-gray-600 mb-1.5">
          自适应高度 · autoSize
        </p>
        <div className="space-y-4 max-w-md">
          <div>
            <p className="text-[11px] text-gray-400 mb-1">
              autoSize=true（无限制）
            </p>
            <Textarea
              autoSize
              value={autoValue}
              onChange={setAutoValue}
              placeholder="输入内容自动扩高..."
            />
          </div>
          <div>
            <p className="text-[11px] text-gray-400 mb-1">
              autoSize={'{'} minRows: 2, maxRows: 5 {'}'}
            </p>
            <Textarea
              autoSize={{ minRows: 2, maxRows: 5 }}
              value={limitedAutoValue}
              onChange={setLimitedAutoValue}
              placeholder="最少 2 行，最多 5 行..."
            />
          </div>
        </div>
      </div>

      {/* 左右图标 */}
      <div className="border-t border-gray-100 pt-5">
        <p className="text-xs font-medium text-gray-600 mb-1.5">
          左右图标 · leftIcon + rightIcon
        </p>
        <Textarea
          className="max-w-md"
          placeholder="填写备注信息"
          rows={3}
          leftIcon={<i className="ri-edit-line text-gray-400 text-base" />}
          rightIcon={
            <i className="ri-emotion-line text-gray-400 text-base" />
          }
        />
      </div>

      {/* 字数统计 */}
      <div className="border-t border-gray-100 pt-5">
        <p className="text-xs font-medium text-gray-600 mb-1.5">
          字数统计 · showCount + maxLength
        </p>
        <Textarea
          className="max-w-md"
          maxLength={200}
          showCount
          value={countValue}
          onChange={setCountValue}
          placeholder="最多输入 200 个字符"
          rows={3}
        />
      </div>

      {/* 辅助说明 */}
      <div className="border-t border-gray-100 pt-5">
        <p className="text-xs font-medium text-gray-600 mb-1.5">
          辅助说明 · description
        </p>
        <div className="space-y-4 max-w-md">
          <Textarea
            description="非必填，建议控制在 100 字以内"
            placeholder="请输入备注信息"
            rows={3}
          />
          <Textarea
            isRequired
            description="请详细描述功能需求及预期效果"
            placeholder="请输入需求说明"
            rows={4}
          />
        </div>
      </div>

      {/* 禁用 / 只读 */}
      <div className="border-t border-gray-100 pt-5">
        <p className="text-xs font-medium text-gray-600 mb-1.5">
          禁用 · disabled / readOnly
        </p>
        <div className="space-y-4 max-w-md">
          <Textarea
            disabled
            value="该内容不可编辑，用于展示历史记录"
            rows={2}
          />
          <Textarea
            readOnly
            value="只读内容，可选择复制但不可修改"
            description="该字段为只读"
            rows={2}
          />
        </div>
      </div>
    </div>
  )
}

/** 独立演示页 */
export default function TextareaDemoPage() {
  return (
    <div className="h-full overflow-y-auto p-5 bg-gray-50/50">
      <div className="space-y-4">
        <div>
          <h1 className="text-lg font-bold text-(--foreground)">Textarea 演示</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            自适应高度 · 左右图标 · 字数统计 · 尺寸 · 辅助说明
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-(--surface) p-4">
          <TextareaOverviewDemo />
        </div>
      </div>
    </div>
  )
}
