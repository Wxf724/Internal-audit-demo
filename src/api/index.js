/**
 * Axios 封装：统一 baseURL、拦截器、Token 刷新、错误 Toast、请求取消。
 * 完整使用说明见同目录 README.md。
 */
import Axios from 'axios'
import { toast } from '@heroui/react'
import { useUserStore } from '@/stores'
import { navigatePromise } from '@/router'

// ─── 不需要携带 Authorization 的接口白名单 ───────────────────────────────────
const NOT_LOGIN = [
  '/plat/saas/login',
  '/user/get_public_key',
  '/plat/trial_apply/trial',
  '/plat/trial_apply/trial_apply',
  '/plat/saas/refresh_token',
]

const axios = Axios.create({
  baseURL: '/api',
  withCredentials: true,
  timeout: 1800000,
})
let isLoggingOut = false
// access_token 提前多少秒触发刷新（提前 60s 刷新，留足网络耗时余量）
const REFRESH_ADVANCE_SECONDS = 60

/**
 * 刷新锁：并发请求同时触发刷新时，只发一次 refresh 请求，其余等待同一个 Promise。
 * - 非 null 时表示刷新中，值为刷新 Promise（resolve 出新的 access_token）
 * - 刷新完成后立即置回 null，下一轮到期时重新创建
 */
let refreshingPromise = null

// ─── Toast 防重复：同一错误只提示一次（在可见周期内） ───
const ERROR_TOAST_DURATION = 100 // 和 UI 展示时间保持一致
const errorToastMap = new Map()

function showErrorToast(msg) {
  if (!msg) return

  // 已经展示过同样的错误 → 不再提示
  if (errorToastMap.get(msg)) return

  errorToastMap.set(msg, true)

  toast.danger(msg)

  // 一段时间后允许再次提示（防止永久锁死）
  setTimeout(() => {
    errorToastMap.delete(msg)
  }, ERROR_TOAST_DURATION)
}
// ─── 请求取消：追踪所有活跃 AbortController，支持全量取消 ───
const activeControllers = new Set()

function cleanupController(config) {
  if (config?._abortController) {
    activeControllers.delete(config._abortController)
  }
}

// 统一路由跳转，避免在非组件上下文直接使用 hook
function navigateTo(path) {
  navigatePromise.then((navigate) => navigate(path))
}

function isNotLoginApi(url = '') {
  return NOT_LOGIN.some((item) => url.includes(item))
}

/**
 * 兼容秒级与毫秒级时间戳，统一转为秒。
 * 后端有时返回毫秒戳（> 1e12），有时返回秒戳，统一处理避免判断失真。
 */
function toSeconds(expire) {
  if (!expire) return null
  const n = Number(expire)
  if (!Number.isFinite(n) || n <= 0) return null
  return n > 1e12 ? Math.floor(n / 1000) : Math.floor(n)
}

/**
 * 判断 access_token 是否需要刷新。
 * 距离过期不足 REFRESH_ADVANCE_SECONDS 秒时提前刷新。
 */
function shouldRefreshToken(expiresTime) {
  const expireSec = toSeconds(expiresTime)
  if (!expireSec) return false
  const nowSec = Math.floor(Date.now() / 1000)
  return expireSec - nowSec <= REFRESH_ADVANCE_SECONDS
}

/**
 * 判断 refresh_token 自身是否已彻底过期（不可挽救，需重新登录）。
 */
function isRefreshTokenExpired(refreshExpire) {
  const expireSec = toSeconds(refreshExpire)
  if (!expireSec) return true
  const nowSec = Math.floor(Date.now() / 1000)
  return expireSec <= nowSec
}

/**
 * 强制登出并跳转登录页，统一入口。
 */
function forceLogout(msg) {
  if (isLoggingOut) return
  isLoggingOut = true
  const { logout } = useUserStore.getState()
  logout()
  showErrorToast(msg || '登录已过期')
  navigateTo('/login')
  setTimeout(() => {
    isLoggingOut = false
  }, 2000)
}

/**
 * 获取当前可用的 access_token，必要时自动刷新。
 *
 * 刷新逻辑：
 * 1. 无 token → 直接返回 null（未登录）
 * 2. token 未到刷新窗口 → 直接返回当前 token
 * 3. refresh_token 已过期 → 强制登出，返回 null
 * 4. 触发刷新 → 用锁保证并发只刷新一次；刷新成功后从 store 取最新 token 返回
 */
async function ensureValidAccessToken() {
  const { token, expires_time, refresh_token, refresh_expire, refreshAccessToken } =
    useUserStore.getState()
  // 未登录
  if (!token) return null

  // access_token 仍在有效期内
  if (!shouldRefreshToken(expires_time)) return token
  // refresh_token 已彻底过期，无法续签
  if (!refresh_token || isRefreshTokenExpired(refresh_expire)) {
    forceLogout('登录已过期，请重新登录')
    return null
  }
  // ── 以下进入刷新流程 ─────────────────────────────────────────────────────
  // 加锁：已有刷新任务时直接复用，等待刷新完成后从 store 取最新 token
  if (!refreshingPromise) {
    refreshingPromise = refreshAccessToken()
      .then(() => {
        // 刷新成功后从 store 取最新 token，而不是直接用 Promise 返回值
        return useUserStore.getState().token
      })
      .catch(() => {
        forceLogout('登录状态已过期，请重新登录')
        return null
      })
      .finally(() => {
        setTimeout(() => {
          refreshingPromise = null
        }, 0)
      })
  }

  return refreshingPromise
}

