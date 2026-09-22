import type { OutputWriter } from "./types.js";

export type { OutputWriter, PutOutputFile } from "./types.js";

/** Writer that discards every write (for `skip-write`). */
export function createNoopWriter(): OutputWriter {
  return {
    putOutputFile: () => Promise.resolve(),
  };
}
