import { PROTOCOL_SCHEMA_TYPES_SCHEMA_VERSION_UNSUPPORTED } from "../diagnostic-codes.js";

export const supportedSchemaVersions = ["1.0.0", "1.1.0"] as const;

export type SchemaVersion = (typeof supportedSchemaVersions)[number];

/** Compile-time exhaustiveness for per-package registries. */
export type VersionRegistry<T> = Record<SchemaVersion, T>;

export function hasSchemaVersion(version: string): version is SchemaVersion {
  return (supportedSchemaVersions as readonly string[]).includes(version);
}

/** Throw when schemaVersion is not registered in supportedSchemaVersions. */
export function assertSchemaVersion(
  version: string
): asserts version is SchemaVersion {
  if (!hasSchemaVersion(version)) {
    throw new Error(
      `${PROTOCOL_SCHEMA_TYPES_SCHEMA_VERSION_UNSUPPORTED.code}: Unsupported schemaVersion: ${version}. Supported: ${supportedSchemaVersions.join(", ")}`
    );
  }
}
