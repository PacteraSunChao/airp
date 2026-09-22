/** AJV JSON Pointer instancePath, e.g. `/blocks/0/title` or `/` for document root. */
export type JsonPath = string;

export interface AirpLocation {
  file?: string;
  path?: JsonPath;
}

export type AirpSeverity = "error" | "warning";

/** Catalog entry: one code string paired with its severity. */
export interface DiagnosticCodeEntry<
  C extends string = string,
  S extends AirpSeverity = AirpSeverity,
> {
  readonly code: C;
  readonly severity: S;
}

export function defineDiagnosticCode<C extends string, S extends AirpSeverity>(
  code: C,
  severity: S
): DiagnosticCodeEntry<C, S> {
  return { code, severity };
}

export interface DiagnosticExtra {
  details?: Record<string, unknown>;
  location?: AirpLocation;
  stage?: string;
}

export interface AirpDiagnostic {
  code: string;
  details?: Record<string, unknown>;
  location?: AirpLocation;
  message: string;
  severity: AirpSeverity;
  stage?: string;
}

/** Build a diagnostic from a catalog entry; severity always comes from the entry. */
export function diagnostic(
  entry: DiagnosticCodeEntry,
  message: string,
  extra?: DiagnosticExtra
): AirpDiagnostic {
  return {
    code: entry.code,
    severity: entry.severity,
    message,
    ...extra,
  };
}

/**
 * Thrown when a lower layer already built domain diagnostics that a public
 * boundary must forward into an `AirpResult` (do not remap severity).
 */
export class AirpDiagnosticError extends Error {
  override name = "AirpDiagnosticError";
  readonly diagnostics: readonly AirpDiagnostic[];

  constructor(diagnostics: readonly AirpDiagnostic[]) {
    const first = diagnostics[0];
    super(first?.message ?? "AIRP diagnostic failure");
    this.diagnostics = diagnostics;
  }
}

export interface AirpFailResult {
  diagnostics: AirpDiagnostic[];
  ok: false;
}

export interface AirpOkResult<T> {
  diagnostics: AirpDiagnostic[];
  ok: true;
  value: T;
}

export type AirpResult<T> = AirpOkResult<T> | AirpFailResult;

/** Success without a business value (e.g. validate). */
export type AirpStatusResult =
  | { diagnostics: AirpDiagnostic[]; ok: true }
  | AirpFailResult;

export function hasErrorDiagnostics(diagnostics: AirpDiagnostic[]): boolean {
  return diagnostics.some((d) => d.severity === "error");
}

export function airpResultFrom(diagnostics: AirpDiagnostic[]): AirpStatusResult;
export function airpResultFrom<T>(
  diagnostics: AirpDiagnostic[],
  value: T
): AirpResult<T>;
export function airpResultFrom<T>(
  ...args: [AirpDiagnostic[]] | [AirpDiagnostic[], T]
): AirpStatusResult | AirpResult<T> {
  const diagnostics = args[0];
  if (hasErrorDiagnostics(diagnostics)) {
    return { ok: false, diagnostics };
  }
  if (args.length === 2) {
    return { ok: true, value: args[1], diagnostics };
  }
  return { ok: true, diagnostics };
}

export function prefixFile(
  diagnostics: AirpDiagnostic[],
  file: string
): AirpDiagnostic[] {
  return diagnostics.map((d) => ({
    ...d,
    location: {
      ...d.location,
      file: d.location?.file ?? file,
    },
  }));
}

export function withStage(
  diagnostics: AirpDiagnostic[],
  stage: string
): AirpDiagnostic[] {
  return diagnostics.map((d) => ({
    ...d,
    stage: d.stage ?? stage,
  }));
}

export interface FormattedDiagnostic {
  body: string;
}

/** Human body only (no level tag). */
export function formatDiagnostic(d: AirpDiagnostic): FormattedDiagnostic {
  const parts: string[] = [];
  if (d.stage) {
    parts.push(`[${d.stage}]`);
  }
  const loc = formatLocation(d.location);
  if (loc) {
    parts.push(loc);
  }
  parts.push(`${d.code}: ${d.message}`);
  return { body: parts.join(" ") };
}

function formatLocation(
  location: AirpLocation | undefined
): string | undefined {
  if (!location) {
    return undefined;
  }
  const { file, path } = location;
  if (file && path) {
    return `${file}:${path}`;
  }
  if (file) {
    return file;
  }
  if (path) {
    return path;
  }
  return undefined;
}

// biome-ignore lint/performance/noBarrelFile: public log* re-export from sibling module
export {
  logDiagnostic,
  logDiagnostics,
  logInternalError,
} from "./log.js";
