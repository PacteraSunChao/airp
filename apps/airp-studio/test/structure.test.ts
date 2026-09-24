import { readFileSync } from "node:fs";
import { indexDocumentAtIds } from "@airp/editor-core";
import { AT_ID_PATTERN } from "@airp/protocol";
import { documentPath } from "@airp/test-kit";
import { describe, expect, it } from "vitest";
import {
  canMove,
  insertBlockAfter,
  moveBlock,
  removeBlock,
  siblingCount,
} from "../src/structure.js";

function readDocument(): unknown {
  return JSON.parse(
    readFileSync(documentPath("valid", "section-at-id-1.1.0.airp.json"), "utf8")
  );
}

function childrenOf(
  document: unknown,
  index: number
): Record<string, unknown>[] {
  const block = (document as { blocks: { children?: unknown }[] }).blocks[
    index
  ];
  return (block?.children ?? []) as Record<string, unknown>[];
}

describe("siblingCount", () => {
  it("counts the array that holds the node", () => {
    const document = readDocument();

    expect(siblingCount(document, ["blocks", 0, "children", 0])).toBe(2);
    expect(siblingCount(document, ["blocks", 1])).toBe(3);
  });

  it("rejects a path that is not inside an array", () => {
    expect(() => siblingCount(readDocument(), ["meta", "title"])).toThrow(
      "Not a node inside an array: meta/title"
    );
  });
});

describe("canMove", () => {
  it("reports the ends of the list", () => {
    const document = readDocument();

    expect(canMove(document, ["blocks", 0, "children", 0], -1)).toBe(false);
    expect(canMove(document, ["blocks", 0, "children", 0], 1)).toBe(true);
    expect(canMove(document, ["blocks", 1], 1)).toBe(true);
    expect(canMove(document, ["blocks", 2], 1)).toBe(false);
  });
});

describe("insertBlockAfter", () => {
  it("seeds a block with a fresh handle and reports it", () => {
    const document = readDocument();
    const inserted = insertBlockAfter(
      document,
      ["blocks", 0, "children", 0],
      "paragraph",
      "1.1.0"
    );
    const children = childrenOf(inserted.document, 0);
    const added = children[1];

    expect(children).toHaveLength(3);
    expect(inserted.atId).toMatch(AT_ID_PATTERN);
    expect(added?.["@id"]).toBe(inserted.atId);
    expect(added?.type).toBe("paragraph");
    expect(added?.text).toBe("");
    expect(
      new Set(
        indexDocumentAtIds(inserted.document).occurrences.map((o) => o.atId)
      ).size
    ).toBe(indexDocumentAtIds(inserted.document).occurrences.length);
  });

  it("keeps the original document untouched", () => {
    const document = readDocument();
    insertBlockAfter(
      document,
      ["blocks", 0, "children", 0],
      "paragraph",
      "1.1.0"
    );

    expect(childrenOf(document, 0)).toHaveLength(2);
  });
});

describe("removeBlock", () => {
  it("drops exactly the addressed block", () => {
    const next = removeBlock(readDocument(), ["blocks", 1]);

    expect((next as { blocks: unknown[] }).blocks).toHaveLength(2);
    expect(indexDocumentAtIds(next).byAtId.has("eeeeeeeeee")).toBe(false);
    expect(indexDocumentAtIds(next).byAtId.has("aaaaaaaaaa")).toBe(true);
  });
});

describe("moveBlock", () => {
  it("swaps a block with its neighbour", () => {
    const next = moveBlock(readDocument(), ["blocks", 0, "children", 0], 1);
    const children = childrenOf(next, 0);

    expect(children[0]?.["@id"]).toBe("cccccccccc");
    expect(children[1]?.["@id"]).toBe("bbbbbbbbbb");
  });

  it("refuses to move past the end of the list", () => {
    expect(() =>
      moveBlock(readDocument(), ["blocks", 0, "children", 0], -1)
    ).toThrow("Cannot move past the end of the list");
  });
});
