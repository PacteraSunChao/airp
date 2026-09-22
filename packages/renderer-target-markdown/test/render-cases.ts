import { RENDERER_TARGETS_MARKDOWN_UNKNOWN_BLOCK_TYPE } from "../src/diagnostic-codes.js";
import type { MarkdownRenderCase } from "./render-case.js";

export const renderCases: MarkdownRenderCase[] = [
  {
    id: "minimal-en",
    document: "valid/minimal.airp.json",
    expect: {
      ok: true,
      contains: ["# Minimal report", "**Kind:** generic", "Hello AIRP."],
    },
  },
  {
    id: "minimal-1.1.0-en",
    document: "valid/minimal-1.1.0.airp.json",
    expect: {
      ok: true,
      contains: [
        "# Minimal report 1.1.0",
        "**Last updated:** maosong 2026-09-21T08:00:00.000Z",
        "Hello AIRP 1.1.0.",
      ],
      notContains: ["**Authors:**"],
    },
  },
  {
    id: "section-at-id-1.1.0",
    document: "valid/section-at-id-1.1.0.airp.json",
    expect: {
      ok: true,
      contains: [
        "# Overview",
        "## Details",
        "Body with **bold**, *italic*, ~~strike~~, `code`, and [docs](https://example.com).",
        "- [1] First source (p.1)",
        "- [2] Second source",
        "| Name | Value |",
        "| alpha | 1 |",
      ],
      notContains: ["- [ffffffffff]", "- [gggggggggg]"],
    },
  },
  {
    id: "markdown-blocks-en",
    document: "valid/markdown-blocks.airp.json",
    expect: {
      ok: true,
      contains: [
        "# Markdown sample",
        "## Overview",
        "> Lead text",
        "Hello **world**.",
        "- One",
        "```mermaid",
        "flowchart LR",
        "![Diagram](https://example.com/a.png)",
        "[External doc](https://example.com/doc)",
        "> _Agent note:_ Visible note",
        "| Name | Value |",
        "- **Core** — Main module",
      ],
      notContains: ["Hidden note", "Default-hidden note"],
    },
  },
  {
    id: "unknown-block-type",
    document: "invalid/unknown-block-type.airp.json",
    expect: {
      ok: false,
      code: RENDERER_TARGETS_MARKDOWN_UNKNOWN_BLOCK_TYPE.code,
    },
  },
];
