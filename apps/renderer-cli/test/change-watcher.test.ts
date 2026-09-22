import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  ChangeWatcher,
  RENDERER_DIST_WATCH_PATH,
  type WatchChange,
} from "../src/supervisor/change-watcher.js";

const TEST_DEBOUNCE_MS = 50;
const WAIT_TIMEOUT_MS = 5000;

let cleanup: (() => Promise<void>) | undefined;

async function waitFor(
  predicate: () => boolean,
  timeoutMs = WAIT_TIMEOUT_MS
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (!predicate()) {
    if (Date.now() >= deadline) {
      throw new Error("Timed out waiting for watcher event");
    }
    await new Promise((resolve) => {
      setTimeout(resolve, 20);
    });
  }
}

afterEach(async () => {
  await cleanup?.();
  cleanup = undefined;
});

describe("ChangeWatcher renderer dist", () => {
  it("filters declarations and survives dist recreation", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "airp-change-watcher-"));
    // Keep input outside the watched package dir (matches CLI layout; avoids
    // FSEvents sibling noise between the airp file and dist/).
    const inputFile = path.join(root, "input", "document.airp.json");
    const distDir = path.join(root, "renderer-package", "dist");
    const nodeDir = path.join(distDir, "node");
    const indexFile = path.join(nodeDir, "index.mjs");
    await mkdir(path.dirname(inputFile), { recursive: true });
    await mkdir(nodeDir, { recursive: true });
    await writeFile(inputFile, "{}");
    await writeFile(indexFile, "export const version = 1;");

    const changes: WatchChange[][] = [];
    const watcher = new ChangeWatcher({
      debounceMs: TEST_DEBOUNCE_MS,
      inputFile,
      rendererDistDir: distDir,
      onChange: (batch) => {
        changes.push(batch);
      },
      onInterrupt: () => {
        // This test observes settled render batches only.
      },
    });
    await watcher.start();
    cleanup = async () => {
      await watcher.stop();
      await rm(root, { force: true, recursive: true });
    };

    await writeFile(path.join(nodeDir, "index.d.mts"), "export {};");
    await new Promise((resolve) => {
      setTimeout(resolve, TEST_DEBOUNCE_MS * 2);
    });
    expect(changes).toHaveLength(0);

    await rm(distDir, { force: true, recursive: true });
    await mkdir(nodeDir, { recursive: true });
    await writeFile(indexFile, "export const version = 2;");
    await waitFor(() => changes.length >= 1);
    expect(changes.at(-1)).toEqual([
      { kind: "change", path: RENDERER_DIST_WATCH_PATH },
    ]);

    // Let the recreate burst finish before asserting a second quiet render.
    await new Promise((resolve) => {
      setTimeout(resolve, TEST_DEBOUNCE_MS * 2);
    });
    const settled = changes.length;

    await writeFile(indexFile, "export const version = 3;");
    await waitFor(() => changes.length > settled);
    expect(changes.at(-1)).toEqual([
      { kind: "change", path: RENDERER_DIST_WATCH_PATH },
    ]);
  });
});
