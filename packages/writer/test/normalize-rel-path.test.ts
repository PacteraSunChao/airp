import { describe, expect, it } from "vitest";
import { normalizeRelPath } from "../src/normalize-rel-path.js";

const INVALID_REL_PATH = /Invalid output relative path/;

describe("normalizeRelPath", () => {
  it("normalizes ./ and backslashes", () => {
    expect(normalizeRelPath("./a/b.md")).toBe("a/b.md");
    expect(normalizeRelPath("a\\b.md")).toBe("a/b.md");
  });

  it("rejects empty, absolute, trailing slash, and dot segments", () => {
    expect(() => normalizeRelPath("")).toThrow(INVALID_REL_PATH);
    expect(() => normalizeRelPath("/abs")).toThrow(INVALID_REL_PATH);
    expect(() => normalizeRelPath("a/")).toThrow(INVALID_REL_PATH);
    expect(() => normalizeRelPath("a/../b")).toThrow(INVALID_REL_PATH);
    expect(() => normalizeRelPath("a/./b")).toThrow(INVALID_REL_PATH);
  });
});
