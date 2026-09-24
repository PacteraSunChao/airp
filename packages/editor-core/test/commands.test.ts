import { readFileSync } from "node:fs";
import { AT_ID_PATTERN } from "@airp/protocol";
import { documentPath } from "@airp/test-kit";
import { describe, expect, it } from "vitest";
import {
  duplicateValue,
  indexDocumentAtIds,
  insertValue,
  moveValue,
  type NodePath,
  readValue,
  removeValue,
  setValue,
  withUniqueAtIds,
} from "../src/index.js";

const FIXTURE = "section-at-id-1.1.0.airp.json";
const CHILD_TEXT: NodePath = ["blocks", 0, "children", 0, "text"];

function readDocument(): unknown {
  return JSON.parse(readFileSync(documentPath("valid", FIXTURE), "utf8"));
}

function arrayAt(document: unknown, path: NodePath): unknown[] {
  return readValue(document, path) as unknown[];
}

function recordAt(document: unknown, path: NodePath): Record<string, unknown> {
  return readValue(document, path) as Record<string, unknown>;
}

/** Every handle the document carries, duplicates included. */
function handlesOf(document: unknown): string[] {
  return indexDocumentAtIds(document).occurrences.map(
    (occurrence) => occurrence.atId
  );
}

function expectUniqueHandles(document: unknown): void {
  const handles = handlesOf(document);
  expect(new Set(handles).size).toBe(handles.length);
}

describe("readValue", () => {
  it("reads a nested value", () => {
    const document = readDocument();

    expect(readValue(document, CHILD_TEXT)).toContain("Body with");
  });

  it("returns the document for the root path", () => {
    const document = readDocument();

    expect(readValue(document, [])).toBe(document);
  });

  it("throws when the path is not there", () => {
    const document = readDocument();

    expect(() => readValue(document, ["blocks", 9])).toThrow(
      "Document path not found: /blocks/9"
    );
    expect(() => readValue(document, ["blocks", "text"])).toThrow(
      "Document path not found: /blocks/text"
    );
  });
});

describe("setValue", () => {
  it("replaces a nested value and leaves the input alone", () => {
    const document = readDocument();
    const next = setValue(document, CHILD_TEXT, "改写后的正文。");

    expect(readValue(next, CHILD_TEXT)).toBe("改写后的正文。");
    expect(readValue(document, CHILD_TEXT)).not.toBe("改写后的正文。");
  });

  it("shares untouched siblings", () => {
    const document = readDocument();
    const next = setValue(document, CHILD_TEXT, "x");

    expect(arrayAt(next, ["blocks"])).not.toBe(arrayAt(document, ["blocks"]));
    expect(arrayAt(next, ["blocks"])[1]).toBe(arrayAt(document, ["blocks"])[1]);
  });

  it("throws when the path is not there", () => {
    expect(() => setValue(readDocument(), ["blocks", 9], "x")).toThrow(
      "Document path not found: /blocks/9"
    );
  });
});

describe("insertValue", () => {
  it("inserts at an index with a fresh handle", () => {
    const document = readDocument();
    const next = insertValue(document, ["blocks", 0, "children"], 1, {
      type: "paragraph",
      "@id": "zzzzzzzzzz",
      text: "new",
    });
    const children = arrayAt(next, ["blocks", 0, "children"]);
    const inserted = recordAt(next, ["blocks", 0, "children", 1]);

    expect(children).toHaveLength(3);
    expect(inserted["@id"]).toMatch(AT_ID_PATTERN);
    expect(inserted["@id"]).not.toBe("zzzzzzzzzz");
    expect(inserted.text).toBe("new");
    expectUniqueHandles(next);
  });

  it("appends at the end", () => {
    const document = readDocument();
    const blocks = arrayAt(document, ["blocks"]);
    const next = insertValue(document, ["blocks"], blocks.length, {
      type: "paragraph",
      "@id": "zzzzzzzzzz",
      text: "last",
    });

    expect(arrayAt(next, ["blocks"])).toHaveLength(blocks.length + 1);
    expect(readValue(next, ["blocks", blocks.length, "text"])).toBe("last");
  });

  it("throws when the target is not an array", () => {
    expect(() =>
      insertValue(readDocument(), ["blocks", 0, "title"], 0, {})
    ).toThrow("Cannot change /blocks/0/title: the target is not an array");
  });

  it("throws when the index is out of range", () => {
    expect(() =>
      insertValue(readDocument(), ["blocks"], 99, { type: "paragraph" })
    ).toThrow("Cannot change /blocks: index 99 is out of range");
  });
});

