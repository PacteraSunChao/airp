import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  defaultExportBasename,
  isAirpJsonFsPath,
  panelKey,
  resolveExportDefaultPath,
} from "../src/paths";

describe("paths", () => {
  it("keys sessions by resolved absolute path", () => {
    expect(panelKey("/tmp/doc.airp.json")).toContain("doc.airp.json");
  });

  it("detects *.airp.json basenames", () => {
    expect(isAirpJsonFsPath("/a/b/doc.airp.json")).toBe(true);
    expect(isAirpJsonFsPath("/a/b/doc.json")).toBe(false);
    expect(isAirpJsonFsPath(undefined)).toBe(false);
  });

  it("builds export basenames from the input stem", () => {
    expect(defaultExportBasename("/a/demo.airp.json", "html")).toBe(
      "demo.html"
    );
    expect(defaultExportBasename("/a/demo.airp.json", "markdown")).toBe(
      "demo.md"
    );
  });

  it("prefers the last export directory when it still exists", () => {
    const lastDir = mkdtempSync(path.join(tmpdir(), "airp-export-"));
    try {
      expect(
        resolveExportDefaultPath("/docs/demo.airp.json", "html", lastDir)
      ).toBe(path.join(lastDir, "demo.html"));
    } finally {
      rmSync(lastDir, { force: true, recursive: true });
    }
  });

  it("falls back to the source directory when last export dir is missing", () => {
    expect(
      resolveExportDefaultPath(
        "/docs/demo.airp.json",
        "markdown",
        "/no/such/export-dir"
      )
    ).toBe(path.join(path.resolve("/docs"), "demo.md"));
  });
});
