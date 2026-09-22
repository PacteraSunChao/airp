import { defineDiagnosticCode } from "@airp/diagnostics";

/** return: src/pipeline/resolve-locales.ts */
export const RENDERER_PIPELINE_LOCALE_UNRESOLVED = defineDiagnosticCode(
  "renderer.pipeline.locale-unresolved",
  "error"
);

/** return: src/pipeline/render-document.ts */
export const RENDERER_PIPELINE_UNKNOWN_TARGET = defineDiagnosticCode(
  "renderer.pipeline.unknown-target",
  "error"
);

export const RENDERER_DIAGNOSTIC_ENTRIES = [
  RENDERER_PIPELINE_LOCALE_UNRESOLVED,
  RENDERER_PIPELINE_UNKNOWN_TARGET,
] as const;

export const RENDERER_DIAGNOSTIC_CODES = [
  RENDERER_PIPELINE_LOCALE_UNRESOLVED.code,
  RENDERER_PIPELINE_UNKNOWN_TARGET.code,
] as const;

export type RendererDiagnosticCode = (typeof RENDERER_DIAGNOSTIC_CODES)[number];

/** Covered only in unit tests (no Package case). */
export const UNIT_COVERED_RENDERER_DIAGNOSTIC_CODES = [
  RENDERER_PIPELINE_LOCALE_UNRESOLVED.code,
] as const satisfies readonly RendererDiagnosticCode[];
