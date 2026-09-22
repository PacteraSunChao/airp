# 断言风格（行为优先）

编写或修改测试断言时遵循本页；与 Tier / case / fixture 分工见同目录其它细则。

## 原则

1. **测可观察行为与稳定契约**，不测实现细节。
2. 断言应回答「用户或下游依赖什么」，而不是「当前 markup 长什么样」。
3. Package / E2E 优先用 case / fixture 的期望字段；勿在 runner 里堆 markup 字符串。

## 宜断言

| 类别 | 示例 |
|------|------|
| 可见结果 | 文案、`<title>`、字段 label、空态提示 |
| 渲染器 UI / 路由契约 | `data-route-path`、`data-active`、`data-breadcrumb-segment`、sidebar `<details open>` |
| 结构化结果 | graph / catalog 对象字段、`label` / `navGroup`、diagnostic code |
| 顺序与包含关系 | sidebar `a[data-route-path]` 顺序、是否暴露某 `.page-container[data-route-path]` |

HTML 片段可用 DOM 解析后查询（如 happy-dom），再断言 text / attribute / 结构关系。

## 禁止（易碎）

- 依赖 **CSS class 名**（含 `toContain('class="…"')`）
- 依赖 **精确 HTML 片段与空白**（含带换行的模板字符串）
- 依赖 **SVG path 几何**（`d=`、`viewBox`、`stroke` 等绘制细节）
- 为「覆盖率」复制实现输出做全量 HTML snapshot

`className` 作为**公开 API 参数**的透传（例如 `renderIcon({ className })`）可断言；图标 glyph 本身用「可区分符号引用（`<use href>`）」表达，不钉 path。

## 与其它规范

- 分层与 owner → [`./layers.md`](./layers.md)
- Case 驱动 → [`./case-model.md`](./case-model.md)
- HTML 渲染器 icons 测试要点 → `registry://rules.renderer.rules.html-icons`
- 变更后同步流程 → `registry://skills.test-sync`
