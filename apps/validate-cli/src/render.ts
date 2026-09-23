import path from "node:path";
import { logDiagnostics } from "@airp/diagnostics";
import { readDocumentPayload } from "@airp/loader";
import type { AirpCtx, Logger } from "@airp/utils";
import type { ValidationResult } from "@airp/validate";

/** Human-readable source label for CLI text reporter. */
export function validationSourceLabel(
  ctx: AirpCtx,
  cwd: string = process.cwd()
): string {
  const entry = readDocumentPayload(ctx.payload);
  if (entry?.sourcePath) {
    return path.relative(cwd, entry.sourcePath) || entry.sourcePath;
  }
  return ".";
}

export function renderValidationResult(
  result: ValidationResult,
  opts: {
    ctx: AirpCtx;
    log: Logger;
    reporter: string;
  }
): void {
  if (opts.reporter === "json") {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  const { log } = opts;
  const label = validationSourceLabel(opts.ctx);

  if (result.ok) {
    logDiagnostics(log, result.diagnostics);
    log.info(`OK  validate  ${label}`);
    return;
  }

  logDiagnostics(log, result.diagnostics);
}
