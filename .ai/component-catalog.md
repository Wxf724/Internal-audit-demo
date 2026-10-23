# 组件索引

生成页面时，优先复用 `@/components` 中已经封装成熟、且适合当前场景的项目组件，再考虑底层 UI 组件或页面局部自定义组件。

组件复用是为了提升一致性和交付效率，不应牺牲页面表现力。功能型控件优先使用项目组件；展示型 UI 可根据设计目标自定义实现。

## 项目组件

以下组件主要适用于表单、弹窗、分页、选择、加载、树形结构等功能场景。若当前页面需要品牌化展示、营销叙事、复杂 Hero、产品卡片、案例模块、导航、图文区块、数据展示等视觉表达，可以在页面模块内自定义轻量组件或局部组件。

| 组件 | 导入方式 | 说明 |
| --- | --- | --- |
| `Button` | `@/components` | 使用 `type`、`onClick`、`loading`、`disabled`；不要使用 HeroUI 的 `variant`、`onPress`、`isLoading`、`isDisabled`。 |
| `Input` | `@/components` | `onChange` 接收字符串，不接收 event。搜索输入使用 `search`。 |
| `Textarea` | `@/components` | `onChange` 接收字符串，不接收 event。 |
| `Modal` | `@/components` | 使用 `open`、`onClose`、`title`、`children`、`footer`；右侧面板使用 `drawer`。 |
| `SearchableSelect` | `@/components` | 首选选择器组件，支持搜索选择。 |
| `DatePicker` | `@/components` | 首选日期选择组件。 |
| `DateRangePicker` | `@/components` | 首选日期范围选择组件。 |
| `TreeSelect` | `@/components` | 首选层级选择组件。 |
| `Tree` | `@/components` | 首选树形展示和控制组件。 |
| `SliderBar` | `@/components` | 首选滑块和进度控制组件。 |
| `Tabs` | `@/components` | 首选选项卡组件。 |
| `Pagination` | `@/components` | 首选分页组件。 |
| `Spin` | `@/components` | 项目加载指示器。 |
| `AiFab` | `@/components` | AI 悬浮入口。 |

## 允许使用 HeroUI 的场景

只有模板未封装的组件才从 `@heroui/react` 导入，例如：

- `toast`
- `Spinner`
- table primitives
- checkbox、radio、switch
- chip、avatar、tooltip、popover、dropdown
- 确实需要 card primitive 且项目没有封装时，可使用 card

## 展示型 UI 自定义原则

- 官网导航、Hero、营销按钮、产品展示卡、客户案例、图文区块、品牌化数据模块等，可按页面视觉目标自定义。
- 自定义展示组件应放在当前页面模块的 `components/` 下，保持 props 清晰、样式集中、可维护。
- 不要为了复用 `@/components` 把展示型页面做成后台表单或管理台风格。
- 禁止的是用 HeroUI 直接替代项目中已经封装且适合当前场景的功能组件；不是禁止页面级视觉创新。

## 本地参考资料

每个组件都有本地文档和示例：

- `src/components/<component>/README.md`
- `src/components/<component>/demo.tsx`

不确定 props 时，先阅读组件源码。
