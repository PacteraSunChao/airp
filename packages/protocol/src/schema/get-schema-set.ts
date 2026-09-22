import {
  type AirpDiagnostic,
  type AirpResult,
  airpResultFrom,
  diagnostic,
} from "@airp/diagnostics";
import { toPosixPath } from "@airp/utils";
import Ajv2020 from "ajv/dist/2020";
import addFormats from "ajv-formats";
import { PROTOCOL_SCHEMA_GET_SCHEMA_SET_VALIDATION } from "../diagnostic-codes.js";
import { documentSchemaRelPath, getSchema } from "../schemas/registry";
import type { SchemaVersion } from "./types";

export interface AirpSchemaSet {
  /** Validate an AIRP document value against this version's document schema. */
  validate(data: unknown): AirpResult<true>;
  readonly version: SchemaVersion;
}

/** Stable URI prefix for Ajv schema identity. */
export function schemaUriBase(version: SchemaVersion): string {
  return `https://airp.local/${version}/`;
}

export function toSchemaUri(
  version: SchemaVersion,
  relativePath: string
): string {
  return `${schemaUriBase(version)}${toPosixPath(relativePath)}`;
}

function formatAjvDiagnostics(
  validate: ReturnType<Ajv2020["compile"]>
): AirpDiagnostic[] {
  return (validate.errors ?? []).map((error) =>
    diagnostic(
      PROTOCOL_SCHEMA_GET_SCHEMA_SET_VALIDATION,
      error.message ?? "validation failed",
      {
        location: {
          path: error.instancePath || "/",
        },
        details: {
          keyword: error.keyword,
        },
      }
    )
  );
}

function buildSchemaSet(version: SchemaVersion): AirpSchemaSet {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);

  const relPath = documentSchemaRelPath(version);
  const schema = getSchema(version, relPath);
  const schemaUri = toSchemaUri(version, relPath);
  ajv.addSchema(schema, schemaUri);
  const validateDoc = ajv.compile(schema);

  return {
    version,
    validate(data: unknown): AirpResult<true> {
      if (validateDoc(data)) {
        return airpResultFrom([], true);
      }
      return airpResultFrom(
        formatAjvDiagnostics(validateDoc)
      ) as AirpResult<true>;
    },
  };
}

const cache = new Map<SchemaVersion, AirpSchemaSet>();

/** Return the compiled schema set for a supported AIRP schema version. */
export function getSchemaSet(version: SchemaVersion): AirpSchemaSet {
  const cached = cache.get(version);
  if (cached) {
    return cached;
  }

  const schemaSet = buildSchemaSet(version);
  cache.set(version, schemaSet);
  return schemaSet;
}
