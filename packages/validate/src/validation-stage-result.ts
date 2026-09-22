import type { AirpDiagnostic } from "@airp/diagnostics";
import { airpResultFrom } from "@airp/diagnostics";
import type { ValidationStageResult } from "./types.js";

/** Build a pipeline stage result; `ok` follows error diagnostics. */
export function validationStageResult(
  stage: string,
  diagnostics: AirpDiagnostic[]
): ValidationStageResult {
  return { stage, ...airpResultFrom(diagnostics) };
}
