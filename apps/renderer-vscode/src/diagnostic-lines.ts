import { type AirpDiagnostic, formatDiagnostic } from "@airp/diagnostics";

export interface DiagnosticLine {
  body: string;
  severity: AirpDiagnostic["severity"];
}

export function toDiagnosticLines(
  diagnostics: readonly AirpDiagnostic[]
): DiagnosticLine[] {
  return diagnostics.map((diagnostic) => ({
    severity: diagnostic.severity,
    body: formatDiagnostic(diagnostic).body,
  }));
}
