import type { AirpDocumentModel } from "@airp/renderer-shared";

/**
 * Prefer updatedAt else createdAt; prefer updatedBy else createdBy.
 * Shared by Markdown 1.1.0 meta emit (no HTML escape).
 */
function resolveDocTimeIso(meta: AirpDocumentModel["meta"]): string | null {
  if (typeof meta.updatedAt === "string" && meta.updatedAt.length > 0) {
    return meta.updatedAt;
  }
  if (typeof meta.createdAt === "string" && meta.createdAt.length > 0) {
    return meta.createdAt;
  }
  return null;
}

function resolveDocUpdatedBy(meta: AirpDocumentModel["meta"]): string | null {
  if (typeof meta.updatedBy === "string" && meta.updatedBy.length > 0) {
    return meta.updatedBy;
  }
  if (typeof meta.createdBy === "string" && meta.createdBy.length > 0) {
    return meta.createdBy;
  }
  return null;
}

/** Emit Markdown meta lines for schemaVersion 1.1.0. */
export function documentMeta110(doc: AirpDocumentModel): string[] {
  const meta: string[] = [];
  if (doc.meta.kind) {
    meta.push(`**Kind:** ${doc.meta.kind}`);
  }

  const updatedBy = resolveDocUpdatedBy(doc.meta);
  const updatedIso = resolveDocTimeIso(doc.meta);
  if (updatedBy || updatedIso) {
    const parts = [updatedBy, updatedIso].filter(
      (part): part is string => typeof part === "string" && part.length > 0
    );
    meta.push(`**Last updated:** ${parts.join(" ")}`);
  }

  if (doc.meta.tags?.length) {
    meta.push(`**Tags:** ${doc.meta.tags.join(", ")}`);
  }
  return meta;
}
