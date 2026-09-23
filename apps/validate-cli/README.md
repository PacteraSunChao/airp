# Validate CLI (`airp-validate`)

Validate an [AIRP](https://github.com/maosong-ai/airp) document (`*.airp.json`).

## Requirements

- Node.js 20.19 or later

## Install

```bash
npm install -g @airp/validate-cli
```

Or run without a global install:

```bash
npx --package=@airp/validate-cli airp-validate --input ./doc.airp.json
```

## Usage

```bash
airp-validate --input <path>
```

### Options

| Option | Description |
|--------|-------------|
| `--input` | Path to a `*.airp.json` AIRP document (required) |
| `--reporter` | `text` (default) or `json` |

### Examples

Human-readable report:

```bash
airp-validate --input ./doc.airp.json
```

JSON report (for scripts and CI):

```bash
airp-validate --input ./doc.airp.json --reporter json
```

## Exit codes

| Code | Meaning |
|------|---------|
| `0` | Valid (warnings may still be printed) |
| `1` | Invalid document or usage error |
| `2` | Unexpected failure |

## Changelog

[Changelog](https://github.com/maosong-ai/airp/blob/main/CHANGELOG.md)

## License

MIT

Copyright (c) 2026 毛松 <maosong-life@outlook.com>
