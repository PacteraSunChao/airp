import path from "node:path";
import type { RenderTarget } from "@airp/renderer";
import { UsageError } from "@airp/utils/node";

const TARGET_EXTENSIONS: Record<RenderTarget, string> = {
  html: ".html",
  markdown: ".md",
};

/**
 * True when `candidate` is the same path as `other` after resolve.
 */
export function isSameResolvedPath(candidate: string, other: string): boolean {
  return path.resolve(candidate) === path.resolve(other);
}

/**
 * `--out` must be a single output file (`.html` / `.md`) matching `--target`.
 */
export function resolveOutFile(outPath: string, target: RenderTarget): string {
  const resolved = path.resolve(outPath);
  const expected = TARGET_EXTENSIONS[target];
  const ext = path.extname(path.basename(resolved)).toLowerCase();
  if (!ext) {
    throw new UsageError(
      `--out must be a single output file ending in ${expected} (got directory path: ${outPath})`
    );
  }
  if (ext !== expected) {
    throw new UsageError(
      `--out for --target ${target} must end with ${expected} (got ${outPath})`
    );
  }
  return resolved;
}

/**
 * Resolve `--out` and reject when it equals the document `--input`.
 */
export function resolveOutFileNotEqualInput(
  outPath: string,
  inputPath: string,
  target: RenderTarget
): string {
  const outFile = resolveOutFile(outPath, target);
  const inputFile = path.resolve(inputPath);
  if (isSameResolvedPath(outFile, inputFile)) {
    throw new UsageError(
      `--out must not equal --input (got ${outFile})`
    );
  }
  return outFile;
}

/** Default primary filename written under staging when `--out` is omitted. */
export function defaultPrimaryFilename(target: RenderTarget): string {
  return target === "html" ? "document.html" : "report.md";
}
