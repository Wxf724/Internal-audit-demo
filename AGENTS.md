# 内控检查管理系统前端开发规范

本文件用于约束央国企内控检查管理系统前端开发、页面调整、组件复用和交付检查。开发前应先了解现有目录、路由、组件和页面实现，优先沿用项目已有模式，避免另起一套风格。
前端模板目录：D:\飞书\agent\前端模板\vibe-code-main
默认使用skill：/[$ui-ux-pro-max](C:\\Users\\86153\\.codex\\skills\\ui-ux-pro-max\\SKILL.md) 
## 项目定位

本系统面向央国企内控监督、检查执行、问题整改和报告归档场景，前端应体现专业、克制、清晰、可追溯的业务系统特征。

页面设计应围绕以下主链路展开：

```text
计划立项 -> 任务派发 -> 数据采集 -> 标准规则 -> 审查复核 -> 取证底稿 -> 问题台账 -> 整改闭环 -> 报告归档 -> 监督看板
```

内控业务页面应突出流程状态、责任主体、依据来源、复核意见、整改期限、佐证材料和报送归档结果。避免营销化表达、过度装饰和与业务无关的说明文字。

## 开发前检查

每次进行页面生成、样式调整、组件开发、重构或修复前，应先查看以下资料：

- 当前涉及页面、组件、样式和数据文件
- 项目组件目录及组件说明
- 当前模块的路由配置、类型定义、常量和样式文件
- 相关业务需求、流程说明和验收口径

设计和开发应以现有工程结构、组件体系和业务流程为准，避免引入与当前系统风格不一致的实现。

## 项目概况

- 项目类型：Vite + React + TypeScript 前端项目
- 包管理：当前仓库已有 `package-lock.json`，默认使用 `npm`
- 路径别名：`@/*` 指向 `src/*`
- 应用入口：`src/main.tsx`
- 路由配置：`src/router/config.tsx`
- 公共组件聚合导出：`src/components/index.ts`
- 全局样式：`src/styles/index.css`
- 主题变量：`src/styles/themes/default.css`、`src/styles/themes/conv-agent.css`

## 前端模板基线

本项目以前端模板 `D:\飞书\agent\前端模板\vibe-code-main` 为工程基线。页面开发、组件复用、主题接入、路由组织和质量检查应与该模板保持一致。

模板基线包含以下约束：

- 使用 Vite、React、TypeScript、React Router、Tailwind CSS 和 CSS 变量主题体系。
- `src/router/config.tsx` 统一维护路由，页面入口使用 `lazy` 加载。
- `src/components/index.ts` 统一导出公共组件，业务页面优先从 `@/components` 引入。
- `src/api/index.js` 统一封装请求、鉴权、错误处理和取消请求。
- `src/stores/` 统一放置全局状态。
- `src/styles/index.css` 统一引入主题变量和全局样式。
- `src/styles/themes/default.css` 为默认主题变量，`src/styles/themes/conv-agent.css` 为独立主题变量。
- `eslint-rules/route-element-jsx.js` 用于约束路由 `element` 必须使用 JSX。

除非确有业务必要，不应绕过上述模板结构新增平行体系。

## 目录结构基线

```text
src/
├── api/                 # 请求封装与业务接口
├── assets/              # 静态资源
├── components/          # 公共组件库，统一从 @/components 引入
├── i18n/                # 国际化
├── pages/               # 页面模块
├── router/              # React Router 配置
├── stores/              # zustand 状态
├── styles/              # 全局样式与主题变量
└── utils/               # 通用工具
```

新增业务页面应放在 `src/pages/<模块名>/` 下。复杂页面应在模块内继续拆分 `components/`、`hooks/`、`types.ts`、`constants.ts`。

## 技术栈

以 `package.json` 为准，当前主要技术栈如下：

