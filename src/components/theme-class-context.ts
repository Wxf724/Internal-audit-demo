import { createContext, useContext } from 'react'

/**
 * 页面主题 class 上下文
 *
 * 用于让 Modal 等 Portal 组件知晓自己所在的页面主题，
 * 从而在 Portal 渲染（脱离原 DOM 树）时仍然应用正确的 CSS 变量作用域。
 *
 * 用法：
 *   // 在页面 Layout 根节点设置
 *   <ThemeClassContext.Provider value="theme-convagent">
 *     <Outlet />
 *   </ThemeClassContext.Provider>
 *
 *   // 在 Portal 组件中读取
 *   const themeClass = useThemeClass()
 *   <div className={themeClass}>...</div>
 */
const ThemeClassContext = createContext<string>('')

/** 读取当前页面主题 class，用于 Portal 组件保持 CSS 变量作用域 */
export function useThemeClass(): string {
  return useContext(ThemeClassContext)
}

export { ThemeClassContext }
export type { } from 'react'
