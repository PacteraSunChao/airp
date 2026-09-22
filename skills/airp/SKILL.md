---
name: airp
description: Generate AIRP `*.airp.json` reports. Use when the user asks for /airp, AIRP, airp.json, or block-based technical reports.
license: MIT
disable-model-invocation: true
---

# /airp

Generates one AIRP `*.airp.json` (v1.1.0).

## Scope

- **Does**: create or update exactly one `.airp.json` under the **project root** (default `.docs/airp/`); validate it (schema + i18n + unique `@id` + Mermaid `parse`).
- **Does not**: touch any other workspace file; does not render or export HTML/Markdown (humans use `airp-render`). If the request would normally edit other files, put analysis/spec/plan/diffs **inside** the document (e.g. `codeDiff`) — never apply real edits. Do not emit chat text outside the `.airp.json`.

## Workflow

```
- [ ] Intent + audience
- [ ] Blocks — references/block-selection.md
- [ ] Mermaid (if any) — references/mermaid-authoring.md
- [ ] Meta timestamps + attribution — references/current-datetime.md
- [ ] `@id` handles — scripts/gen-airp-ids.mjs (every block + structured object)
- [ ] Output path (new: timestamp + slug; update: keep path)
- [ ] Read schemas/document.schema.json and write the file
- [ ] Validate — must print "OK  validate"
```

## Steps

### 1 — Blocks

Follow `references/block-selection.md`. Choose from this request’s content shape. Do **not** mirror existing `*.airp.json` under the output directory unless the user **explicitly** names documents to follow.

### 1b — Mermaid

When using `mermaid` or `architectureOverview`, follow `references/mermaid-authoring.md`.

### 1c — Machine handles (`@id`)

Every Block and every structured object needs a document-unique `@id` matching `^[a-z0-9]{10}$` (not business keys like `table.columns[].key` or `reqId`). Pure string array items (list rows, `meta.tags`, roadmap goals) do **not** get `@id`.

Generate in batch from the **skill root**:

```bash
node scripts/gen-airp-ids.mjs 20
```

Do not invent ad-hoc ids; do not leave `@id` blank for validate to fill (validate does not auto-complete).

### 2 — Schema

SSOT: `schemas/document.schema.json` (AIRP v1.1.0). Before writing, satisfy at least:

- top-level `required`; `additionalProperties: false`
- `schemaVersion`: `"1.1.0"`
- `meta`: new → `createdBy` + `createdAt` only; modify → `updatedBy` + `updatedAt` only (see `references/current-datetime.md`)
- `i18n.locale`: exactly one locale
- Text types: `PlainString` (title / label / term / alt / short caption; escaped, no markdown) vs `MarkdownString` (text / body / description / note; markdown-lite **inline only**: `**bold**`, `*italic*`, `~~strike~~`, `` `code` ``, `[label](url)` — no headings/lists/fences/images/HTML) — no `LocalizedString` / `RichText` / `InlineNode`
- `blocks` discriminator (`type`), each block’s field constraints, and required `@id` on blocks + structured objects

### 3 — Path and naming

Default directory (relative to **project root**, not the skill directory): `.docs/airp/`

Override: `/airp --out <dir>`

**New file** basename: `<filename-timestamp>-<slug>.airp.json`

- `<filename-timestamp>`: stdout of `node scripts/get-current-datetime.mjs --filename` (verbatim). Format `YYYYMMDD-HHmmss±HHmm`. See `references/current-datetime.md`.
- `<slug>`: short kebab-case ASCII from the topic (`[a-z0-9-]+`, prefer ≤ 48 chars).

**Update**: keep the existing path and filename.

Example: `.docs/airp/20260921-175819+0800-airp-skill.airp.json`

### 4 — Locale

| Case | Example |
|---|---|
| Unspecified — use chat language | `/airp` |
| Explicit | `/airp --locale zh-CN` |

Set `i18n.locale` to one of:

`en-US` · `zh-CN` · `ja-JP` · `ko-KR` · `de-DE` · `fr-FR` · `ru-RU` · `es-ES` · `pt-BR` · `it-IT`

(Match chat language when possible. For English use `en-US`.)

### 5 — Validate

Requires Node.js `>=20.19` and `@airp/validate-cli` (`airp-validate`). The skill script uses a PATH install if present, otherwise `npx`.

From the **skill root** (directory containing this `SKILL.md`):

```bash
node scripts/validate-airp.mjs <path/to/file.airp.json>
```

From the project root, use an absolute path to that script, or `cd` to the skill root first.

Success: stdout contains `OK  validate`. On failure, fix until it passes — no best-effort file.

Optional global install:

```bash
npm i -g @airp/validate-cli
```
