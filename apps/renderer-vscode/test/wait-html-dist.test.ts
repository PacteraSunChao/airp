import { readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mkdtempTestingUnit } from "@airp/test-kit";
import { describe, expect, it } from "vitest";
import {
  htmlTargetDistFiles,
  resolveHtmlTargetDistDir,
  waitForHtmlTargetDist,
  waitHtmlDistPlugin,
} from "../scripts/wait-html-dist.mjs";

describe("airp-renderer-vscode unit wait html dist", () => {
  it("resolves the html target dist directory", () => {
    const distDir = resolveHtmlTargetDistDir();
    expect(distDir.endsWith(`${path.sep}dist`)).toBe(true);
    expect(htmlTargetDistFiles(distDir)).toEqual([
      path.join(distDir, "index.mjs"),
      path.join(distDir, "node", "index.mjs"),
    ]);
  });

  it("returns when injected dist files exist", async () => {
    const distDir = await mkdtempTestingUnit(
      "airp-renderer-vscode",
      "html-dist-"
    );
    const files = htmlTargetDistFiles(distDir);
    await mkdir(path.dirname(files[1]), { recursive: true });
    await writeFile(files[0], "export {}\n");
    await writeFile(files[1], "export {}\n");
    await waitForHtmlTargetDist({ files, timeoutMs: 200, pollMs: 20 });
  });

  it("waits until missing dist files appear", async () => {
    const distDir = await mkdtempTestingUnit(
      "airp-renderer-vscode",
      "html-dist-late-"
    );
    const files = htmlTargetDistFiles(distDir);
    const pending = waitForHtmlTargetDist({
      files,
      timeoutMs: 2000,
      pollMs: 20,
    });
    await mkdir(path.dirname(files[1]), { recursive: true });
    await writeFile(files[0], "export {}\n");
    await writeFile(files[1], "export {}\n");
    await pending;
  });

  it("times out when dist files stay missing", async () => {
    const distDir = await mkdtempTestingUnit(
      "airp-renderer-vscode",
      "html-dist-miss-"
    );
    const files = htmlTargetDistFiles(distDir);
    await expect(
      waitForHtmlTargetDist({ files, timeoutMs: 80, pollMs: 20 })
    ).rejects.toThrow("Timed out waiting for html target dist");
  });

  it("hooks the wait plugin into the extension and render-worker bundles", () => {
    expect(waitHtmlDistPlugin().name).toBe("wait-html-dist");
    const esbuildSource = readFileSync(
      path.join(path.dirname(fileURLToPath(import.meta.url)), "../esbuild.mjs"),
      "utf8"
    );
    expect(esbuildSource.includes("waitHtmlDistPlugin()")).toBe(true);
  });
});
