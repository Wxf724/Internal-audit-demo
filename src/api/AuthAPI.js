import { post } from './index.js'

/**
 * 登录
 * 功能描述：用户名密码登录并返回 token 及用户信息
 * 入参：{ username, password }
 * 返回参数：{ code, data: { access_token, refresh_token, access_expire, refresh_expire, ... }, message }
 * url地址: /api/plat/saas/login
 * 请求方式: POST
 */
export function loginAPI(params = {}) {
  return post('/plat/saas/login', params)
}

/**
 * 刷新 token
 * 功能描述：根据 refresh_token 续签 access_token
 * 入参：{ refresh_token }
 * 返回参数：{ code, data: { access_token, access_expire }, message }
 * url地址: /api/plat/saas/refresh_token
 * 请求方式: POST
 * 注意：该接口在白名单中，拦截器不会自动注入 token；
 *       此处手动从 store 取当前 access_token 注入 Authorization header。
 */
// token 由 store 显式传入，避免 AuthAPI 反向依赖 store 造成循环依赖。
export function refreshTokenAPI(params = {}, token = '') {
  return post('/plat/saas/refresh_token', params, {
    headers: {
      Authorization: `Bearer ${token || ''}`,
    },
  })
}

/**
 * 申请免费试用接口
 * 功能描述：提交企业联系人信息，申请免费试用
 * 入参：{ company_name, contact_name, phone, email, intent_content, usage_scenario }
 * 返回参数：{ code, data: { msg }, message }
 * url地址: /api/plat/trial_apply/trial
 * 请求方式: POST
 */
export function applyTrialAPI(params = {}) {
  return post('/plat/trial_apply/trial', params)
}

/**
 * 申请免费试用接口（trial_apply 路径版本）
 * 功能描述：提交企业联系人信息，申请免费试用
 * 入参：{ company_name, contact_name, phone, email, intent_content, usage_scenario }
 * 返回参数：{ code, data: { msg }, message }
 * url地址: /api/plat/trial_apply/trial_apply
 * 请求方式: POST
 */
export function applyTrialApplyAPI(params = {}) {
  return post('/plat/trial_apply/trial_apply', params)
}

/**
 * 登录获取公钥接口
 * 功能描述：登录获取公钥
 * 入参：无
 * 返回参数：{ code, data: { public_key }, message }
 * url地址: /api/user/get_public_key
 * 请求方式: POST
 */
export function getPublicKey(data) {
  return post('/user/get_public_key', data || {})
}
