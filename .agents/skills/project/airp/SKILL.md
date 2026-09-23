---
name: airp
description: >-
  skill 1.1.3 · schema 1.1.0 — Generate one AIRP `*.airp.json` report.
  Use when the user asks for /airp, AIRP, airp.json, or block-based reports.
license: MIT
disable-model-invocation: true
---

# /airp

Produce exactly one `*.airp.json` (`schemaVersion`: `"1.1.0"`). Fields and enums follow `schemas/document.schema.json`; this file covers workflow and hard rules only.

## Contract

| | |
|---|---|
| **Do** | Create or update exactly one `.airp.json` under the **project root** (default dir `.docs/airp/`); validation must pass (schema + i18n + unique `@id`) |
| **Don't** | Change other workspace files; do not render/export HTML/Markdown (humans use `airp-render`) |
| **Substitute writes** | Analysis / plans / diffs that would otherwise edit other files go into the document (e.g. `codeDiff`), not real edits |
| **Chat** | No prose output besides that `.airp.json` |

Override path: `/airp --out <dir>`.

## Workflow (check in order)

```
- [ ] Intent and audience (decide meta.kind, narrative focus, locale)
- [ ] Author blocks (pick type) — references/block-authoring.md
- [ ] If mermaid / architectureOverview — references/mermaid-authoring.md
- [ ] Batch-generate @id — scripts/gen-airp-ids.mjs
- [ ] meta timestamps and attribution — references/current-datetime.md
- [ ] Decide output path (create: timestamp+slug; update: keep path)
- [ ] Read schemas/document.schema.json, write the file
- [ ] Validation passes — stdout contains OK  validate
```

Always run scripts from the **skill root** (directory containing this `SKILL.md`); input/output paths are relative to the **project root** or absolute.

## Hard rules

### `@id`

Every block and every structured object needs a document-unique `@id` matching `^[a-z0-9]{10}$`. Plain string array items (list lines, `meta.tags`, roadmap goals, etc.) do not get `@id`. Business keys (e.g. `table.columns[].key`, `reqId`) are not `@id`.

```bash
node scripts/gen-airp-ids.mjs 20
```

Do not hand-write them; do not leave them empty expecting validate to fill them in (it will not).

### Text types

| Type | Use for | Constraints |
|------|---------|-------------|
| `PlainString` | title / label / term / alt / short caption | Plain text; markdown not parsed |
| `MarkdownString` | text / body / description / note | Inline only: `**bold**` `*italic*` `~~strike~~` `` `code` `` `[label](url)`; no headings/lists/fences/images/HTML |

Use the matching block for multi-paragraph or list content; do not stuff them into one `MarkdownString`.

### Locale

`i18n.locale` is exactly one value from the reader-shell-supported set:

`en-US` · `zh-CN` · `ja-JP` · `ko-KR` · `de-DE` · `fr-FR` · `ru-RU` · `es-ES` · `pt-BR` · `it-IT`

| Case | Value |
|------|-------|
| Unspecified | Follow chat language (English → `en-US`) |
| `/airp --locale <code>` | Use that code (must be in the list above) |

### Paths and filenames

Default directory (relative to **project root**): `.docs/airp/`

| Action | Rule |
|--------|------|
| **Create** | `<filename-timestamp>-<slug>.airp.json` |
| **Update** | Keep the existing path and filename |

- `<filename-timestamp>`: stdout of `node scripts/get-current-datetime.mjs --filename` (verbatim). Details → `references/current-datetime.md`
- `<slug>`: short kebab ASCII topic (`[a-z0-9-]+`, preferably ≤ 48)

Example: `.docs/airp/20260921-175819+0800-airp-skill.airp.json`

### meta (summary)

Schema requires `title`, `kind`, and `createdAt`. For `created*` / `updated*` on create / update and timestamp commands → `references/current-datetime.md`.

### Validation

Requires Node.js `>=20.19`. Scripts prefer `airp-validate` on PATH, otherwise `npx @airp/validate-cli`.

```bash
node scripts/validate-airp.mjs <path/to/file.airp.json>
```

Success: stdout contains `OK  validate`. On failure, fix until it passes; do not leave a broken file "best effort".

## Anti-patterns

- Treating existing `*.airp.json` in the output dir as a template (unless the user **explicitly** names a document to follow)
- Writing long prose in chat, dropping a half-finished `.airp.json`, or skipping validation
- Hand-writing / leaving empty `@id`
- Really editing other repo files instead of writing into document blocks such as `codeDiff`
- Inventing a `type` not in the schema

## Index

| Resource | Path |
|----------|------|
| Schema SSOT | `schemas/document.schema.json` |
| Block authoring | `references/block-authoring.md` |
| Mermaid authoring | `references/mermaid-authoring.md` |
| Timestamps and attribution | `references/current-datetime.md` |
| Generate `@id` | `scripts/gen-airp-ids.mjs` |
| Current datetime | `scripts/get-current-datetime.mjs` |
| Validate entry | `scripts/validate-airp.mjs` |
