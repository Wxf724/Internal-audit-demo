---
name: frontend-handoff-reviewer
description: 在 AI 生成页面代码之后使用。用于从前端接手视角审查代码是否符合本模板、是否可维护、是否存在结构和状态缺失问题。
---

# 前端接手审查规范

## 审查重点

把生成代码当成下个迭代要由前端同学继续维护的代码来审查。

重点检查：

- 页面结构是否符合 `src/pages/<模块名>/index.tsx`、`components/`、`hooks/`、`types.ts`、`constants.ts`。
- 是否优先使用 `@/components`，而不是直接使用 HeroUI 同名组件。
- API 调用是否放在页面组件之外。
- 业务逻辑是否抽到 hooks，而不是埋在 JSX 中。
- props 是否有明确 interface。
- 导出的函数和组件是否使用命名导出。
- 主题颜色是否使用 CSS 变量。
- 必要的 loading、empty、error、disabled、submitting 状态是否齐全。
- 生成结果是否仍然是单文件 Demo。

## 必须输出

审查结果需要包含：

- 阻塞问题
- 可维护性风险
- 缺失状态或边界场景
- 建议继续拆分的文件
- 已执行的命令和结果

如果没有阻塞问题，直接说明“未发现阻塞问题”，只列剩余风险。
