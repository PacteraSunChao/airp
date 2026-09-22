import type { Logger } from "@airp/utils";
import { formatDiagnostic } from "./index.js";

export interface LoggableDiagnostic {
  code: string;
  location?: {
    file?: string;
    path?: string;
  };
  message: string;
  severity: "error" | "warning";
  stage?: string;
}

export function logDiagnostic(log: Logger, d: LoggableDiagnostic): void {
  const { body } = formatDiagnostic(d);
  if (d.severity === "warning") {
    log.warn(body);
    return;
  }
  log.error(body);
}

export function logDiagnostics(
  log: Logger,
  diagnostics: LoggableDiagnostic[]
): void {
  for (const d of diagnostics) {
    logDiagnostic(log, d);
  }
}

export function logInternalError(log: Logger, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  log.error(`internal error: ${message}`);
  const stack = error instanceof Error ? error.stack : undefined;
  if (!stack) {
    return;
  }
  for (const line of stack.split("\n").slice(1)) {
    log.raw(line);
  }
}
