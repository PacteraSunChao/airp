// biome-ignore lint/performance/noBarrelFile: package public API entry point
export {
  type AtIdOccurrence,
  atIdAtPath,
  type DocumentAtIdIndex,
  indexDocumentAtIds,
  pathOfAtId,
} from "./document-index.js";
export { fromJsonPointer, type NodePath, toJsonPointer } from "./paths.js";
export { serializeDocument } from "./serialize.js";
