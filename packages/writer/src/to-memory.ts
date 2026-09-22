import { normalizeRelPath } from "./normalize-rel-path.js";
import type { OutputWriter } from "./types.js";

export type { OutputWriter, PutOutputFile } from "./types.js";

/** In-memory output tree; extras support virtual-root inspection. */
export interface MemoryWriter extends OutputWriter {
  /** Bytes previously written at `relPath`, if any. */
  getOutputFile(relPath: string): Uint8Array | undefined;
  /** Whether `relPath` has been written. */
  hasOutputFile(relPath: string): boolean;
  /** Sorted list of written relative paths. */
  listOutputFiles(): readonly string[];
}

/** Create an in-memory writer for browser / test hosts. */
export function createMemoryWriter(): MemoryWriter {
  const files = new Map<string, Uint8Array>();

  return {
    putOutputFile(relPath, content) {
      return Promise.resolve().then(() => {
        files.set(normalizeRelPath(relPath), content);
      });
    },
    getOutputFile(relPath) {
      return files.get(normalizeRelPath(relPath));
    },
    hasOutputFile(relPath) {
      return files.has(normalizeRelPath(relPath));
    },
    listOutputFiles() {
      return [...files.keys()].sort();
    },
  };
}
