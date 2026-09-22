# HTML 渲染器样式（html-styles）

`packages/renderer-target-html/src/styles/` 与 emit 中 Tailwind/`style` 的终态约定。

## 结论

1. **外观写在 emit**：读者可见节点的版式用**完整** Tailwind utility 字符串（构建期 `@source` 扫描 `src/**/*.ts` 打进产物）。主题色/面用 `style="… var(--…) …"`，不用语义皮 class 二次映射。
2. **Elevation**：正文流内积木与壳层按钮**无** `box-shadow` elevation（靠 `border` + `--bg-surface` / `--bg-subtle`）；浮层（真源参考菜单、本页目录面板、宿主导出菜单、toast）统一 `box-shadow: var(--shadow-float)`。浮层开合动效用 `.airp-float-panel`（160ms opacity + `translateX(6px) scale(0.98)`，与 TOC 面板同式）。禁止 Tailwind `shadow-*` 与第二套阴影 token。
3. **全局 CSS 仅保留**：CSS 变量（`:root` / `html.dark`）、base 层默认 `border-color: var(--border-color)`（Tailwind v4 裸 `border`/`divide` 只设宽度，否则继承正文色）、`body` 底色与抗锯齿、`.status-badge` 色表、`.svg-viewer` 交互壳、Shiki 亮暗切换、图标雪碧图隐藏、本页目录（`.page-toc*` 锚点切换动画与细滚动条）、`.airp-float-panel`。禁止 Basecoat；禁止为积木另起语义皮 class 或组件 CSS 表。本页目录版式以 emit 上 Tailwind utility 为主，状态切换动画落在全局 CSS。
4. **暗色变体**：`input.css` 须声明 `@custom-variant dark (&:where(.dark, .dark *))`，使 Tailwind `dark:` 跟随 `html.dark`（与色板切换脚本一致），禁止依赖 `prefers-color-scheme`。
5. **离线**：`tsdown` + PostCSS 将 CSS `?inline` 进 `dist`；组装进单文件 HTML。禁止 CDN、外链字体、运行时拉样式。
6. **VS Code / Cursor webview**：宿主 `#_defaultStyles`（`@layer vscode-default`）会给 `body` 加左右 padding、改裸 `code` 灰底与字色等。由 **`apps/renderer-vscode`** 经 `extraHead`（错误壳同式）注入**无层**重置并移除 `#_defaultStyles`；**勿**写进 HTML target `tokens.css` / `input.css`。重置用阅读器 token（如 `--bg-page`）；不对 `img`/`video` 做无层 `max-size: revert`。

## Token（亮 / 暗）

| 变量 | 亮 | 暗 |
|------|----|----|
| `--bg-page` | `#f8fafc` | `#0b0f17` |
| `--bg-surface` | `#ffffff` | `#111827` |
| `--bg-subtle` | `#f1f5f9` | `#1a2234` |
| `--border-color` | `oklch(92.9% 0.013 255.508)`（= slate-200） | `oklch(37.2% 0.044 257.287)`（= slate-700） |
| `--border-subtle` | `#edf2f7` | `#1e293b` |
| `--text-main` | `#0f172a` | `#f1f5f9` |
| `--text-secondary` | `#475569` | `#94a3b8` |
| `--text-muted` | `#94a3b8` | `#64748b` |
| `--code-bg` / `--code-border` | page / border-color 同系 | 暗面同系 |
| `--shadow-float` | 浮层阴影（菜单 / 本页目录 / toast） | 暗面浮层阴影 |
| `--airp-m-text` / `--airp-m-line` | 跟 `--text-main` / `--text-secondary` | 同 |
| `--airp-m-node-bg` / `--airp-m-node-border` / `--airp-m-on-node` | 天蓝节点系 | 暗面天蓝节点系 |
| `--airp-m-cluster-*` / `--airp-m-label-bg` / `--airp-m-note-*` / `--airp-m-activation-*` / `--airp-m-error` | Mermaid 簇/边标/注释/激活/错误 | 暗面同角色 |

Mermaid 单份 SVG：导出后注入 `var(--airp-m-*)` 覆盖样式；见 `registry://rules.renderer.rules.mermaid-svg`。

品牌点缀用 Tailwind `sky-*` utility（须成对写 `dark:`）；成功/警告/危险等用定稿同款 utility 或 `.status-badge` 色表。彩色边框须写显式 utility（如 `border-sky-200 dark:border-sky-800`）。中性面/边/字优先 `style` + token，避免裸 `bg-white` / `border-slate-200` / `text-slate-*` 无暗色。

## 工程管线

| 项 | 约定 |
|----|------|
| 入口 | `src/styles/input.css` |
| 构建 | `postcss-import` → `@tailwindcss/postcss` → `cssnano` |
| 组装 | `import htmlStyles from "./styles/input.css?inline"` |
| 扫描 | `@source "../**/*.ts"` |
| emit class | 静态完整 utility；禁止 `p-${n}` 这类拼不出完整名的动态 class |

## 维护

改管线、token 或 webview 宿主重置边界时同步本文与实现。积木外观变更改 emit 中的 class/`style`，不新增语义皮 CSS。
