import { defineDiagnosticCode } from "@airp/diagnostics";

/** return: src/validate-document.ts */
export const VALIDATE_SCHEMA_VERSION_UNSUPPORTED = defineDiagnosticCode(
  "validate.schema-version.unsupported",
  "error"
);

/** return: src/validators/document/v1-0-0.ts */
export const VALIDATE_VALIDATORS_DOCUMENT_ZOD_FAILED = defineDiagnosticCode(
  "validate.validators.document.zod-failed",
  "error"
);

/** return: src/validators/at-id/v1-1-0.ts */
export const VALIDATE_VALIDATORS_AT_ID_MISSING = defineDiagnosticCode(
  "validate.validators.at-id.missing",
  "error"
);

/** return: src/validators/at-id/v1-1-0.ts */
export const VALIDATE_VALIDATORS_AT_ID_INVALID_PATTERN = defineDiagnosticCode(
  "validate.validators.at-id.invalid-pattern",
  "error"
);

/** return: src/validators/at-id/v1-1-0.ts */
export const VALIDATE_VALIDATORS_AT_ID_DUPLICATE = defineDiagnosticCode(
  "validate.validators.at-id.duplicate",
  "error"
);

export const VALIDATE_DIAGNOSTIC_ENTRIES = [
  VALIDATE_SCHEMA_VERSION_UNSUPPORTED,
  VALIDATE_VALIDATORS_DOCUMENT_ZOD_FAILED,
  VALIDATE_VALIDATORS_AT_ID_MISSING,
  VALIDATE_VALIDATORS_AT_ID_INVALID_PATTERN,
  VALIDATE_VALIDATORS_AT_ID_DUPLICATE,
] as const;

export const VALIDATE_DIAGNOSTIC_CODES = [
  VALIDATE_SCHEMA_VERSION_UNSUPPORTED.code,
  VALIDATE_VALIDATORS_DOCUMENT_ZOD_FAILED.code,
  VALIDATE_VALIDATORS_AT_ID_MISSING.code,
  VALIDATE_VALIDATORS_AT_ID_INVALID_PATTERN.code,
  VALIDATE_VALIDATORS_AT_ID_DUPLICATE.code,
] as const;

export type ValidateDiagnosticCode = (typeof VALIDATE_DIAGNOSTIC_CODES)[number];

/** Covered only in validate unit tests (no Package case). */
export const UNIT_COVERED_VALIDATE_DIAGNOSTIC_CODES = [
  VALIDATE_VALIDATORS_AT_ID_MISSING.code,
  VALIDATE_VALIDATORS_AT_ID_INVALID_PATTERN.code,
] as const satisfies readonly ValidateDiagnosticCode[];
