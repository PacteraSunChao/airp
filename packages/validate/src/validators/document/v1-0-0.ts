import { diagnostic } from "@airp/diagnostics";
import type { SchemaVersion } from "@airp/protocol";
import { VALIDATE_VALIDATORS_DOCUMENT_ZOD_FAILED } from "../../diagnostic-codes.js";
import type { ValidationStageResult } from "../../types.js";
import { validationStageResult } from "../../validation-stage-result.js";
import { airpDocumentSchema } from "./zod-airp-schema-1-0-0.js";

/** Validate 1.0.0 document structure with the legacy Zod schema (safeParse). */
export function document100(
  document: Record<string, unknown>,
  _schemaVersion: SchemaVersion
): ValidationStageResult {
  const parsed = airpDocumentSchema.safeParse(document);
  if (parsed.success) {
    return validationStageResult("document", []);
  }
  return validationStageResult("document", [
    diagnostic(VALIDATE_VALIDATORS_DOCUMENT_ZOD_FAILED, parsed.error.message),
  ]);
}
