// biome-ignore lint/performance/noBarrelFile: package public API entry point
export {
  type BlockShape,
  type FieldShape,
  listBlockTypes,
  type ObjectShape,
  readBlockShape,
  type ValueShape,
} from "./block-shape.js";
export {
  duplicateValue,
  insertValue,
  moveValue,
  readValue,
  removeValue,
  setValue,
  withUniqueAtIds,
} from "./commands.js";
export { createBlock } from "./create-block.js";
export {
  type AtIdOccurrence,
  atIdAtPath,
  type DocumentAtIdIndex,
  indexDocumentAtIds,
  pathOfAtId,
} from "./document-index.js";
export { fromJsonPointer, type NodePath, toJsonPointer } from "./paths.js";
export { serializeDocument } from "./serialize.js";
export {
  type DiagnosticLocation,
  resolveDiagnosticLocations,
} from "./validation-bridge.js";
