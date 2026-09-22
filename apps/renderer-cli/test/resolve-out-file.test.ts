import path from "node:path";
import { UsageError } from "@airp/utils/node";
import { describe, expect, it } from "vitest";
import {
  resolveOutFile,
  resolveOutFileNotEqualInput,
} from "../src/out/resolve-out-file.js";

describe("resolveOutFile", () => {
  it("accepts .html for html target", () => {
    const resolved = resolveOutFile("out/report.html", "html");
    expect(path.basename(resolved)).toBe("report.html");
  });

  it("rejects wrong extension", () => {
    expect(() => resolveOutFile("out/report.md", "html")).toThrow(
      new UsageError(
        "--out for --target html must end with .html (got out/report.md)"
      )
    );
  });

  it("rejects directory path", () => {
    expect(() => resolveOutFile("out/report", "html")).toThrow(UsageError);
  });

  it("rejects out equal to input", () => {
    const same = path.resolve("doc.html");
    expect(() => resolveOutFileNotEqualInput(same, same, "html")).toThrow(
      UsageError
    );
  });
});
