import { stat } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const DIST_WAIT_MS = 30_000;
const DIST_POLL_MS = 100;
const HTML_TARGET_IMPORT = /^@airp\/renderer-target-html/;

/**
 * Absolute path to the HTML target `dist/`.
 * Resolve via `@airp/renderer` (direct dep) so pnpm isolation still finds the target.
 */
export function resolveHtmlTargetDistDir() {
  const rendererRequire = createRequire(require.resolve("@airp/renderer"));
  const packageJsonPath = rendererRequire.resolve(
    "@airp/renderer-target-html/package.json"
  );
  return path.join(path.dirname(packageJsonPath), "dist");
}

export function htmlTargetDistFiles(distDir = resolveHtmlTargetDistDir()) {
  return [
    path.join(distDir, "index.mjs"),
    path.join(distDir, "node", "index.mjs"),
  ];
}

/**
 * Poll until HTML target dist files exist (tsdown --watch may clean first).
 * @param {{ files?: string[]; timeoutMs?: number; pollMs?: number }} [options]
 */
export async function waitForHtmlTargetDist(options = {}) {
  const files = options.files ?? htmlTargetDistFiles();
  const timeoutMs = options.timeoutMs ?? DIST_WAIT_MS;
  const pollMs = options.pollMs ?? DIST_POLL_MS;
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await allExist(files)) {
      return;
    }
    await sleep(pollMs);
  }
  throw new Error(
    `Timed out waiting for html target dist: ${files.join(", ")}`
  );
}

/** esbuild plugin: wait for html dist before resolve (CLI-style). */
export function waitHtmlDistPlugin() {
  return {
    name: "wait-html-dist",
    setup(build) {
      build.onStart(async () => {
        await waitForHtmlTargetDist();
      });
      build.onResolve({ filter: HTML_TARGET_IMPORT }, async () => {
        await waitForHtmlTargetDist();
        return;
      });
    },
  };
}

async function allExist(files) {
  for (const filePath of files) {
    try {
      await stat(filePath);
    } catch {
      return false;
    }
  }
  return true;
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
