# `src/api/index.js` 使用说明

本文件封装 Axios 实例、请求/响应拦截器，并导出统一的 `get` / `post` / `put` / `del` 与 `cancelAllRequests`。业务模块里的 `*API.js` 应**只从这里**引入 HTTP 方法（与项目约定一致）。

---

## 基础用法

`baseURL` 为 `/api`，请求路径写相对路径即可（不要重复写 `/api` 前缀）。

```js
import { get, post, put, del } from './index.js'

// GET  /api/foo/bar?page=1
await get('/foo/bar', { page: 1 })

// POST /api/foo/bar  body: JSON
await post('/foo/bar', { name: 'x' })

// PUT / DELETE 同理
await put('/foo/bar/1', { name: 'y' })
await del('/foo/bar/1', { id: 1 }) // delete 的 body 在第三个参数里
```

第三个参数可传 **Axios 原生 config**（如 `signal`、`headers`、`timeout` 等）。

---

## 响应数据形态（重要）

响应拦截器在**成功**时会 **`return response.data`**，因此：

- `await get(...)` / `await post(...)` 拿到的就是后端 JSON 根对象，例如 `{ code, data, message }`，**不是** Axios 的 `response` 包装对象。

业务码约定（与拦截器一致）：

- `code === 200`：视为成功，返回该对象。
- 其他 `code`：会弹出错误 Toast（见下文「错误 Toast 防刷」），并 **`Promise.reject`**，业务侧用 `try/catch` 即可。

---

## 登录开关 `VITE_OPEN_LOGIN`

- 为 **0 / 未开启**：请求拦截**不**校验 token、不挂 `Authorization`。
- 为 **非 0**：除白名单接口外，请求会带上 `Bearer ${token}`，并在 access 将过期时尝试刷新（见「Token」）。

---

## Token 与刷新

- 从 `useUserStore` 读取 `token`、`expires_time`、`refresh_token`、`refresh_expire`。
- 当 `expires_time` 距离当前时间不足 **60 秒**（`REFRESH_ADVANCE_SECONDS`）时，发请求前会调用 store 的 `refreshAccessToken()`；**并发**多个请求时**只刷新一次**（共享同一个 `refreshPromise`）。
- 若 refresh 已过期或不存在，会登出并提示跳转登录。

---

## 免登录白名单 `NOT_LOGIN`

路径 **包含** 白名单中的片段时，不带 `Authorization`（例如登录接口）。
若新增「无需 token」的接口，需在 `NOT_LOGIN` 中补充路径片段。

---

## 错误 Toast 防刷

短时间内多个请求失败时，**约 300ms 内**只弹 **一次** `toast.danger`，避免一屏刷屏。

---

## 取消请求

### 1. 取消单个请求

传入 `AbortController` 的 `signal`（与 `fetch` 用法一致）：

```js
import { get } from './index.js'

const ctrl = new AbortController()
get('/some/list', {}, { signal: ctrl.signal })

// 需要取消时
ctrl.abort()
```

被取消的请求**不会**弹出错误 Toast；`Promise` 会 `reject`，可用 `Axios.isCancel(error)` 判断。

### 2. 取消当前所有进行中的请求

在路由离开、登出、组件卸载等场景：

```js
import { cancelAllRequests } from './index.js'

cancelAllRequests('user navigated away')
```

---

## 默认导出 `axios`

```js
import axios from './index.js'
```

如需使用 Axios 原生能力（如 `axios.isCancel`），可从本文件导入；业务请求仍建议优先用封装的 `get/post/put/del`。

---

## HTTP 错误与 401

- **401**：清登录态、提示并跳转 `/login`。
- **403 / 404 / 5xx** 等：按拦截器内逻辑提示（部分会跳转）。

---

## 与 `*API.js` 的关系

各模块 `*API.js` 应 `import { get, post } from './index.js'`（或 `@/api` 别名），**不要**再新建独立 Axios 实例，以便统一走拦截器、Token、Toast 与取消逻辑。
