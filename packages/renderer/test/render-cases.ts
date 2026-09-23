import { RENDERER_PIPELINE_UNKNOWN_TARGET } from "../src/diagnostic-codes.js";
import type { RendererCase } from "./render-case.js";

export const renderCases: RendererCase[] = [
  {
    id: "markdown-minimal",
    document: "valid/minimal.airp.json",
    target: "markdown",
    expect: {
      ok: true,
      format: "markdown",
      contains: ["# Minimal report", "Hello AIRP."],
    },
  },
  {
    id: "markdown-blocks",
    document: "valid/markdown-blocks.airp.json",
    target: "markdown",
    expect: {
      ok: true,
      format: "markdown",
      contains: [
        "# Markdown sample",
        "> _Agent note:_ Visible note",
        "```mermaid",
      ],
      notContains: ["Hidden note"],
    },
  },
  {
    id: "html-minimal",
    document: "valid/minimal.airp.json",
    target: "html",
    expect: {
      ok: true,
      format: "html",
      contains: [
        "<!DOCTYPE html>",
        "<title>Minimal report</title>",
        "Hello AIRP.",
        'data-block-type="paragraph"',
      ],
    },
  },
  {
    id: "html-minimal-node",
    document: "valid/minimal.airp.json",
    target: "html",
    entry: "node",
    expect: {
      ok: true,
      format: "html",
      contains: [
        "<!DOCTYPE html>",
        "<title>Minimal report</title>",
        "Hello AIRP.",
        'data-block-type="paragraph"',
      ],
    },
  },
  {
    id: "html-mermaid-node",
    document: "valid/mermaid-ok.airp.json",
    target: "html",
    entry: "node",
    expect: {
      ok: true,
      format: "html",
      contains: ['data-mermaid="true"', 'id="airp-mmd-0"', 'id="airp-mmd-1"'],
      notContains: ["data-mermaid-source"],
    },
  },
  {
    id: "html-mermaid-bad-source-soft-fail",
    document: "valid/mermaid-bad-source.airp.json",
    target: "html",
    entry: "node",
    expect: {
      ok: true,
      format: "html",
      contains: [
        "Before diagram.",
        "After diagram.",
        'data-mermaid-error="true"',
      ],
      diagnostics: [
        {
          code: "renderer.targets.html.mermaid.render-failed",
          severity: "warning",
        },
      ],
    },
  },
  {
    id: "unknown-target",
    document: "valid/minimal.airp.json",
    target: "excel",
    expect: {
      ok: false,
      codes: [RENDERER_PIPELINE_UNKNOWN_TARGET.code],
    },
  },
];
