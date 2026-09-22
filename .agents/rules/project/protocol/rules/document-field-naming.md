# AIRP 文档字段命名

适用于所有 `*.airp.json` 业务字段。结构真源：`packages/protocol/src/schemas/<semver>/document.schema.json`。

**版本分列**：`1.0.0` 与 `1.1.0` 字段与 `$defs` 分列描述；禁止跨版 fallback、过渡别名或混用表述。

## 根形状

| 字段 | 规则 |
|------|------|
| `schemaVersion` | 精确 semver 字符串；须 ∈ `supportedSchemaVersions`（当前含 `1.0.0`、`1.1.0`） |
| `meta` | 文档元数据（标题、归因、时间等；以对应版 schema 为准） |
| `i18n` | **1.0.0**：`defaultLocale` + `locales`；**1.1.0**：仅 `locale` |
| `blocks` | 积木块数组；`minItems: 1`；树可含容器子块 |

### `meta` 按版差异

| 字段 | `1.0.0` | `1.1.0` |
|------|---------|---------|
| `authors` | 可选 `string[]` | **禁止** |
| `createdBy` / `updatedBy` | 无 | 可选 `string`（HTML 展示「最后更新：updatedBy updatedAt」） |

### `i18n` 按版差异

| 概念 | `1.0.0` | `1.1.0` |
|------|---------|---------|
| 配置 | `defaultLocale` + `locales[]`（可多 locale） | **仅** `locale`（单个 LocaleCode） |
| `i18n.ui` | 可选：按 locale 的 renderer chrome 字符串 | **禁止**（壳文案走 html-locale，勿写入文档） |

## 字段名：camelCase 与 `@id` 例外

- JSON 业务字段默认 **camelCase**（与领域 schema / TS 标识符同形）。
- **例外（仅 `1.1.0`）**：机器句柄字段名一律为 `@id`（字面量含 `@`），不是 `id`、不是 `atId`。
- 业务键（如 `table.columns[].key`、`requirementTrace` 的 `reqId`）与机器句柄分离，不得互相替代。

## 机器句柄

### `1.0.0`：可选 `id`

- Block 可有稳定 `id`（可选）；整棵 `blocks` 树（含容器子块）上出现的 `id` **有则全局唯一**（validate 门禁）。
- 无 `@id`、无 `PlainString` / `MarkdownString`。

### `1.1.0`：必填 `@id`

| 项 | 规则 |
|----|------|
| 字段名 | 一律 `@id` |
| 格式 | `^[a-z0-9]{10}$` |
| 唯一性 | 单份 `*.airp.json` 内所有 `@id` **共池唯一** |
| 校验 | 必填 + pattern + 唯一；**不**自动补 |
| HTML / TOC | 可寻址节点 `id="{@id 值}"`；锚点直接用 `@id` 值 |

**必须有 `@id`**：所有 Block（含 `divider` / `spacer` 及容器子树内每一块）；所有结构化对象——含 Badge、`meta.sourceRefs[]`、`CollectionItem`、checklist / definitionList / keyValueList / statusBoard / linkList / glossary / fileChangeList 的 item、flowSteps / timeline / roadmap 的步与事件与阶段、`decision.options[]`、`tabs.panels[]`、test suites、API endpoints、citation items、requirementTrace items（另保留业务字段 `reqId`）、`FileTreeNode`、`table.columns[]`（保留业务 `key`）、`table.rows[]`、`footerRow`、`architectureOverview.overview` 等嵌套类 Block 对象。

**不需要 `@id`**：纯字符串数组项（如 `bulletList` / `numberedList` 的项、`roadmap.phases[].goals`、`meta.tags`）。

**table 行与 `footerRow`**：`@id` 与列字段同层；渲染按 `columns[].key` 取单元格并**忽略** `@id`。`footerRow` 同样必填 `@id`，渲染忽略。

**citation**：无协议级交叉引用；展示用顺序 `[1]` `[2]`…；`@id` 仅机器句柄；DOM `id` 用 `@id` 值。

## 文案类型

### `1.0.0`

| `$defs` | 规则 |
|---------|------|
| `LocalizedString` | plain `string` **或** `Record<locale, string>`；object 形态必须含 `defaultLocale` 键，且所有键 ⊆ `i18n.locales`（validate i18n 门禁） |
| `RichText` / `InlineNode` | 富文本与行内节点（以该版 schema 为准） |

### `1.1.0`

| `$defs` | 用途 | 渲染 |
|---------|------|------|
| `PlainString` | title / label / term / alt / 短 caption 等 | 纯文本转义，不跑 markdown |
| `MarkdownString` | text / body / description / note 等正文类 | markdown-lite（**仅行内**）：`**bold**`、`*italic*`、`~~strike~~`、`` `code` ``、`[label](url)`；不支持标题/列表/引用/围栏代码块/图片/原始 HTML 等块级或 GFM 扩展（按字面保留） |

- **删除**本版 `LocalizedString`、`RichText`、`InlineNode`。
- 文案字段一律 plain `string`，按字段所属 `$defs` 区分 Plain vs Markdown；禁止 locale map。

## Block

- 每块有 `type`（schema 登记的全部 type 首版均实现）。
- **`1.0.0`**：稳定 `id` 见上文「机器句柄 / 1.0.0」。
- **`1.1.0`**：每块必填 `@id`，见上文「机器句柄 / 1.1.0」。
- 无布局坐标；呈现由 renderer 推导。

## 图与媒体

| 概念 | 规则 |
|------|------|
| Mermaid | JSON 存源码（如 `mermaid.source`、`architectureOverview.overview.source`）；validate 用 `mermaid.parse`；导出期 Node 渲 SVG |
| 图片 / embed | URL 外联；不物化、不把二进制写入 JSON |
| `agentNote` | 保留 `visible`；仅 `visible === true` 进入 HTML/Markdown |

## 禁止

- 多文件项目树、`ssp://` URI、`@ref-id` 引用模型
- 第二套完整文档 schema（Zod 等）与 JSON Schema 双真源
- 旧字段 fallback / deprecated 别名
- 在 `1.1.0` 使用 `id`（机器句柄）、`LocalizedString`、`RichText`、`InlineNode`
- 在 `1.0.0` 使用 `@id`、`PlainString`、`MarkdownString`
