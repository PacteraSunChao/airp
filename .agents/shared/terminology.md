# 术语表

按要表达的**意思**定位概念行，再取词。

| 用途 | 取哪一列 |
|------|----------|
| 代码、路径、类型、字段、文件/目录名等标识符 | **规范英名** |
| 用户可见文案中的该概念说法 | **当前界面语言对应的展示列** |

规范英名是标识符真源。展示列中 **en** 是界面说法真源；其它语言列由 en 派生。标识符专用行展示列可空；展示专用行规范英名可空。提示词出现表外同义时，产出仍须落回本表。

**准入**：会写错名或撞名、出现在用户可见文案、或跨包须同一说法——满足其一才进表。协议校验步骤、单包实现符号、无争议的 schema 字段与枚举取值不进表。字段规则见 `registry://rules.protocol.rules.document-field-naming`。

**版本分列**：同一概念在 `1.0.0` 与 `1.1.0` 字段名或 `$defs` 不同时，表中分行列出；禁止用「过渡 / 兼容」措辞混写。

## 产品与协议

| 概念 | 规范英名 | en | zh-CN |
|------|----------|-----|-------|
| 产品 / 协议名 | AIRP | AIRP | AIRP |
| 文档文件 | `*.airp.json` | AIRP document | AIRP 文档 |
| Schema 版本字段 | `schemaVersion` | Schema Version | Schema 版本 |
| 积木块 | `block` / `blocks` | Block | 积木块 |
| 积木块类型 | `type` | Block Type | 积木块类型 |
| 积木块标识（仅 `1.0.0`） | `id` | Block Id | 积木块标识 |
| 机器句柄（仅 `1.1.0`） | `@id` | Machine Handle | 机器句柄 |
| 本地化字符串（仅 `1.0.0`） | `LocalizedString` | Localized String | 本地化字符串 |
| 富文本（仅 `1.0.0`） | `RichText` | Rich Text | 富文本 |
| 行内节点（仅 `1.0.0`） | `InlineNode` | Inline Node | 行内节点 |
| 纯文案（仅 `1.1.0`） | `PlainString` | Plain String | 纯文案 |
| Markdown 文案（仅 `1.1.0`） | `MarkdownString` | Markdown String | Markdown 文案 |
| 默认语言 | `defaultLocale` | Default Locale | 默认语言 |
| 文档语言 | `locale` | Locale | 文档语言 |
| 语言列表 | `locales` | Locales | 语言列表 |
| 创建者 | `createdBy` | Created By | 创建者 |
| 更新者 | `updatedBy` | Updated By | 更新者 |
| 最后更新 | | Last updated | 最后更新 |
| 渲染目标 | `html` \| `markdown` | Render Target | 渲染目标 |
| 校验 CLI | `airp-validate` | Validate CLI | 校验命令 |
| 渲染 CLI | `airp-render` | Render CLI | 渲染命令 |
| 结果类型 | `AirpResult` | Result | 结果 |
| 诊断 | `AirpDiagnostic` | Diagnostic | 诊断 |

## VS Code 渲染器

| 概念 | 规范英名 | en | zh-CN |
|------|----------|-----|-------|
| 渲染视图 | `Renderer view` | Renderer view | 渲染视图 |
| 打开渲染器 | `airp.renderer.open` | Open Renderer | 打开渲染器 |
| 编辑源文档 | `airp.renderer.editSource` | Edit Source | 编辑源文档 |

**禁词**：本产品用语禁止 Preview（第三方 lockfile 包名除外）。

## 图与媒体

| 概念 | 规范英名 | en | zh-CN |
|------|----------|-----|-------|
| Mermaid 源码 | `mermaid.source` 等 | Mermaid Source | Mermaid 源码 |
| SVG 阅读器壳 | `svg-viewer` | SVG Viewer | SVG 阅读器 |
| 架构总览块 | `architectureOverview` | Architecture Overview | 架构总览 |
| 代理备注 | `agentNote` | Agent Note | 代理备注 |
| 外链嵌入 | `embed` | Embed | 外链嵌入 |
