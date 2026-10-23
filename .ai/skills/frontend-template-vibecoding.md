---
name: frontend-template-vibecoding
description: 当前端产品经理或 AI 代理基于本模板生成 React 页面时使用。用于约束页面拆分、项目组件优先级、主题变量和前端可接手的交付质量。
---

# 前端模板 Vibecoding 规范

## 目标

把产品需求提示词生成成可维护的前端工程代码，而不是一次性单文件 Demo。前端同学接手时，应能直接沿着页面、组件、hooks、类型和常量继续开发。

## 必须遵守的流程

1. 生成页面代码前，先阅读 `AGENTS.md` 和 `.ai/component-catalog.md`。
2. 明确模块名，所有页面代码放到 `src/pages/<模块名>/`。
3. 按职责拆分文件：
   - `index.tsx`：只负责页面组合和传参
   - `components/`：表格、弹窗、筛选栏、表单、工具栏、重复卡片等，一个组件一个文件
   - `hooks/useXxx.ts`：状态、副作用、请求、提交、分页、派生数据（可按照业务生成多个）
   - `types.ts`：导出的接口和联合类型
   - `constants.ts`：选项、tab、列元信息、默认筛选条件
4. 功能型控件优先复用 `@/components`；展示型 UI 可根据设计目标创建页面局部组件。
5. 颜色优先使用 CSS 变量。现有 token 不足时，应扩展主题 token 或页面级 token，不要在 JSX 中散落不可维护的硬编码色值。
6. 涉及与后端交互、接口联调、列表/详情/表单提交/状态流转等数据场景时，必须先把页面所需数据写入 `src/mocks/`，页面或 hook 通过 mock 数据完成可运行交互；后续接真实 API 时再替换数据来源。
7. 交付时必须列出变更文件，并说明每个文件的职责。

## 组件优先级与边界

以下功能型组件优先从 `@/components` 导入，尤其适用于表单、弹窗、筛选、分页、选择器、加载态等场景：

- `Button`
- `Input`
- `Textarea`
- `Modal`
- `SearchableSelect`
- `DatePicker`
- `DateRangePicker`
- `TreeSelect`
- `SliderBar`
- `Tabs`
- `Pagination`
- `Spin`
- `AiFab`

展示型 UI 不强制使用项目组件。官网导航、Hero、营销 CTA、产品卡片、客户案例、图文区块、数据展示、品牌化布局等，可以在页面模块内自定义实现，以保证设计表达和品牌质感。

允许直接从 `@heroui/react` 导入的内容：

- `toast`
- `Spinner`
- 模板暂未封装的组件，例如 table、checkbox、switch、radio、tooltip、popover、dropdown、chip、avatar、card

## UI 设计规则

- SaaS、CRM、后台、流程管理类页面应保持克制、清晰、信息密度适中。
- 运营工具不要做成营销落地页风格的大 Hero 页面。
- 操作图标和空状态图标优先使用 `lucide-react`。
- 根据流程需要补齐 loading、empty、error、disabled、submitting 状态。
- 弹窗使用 `Modal` 的 `open`、`onClose`、`title`、`children`、`footer` 三段式；右侧详情优先用 `drawer`。
- 不要在 UI 卡片里再嵌套 UI 卡片。
- 不要为了套用后台组件牺牲页面设计；工程一致性体现在目录拆分、状态管理、类型、路由和 token 管理，而不是让所有页面长成同一种控件风格。

## 主题规则

使用这类 token class：

- `bg-(--surface)`
- `bg-(--bg-soft)`
- `text-(--foreground)`
- `text-(--text-secondary)`
- `border-(--border)`
- `bg-(--accent)`
- `text-(--danger)`

如果要为具体产品新增主题，应创建 `src/styles/themes/<product>.css` 并覆盖 CSS 变量。不要把产品配色直接写进页面 JSX。

现有 `--accent`、`--success`、`--danger`、`--warning`、`--info` 主要服务操作、状态、表单反馈和系统提示，不应限制完整视觉表达。设计需要新的品牌色、背景色、材质色、图表色、装饰色或页面专属色时，可以新增语义明确的 token，例如：

- `--brand-primary`
- `--brand-secondary`
- `--brand-ink`
- `--brand-muted`
- `--hero-overlay`
- `--section-warm`
- `--surface-elevated`
- `--card-tint`
- `--industry-blue`
- `--factory-steel`
- `--highlight-gold`

新增 token 后，页面通过 CSS 变量使用它们。禁止的是无组织、不可维护、散落在 JSX className 里的硬编码颜色。

## 交付检查清单

交付前尽量执行：

- `npm run type-check`
- `npm run lint`
- `npm run vibecoding:check`

同时确认：

- 没有从 `@heroui/react` 导入模板已经封装过的同名组件。
- 功能型组件优先复用 `@/components`，展示型组件按设计目标自定义且文件拆分清晰。
- 页面已经拆分，`index.tsx` 没有承载复杂业务逻辑。
- 页面 JSX 中没有大量散落的硬编码颜色；新增颜色已沉淀为主题 token 或页面级 token。
- 涉及后端交互的数据已放在 `src/mocks/`，没有把 mock 数据散落在页面 JSX 或组件内部。
