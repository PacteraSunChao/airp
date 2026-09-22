import { existsSync } from "node:fs";
import path from "node:path";

const AIRP_JSON_SUFFIX = ".airp.json";

/** Absolute path is the session / panel key. */
export function panelKey(fsPath: string): string {
  return path.resolve(fsPath);
}

export function isAirpJsonFsPath(fsPath: string | undefined): boolean {
  if (!fsPath) {
    return false;
  }
  return path.basename(fsPath).endsWith(AIRP_JSON_SUFFIX);
}

export function defaultExportBasename(
  inputFsPath: string,
  format: "html" | "markdown"
): string {
  const base = path.basename(inputFsPath, AIRP_JSON_SUFFIX);
  return format === "html" ? `${base}.html` : `${base}.md`;
}

/**
 * Save-dialog default path: last export directory when it still exists,
 * otherwise the directory of the source `*.airp.json`.
 */
export function resolveExportDefaultPath(
  inputFsPath: string,
  format: "html" | "markdown",
  lastExportDir: string | undefined
): string {
  const fileName = defaultExportBasename(inputFsPath, format);
  const fallbackDir = path.dirname(path.resolve(inputFsPath));
  if (lastExportDir && existsSync(lastExportDir)) {
    return path.join(lastExportDir, fileName);
  }
  return path.join(fallbackDir, fileName);
}
