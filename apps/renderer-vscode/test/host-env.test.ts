import { describe, expect, it } from "vitest";
import { isCursorHost } from "../src/host-env";

describe("isCursorHost", () => {
  it("detects Cursor case-insensitively", () => {
    expect(isCursorHost("Cursor")).toBe(true);
    expect(isCursorHost("cursor")).toBe(true);
    expect(isCursorHost("CURSOR")).toBe(true);
  });

  it("rejects Visual Studio Code and empty names", () => {
    expect(isCursorHost("Visual Studio Code")).toBe(false);
    expect(isCursorHost("Code")).toBe(false);
    expect(isCursorHost("")).toBe(false);
  });
});
