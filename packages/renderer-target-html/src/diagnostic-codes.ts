import { defineDiagnosticCode } from "@airp/diagnostics";

/** return: src/emit-block.ts */
export const RENDERER_TARGETS_HTML_UNKNOWN_BLOCK_TYPE = defineDiagnosticCode(
  "renderer.targets.html.unknown-block-type",
  "error"
);

/** return: src/emit-handlers.ts */
export const RENDERER_TARGETS_HTML_MERMAID_NODE_REQUIRED = defineDiagnosticCode(
  "renderer.targets.html.mermaid.node-required",
  "error"
);

/** return: src/node/render-mermaid-svg.ts */
export const RENDERER_TARGETS_HTML_MERMAID_RENDER_FAILED = defineDiagnosticCode(
  "renderer.targets.html.mermaid.render-failed",
  "error"
);

/** return: src/section-anchor/v1-1-0.ts */
export const RENDERER_TARGETS_HTML_AT_ID_MISSING = defineDiagnosticCode(
  "renderer.targets.html.at-id.missing",
  "error"
);

export const RENDERER_TARGET_HTML_DIAGNOSTIC_ENTRIES = [
  RENDERER_TARGETS_HTML_UNKNOWN_BLOCK_TYPE,
  RENDERER_TARGETS_HTML_MERMAID_NODE_REQUIRED,
  RENDERER_TARGETS_HTML_MERMAID_RENDER_FAILED,
  RENDERER_TARGETS_HTML_AT_ID_MISSING,
] as const;

export const RENDERER_TARGET_HTML_DIAGNOSTIC_CODES = [
  RENDERER_TARGETS_HTML_UNKNOWN_BLOCK_TYPE.code,
  RENDERER_TARGETS_HTML_MERMAID_NODE_REQUIRED.code,
  RENDERER_TARGETS_HTML_MERMAID_RENDER_FAILED.code,
  RENDERER_TARGETS_HTML_AT_ID_MISSING.code,
] as const;

export type RendererTargetHtmlDiagnosticCode =
  (typeof RENDERER_TARGET_HTML_DIAGNOSTIC_CODES)[number];

export const UNIT_COVERED_RENDERER_TARGET_HTML_DIAGNOSTIC_CODES = [
  RENDERER_TARGETS_HTML_MERMAID_RENDER_FAILED.code,
  RENDERER_TARGETS_HTML_AT_ID_MISSING.code,
] as const satisfies readonly RendererTargetHtmlDiagnosticCode[];
