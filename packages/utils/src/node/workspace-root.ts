import { existsSync } from "node:fs";
import path from "node:path";

export const WORKSPACE_ROOT_MARKER = "pnpm-workspace.yaml";

export interface FindWorkspaceRootOptions {
  /** File that marks the monorepo root. */
  markerFile?: string;
}

/**
 * Walk upward from `startDir` until `markerFile` exists.
 * Returns `startDir` when no marker is found.
 */
export function findWorkspaceRoot(
  startDir: string,
  options: FindWorkspaceRootOptions = {}
): string {
  const marker = options.markerFile ?? WORKSPACE_ROOT_MARKER;
  let dir = path.resolve(startDir);
  for (;;) {
    if (existsSync(path.join(dir, marker))) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      return path.resolve(startDir);
    }
    dir = parent;
  }
}
