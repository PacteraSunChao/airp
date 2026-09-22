import type { AirpDocumentSnapshot } from "@airp/renderer-contract";
import { isRecord } from "@airp/utils";
import type { AirpDocumentModel } from "./document-model.js";

/** Narrow a render snapshot to the shared document model. */
export function asDocumentModel(
  snapshot: AirpDocumentSnapshot
): AirpDocumentModel {
  return snapshot as AirpDocumentModel;
}

/** Type guard for a block-like record with a string `type`. */
export function isBlockBase(
  value: unknown
): value is { type: string; [key: string]: unknown } {
  return isRecord(value) && typeof value.type === "string";
}
