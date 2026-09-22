import { defineDiagnosticCode } from "@airp/diagnostics";

/** return: src/locale/resolve-localized.ts */
export const RENDERER_SHARED_LOCALE_LOCALIZED_STRING_MISSING =
  defineDiagnosticCode(
    "renderer.shared.locale.localized-string-missing",
    "error"
  );

export const RENDERER_SHARED_DIAGNOSTIC_ENTRIES = [
  RENDERER_SHARED_LOCALE_LOCALIZED_STRING_MISSING,
] as const;

export const RENDERER_SHARED_DIAGNOSTIC_CODES = [
  RENDERER_SHARED_LOCALE_LOCALIZED_STRING_MISSING.code,
] as const;

export type RendererSharedDiagnosticCode =
  (typeof RENDERER_SHARED_DIAGNOSTIC_CODES)[number];

/** Covered only in renderer-shared unit tests (no Package case). */
export const UNIT_COVERED_RENDERER_SHARED_DIAGNOSTIC_CODES = [
  RENDERER_SHARED_LOCALE_LOCALIZED_STRING_MISSING.code,
] as const satisfies readonly RendererSharedDiagnosticCode[];
