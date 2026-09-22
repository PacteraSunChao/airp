import { defineDiagnosticCode } from "@airp/diagnostics";

/**
 * return: public unsupported version → callers may diagnostic()
 * throw 锚点: src/schema/types.ts — assertSchemaVersion internal only
 */
export const PROTOCOL_SCHEMA_TYPES_SCHEMA_VERSION_UNSUPPORTED =
  defineDiagnosticCode(
    "protocol.schema.types.schema-version-unsupported",
    "error"
  );

/** return: src/schema/get-schema-set.ts */
export const PROTOCOL_SCHEMA_GET_SCHEMA_SET_VALIDATION = defineDiagnosticCode(
  "protocol.schema.get-schema-set.validation",
  "error"
);

export const PROTOCOL_DIAGNOSTIC_ENTRIES = [
  PROTOCOL_SCHEMA_TYPES_SCHEMA_VERSION_UNSUPPORTED,
  PROTOCOL_SCHEMA_GET_SCHEMA_SET_VALIDATION,
] as const;

export const PROTOCOL_DIAGNOSTIC_CODES = [
  PROTOCOL_SCHEMA_TYPES_SCHEMA_VERSION_UNSUPPORTED.code,
  PROTOCOL_SCHEMA_GET_SCHEMA_SET_VALIDATION.code,
] as const;

/** Covered only in protocol unit tests (no Package case). */
export const UNIT_COVERED_PROTOCOL_DIAGNOSTIC_CODES = [
  PROTOCOL_SCHEMA_TYPES_SCHEMA_VERSION_UNSUPPORTED.code,
] as const satisfies readonly ProtocolDiagnosticCode[];

export type ProtocolDiagnosticCode = (typeof PROTOCOL_DIAGNOSTIC_CODES)[number];
