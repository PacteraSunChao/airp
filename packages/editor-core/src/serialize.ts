/**
 * Write-back serialization for `*.airp.json` documents.
 *
 * The policy is deliberately narrow, so editing does not fight the authoring
 * path:
 *
 * - **Key order is preserved.** `JSON.parse` keeps insertion order, so writing
 *   back yields a minimal diff against the file the AI wrote instead of a
 *   normalized rewrite.
 * - **`meta` is never touched.** `updatedAt` / `updatedBy` stay owned by the
 *   AI / CLI authoring path; an editor reports edits, it does not stamp them.
 * - **Unknown fields pass through.** Anything this package does not model — for
 *   example fields added by a future Schema Version — survives a round trip.
 */

/** Serialize a document for write-back: 2-space indent plus a trailing newline. */
export function serializeDocument(document: unknown): string {
  return `${JSON.stringify(document, null, 2)}\n`;
}
