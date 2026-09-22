import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);

/** Absolute path to the HTML target `dist/` (CSS/scripts live here). */
export function resolveHtmlTargetDistDir(): string {
  const packageJsonPath = require.resolve(
    "@airp/renderer-target-html/package.json"
  );
  return path.join(path.dirname(packageJsonPath), "dist");
}

/** Node HTML entry under dist (Mermaid→SVG). */
export function resolveHtmlTargetNodeDistIndex(): string {
  return path.join(resolveHtmlTargetDistDir(), "node", "index.mjs");
}