| 类别 | 技术/依赖 | 用途 |
| ---- | ---- | ---- |
| 构建工具 | `vite`、`@vitejs/plugin-react-swc` | 开发服务器、构建、React SWC 编译 |
| 前端框架 | `react`、`react-dom` | React 应用运行时 |
| 语言 | `typescript` | 类型系统与类型检查 |
| 路由 | `react-router-dom` | 页面路由与导航 |
| 样式 | `tailwindcss`、`@tailwindcss/vite`、`postcss`、`autoprefixer` | Tailwind CSS、CSS 变量主题、样式构建 |
| UI 底座 | `@heroui/react` | 底层 UI primitives，业务优先使用 `@/components` 封装 |
| 项目组件 | `src/components/*` | `Button`、`Input`、`Modal`、`Tabs`、`TreeSelect` 等统一组件 |
| 图表 | `echarts`、`echarts-for-react`、`recharts` | 趋势图、分布图、风险看板等数据可视化 |
| 状态管理 | `zustand` | 全局状态、用户态、UI 状态 |
| 网络请求 | `axios` | `src/api/index.js` 统一请求封装 |
| 动效 | `framer-motion` | 复杂交互或页面动效 |
| 图标 | `lucide-react` | 操作图标、状态图标、页面图标 |
| 国际化 | `i18next`、`react-i18next`、`i18next-browser-languagedetector` | 多语言与语言检测 |
| 日期时间 | `dayjs` | 日期格式化和时间处理 |
| 表格/文件 | `xlsx` | Excel 读写 |
| 富文本/Markdown | `marked` | Markdown 渲染 |
| 拖拽排序 | `@dnd-kit/core`、`@dnd-kit/sortable`、`@dnd-kit/utilities` | 拖拽和排序交互 |
| 工具库 | `copy-to-clipboard`、`uuid`、`pinyin-pro`、`jsencrypt` | 复制、ID、拼音、加密等工具能力 |
| 工程质量 | `eslint`、`typescript-eslint`、`prettier`、`unplugin-auto-import` | Lint、格式化、自动导入类型 |

## 业务表达原则

用户可见文案应符合央国企内控检查业务语境。

推荐使用：

- 检查计划、专项检查、临时检查、任务派发
- 数据需求、采集结果包、质量校验、字段映射
- 检查要点、检查标准、规则配置、抽样规则、评分标准
- 审查线索、人工复核、取证单、检查底稿
- 问题台账、问题定级、整改派单、整改佐证、复核销号
- 报告编制、报告审核、报送台账、归档调阅
- 风险预警、整改闭环率、超期整改、回访评估

避免在业务页面出现：

- 技术实现说明、开发阶段说明、占位说明
- 过度口语化的操作提示
- 与真实业务无关的示例边界说明
- 营销化、概念化、夸张化表达

按钮应使用清晰动作词，例如：

- `提交审核`
- `任务派发`
- `生成底稿`
- `登记问题`
- `提交整改`
- `复核销号`
- `确认归档`

页面标题和说明应简短，重点说明当前页面的业务职责，不描述页面如何操作。

## 页面设计规则

央国企内控系统属于流程管理和监督管理类系统，应优先采用以下结构：

- 筛选栏 + 表格/列表 + 详情区
- 左侧对象列表 + 中间业务详情 + 右侧状态/指标
- 流程节点 + 复核记录 + 关联材料
- 指标摘要 + 明细台账

设计要求：

- 信息密度适中，便于扫读和连续操作。
- 卡片仅用于摘要指标、重复实体、弹窗和确实需要框定的工具区域。
- 不要在卡片中继续嵌套卡片。
- 不要使用营销落地页式 Hero、大面积装饰背景或与业务无关的视觉元素。
- 表格、列表、按钮、状态标签应保持稳定尺寸，避免 hover、loading 或长文本导致布局跳动。
- 文本不得溢出按钮、表格单元格、卡片和弹窗；必要时使用换行、截断或响应式布局。
- 状态表达不能只依赖颜色，应同时提供状态文字。
- 移动端或窄屏应有明确的纵向堆叠顺序。

## 文件拆分

禁止把复杂业务都写在一个文件中。新功能按职责拆分：

- `index.tsx`：页面入口，只负责组合布局和传参。
- `components/`：表格、弹窗、筛选栏、表单、工具栏、重复卡片等局部组件。
- `hooks/useXxx.ts`：状态、副作用、请求、提交、分页、派生数据。
- `types.ts`：页面私有类型和导出接口。
- `constants.ts`：选项、页签、列信息、默认筛选条件。

页面超过 500 行时，应优先拆分局部组件、hooks、类型和常量。已有历史页面如体量过大，后续迭代应逐步收敛。

## 组件使用规范

功能型控件优先从 `@/components` 导入，禁止直接使用 HeroUI 中已被项目封装的同名基础组件。

```tsx
import { Button, Input, Modal, Textarea } from '@/components'
```

| 组件 | 约定 |
| ---- | ---- |
| `Button` | 使用 `type`，不要使用 HeroUI `variant`；使用 `onClick`，不要使用 `onPress`；支持 `loading`、`disabled` |
| `Input` | `onChange` 参数是 `string`，搜索框使用 `search` |
| `Textarea` | `onChange` 参数是 `string` |
| `Modal` | 使用 `open`、`onClose`、`title`、`children`、`footer`；右侧详情可使用 `drawer` |
| `SearchableSelect`、`DatePicker`、`DateRangePicker`、`TreeSelect`、`SliderBar`、`Tabs`、`Pagination`、`Spin`、`Tree` | 直接从 `@/components` 引入 |

