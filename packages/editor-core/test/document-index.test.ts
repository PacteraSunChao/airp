import { readFileSync } from "node:fs";
import { documentPath } from "@airp/test-kit";
import { describe, expect, it } from "vitest";
import { atIdAtPath, indexDocumentAtIds, pathOfAtId } from "../src/index.js";

const SECTION_FIXTURE = "section-at-id-1.1.0.airp.json";

/** The fixture walks blocks → nested sections, citation items, table rows/cols. */
const SECTION_PATHS: Record<string, readonly (string | number)[]> = {
  aaaaaaaaaa: ["blocks", 0],
  bbbbbbbbbb: ["blocks", 0, "children", 0],
  cccccccccc: ["blocks", 0, "children", 1],
  dddddddddd: ["blocks", 0, "children", 1, "children", 0],
  eeeeeeeeee: ["blocks", 1],
  ffffffffff: ["blocks", 1, "items", 0],
  gggggggggg: ["blocks", 1, "items", 1],
  hhhhhhhhhh: ["blocks", 2],
  iiiiiiiiii: ["blocks", 2, "columns", 0],
  jjjjjjjjjj: ["blocks", 2, "columns", 1],
  kkkkkkkkkk: ["blocks", 2, "rows", 0],
  llllllllll: ["blocks", 2, "rows", 1],
};

function readFixture(name: string): unknown {
  return JSON.parse(readFileSync(documentPath("valid", name), "utf8"));
}

describe("indexDocumentAtIds", () => {
  it("indexes blocks, nested children, and structured objects alike", () => {
    const index = indexDocumentAtIds(readFixture(SECTION_FIXTURE));

    expect(index.occurrences).toHaveLength(Object.keys(SECTION_PATHS).length);
    expect(index.duplicateAtIds).toEqual([]);
    for (const occurrence of index.occurrences) {
      expect(occurrence.isWellFormed).toBe(true);
    }
    for (const [atId, path] of Object.entries(SECTION_PATHS)) {
      expect(pathOfAtId(index, atId)).toEqual(path);
    }
  });

  it("records a carrier type only when the node declares one", () => {
    const index = indexDocumentAtIds(readFixture(SECTION_FIXTURE));
    const types = new Map(
      index.occurrences.map((occurrence) => [occurrence.atId, occurrence.type])
    );

    expect(types.get("aaaaaaaaaa")).toBe("section");
    expect(types.get("cccccccccc")).toBe("section");
    expect(types.get("hhhhhhhhhh")).toBe("table");
    expect(types.get("iiiiiiiiii")).toBeUndefined();
    expect(types.get("kkkkkkkkkk")).toBeUndefined();
    expect(types.get("ffffffffff")).toBeUndefined();
  });

  it("resolves handles in both directions", () => {
    const index = indexDocumentAtIds(readFixture(SECTION_FIXTURE));

    for (const occurrence of index.occurrences) {
      expect(atIdAtPath(index, occurrence.path)).toBe(occurrence.atId);
    }
    expect(atIdAtPath(index, ["meta"])).toBeUndefined();
    expect(atIdAtPath(index, ["blocks", 9])).toBeUndefined();
  });

  it("reports duplicates without dropping the later occurrence", () => {
    const index = indexDocumentAtIds({
      blocks: [
        { type: "paragraph", "@id": "duplicated0", text: "first" },
        { type: "paragraph", "@id": "duplicated0", text: "second" },
      ],
    });

    expect(index.duplicateAtIds).toEqual(["duplicated0"]);
    expect(pathOfAtId(index, "duplicated0")).toEqual(["blocks", 0]);
    expect(index.pathsByAtId.get("duplicated0")).toEqual([
      ["blocks", 0],
      ["blocks", 1],
    ]);
  });

  it("records malformed handles instead of rejecting them", () => {
    const index = indexDocumentAtIds({
      blocks: [{ type: "paragraph", "@id": "TOO-SHORT", text: "x" }],
    });

    expect(index.occurrences).toHaveLength(1);
    expect(index.occurrences[0]?.isWellFormed).toBe(false);
    expect(pathOfAtId(index, "TOO-SHORT")).toEqual(["blocks", 0]);
    expect(atIdAtPath(index, ["blocks", 0])).toBe("TOO-SHORT");
  });

  it("survives a cyclic object graph without hanging", () => {
    const cyclic: Record<string, unknown> = {
      blocks: [{ type: "paragraph", "@id": "cccccccccc", text: "x" }],
    };
    cyclic.self = cyclic;

    expect(indexDocumentAtIds(cyclic).occurrences).toHaveLength(1);
  });

  it("ignores non-string and empty handles", () => {
    const index = indexDocumentAtIds({
      blocks: [
        { type: "paragraph", "@id": 42, text: "x" },
        { type: "paragraph", "@id": "", text: "y" },
      ],
    });

    expect(index.occurrences).toEqual([]);
  });
});
