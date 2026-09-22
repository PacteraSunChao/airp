import type { ValidationStageResult } from "../../types.js";
import { validationStageResult } from "../../validation-stage-result.js";

/**
 * schema 1.1.0 i18n gate.
 * Structure (`i18n.locale`) is enforced by Ajv; LocalizedString maps are not allowed
 * by schema, so there is no locale-key walk like 1.0.0.
 */
export function i18n110(
  _document: Record<string, unknown>
): ValidationStageResult {
  return validationStageResult("i18n", []);
}
