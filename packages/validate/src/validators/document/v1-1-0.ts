import type { SchemaVersion } from "@airp/protocol";
import { getSchemaSet } from "@airp/protocol";
import type { ValidationStageResult } from "../../types.js";
import { validationStageResult } from "../../validation-stage-result.js";

/** Validate 1.1.0 document structure against the versioned JSON Schema (Ajv). */
export function document110(
  document: Record<string, unknown>,
  schemaVersion: SchemaVersion
): ValidationStageResult {
  const result = getSchemaSet(schemaVersion).validate(document);
  return validationStageResult("document", result.diagnostics);
}
