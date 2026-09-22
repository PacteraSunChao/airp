import type { AnySchema } from "ajv";
import type { SchemaVersion, VersionRegistry } from "../schema/types";
import {
  DOCUMENT_SCHEMA_REL_PATH as DOCUMENT_SCHEMA_REL_PATH_1_0_0,
  schemas as schemas_1_0_0,
} from "./1.0.0/index";
import {
  DOCUMENT_SCHEMA_REL_PATH as DOCUMENT_SCHEMA_REL_PATH_1_1_0,
  schemas as schemas_1_1_0,
} from "./1.1.0/index";

const registries = {
  "1.0.0": schemas_1_0_0,
  "1.1.0": schemas_1_1_0,
} as const satisfies VersionRegistry<Record<string, AnySchema>>;

const documentRelPaths = {
  "1.0.0": DOCUMENT_SCHEMA_REL_PATH_1_0_0,
  "1.1.0": DOCUMENT_SCHEMA_REL_PATH_1_1_0,
} as const satisfies VersionRegistry<string>;

export function schemaRegistry(
  version: SchemaVersion
): Record<string, AnySchema> {
  return registries[version];
}

export function documentSchemaRelPath(version: SchemaVersion): string {
  return documentRelPaths[version];
}

export function getSchema(
  version: SchemaVersion,
  relativePath: string
): AnySchema {
  const schema = registries[version][relativePath];
  if (!schema) {
    throw new Error(`Schema not found: ${version}/${relativePath}`);
  }
  return schema;
}
