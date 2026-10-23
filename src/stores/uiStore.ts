import { create } from 'zustand'

type ThemeMode = 'light' | 'dark' | 'system'

interface UIState {
  sidebarCollapsed: boolean
  pageLoading: boolean
  globalModalOpen: boolean
  themeMode: ThemeMode
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebar: () => void
  setPageLoading: (loading: boolean) => void
  setGlobalModalOpen: (open: boolean) => void
  setThemeMode: (mode: ThemeMode) => void
  resetUI: () => void
}

const initialState = {
  sidebarCollapsed: false,
  pageLoading: false,
  globalModalOpen: false,
  themeMode: 'system' as ThemeMode,
}

export const useUIStore = create<UIState>((set) => ({
  ...initialState,
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setPageLoading: (loading) => set({ pageLoading: loading }),
  setGlobalModalOpen: (open) => set({ globalModalOpen: open }),
  setThemeMode: (mode) => set({ themeMode: mode }),
  resetUI: () => set({ ...initialState }),
}))
