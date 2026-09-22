// biome-ignore lint/performance/noBarrelFile: package public API entry point
export {
  type AirpSchemaSet,
  getSchemaSet,
  schemaUriBase,
  toSchemaUri,
} from "./schema/get-schema-set";
export {
  assertSchemaVersion,
  hasSchemaVersion,
  type SchemaVersion,
  supportedSchemaVersions,
  type VersionRegistry,
} from "./schema/types";
export {
  documentSchemaRelPath,
  getSchema,
  schemaRegistry,
} from "./schemas/registry";
