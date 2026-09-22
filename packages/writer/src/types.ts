/** Write bytes into the output tree at a project-relative path. */
export type PutOutputFile = (
  relPath: string,
  content: Uint8Array
) => Promise<void>;

/** Minimal output-tree writer surface shared by disk / memory / noop. */
export interface OutputWriter {
  putOutputFile: PutOutputFile;
}
