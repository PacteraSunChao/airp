/** Codes owned by @airp/diagnostics (none today). */

export const DIAGNOSTICS_DIAGNOSTIC_ENTRIES = [] as const;

export const DIAGNOSTICS_DIAGNOSTIC_CODES = [] as const;

export type DiagnosticsDiagnosticCode =
  (typeof DIAGNOSTICS_DIAGNOSTIC_CODES)[number];
