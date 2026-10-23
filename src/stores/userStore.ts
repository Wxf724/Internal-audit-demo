import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// 与主系统保持一致，两个前端项目共用 localStorage.user。
const USER_STORAGE_KEY = 'user'

export interface SharedUserInfo {
  key?: string
  username?: string
  title?: string
  phone?: string
  email?: string
  messenger?: string
  is_bind_wechat?: boolean
  [key: string]: unknown
}

export interface UserProfile {
  user_key?: string | number
  user_name?: string
  title?: string
  tnn?: string
  tnn_name?: string
  user_info?: SharedUserInfo
  [key: string]: unknown
}

interface UserState extends UserProfile {
  expires_time: number | null
  token: string | null
  refresh_expire: number | null
  refresh_token: string | null
  isLoggedIn: boolean
  setUser: (user: UserProfile | null) => void
  updateUser: (patch: Partial<UserProfile>) => void
  setToken: (token: string | null) => void
  setTokenSession: (payload: {
    access_token: string
    refresh_token?: string
    access_expire?: number
    refresh_expire?: number
  }) => void
  setLogin: (payload: { user: UserProfile; token?: string | null }) => void
  login: (payload: { username: string; password: string }) => Promise<unknown>
  refreshAccessToken: () => Promise<string | null>
  logout: () => void
  reset: () => void
}

type StoredUser = Pick<
  UserState,
  | 'expires_time'
  | 'token'
  | 'refresh_expire'
  | 'refresh_token'
  | 'tnn'
  | 'tnn_name'
  | 'user_name'
  | 'title'
  | 'user_key'
  | 'user_info'
>

const initialState: Pick<
  UserState,
  | 'expires_time'
  | 'token'
  | 'refresh_expire'
  | 'refresh_token'
  | 'tnn'
  | 'tnn_name'
  | 'user_name'
  | 'title'
  | 'user_key'
  | 'user_info'
  | 'isLoggedIn'
> = {
  expires_time: null,
  token: null,
  refresh_expire: null,
  refresh_token: null,
  tnn: undefined,
  tnn_name: undefined,
  user_name: undefined,
  title: undefined,
  user_key: undefined,
  user_info: undefined,
  isLoggedIn: false,
}

// Zustand 默认会额外包 state/version；这里改成直接读写主系统约定的 user 对象。
const userStorage = {
  getItem: () => {
    const raw = localStorage.getItem(USER_STORAGE_KEY)
    if (!raw) return null

    try {
      const user = JSON.parse(raw) as StoredUser
      return {
        state: {
          ...user,
          isLoggedIn: Boolean(user.token),
        },
        version: 0,
      }
    } catch {
      return null
    }
  },
  setItem: (_name: string, value: { state: Partial<UserState> }) => {
    const state = value.state

    if (!state.token && !state.refresh_token) {
      localStorage.removeItem(USER_STORAGE_KEY)
      return
    }

    const user: StoredUser = {
      expires_time: state.expires_time ?? null,
      token: state.token ?? null,
      refresh_expire: state.refresh_expire ?? null,
      refresh_token: state.refresh_token ?? null,
      tnn: state.tnn,
      tnn_name: state.tnn_name,
      user_name: state.user_name,
      title: state.title,
      user_key: state.user_key,
      user_info: state.user_info,
    }

    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
  },
  removeItem: () => {
    localStorage.removeItem(USER_STORAGE_KEY)
  },
}

export const useUserStore = create<UserState>()(
  persist<UserState>(
    (set) => ({
      ...initialState,
      setUser: (user) =>
        set({
          tnn: user?.tnn,
          tnn_name: user?.tnn_name,
          user_name: user?.user_name,
          title: user?.title,
          user_key: user?.user_key,
          user_info: user?.user_info,
          isLoggedIn: Boolean(user),
        }),
      updateUser: (patch) =>
        set((state) => ({
          tnn: patch.tnn ?? state.tnn,
          tnn_name: patch.tnn_name ?? state.tnn_name,
          user_name: patch.user_name ?? state.user_name,
          title: patch.title ?? state.title,
          user_key: patch.user_key ?? state.user_key,
          user_info: patch.user_info ?? state.user_info,
        })),
      setToken: (token) =>
        set((state) => ({
          token,
          isLoggedIn: state.isLoggedIn || Boolean(token),
        })),
      setTokenSession: ({ access_token, refresh_token, access_expire, refresh_expire }) =>
        set((state) => ({
          token: access_token || state.token,
          refresh_token: refresh_token ?? state.refresh_token,
          expires_time: access_expire ?? state.expires_time,
          refresh_expire: refresh_expire ?? state.refresh_expire,
          isLoggedIn: Boolean(access_token || state.token),
        })),
      setLogin: ({ user, token = null }) =>
        set({
          tnn: user.tnn,
          tnn_name: user.tnn_name,
          user_name: user.user_name,
          title: user.title,
          user_key: user.user_key,
          user_info: user.user_info,
          token,
          isLoggedIn: true,
        }),
      login: async ({ username, password }) => {
        // 动态加载 API，避免 store 与 axios 拦截器形成模块循环依赖。
        const { loginAPI } = await import('@/api/AuthAPI')
        const res = await loginAPI({ username, password })
        const data = res?.data || {}
        set({
          expires_time: data.access_expire ?? null,
          token: data.access_token ?? null,
          refresh_expire: data.refresh_expire ?? null,
          refresh_token: data.refresh_token ?? null,
          tnn: data.tnn,
          tnn_name: data.tnn_name,
          user_name: data.user_name,
          title: data.title,
          user_key: data.user_key,
          user_info: data.user_info ?? {
            key: data.user_key != null ? String(data.user_key) : '',
            username: data.user_name || '',
            title: data.title || '',
            phone: '',
            email: '',
            messenger: '',
            is_bind_wechat: false,
          },
          isLoggedIn: Boolean(data.access_token),
        })
        return res
      },
      refreshAccessToken: async () => {
        const state = useUserStore.getState()
        if (!state.refresh_token) return null

        // 刷新接口显式传入当前 token，AuthAPI 不反向依赖 store。
        const { refreshTokenAPI } = await import('@/api/AuthAPI')
        const res = await refreshTokenAPI({ refresh_token: state.refresh_token }, state.token || '')
        const data = res?.data || {}
        set((prev) => ({
          token: data.access_token || prev.token,
          expires_time: data.access_expire || prev.expires_time,
          refresh_token: data.refresh_token || prev.refresh_token,
          refresh_expire: data.refresh_expire || prev.refresh_expire,
          isLoggedIn: Boolean(data.access_token || prev.token),
        }))
        return data.access_token || null
      },
      // 退出只清登录认证态；persist 会移除 localStorage.user，不影响同域名其他缓存。
      logout: () => set({ ...initialState }),
      reset: () => set({ ...initialState }),
    }),
    {
      name: USER_STORAGE_KEY,
      storage: userStorage as never,
    }
  )
)
