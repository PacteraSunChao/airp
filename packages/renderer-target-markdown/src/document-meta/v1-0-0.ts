import type { AirpDocumentModel } from "@airp/renderer-shared";

/** Emit Markdown meta lines for schemaVersion 1.0.0. */
export function documentMeta100(doc: AirpDocumentModel): string[] {
  const meta: string[] = [];
  if (doc.meta.kind) {
    meta.push(`**Kind:** ${doc.meta.kind}`);
  }
  if (doc.meta.authors?.length) {
    meta.push(`**Authors:** ${doc.meta.authors.join(", ")}`);
  }
  if (doc.meta.tags?.length) {
    meta.push(`**Tags:** ${doc.meta.tags.join(", ")}`);
  }
  return meta;
}
