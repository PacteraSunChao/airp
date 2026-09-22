import { readFile } from "node:fs/promises";

const XML_HTTP_REQUEST_IMPL = /XMLHttpRequest-impl\.js$/;
const XHR_SYNC_WORKER_RESOLVE =
  /require\.resolve\s*\?\s*require\.resolve\(\s*["']\.\/xhr-sync-worker\.js["']\s*\)\s*:\s*null/;

/**
 * jsdom resolves `./xhr-sync-worker.js` at load time. After a fat CJS bundle that
 * relative path no longer exists next to the outfile. AIRP never uses sync XHR,
 * so replace the resolve with null (same as jsdom when require.resolve is absent).
 */
export function stubXhrSyncWorkerPlugin() {
  return {
    name: "stub-xhr-sync-worker",
    setup(build) {
      build.onLoad({ filter: XML_HTTP_REQUEST_IMPL }, async (args) => {
        const source = await readFile(args.path, "utf8");
        return {
          contents: source.replace(XHR_SYNC_WORKER_RESOLVE, "null"),
          loader: "js",
        };
      });
    },
  };
}
