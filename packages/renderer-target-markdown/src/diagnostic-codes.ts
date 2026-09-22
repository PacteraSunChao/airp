import { defineDiagnosticCode } from "@airp/diagnostics";

/** return: src/emit-block.ts */
export const RENDERER_TARGETS_MARKDOWN_UNKNOWN_BLOCK_TYPE =
  defineDiagnosticCode("renderer.targets.markdown.unknown-block-type", "error");

export const RENDERER_TARGET_MARKDOWN_DIAGNOSTIC_ENTRIES = [
  RENDERER_TARGETS_MARKDOWN_UNKNOWN_BLOCK_TYPE,
] as const;

export const RENDERER_TARGET_MARKDOWN_DIAGNOSTIC_CODES = [
  RENDERER_TARGETS_MARKDOWN_UNKNOWN_BLOCK_TYPE.code,
] as const;

export type RendererTargetMarkdownDiagnosticCode =
  (typeof RENDERER_TARGET_MARKDOWN_DIAGNOSTIC_CODES)[number];

/** Covered only in unit tests (no Package case). */
export const UNIT_COVERED_RENDERER_TARGET_MARKDOWN_DIAGNOSTIC_CODES =
  [] as const satisfies readonly RendererTargetMarkdownDiagnosticCode[];
