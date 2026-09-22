# HTML 渲染器 UI 文案（html-locale）

## 结论

- html-locale 只管阅读器壳 UI 文案；文档内容文案来自 `*.airp.json`，按文档敲定 locale 选取壳文案包。
- key 前缀绑定 `packages/renderer-target-html/src/` 下源文件路径；禁止跨文件共用 key。
- 禁止硬编码壳 UI 文案；禁止把 html-locale 写入 `*.airp.json`。
- 客户端本地时间偏移符号统一 `UTC±`；标签文案走 locale。

## 须有键

| Key 前缀 / 键 | 用途（中 / 英示例） |
|---------------|-------------------|
| `assemble.default-name` | 缺省文档名 |
| `components.page-toc.label` | 本页目录 / On this page（`nav` `aria-label`） |
| `client.color-scheme-script.*` | 亮 / 暗（`sr-only`） |
| `client.code-copy-script.*` | 复制 / 已复制 |
| `emit.hero-chrome-label` | 「关键指标」/ `Key metrics` |
| `emit.lead-eyebrow` | 「导语」/ `Lead` |
| `emit.agent-note-label` | 「AI 备忘」/ `Agent note` |
| `emit.doc-authors-label` | 「作者」/ `Authors`（schema 1.0.0） |
| `emit.doc-updated-label` | 「更新时间」/ `Updated`（schema 1.0.0） |
| `emit.doc-last-updated-label` | 「最后更新」/ `Last updated`（schema 1.1.0） |
| `emit.doc-sources-label` | 「真源参考」/ `Sources`（文档头右侧菜单触发器与面板标题） |
| `emit.decision.*` | Context / Chosen / Rationale / Pros / Cons |
| `emit.constraint-rigid` | 「刚性」/ `Rigid` |
| `emit.constraint-scope` | 「范围」/ `Scope` |
| `emit.comparison-before` / `emit.comparison-after` | 「之前/之后」/ `Before` / `After` |
| `emit.requirement-trace-*` | 需求追溯表头 |
| `emit.assumption-validated` / `emit.assumption-unvalidated` | 已验证 / 未验证 |
| `emit.open-question-blocking` / `emit.open-question-non-blocking` | 阻塞 / 非阻塞 |
| `emit.decision-status.*` | decision 状态人话 |
| `emit.risk-status.*` | risk 状态人话 |
| `emit.file-change-*` | 文件变更表头 |
| `emit.code-diff-before` / `emit.code-diff-after` | split 双栏侧标 |

## 维护

增删壳 UI 文案时同步本表与 `src/i18n/locale/*`。语言包 stem 与 BCP47 映射见 `src/i18n/locale.ts`（当前 10 种：`en-US`、`zh-CN`、`ja-JP`、`ko-KR`、`de-DE`、`fr-FR`、`ru-RU`、`es-ES`、`pt-BR`、`it-IT`；`en` 别名 `en-US`）。
