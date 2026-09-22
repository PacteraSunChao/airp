import type { SchemaVersion } from "@airp/protocol";
import { getSchemaSet } from "@airp/protocol";
import type { ValidationStageResult } from "../../types.js";
import { validationStageResult } from "../../validation-stage-result.js";

/** Validate document structure against the versioned JSON Schema (Ajv). */
export function document100(
  document: Record<string, unknown>,
  schemaVersion: SchemaVersion
): ValidationStageResult {
  const result = getSchemaSet(schemaVersion).validate(document);
  return validationStageResult("document", result.diagnostics);
}
