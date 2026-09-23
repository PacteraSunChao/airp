# meta timestamps and attribution

`meta.createdAt` / `meta.updatedAt` must come from this skill script’s **real current time**. Do not guess or hand-fill timestamps.

## Create vs update

| Scenario | Write | Leave unchanged |
|----------|-------|-----------------|
| **Create** `*.airp.json` | `meta.createdBy` + `meta.createdAt` | Do not write `updatedBy` / `updatedAt` |
| **Modify** an existing file | `meta.updatedBy` + `meta.updatedAt` | Keep existing `createdBy` / `createdAt` |

Schema also requires `meta.title` and `meta.kind`; `createdAt` is always present after create and after later edits.

## Timestamp commands

Run from the **skill root** (directory containing `SKILL.md`):

| Mode | Command | Used for |
|------|---------|----------|
| **Meta** (default) | `node scripts/get-current-datetime.mjs` | `meta.createdAt` / `meta.updatedAt` |
| **Filename** | `node scripts/get-current-datetime.mjs --filename` | Prefix of new filenames only |

**Meta** — UTC ISO 8601 with milliseconds and `Z`:

`2026-06-16T09:13:12.345Z`

**Filename** — local wall clock + UTC offset `YYYYMMDD-HHmmss±HHmm`:

`20260921-175819+0800`

Rules:

- Use stdout **verbatim** for the matching field or filename prefix.
- Do not mix modes: meta → default; filename → `--filename`.
- If the command fails, exits non-zero, or produces a bad format → **stop**.

## Attribution (`createdBy` / `updatedBy`)

Format: `Name <email>` when both are known; otherwise name only.

Resolve once per write, in order:

1. Read git config separately (**do not** use `git var GIT_AUTHOR_IDENT`):

   ```bash
   git config user.name
   git config user.email
   ```

   If email is non-empty, use `"Name <email>"`; otherwise name only.

2. If git is missing, not a repo, or either command fails: use the OS login name (Unix: `$USER` / `id -un`; Windows: `%USERNAME%`).

On create write `createdBy`; on modify write `updatedBy`.
