# Render CLI (`airp-render`)

Render an [AIRP](https://github.com/maosong-ai/airp) document (`*.airp.json`) to HTML or Markdown.

## Requirements

- Node.js 20.19 or later

## Install

```bash
npm install -g @airp/renderer-cli
```

Or run without a global install:

```bash
npx --package=@airp/renderer-cli airp-render export --input ./doc.airp.json --out ./doc.html
```

## Commands

### `export` — render once

Write a single HTML or Markdown file and exit.

```bash
airp-render export --input <path> --out <file> [--target html|markdown]
```

| Option | Description |
|--------|-------------|
| `--input` | Path to a `*.airp.json` AIRP document (required) |
| `--out` | Output file path (required; use `.html` or `.md`) |
| `--target` | Render target: `html` (default) or `markdown` |

Examples:

```bash
airp-render export --input ./doc.airp.json --out ./doc.html
airp-render export --input ./doc.airp.json --out ./doc.md --target markdown
```

### `watch` — re-render on changes

Watch one AIRP document and re-render when it changes. Optionally serve HTML over HTTP with live reload.

```bash
airp-render watch --input <path> [--out <file>] [--target html|markdown] [--serve] [--serve-port <port>]
```

| Option | Description |
|--------|-------------|
| `--input` | Path to a `*.airp.json` AIRP document (required) |
| `--out` | Output file path (required for Markdown; for HTML use `--out` and/or `--serve`) |
| `--target` | Render target: `html` (default) or `markdown` |
| `--serve` | Serve HTML over HTTP (HTML target only) |
| `--serve-port` | HTTP port when `--serve` is set (default: `4173`) |

Examples:

```bash
airp-render watch --input ./doc.airp.json --out ./doc.html
airp-render watch --input ./doc.airp.json --serve
airp-render watch --input ./doc.airp.json --serve --serve-port 3000
```

Open the printed URL in a browser when using `--serve`.

## Exit codes

| Code | Meaning |
|------|---------|
| `0` | Success |
| `1` | Validation or render failure, or usage error |
| `2` | Unexpected failure |

## License

MIT

Copyright (c) 2026 毛松 <maosong-life@outlook.com>
