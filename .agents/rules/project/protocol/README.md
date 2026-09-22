# AIRP 协议文档命名规范（SSOT）

`*.airp.json` 字段命名与文档形状约定。细则在 [`rules/`](./rules/)；**结构与类型真源**仍为 `packages/protocol/src/schemas/<semver>/document.schema.json`。

## 规则

| 域 | 何时读 | 文档 |
|----|--------|------|
| 根字段、积木块、i18n、机器句柄、文案类型 | 新增/修改 `.airp.json`、schema、fixture、校验或渲染逻辑 | [`rules/document-field-naming.md`](./rules/document-field-naming.md) |

## 核心原则

1. **单文件文档**：一份报告 = 一个 `*.airp.json`；无项目树、无目录结构 meta-schema、无跨文件 `@ref-id`。
2. **根必填**：`schemaVersion` | `meta` | `i18n` | `blocks`。
3. **camelCase**：JSON 字段用 camelCase（与领域 schema 一致）；与 TS 标识符同形，边界无需字段名映射。**例外（仅 `1.1.0`）**：机器句柄字段名为 `@id`（见 `rules/document-field-naming.md`）。
4. **无兼容层**：禁止旧字段 fallback、禁止过渡逻辑；`1.0.0` 与 `1.1.0` 分列，不得混用字段假设。
5. **schema 优先**：字段定义以 JSON Schema 为准；本文档为可读索引，不与 schema 冲突。
6. **`$id`**：`https://airp.local/<semver>/document.schema.json`。

## 维护

- 协议字段或管线变更时：**先改 schema 与校验器**，再同步 `rules/document-field-naming.md`。
- 禁止在索引页复制 `rules/*` 长文。
