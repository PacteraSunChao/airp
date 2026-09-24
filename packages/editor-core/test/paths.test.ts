import { describe, expect, it } from "vitest";
import { fromJsonPointer, toJsonPointer } from "../src/paths.js";

describe("toJsonPointer", () => {
  it("renders the document root as an empty pointer", () => {
    expect(toJsonPointer([])).toBe("");
  });

  it("renders object keys and array indexes", () => {
    expect(toJsonPointer(["blocks", 0, "text"])).toBe("/blocks/0/text");
  });

  it("escapes ~ as ~0 and / as ~1", () => {
    expect(toJsonPointer(["a/b"])).toBe("/a~1b");
    expect(toJsonPointer(["a~b"])).toBe("/a~0b");
    expect(toJsonPointer(["~/"])).toBe("/~0~1");
  });
});

describe("fromJsonPointer", () => {
  it('treats both "" and "/" as the document root', () => {
    expect(fromJsonPointer("")).toEqual([]);
    expect(fromJsonPointer("/")).toEqual([]);
  });

  it("decodes object keys and canonical array indexes", () => {
    expect(fromJsonPointer("/blocks/0/text")).toEqual(["blocks", 0, "text"]);
  });

  it("unescapes ~1 before ~0 so ~01 stays a literal tilde-one", () => {
    expect(fromJsonPointer("/a~1b")).toEqual(["a/b"]);
    expect(fromJsonPointer("/a~0b")).toEqual(["a~b"]);
    expect(fromJsonPointer("/~01")).toEqual(["~1"]);
  });

  it("keeps non-canonical index tokens as string keys", () => {
    expect(fromJsonPointer("/01")).toEqual(["01"]);
    expect(fromJsonPointer("/blocks/-1")).toEqual(["blocks", "-1"]);
  });

  it("round-trips every path it encodes", () => {
    const paths = [
      [],
      ["blocks", 0, "children", 12, "title"],
      ["a/b", "c~d"],
      ["meta"],
    ];
    for (const path of paths) {
      expect(fromJsonPointer(toJsonPointer(path))).toEqual(path);
    }
  });
});
