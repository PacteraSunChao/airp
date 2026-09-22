import type { AirpDocumentModel } from "@airp/renderer-shared";

/** Prefer updatedAt, else createdAt. */
export function resolveDocTimeIso(
  meta: AirpDocumentModel["meta"]
): string | null {
  if (typeof meta.updatedAt === "string" && meta.updatedAt.length > 0) {
    return meta.updatedAt;
  }
  if (typeof meta.createdAt === "string" && meta.createdAt.length > 0) {
    return meta.createdAt;
  }
  return null;
}

/** Prefer updatedBy, else createdBy (schema 1.1.0 attribution). */
export function resolveDocUpdatedBy(
  meta: AirpDocumentModel["meta"]
): string | null {
  if (typeof meta.updatedBy === "string" && meta.updatedBy.length > 0) {
    return meta.updatedBy;
  }
  if (typeof meta.createdBy === "string" && meta.createdBy.length > 0) {
    return meta.createdBy;
  }
  return null;
}
