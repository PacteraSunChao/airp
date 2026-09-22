# Renderer 规范（SSOT）

`packages/renderer-contract`、`packages/renderer-shared`、`packages/renderer-target-*`、`packages/renderer` 实现层约定（封闭 `rendererTargetCatalog` 内建于 `renderer`；无独立组装包）。细则在 [`rules/`](./rules/)；**协议数据**仍遵循 `registry://rules.protocol`。包边界与 platform 见 `registry://rules.package-boundaries`。

## 规则

| 域 | 何时读 | 文档 |
|----|--------|------|
| 缺物件硬失败 | 改渲染缺物件策略、`AirpDiagnosticError` 冒泡 | [`rules/missing-object-hard-fail.md`](./rules/missing-object-hard-fail.md) |
| 语言敲定（locale） | 改文档 locale 推导、LocalizedString 折叠 | [`rules/locale-format.md`](./rules/locale-format.md) |
| 目标渲染器配置 | 改 `targetOptions`、pipeline 透传 | [`rules/target-options.md`](./rules/target-options.md) |
| HTML 积木 / 组件钩子 | 改 `data-*`、client 选择器、壳层 DOM | [`rules/html-components.md`](./rules/html-components.md) |
| HTML 样式工程 | 改构建管线、token、离线内联、webview 宿主无层重置边界 | [`rules/html-styles.md`](./rules/html-styles.md) |
| HTML UI 文案 | 新增/修改 html-locale key | [`rules/html-locale.md`](./rules/html-locale.md) |
| HTML 图标 | 新增/修改 icon / `renderIcon()` | [`rules/html-icons.md`](./rules/html-icons.md) |
| Mermaid → SVG | 改 Node 导出面画图、`svg-viewer`、多图 id | [`rules/mermaid-svg.md`](./rules/mermaid-svg.md) |

## 核心原则

1. **离线单文件**：产物 CSS/JS/图标雪碧图内联；禁止 CDN、外链字体、外链图标运行时、Basecoat。
2. **读者可见 markup**：emit 直接写出 **Tailwind utility `class`**；主题表面用 **`style` + CSS 变量**（`--bg-page` / `--bg-surface` / `--bg-subtle` / `--border-color` / `--border-subtle` / `--text-main` / `--text-secondary` / `--text-muted` / `--shadow-float` 等）。禁止语义皮 class 经第二套 CSS 翻译外观。正文流无 elevation；浮层统一 `--shadow-float`。
3. **壳层结构**：`body` → sticky 顶栏 → `main`（正文 `article`）→ 可选本页目录 `nav[data-page-toc]` → 页脚。
4. **语言敲定**：由文档字段推导（1.1.0：`i18n.locale`；1.0.0：`i18n.defaultLocale`）；渲染期写入产物；换语言 = 改文档后重新 export/watch。
5. **缺物件硬失败**：渲染所需物件缺失 → `ok: false`（见 `missing-object-hard-fail`）。
6. **图**：JSON 存 Mermaid；Node 导出期渲 SVG，再包进 `svg-viewer`；产物不含 Mermaid 运行时；多图隔离 SVG 内 id；失败 fail-closed。
7. **代码着色**：Shiki SSR；未知语言降级 `text`；不改协议 `language` schema。
8. **读者面不外露协议枚举**：不输出 `meta.kind`、积木 `type` 名；`importance` 不驱动样式、不打印。
9. **图片 / embed**：URL 外联；embed 为可点外链。
10. **`agentNote`**：仅 `visible === true` 输出。
11. **Markdown**：降级可读，不对等 HTML。
12. **无兼容层**：禁止硬编码壳 UI 文案；禁止把 html-locale 写入 `*.airp.json`；禁止双轨外观实现。

## 维护

策略变更只改对应 `rules/*`；禁止在索引页复制长文。