describe("removeValue", () => {
  it("removes an array item and keeps the others", () => {
    const document = readDocument();
    const next = removeValue(document, ["blocks", 0, "children", 0]);
    const children = arrayAt(next, ["blocks", 0, "children"]);

    expect(children).toHaveLength(1);
    expect(children[0]).toBe(arrayAt(document, ["blocks", 0, "children"])[1]);
  });

  it("removes an object key", () => {
    const document = readDocument();
    const next = removeValue(document, ["blocks", 0, "title"]);

    expect(() => readValue(next, ["blocks", 0, "title"])).toThrow(
      "Document path not found"
    );
    expect(readValue(next, ["blocks", 0, "@id"])).toBe("aaaaaaaaaa");
  });

  it("throws when the path is not there", () => {
    expect(() => removeValue(readDocument(), ["blocks", 0, "nope"])).toThrow(
      "Document path not found: /blocks/0/nope"
    );
  });
});

describe("moveValue", () => {
  it("reorders an array and keeps the same handles", () => {
    const document = readDocument();
    const next = moveValue(document, ["blocks", 0, "children", 1], 0);
    const children = arrayAt(next, ["blocks", 0, "children"]);

    expect(recordAt(next, ["blocks", 0, "children", 0])["@id"]).toBe(
      "cccccccccc"
    );
    expect(recordAt(next, ["blocks", 0, "children", 1])["@id"]).toBe(
      "bbbbbbbbbb"
    );
    expect(children).toHaveLength(2);
    expect(handlesOf(next).sort()).toEqual(handlesOf(document).sort());
  });

  it("throws when the parent is not an array", () => {
    expect(() => moveValue(readDocument(), ["blocks", 0, "title"], 0)).toThrow(
      "Cannot change /blocks/0/title: the parent is not an array"
    );
  });

  it("throws when the index is out of range", () => {
    expect(() =>
      moveValue(readDocument(), ["blocks", 0, "children", 0], 9)
    ).toThrow("Cannot change /blocks/0/children/0: index 9 is out of range");
  });
});

describe("duplicateValue", () => {
  it("copies a node right after itself with fresh handles", () => {
    const document = readDocument();
    const next = duplicateValue(document, ["blocks", 0, "children", 0]);
    const original = recordAt(document, ["blocks", 0, "children", 0]);
    const copy = recordAt(next, ["blocks", 0, "children", 1]);

    expect(arrayAt(next, ["blocks", 0, "children"])).toHaveLength(3);
    expect(copy.text).toBe(original.text);
    expect(copy["@id"]).not.toBe(original["@id"]);
    expectUniqueHandles(next);
  });

  it("re-issues nested handles too", () => {
    const document = readDocument();
    const next = duplicateValue(document, ["blocks", 0]);

    expect(handlesOf(next)).toHaveLength(handlesOf(document).length + 4);
    expectUniqueHandles(next);
  });

  it("throws when the parent is not an array", () => {
    expect(() =>
      duplicateValue(readDocument(), ["blocks", 0, "title"])
    ).toThrow("Cannot change /blocks/0/title: the parent is not an array");
  });
});

describe("withUniqueAtIds", () => {
  it("copies the value even when there is nothing to re-issue", () => {
    const document = readDocument();
    const value = { type: "paragraph", text: "x" };
    const copy = withUniqueAtIds(value, document);

    expect(copy).not.toBe(value);
    expect(copy).toEqual(value);
  });

  it("re-issues every handle in the value and keeps the rest", () => {
    const document = readDocument();
    const value = {
      "@id": "aaaaaaaaaa",
      type: "section",
      children: [{ "@id": "bbbbbbbbbb", type: "paragraph", text: "x" }],
    };
    const copy = recordAt(withUniqueAtIds(value, document), []);
    const children = arrayAt(copy, ["children"]);

    expect(copy["@id"]).toMatch(AT_ID_PATTERN);
    expect(copy["@id"]).not.toBe("aaaaaaaaaa");
    expect(children).toHaveLength(1);
    expect(recordAt(copy, ["children", 0])["@id"]).not.toBe("bbbbbbbbbb");
    expect(readValue(copy, ["children", 0, "text"])).toBe("x");
    expect(value["@id"]).toBe("aaaaaaaaaa");
  });

  it("leaves nodes without a handle alone", () => {
    const copy = recordAt(
      withUniqueAtIds({ type: "paragraph", text: "x" }, readDocument()),
      []
    );

    expect(copy["@id"]).toBeUndefined();
  });

  it("replaces a malformed handle", () => {
    const copy = recordAt(
      withUniqueAtIds({ "@id": "BAD", type: "paragraph" }, readDocument()),
      []
    );

    expect(copy["@id"]).toMatch(AT_ID_PATTERN);
  });
});

describe("mutations", () => {
  it("never write to the input document", () => {
    const document = readDocument();
    const snapshot = JSON.parse(JSON.stringify(document));

    setValue(document, CHILD_TEXT, "x");
    insertValue(document, ["blocks"], 0, { type: "paragraph" });
    removeValue(document, ["blocks", 0, "children", 0]);
    moveValue(document, ["blocks", 0, "children", 0], 1);
    duplicateValue(document, ["blocks", 1]);
    withUniqueAtIds(readDocument(), document);

    expect(document).toEqual(snapshot);
  });
});
