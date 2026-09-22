import type { SchemaVersion, VersionRegistry } from "@airp/protocol";
import type { AirpDocumentModel } from "@airp/renderer-shared";
import { documentMeta100 } from "./v1-0-0.js";
import { documentMeta110 } from "./v1-1-0.js";

export type DocumentMetaEmitter = (doc: AirpDocumentModel) => string[];

const DOCUMENT_META_EMITTERS = {
  "1.0.0": documentMeta100,
  "1.1.0": documentMeta110,
} as const satisfies VersionRegistry<DocumentMetaEmitter>;

/** Resolve the document-meta emitter for a supported schema version. */
export function documentMetaFor(version: SchemaVersion): DocumentMetaEmitter {
  return DOCUMENT_META_EMITTERS[version];
}
