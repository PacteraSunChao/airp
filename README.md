# AIRP — AI Report Protocol

[🇺🇸 English](./README.md) | [🇨🇳 中文](./README.cn.md) | [🇯🇵 日本語](./README.ja.md) | [🇰🇷 한국어](./README.ko.md) | [🇩🇪 Deutsch](./README.de.md) | [🇫🇷 Français](./README.fr.md) | [🇷🇺 Русский](./README.ru.md) | [🇪🇸 Español](./README.es.md) | [🇧🇷 Português (Brasil)](./README.pt-BR.md) | [🇮🇹 Italiano](./README.it.md)

![AIRP screen capture](./screen-capture.png "AIRP screen capture")

**Make AI-written reports easier to read—and easier to change.**

Ask AI for Markdown and you often get flat, meandering text. Ask for HTML and it can look fine, but it’s long, token-heavy, and painful to edit later. AIRP’s approach: have the AI write a `*.airp.json` source first, then open it with the **AIRP Renderer** extension as polished HTML. When you need to share, export HTML or Markdown.

The source is organized like Notion **Blocks**—**46** of them so far (hero metrics, comparison, decision, timeline, Mermaid, architecture overview, and more). Each has its own layout, so plans, reviews, retros, and audits stay clear instead of turning into a wall of text.

## How a report runs

Writing and reading stay separate. The `*.airp.json` in the middle is shaped by JSON Schema—generation and validation both treat it as the source of truth:

| Who | What it does |
| --- | --- |
| **`/airp` Skill** | Have AI create or update the source, and validate it |
| **VS Code extension** | Read it in the editor; export HTML / Markdown |

What you actually get:

- Missing fields or sections fail validation—fewer half-finished deliverables.
- The source fits Git and diffs; HTML / Markdown are just what humans read.
- Clear Block boundaries are steadier for the model, and usually cheaper in tokens than a hand-written full HTML page.

## Quick start

### 1. Install the VS Code extension

Install **AIRP Renderer** from the [Marketplace](https://marketplace.visualstudio.com/items?itemName=airp.airp-renderer-vscode) (extension ID: `airp.airp-renderer-vscode`).

Open any `*.airp.json` to read it, or export HTML / Markdown. Needs a VS Code–compatible editor (e.g. Cursor).

### 2. Install the `/airp` Skill

If you’re only opening sources someone else already wrote, the extension is enough. Install the Skill when you want AI to write new reports:

```bash
npx skills add maosong-ai/airp
```

In chat, type `/airp <topic>`. The Skill generates and validates a source file (default folder: `.docs/airp/`). Open it with the extension to read. Optional flags: `--locale en-US`, `--out <dir>`.

## Languages

Supported document languages: English (`en-US`), 简体中文 (`zh-CN`), 日本語 (`ja-JP`), 한국어 (`ko-KR`), Deutsch (`de-DE`), Français (`fr-FR`), Русский (`ru-RU`), Español (`es-ES`), Português Brasil (`pt-BR`), Italiano (`it-IT`). Pass `/airp --locale …` when you write a report.

## What’s next

Available today: Skill generates / validates sources; the extension reads and exports HTML / Markdown. Planned next:

| Direction | Notes |
| --- | --- |
| **Visual editing** | Edit content in the extension—don’t need the Skill for every change |
| **More export formats** | Add PDF (print, archive) |
| **Multi-page / multi-sheet** | Split long reports by section or sheet instead of one endless page |

## Local development and build

For people hacking on the repo. Day-to-day use of the VS Code extension and Skill doesn’t require cloning this repository.

Requires Node.js **20.19+** and pnpm **10.17+**.

```bash
pnpm install
```

**Validate CLI** (`airp-validate`)

```bash
# try it
pnpm validate-cli:sample

# build → apps/validate-cli/dist/cli.mjs
pnpm exec turbo run build --filter=@airp/validate-cli
```

**Render CLI** (`airp-render`)

```bash
# try it
pnpm renderer-cli:sample

# build → apps/renderer-cli/dist/cli.mjs
pnpm exec turbo run build --filter=@airp/renderer-cli
```

**VS Code extension**

Open this repo in VS Code, press F5 (or run **Launch AIRP Renderer**) to debug in the Extension Development Host.

```bash
# build
pnpm exec turbo run build --filter=airp-renderer-vscode

# package → apps/renderer-vscode/dist/airp-renderer-vscode-<version>.vsix
pnpm --filter=airp-renderer-vscode package
```

---

## License

MIT

[AIRP](https://github.com/maosong-ai/airp) | Copyright (c) 2026 毛松 <maosong-life@outlook.com>
