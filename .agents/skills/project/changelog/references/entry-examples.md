# Good / bad entry examples

结论：条目须帮助读者决定是否升级、如何迁移。全部 bullet 与发版正文为 **English**。

## Rewrite

| Forbidden / internal | Correct (user-facing English) |
|----------------------|-------------------------------|
| `fix: handle NPE in ExportService when rows==0` | `Exporting an empty report no longer fails` |
| `refactor validate pipeline` | (no behavior change → **omit**) |
| `bump zod to 3.x` | (invisible → omit; if behavior changes → describe the effect) |
| `feat: add mermaid svg` | `Renderer can render Mermaid diagrams as SVG` |
| `fix typo in README` | (omit unless user-facing steps changed) |
| Chinese prose in CHANGELOG | **Forbidden** — rewrite in English |

## Merge

| Forbidden | Correct |
|-----------|---------|
| Five unrelated Fixed bullets forced into “Fixed several issues” | Merge only related ones under a clear theme; keep unrelated bullets separate |
| `Added: new CLI` + `Fixed: crash in new CLI` + `Fixed: help text for new CLI` (all unreleased) | One `Added` bullet describing the final shipped capability |
| `Fixed: various bug fixes` | Forbidden; use a themed sentence or split |

## Must stand alone

```markdown
### Removed
- Removed deprecated `id` field (schema 1.0.0); use `@id` (1.1.0) instead

### Security
- Fixed unescaped output in the render path that could enable XSS
```

## OK to collapse

```markdown
### Fixed
- validate-cli no longer exits abnormally on several invalid inputs (empty file, non-JSON, truncated input)
```

## Section shape (illustrative)

```markdown
## [Unreleased]

### Added
- …

## [1.2.0] - 2026-09-24

### Added
- …

### Fixed
- …
```

Examples are not project history; real entries come only from the current range’s net effect.