允许从 `@heroui/react` 使用模板未封装的能力，例如 `toast`、`Spinner`、tooltip、popover、dropdown、avatar 等。

文件上传可使用原生 `<input type="file">`。

组件 API 以各组件目录下的 `README.md` 和源码为准。新增组件应同步聚合导出，并补充必要说明。

当前模板组件基线：

| 组件目录 | 用途 |
| ---- | ---- |
| `button` | 统一按钮 |
| `input` | 文本输入、搜索输入 |
| `textarea` | 多行文本 |
| `modal` | 弹窗、抽屉式详情 |
| `tabs` | 页签切换 |
| `pagination` | 分页 |
| `date-picker` | 日期选择 |
| `date-range-picker` | 日期范围选择 |
| `searchable-select` | 可检索选择器 |
| `tree-select` | 层级选择 |
| `tree` | 树形结构 |
| `slider-bar` | 滑块、比例控制 |
| `spin` | 加载状态 |

业务展示组件可在页面模块内自定义，但表单、弹窗、筛选、分页、选择器和加载状态应优先复用公共组件。

## 主题与颜色

项目使用 CSS 变量 + class 级联实现主题：

- 默认主题：`:root`
- 独立主题：`.theme-convagent`
- 全局样式入口：`src/styles/index.css`

业务 UI 中应优先使用 CSS 变量：

| 用途 | 变量 |
| ---- | ---- |
| 主文字 | `--foreground` |
| 次要文字 | `--text-secondary` |
| 三级文字 | `--text-tertiary` |
| 卡片/弹窗底色 | `--surface` |
| 浅背景 | `--bg-soft` |
| hover 背景 | `--bg-hover` |
| 边框 | `--border`、`--border-light` |
| 主题色 | `--accent`、`--accent-hover`、`--accent-soft`、`--accent-light`、`--accent-strong`、`--focus-ring` |
| 语义色 | `--success`、`--danger`、`--warning`、`--info` |

推荐写法：

```tsx
<div className="bg-(--surface) text-(--foreground) border border-(--border)" />
<Button className="bg-(--accent) hover:bg-(--accent-hover)">保存</Button>
```

如现有变量无法覆盖业务视觉，可新增语义明确的页面级或主题级变量，避免在 JSX 中散落难维护的颜色值。

新增主题时应遵循模板接入方式：

1. 在 `src/styles/themes/` 新增主题变量文件。
2. 在 `src/styles/index.css` 中引入主题文件。
3. 在页面或布局根节点添加主题 class。
4. 如弹窗通过 Portal 渲染，应确保主题 class 可传递到弹窗内容。

示例：

```css
.internal-control-theme {
  --accent: #0f52ba;
  --accent-hover: #0b469f;
  --surface: #ffffff;
  --foreground: #172033;
}
```

```tsx
<ThemeClassContext.Provider value="internal-control-theme">
  <div className="internal-control-theme">{children}</div>
</ThemeClassContext.Provider>
```

## 路由规范

路由集中在 `src/router/config.tsx`：

- 页面组件使用 `lazy(() => import(...))`。
- `RouteObject` 的 `element` 必须写 JSX，例如 `{ path: '/login', element: <Login /> }`。
- 新页面应补充路由并确认本地路由规则通过。
- 页面目录默认导出当前路由入口组件，以匹配现有 lazy import 写法。

## API 调用

`src/api/index.js` 已封装 Axios 实例、拦截器、Token 刷新、错误 Toast 和取消请求。

- 业务 API 文件只从 `src/api/index.js` 或 `@/api` 引入 `get`、`post`、`put`、`del`。
- 请求路径不要重复加 `/api` 前缀，封装内已有 `baseURL: '/api'`。
- 成功响应已经返回 `response.data`，业务侧拿到的是后端 JSON 根对象。
- 异步 UI 操作使用 `try/catch/finally`，loading 必须在 `finally` 恢复。
- 需要取消请求时使用 `AbortController` 或 `cancelAllRequests`，不要另建 Axios 实例。

## 状态与副作用

- 全局状态使用 `zustand`，放在 `src/stores/`。
- 页面内部状态优先放页面组件或页面 hook；共享后再提升到 store。
- 请求、表单提交、批量操作等副作用集中在 hook 或清晰命名的 handler 中。
- 复杂页面优先抽 `useXxxPage`，让页面入口负责组装布局。