// ─── 请求拦截 ───────────────────────────────────────────────────────────────
axios.interceptors.request.use(
  async (config) => {
    // 为每个请求创建独立的 AbortController 并注册到全局 Set
    // 支持两种取消方式：
    //   1. 调用方传入自己的 signal → 桥接到内部 ctrl（单个取消）
    //   2. cancelAllRequests() → 终止 Set 内所有 ctrl（全量取消）
    const ctrl = new AbortController()
    if (config.signal) {
      if (config.signal.aborted) {
        ctrl.abort(config.signal.reason)
      } else {
        config.signal.addEventListener('abort', () => ctrl.abort(config.signal.reason), {
          once: true,
        })
      }
    }

    config.signal = ctrl.signal
    config._abortController = ctrl
    activeControllers.add(ctrl)

    if (!config.headers) {
      config.headers = {}
    }

    // 白名单接口不需要 token（登录、公钥获取、试用申请等）
    if (isNotLoginApi(config.url)) {
      return config
    }

    // 需要鉴权的接口：获取有效 token（必要时自动刷新）
    const validToken = await ensureValidAccessToken()
    if (!validToken) {
      // 未登录或 refresh 已失败：forceLogout 会带提示；此处仅补「从未带 token」的跳转
      const { token } = useUserStore.getState()
      if (!token && !isLoggingOut) {
        isLoggingOut = true
        useUserStore.getState().logout()
        navigateTo('/login')
        setTimeout(() => {
          isLoggingOut = false
        }, 2000)
      }
      return Promise.reject(new Error('No auth token'))
    }

    config.headers.Authorization = `Bearer ${validToken}`
    return config
  },
  () => Promise.reject({ msg: '请求服务出错！' })
)

// ─── 响应拦截 ───────────────────────────────────────────────────────────────
axios.interceptors.response.use(async (response) => {
  cleanupController(response.config)

  // Blob 响应：文件下载场景，若实际是 JSON 错误则提取并提示
  if (response.data instanceof Blob) {
    if (response.data.type === 'application/json') {
      try {
        const text = await response.data.text()
        const errorData = JSON.parse(text)
        if (errorData && errorData.code !== undefined && errorData.code !== 1) {
          showErrorToast(errorData.msg || errorData.message || '请求失败')
          return Promise.reject(errorData)
        }
      } catch (error) {
        console.warn('解析 Blob 响应数据失败，继续下载流程:', error)
      }
    }
    return response
  }

  // content-type 为 json 但 data 为字符串时（部分后端格式），做一次清洗再解析
  if (
    response.headers['content-type']?.includes('application/json') &&
    typeof response.data === 'string'
  ) {
    let str = response.data
    str = str.replace(/\b(?:nan|NaN)\b/g, 'null')
    response.data = JSON.parse(str)
  }

  const code = response?.data?.code
  // 兼容后端两种成功码： 1（旧约定）
  if (code !== 1) {
    code !== 4000 && showErrorToast(response?.data?.msg || response?.data?.message || '请求失败')
    return Promise.reject(response.data)
  }

  return response.data
}, errorHandler)

function errorHandler(error) {
  cleanupController(error.config)

  // 主动取消的请求（单个或全量）静默处理，不弹错误提示
  if (Axios.isCancel(error)) {
    return Promise.reject(error)
  }
  console.log('error.response', error)

  if (error.response) {
    const status = error.response.status

    if (status === 401) {
      forceLogout('登录状态已过期，请重新登录')
    } else if (status === 403) {
      showErrorToast('暂无权限访问该资源')
    } else if (status === 404) {
      showErrorToast('请求资源不存在')
    } else {
      showErrorToast('请求服务器失败')
    }
  }

  return Promise.reject(error)
}

// ─── 导出 ────────────────────────────────────────────────────────────────────

export const get = (url, params = {}, config = {}) => axios.get(url, { params, ...config })

export const post = (url, data = {}, config = {}) => axios.post(url, data, config)

export const put = (url, data = {}, config = {}) => axios.put(url, data, config)

export const del = (url, data = {}, config = {}) => axios.delete(url, { data, ...config })

/**
 * 取消所有进行中的请求
 *
 * 适用场景：路由离开、用户登出、页面销毁等需要中断全部请求的情况
 * 被取消的请求会静默失败（不弹错误 toast）
 *
 * @example
 * import { cancelAllRequests } from '@/api'
 * cancelAllRequests()
 */
export function cancelAllRequests(reason = 'cancel') {
  activeControllers.forEach((ctrl) => ctrl.abort(reason))
  activeControllers.clear()
}

export default axios
