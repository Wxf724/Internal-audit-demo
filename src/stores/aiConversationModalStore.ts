import { create } from 'zustand'

export interface AiConversationModalPreset {
  /** AI Agent 标识；不传时由弹框内部按路由或默认值处理 */
  agentId?: number
  /** 弹框标题 */
  title: string
  /** 新会话首条欢迎语 */
  welcomeInfo: string
  /** 后端流程配置，用于指定当前 AI 对话运行的流程 */
  flowConfig: object
  /** 输入框 DOM id，避免多个对话入口共用时重复 */
  inputId: string
  /** 用于强制弹窗重新创建会话；不传时使用 inputId */
  modalKey?: string
  /** 页面主题 class，用于 Portal 弹窗穿透 CSS 作用域；不传时走 :root 默认蓝色 */
  themeClass?: string
}

interface AiConversationModalState {
  /** 全局 AI 对话弹框是否打开 */
  isOpen: boolean
  /** 当前弹框配置；为 null 时不渲染弹框 */
  preset: AiConversationModalPreset | null
  /** 打开全局 AI 对话弹框，并写入本次对话配置 */
  openAiConversationModal: (preset: AiConversationModalPreset) => void
  /** 关闭全局 AI 对话弹框，并清空当前配置 */
  closeAiConversationModal: () => void
}

export const useAiConversationModalStore = create<AiConversationModalState>((set) => ({
  isOpen: false,
  preset: null,
  openAiConversationModal: (preset) => set({ isOpen: true, preset }),
  closeAiConversationModal: () => set({ isOpen: false, preset: null }),
}))
