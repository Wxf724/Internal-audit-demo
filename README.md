## 技术栈

| 技术         | 版本 |
| ------------ | ---- |
| React        | 18   |
| TypeScript   | 5.x  |
| Vite         | 6.x  |
| Tailwind CSS | 4.x  |
| HeroUI       | 3.x  |
| React Router | 7.x  |

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器（默认 http://localhost:3000）
npm run dev

# 测试构建
npm run test

# 生产构建
npm run live

# 预览生产构建
npm run preview

# TypeScript 类型检查
npm run type-check
```

## 主题系统

项目使用 **CSS 变量 + class 级联** 实现双主题，无需 JS 运行时切换，DOM 在哪就自动用哪套：

| 页面                                                   | 主题                           | 主色      |
| ------------------------------------------------------ | ------------------------------ | --------- |
| dashboard、my-agents、agent-store、account-info、login | `:root`（蓝色默认）            | `#0F52BA` |
| conv-agent（项目看板、任务、事项等）                   | `.theme-convagent`（紫色覆盖） | `#7F22FE` |

### 新增主题

```bash
# 1. 创建变量文件
touch src/styles/themes/my-theme.css
```

```css
/* 2. 定义主题变量 */
.my-theme {
  --accent: #e11d48;
  --accent-hover: #be123c;
  --surface: #ffffff;
  --foreground: #111827;
  /* ... 覆盖其他变量 */
}
```

```css
/* 3. index.css 加一行 @import（放在 conv-agent.css 之后） */
@import './styles/themes/my-theme.css';
```

```tsx
// 4. 页面 Layout 根节点加 class 和 Context
<ThemeClassContext.Provider value="my-theme">
  <div className="my-theme">{/* 页面内容 — 自动使用新主题 */}</div>
</ThemeClassContext.Provider>
```

项目根目录的 `AGENTS.md` 包含了完整的组件使用规范和代码风格约定。如果你用的是其他 AI 工具，把 `AGENTS.md` 的内容复制一份，改成对应工具要的文件名，放在项目根目录就行：

| AI 工具     | 需要创建的文件 |
| ----------- | -------------- |
| Claude Code | `CLAUDE.md`    |
| Codex       | `AGENTS.md`    |

搞完之后，不管团队里谁用什么 AI 工具，生成的代码都会遵守同一套规范。

### Vibecoding 工作流

给产品经理或 AI 工具使用时，优先读取这些文件：

- `AGENTS.md`：强制工程规范
- `.ai/component-catalog.md`：项目组件索引
- `.ai/skills/frontend-template-vibecoding.md`：页面生成规范
- `.ai/skills/product-ui-designer.md`：产品需求转 UI 规格
- `.ai/skills/frontend-handoff-reviewer.md`：前端接手前审查

建议交付前执行：

```bash
npm run vibecoding:check
npm run type-check
npm run lint
```

`vibecoding:check` 会扫描页面代码中的常见 AI 产物问题，例如直接使用 HeroUI 同名组件、硬编码颜色、页面入口文件过长等。

## Git 分支规范

- `main` — 主分支，生产代码
