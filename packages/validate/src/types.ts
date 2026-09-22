import type { AirpDiagnostic, AirpStatusResult } from "@airp/diagnostics";
import type { SchemaVersion } from "@airp/protocol";

export interface ValidationStageResult {
  diagnostics: AirpDiagnostic[];
  ok: boolean;
  stage: string;
}

export type ValidationResult = AirpStatusResult;

export type ValidationStage = (
  document: Record<string, unknown>,
  schemaVersion: SchemaVersion
) => ValidationStageResult | Promise<ValidationStageResult>;

export interface ValidationPipeline {
  gates: ValidationStage[];
  semantics: ValidationStage[];
}
