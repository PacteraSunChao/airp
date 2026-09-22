import {
  type AirpFailResult,
  type AirpResult,
  airpResultFrom,
  diagnostic,
} from "@airp/diagnostics";
import { isRecord } from "@airp/utils";
import {
  LOADER_LOAD_JSON_PARSE,
  LOADER_LOAD_NOT_OBJECT,
  LOADER_LOAD_SCHEMA_VERSION_INVALID,
} from "./diagnostic-codes.js";
import type { LoadedDocument } from "./types.js";

/** Load an AIRP document from a parsed value (isomorphic). */
export function loadDocument(data: unknown): AirpResult<LoadedDocument> {
  if (!isRecord(data)) {
    return airpResultFrom([
      diagnostic(
        LOADER_LOAD_NOT_OBJECT,
        "AIRP document root must be a JSON object"
      ),
    ]) as AirpFailResult;
  }

  const schemaVersion = data.schemaVersion;
  if (typeof schemaVersion !== "string" || schemaVersion.length === 0) {
    return airpResultFrom([
      diagnostic(
        LOADER_LOAD_SCHEMA_VERSION_INVALID,
        "Document root must include a non-empty string schemaVersion",
        { location: { path: "/schemaVersion" } }
      ),
    ]) as AirpFailResult;
  }

  return airpResultFrom([], {
    document: data,
    schemaVersion,
  });
}

/** Parse JSON text then load as an AIRP document (isomorphic). */
export function loadDocumentJson(text: string): AirpResult<LoadedDocument> {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return airpResultFrom([
      diagnostic(LOADER_LOAD_JSON_PARSE, `Invalid JSON: ${message}`),
    ]) as AirpFailResult;
  }
  return loadDocument(data);
}