## 命名约定

| 类别 | 规则 | 示例 |
| ---- | ---- | ---- |
| 组件 | PascalCase，尽量带模块语义 | `TaskTable`、`IssueDrawer` |
| Props 接口 | 组件名 + `Props` | `TaskTableProps` |
| 事件处理 | `handle` + 动作 | `handleSave`、`handleDelete` |
| 回调 prop | `on` + 事件 | `onClose`、`onSaved` |
| 状态 setter | `set` + 变量名 | `setSaving`、`setForm` |
| Hook | `use` 开头 | `usePlanWorkbench` |
| API 函数 | 动词 + 资源 | `getIssueList`、`postRectification` |
| 类型/接口 | PascalCase | `IssueRecord` |
| 常量 | UPPER_SNAKE_CASE | `ISSUE_LEVEL_OPTIONS` |
| 工具函数 | camelCase | `normalizeOptions` |

代码风格：

- 优先使用命名导出；路由页面入口可保留默认导出。
- 接口使用 `interface`，联合类型使用 `type`。
- 类型导入使用 `import type`。
- 导出函数和关键接口可加简短注释，避免无意义注释。

## Import 顺序

组间空行分隔：

```text
1. React
2. 第三方库
3. @/ 别名导入，按 api -> components -> pages -> stores -> utils 大致排序
4. 类型导入
5. 相对路径
```

示例：

```tsx
import { useMemo } from 'react'
import { toast } from '@heroui/react'

import { getIssueList } from '@/api/issueApi'
import { Button, Input } from '@/components'
import { useUserStore } from '@/stores'

import type { IssueRecord } from './types'
import { ISSUE_LEVEL_OPTIONS } from './constants'
```

## i18n

仓库已有 `src/i18n/` 与 `react-i18next`。新增用户可见文案时，先查看现有页面做法；如果所在模块已有国际化结构，按现有 key 组织补充，不要混用多套方案。

## 常用命令

```bash
npm run dev
npm run build
npm run test
npm run live
npm run preview
npm run type-check
npm run lint
npm run format:check
```

交付前根据改动范围优先执行：

```bash
npm run type-check
npm run lint
npm run build
```

如只改文档，可说明未运行构建类命令。

## 质量检查

完成代码变更后应检查：

- 页面是否符合内控业务主链路和术语体系。
- 用户可见文案是否专业、简洁、无开发阶段说明。
- 是否优先使用 `@/components`。
- 是否存在可拆分的大文件、大组件。
- 是否有必要的 loading、empty、error、disabled、submitting 状态。
- 是否存在无关路由、未使用入口或无效占位页面。
- 是否存在无法维护的硬编码颜色、尺寸和内联样式。
- 表格、列表、弹窗、按钮在窄屏下是否可用。

若命令因环境、依赖或权限失败，应在交付说明中写清楚失败命令和原因。

## Git 与工作区

- 不要回滚他人已有改动。
- 不要运行破坏性命令，例如 `git reset --hard`、`git checkout --`、未确认的批量删除。
- 修改前先查看相关文件，修改后用 `git diff` 或等价方式自查。
- 只改与任务相关的文件，避免格式化整个仓库造成无关噪音。

## 业务数据一致性与状态闭环

内控检查系统的同一业务对象必须使用唯一编号和唯一状态来源，禁止在不同页面重新维护一份同名但无关联的模拟数据。

- 计划、任务、数据需求、数据包、审查线索、取证单、审查记录、问题、整改、报告、审批实例分别使用稳定 ID，并通过关联 ID 串联。
- 页面跳转必须携带当前业务对象 ID；详情页不得因缺少参数回落到默认对象，导致“点击查看”与展示内容不一致。
- 状态只可由上游业务动作推进：审查线索 -> 审查记录 -> 问题草稿 -> 问题确认 -> 整改中 -> 已整改 -> 报告 -> 归档。
- 同一状态变更必须回写所有关联视图，包括列表、详情、首页待办、审核中心和监督看板。
- AI 或规则输出仅能创建审查线索/问题草稿；不能绕过人工复核、底稿和问题确认直接进入整改或报告。
- 生成、派发、提交复核、通过、退回、归档等按钮必须有明确的状态变更、关联对象更新和下一步入口；禁止只显示提示而不更新业务数据。
- 需要演示数据时，优先在模块级共享 store 或统一数据源中维护，再由页面派生展示；禁止在页面组件内重复创建同一业务对象的平行数组。