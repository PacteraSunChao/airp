import { UsageError } from "@airp/utils/node";
import { describe, expect, it } from "vitest";
import { validateWatchModes } from "../src/supervisor/watch-validation.js";

describe("validateWatchModes", () => {
  it("allows html watch with serve", () => {
    expect(() =>
      validateWatchModes({
        explicitServe: true,
        target: "html",
        out: null,
        servePort: 4173,
      })
    ).not.toThrow();
  });

  it("allows html watch with out only", () => {
    expect(() =>
      validateWatchModes({
        explicitServe: false,
        target: "html",
        out: "dist/document.html",
        servePort: 4173,
      })
    ).not.toThrow();
  });

  it("rejects html watch without serve or out", () => {
    expect(() =>
      validateWatchModes({
        explicitServe: false,
        target: "html",
        out: null,
        servePort: 4173,
      })
    ).toThrow(new UsageError("html watch requires --serve and/or --out"));
  });

  it("rejects markdown watch without out", () => {
    expect(() =>
      validateWatchModes({
        explicitServe: false,
        target: "markdown",
        out: null,
        servePort: 4173,
      })
    ).toThrow(new UsageError("--out is required for --target markdown"));
  });

  it("rejects serve on markdown", () => {
    expect(() =>
      validateWatchModes({
        explicitServe: true,
        target: "markdown",
        out: "out.md",
        servePort: 4173,
      })
    ).toThrow(new UsageError("--serve is only valid with --target html"));
  });

  it("rejects serve-port without serve", () => {
    expect(() =>
      validateWatchModes({
        explicitServe: false,
        target: "html",
        out: "out.html",
        servePort: 8080,
      })
    ).toThrow(new UsageError("--serve-port requires --serve"));
  });
});
