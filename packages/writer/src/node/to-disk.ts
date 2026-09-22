import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { normalizeRelPath } from "../normalize-rel-path.js";
import type { OutputWriter } from "../types.js";

export type { OutputWriter, PutOutputFile } from "../types.js";

function resolveUnderRoot(outputRoot: string, relPath: string): string {
  const normalized = normalizeRelPath(relPath);
  const root = path.resolve(outputRoot);
  const target = path.resolve(root, ...normalized.split("/"));
  if (target !== root && !target.startsWith(`${root}${path.sep}`)) {
    throw new Error(`Output path escapes root: ${relPath}`);
  }
  return target;
}

/** Create a disk writer rooted at `outputRoot`. */
export function createDiskWriter(outputRoot: string): OutputWriter {
  const root = path.resolve(outputRoot);
  return {
    async putOutputFile(relPath, content) {
      const target = resolveUnderRoot(root, relPath);
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, content);
    },
  };
}
