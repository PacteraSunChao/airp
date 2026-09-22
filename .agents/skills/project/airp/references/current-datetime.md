## Current datetime and attribution for AIRP meta

`meta.createdAt` / `meta.updatedAt` must be the **real current time** from the skill script. Never guess or invent a timestamp.

### Create vs update

| Scenario | Write | Leave alone |
|----------|-------|-------------|
| **New** `*.airp.json` | `meta.createdBy` + `meta.createdAt` only | Do not emit `updatedBy` / `updatedAt` |
| **Modify** existing file | `meta.updatedBy` + `meta.updatedAt` only | Keep existing `createdBy` / `createdAt` |

### Timestamps

From the **skill root** (directory containing `SKILL.md`):

| Mode | Command | Use for |
|------|---------|---------|
| **Meta** (default) | `node scripts/get-current-datetime.mjs` | `meta.createdAt` / `meta.updatedAt` |
| **Filename** | `node scripts/get-current-datetime.mjs --filename` | New-file name prefix only |

**Meta** — UTC ISO 8601 with milliseconds, `Z`:

`2026-06-16T09:13:12.345Z`

**Filename** — local wall clock + UTC offset `YYYYMMDD-HHmmss±HHmm`:

`20260921-175819+0800`

Rules:

- Use stdout **verbatim** for the intended field or filename prefix.
- Do not mix modes: meta → default; filename → `--filename`.
- If the command fails, exits non-zero, or returns an unexpected format, **stop**.

### Attribution (`createdBy` / `updatedBy`)

Format: `Name <email>` when both are known; otherwise name only.

Resolve once per write, in order:

1. Prefer separate git config reads (do **not** use `git var GIT_AUTHOR_IDENT`):

   ```bash
   git config user.name
   git config user.email
   ```

   Combine into `"Name <email>"` when email is non-empty; otherwise use name alone.

2. If git is missing, not a repo, or either command fails: use the OS login name (`$USER` / `id -un` on Unix; `%USERNAME%` on Windows).

Apply to `createdBy` (new) or `updatedBy` (modify).
