/** Successful load value: parsed document plus routing version string. */
export interface LoadedDocument {
  /** Parsed AIRP document object (not yet validated). */
  document: Record<string, unknown>;
  /** Raw `schemaVersion` string from the document root. */
  schemaVersion: string;
  /** Absolute path when loaded from disk. */
  sourcePath?: string;
}
