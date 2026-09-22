import type { CliCase, LoadCase, PipelineCase, SchemaCase } from "./types";

export interface DiagnosticCodeCaseSources {
  cliCases?: readonly CliCase[];
  loadCases?: readonly LoadCase[];
  pipelineCases?: readonly PipelineCase[];
  schemaCases?: readonly SchemaCase[];
}

export interface DiagnosticSeverityCatalogEntry {
  readonly code: string;
  readonly severity: "error" | "warning";
}

function codesFromCaseSources(sources: DiagnosticCodeCaseSources): Set<string> {
  const covered = new Set<string>();

  for (const case_ of sources.schemaCases ?? []) {
    if (!case_.expect.ok) {
      covered.add(case_.expect.code);
    }
  }

  for (const case_ of sources.loadCases ?? []) {
    if (!case_.expect.ok) {
      covered.add(case_.expect.code);
    }
  }

  for (const case_ of sources.pipelineCases ?? []) {
    if (!case_.expect.ok) {
      for (const code of case_.expect.codes) {
        covered.add(code);
      }
    }
  }

  for (const case_ of sources.cliCases ?? []) {
    if (case_.bootstrapCode) {
      covered.add(case_.bootstrapCode);
    }
  }

  return covered;
}

/** Fail when any registered diagnostic code lacks case or unit coverage. */
export function assertDiagnosticCodeCoverage(
  registered: readonly string[],
  caseSources?: DiagnosticCodeCaseSources,
  unitCovered?: readonly string[]
): void {
  const covered = codesFromCaseSources(caseSources ?? {});
  for (const code of unitCovered ?? []) {
    covered.add(code);
  }

  const missing = registered.filter((code) => !covered.has(code));
  if (missing.length > 0) {
    throw new Error(`diagnostic code coverage gaps:\n${missing.join("\n")}`);
  }
}

/**
 * Fail when any diagnostic's severity disagrees with the catalog entry for its
 * code, or when the code is not in the catalog.
 */
export function assertDiagnosticsMatchCatalog(
  diagnostics: readonly { code: string; severity: string }[],
  catalog: readonly DiagnosticSeverityCatalogEntry[]
): void {
  const byCode = new Map(
    catalog.map((entry) => [entry.code, entry.severity] as const)
  );
  const mismatches: string[] = [];
  for (const d of diagnostics) {
    const expected = byCode.get(d.code);
    if (expected === undefined) {
      mismatches.push(`${d.code}: not in catalog`);
      continue;
    }
    if (d.severity !== expected) {
      mismatches.push(`${d.code}: catalog=${expected} actual=${d.severity}`);
    }
  }
  if (mismatches.length > 0) {
    throw new Error(
      `diagnostic severity catalog mismatches:\n${mismatches.join("\n")}`
    );
  }
}
