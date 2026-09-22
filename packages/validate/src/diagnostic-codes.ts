import { defineDiagnosticCode } from "@airp/diagnostics";

/** return: src/validate-document.ts */
export const VALIDATE_SCHEMA_VERSION_UNSUPPORTED = defineDiagnosticCode(
  "validate.schema-version.unsupported",
  "error"
);

/** return: src/validators/i18n/v1-0-0.ts */
export const VALIDATE_VALIDATORS_I18N_DEFAULT_LOCALE_MISSING =
  defineDiagnosticCode(
    "validate.validators.i18n.default-locale-missing",
    "error"
  );

/** return: src/validators/i18n/v1-0-0.ts */
export const VALIDATE_VALIDATORS_I18N_LOCALIZED_STRING_MISSING_DEFAULT =
  defineDiagnosticCode(
    "validate.validators.i18n.localized-string-missing-default",
    "error"
  );

/** return: src/validators/i18n/v1-0-0.ts */
export const VALIDATE_VALIDATORS_I18N_UNKNOWN_LOCALE_KEY = defineDiagnosticCode(
  "validate.validators.i18n.unknown-locale-key",
  "error"
);

/** return: src/validators/block-id/v1-0-0.ts */
export const VALIDATE_VALIDATORS_BLOCK_ID_DUPLICATE = defineDiagnosticCode(
  "validate.validators.block-id.duplicate",
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

/** return: src/validators/mermaid-parse/v1-0-0.ts */
export const VALIDATE_VALIDATORS_MERMAID_PARSE_FAILED = defineDiagnosticCode(
  "validate.validators.mermaid-parse.failed",
  "error"
);

export const VALIDATE_DIAGNOSTIC_ENTRIES = [
  VALIDATE_SCHEMA_VERSION_UNSUPPORTED,
  VALIDATE_VALIDATORS_I18N_DEFAULT_LOCALE_MISSING,
  VALIDATE_VALIDATORS_I18N_LOCALIZED_STRING_MISSING_DEFAULT,
  VALIDATE_VALIDATORS_I18N_UNKNOWN_LOCALE_KEY,
  VALIDATE_VALIDATORS_BLOCK_ID_DUPLICATE,
  VALIDATE_VALIDATORS_AT_ID_MISSING,
  VALIDATE_VALIDATORS_AT_ID_INVALID_PATTERN,
  VALIDATE_VALIDATORS_AT_ID_DUPLICATE,
  VALIDATE_VALIDATORS_MERMAID_PARSE_FAILED,
] as const;

export const VALIDATE_DIAGNOSTIC_CODES = [
  VALIDATE_SCHEMA_VERSION_UNSUPPORTED.code,
  VALIDATE_VALIDATORS_I18N_DEFAULT_LOCALE_MISSING.code,
  VALIDATE_VALIDATORS_I18N_LOCALIZED_STRING_MISSING_DEFAULT.code,
  VALIDATE_VALIDATORS_I18N_UNKNOWN_LOCALE_KEY.code,
  VALIDATE_VALIDATORS_BLOCK_ID_DUPLICATE.code,
  VALIDATE_VALIDATORS_AT_ID_MISSING.code,
  VALIDATE_VALIDATORS_AT_ID_INVALID_PATTERN.code,
  VALIDATE_VALIDATORS_AT_ID_DUPLICATE.code,
  VALIDATE_VALIDATORS_MERMAID_PARSE_FAILED.code,
] as const;

export type ValidateDiagnosticCode = (typeof VALIDATE_DIAGNOSTIC_CODES)[number];

/** Covered only in validate unit tests (no Package case). */
export const UNIT_COVERED_VALIDATE_DIAGNOSTIC_CODES = [
  VALIDATE_VALIDATORS_I18N_UNKNOWN_LOCALE_KEY.code,
  VALIDATE_VALIDATORS_AT_ID_MISSING.code,
  VALIDATE_VALIDATORS_AT_ID_INVALID_PATTERN.code,
] as const satisfies readonly ValidateDiagnosticCode[];
