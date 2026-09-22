import { defineDiagnosticCode } from "@airp/diagnostics";

/** return: src/load.ts */
export const LOADER_LOAD_JSON_PARSE = defineDiagnosticCode(
  "loader.load.json-parse",
  "error"
);

/** return: src/load.ts */
export const LOADER_LOAD_NOT_OBJECT = defineDiagnosticCode(
  "loader.load.not-object",
  "error"
);

/** return: src/load.ts */
export const LOADER_LOAD_SCHEMA_VERSION_INVALID = defineDiagnosticCode(
  "loader.load.schema-version-invalid",
  "error"
);

/** return: src/node/from-file.ts */
export const LOADER_NODE_INPUT_UNAVAILABLE = defineDiagnosticCode(
  "loader.node.input-unavailable",
  "error"
);

export const LOADER_DIAGNOSTIC_ENTRIES = [
  LOADER_LOAD_JSON_PARSE,
  LOADER_LOAD_NOT_OBJECT,
  LOADER_LOAD_SCHEMA_VERSION_INVALID,
  LOADER_NODE_INPUT_UNAVAILABLE,
] as const;

export const LOADER_DIAGNOSTIC_CODES = [
  LOADER_LOAD_JSON_PARSE.code,
  LOADER_LOAD_NOT_OBJECT.code,
  LOADER_LOAD_SCHEMA_VERSION_INVALID.code,
  LOADER_NODE_INPUT_UNAVAILABLE.code,
] as const;

export type LoaderDiagnosticCode = (typeof LOADER_DIAGNOSTIC_CODES)[number];
