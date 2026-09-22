# Mermaid → SVG

## 结论

- validate/node：对文档全部 Mermaid 源码调用 `mermaid.parse`（不 `render`）；失败 → 校验诊断。
- renderer-target-html/node：导出期 `render` 成 SVG，再经 `renderSvgViewer`（`.svg-viewer` + pan/zoom）。
- **同一 `mermaid` 版本**锁定于 validate/node 与 html/node。
- 多图须保证 SVG 内 id 不冲突。
- 渲失败 → 渲染诊断（fail-closed）。
- 产物 **不含** Mermaid 运行时 / CDN。
- 不承诺 parse 通过后导出 100% 成功（排版、多图 id、环境仍可能在导出期失败）。
- Node/jsdom 量 htmlLabel：`<br>` / 块级标签按行拆分；宽取最长行，高按行数 × Mermaid `line-height: 1.5`（约 24px/行；与 validate/node fork 同契约）。

## 亮 / 暗色（单份 SVG）

- 导出仍只渲 **一份** SVG；渲后由 `applyMermaidThemeVars` 注入覆盖样式（`data-airp-mermaid-theme`），把节点/连线/文字等指到 `--airp-m-*`。
- `--airp-m-*` 定义在 `tokens.css` 的 `:root` / `html.dark`，跟随阅读器色板切换；禁止双份 SVG、禁止产物内嵌 Mermaid 运行时再渲。
- 作者在源码里写死的 `classDef` / `style` 色不保证跟主题；覆盖以 Mermaid 默认 class 为主（flowchart / sequence 等常用图）。

## `.svg-viewer` 外壳

顶栏 chrome（左：可选 `title` mono 文案；右：放大 / 缩小 / 复原）→ 点阵视口（pan/zoom；工具栏缩放约 180ms transform 过渡，拖拽平移即时）→ 底边拖高。

- `mermaid.title` / `architectureOverview.overview.title` 写入 chrome，不另起 `figcaption`。
- localStorage：`airp-svg-viewer:{route}:{instance}`。`instance` 在 **1.1.0** 为图块机器句柄（`mermaid.@id` 或 `architectureOverview.overview.@id`）；**1.0.0** Mermaid 无 `id`，退化为文档序 `mermaid-N`。
- markup / `data-*` / 图标见 `registry://rules.renderer.rules.html-components` 与 `registry://rules.renderer.rules.html-icons`。
