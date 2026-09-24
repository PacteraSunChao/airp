import { readFileSync } from "node:fs";
import { indexDocumentAtIds } from "@airp/editor-core";
import { documentPath } from "@airp/test-kit";
import { describe, expect, it } from "vitest";
import {
  appendArrayItem,
  blockAncestors,
  blockFieldSpecs,
  diagnosticEntries,
  documentText,
  dropArrayItem,
  isScalarShape,
  listBlocks,
  primaryTextField,
  readAt,
  resolveSelection,
  setScalarText,
  visibleDiagnostics,
} from "../src/studio.js";

const SECTION_FIXTURE = "section-at-id-1.1.0.airp.json";

function readDocument(name = SECTION_FIXTURE, folder = "valid"): unknown {
  return JSON.parse(readFileSync(documentPath(folder, name), "utf8"));
}

function specOf(specs: ReturnType<typeof blockFieldSpecs>, key: string) {
  const spec = specs.find((candidate) => candidate.key === key);
  if (spec === undefined) {
    throw new Error(`missing field ${key}`);
  }
  return spec;
}

function columnShape(document: unknown) {
  const columns = specOf(
    blockFieldSpecs(document, ["blocks", 2], "1.1.0"),
    "columns"
  );
  if (columns.shape.kind !== "array") {
    throw new Error("columns is not an array");
  }
  return columns.shape.items;
}

describe("listBlocks", () => {
  it("walks nested blocks with a human label", () => {
    const blocks = listBlocks(readDocument(), "1.1.0");

    expect(blocks).toHaveLength(6);
    expect(blocks[0]).toMatchObject({
      atId: "aaaaaaaaaa",
      label: "Overview",
      path: ["blocks", 0],
      type: "section",
    });
    expect(blocks[3]?.path).toEqual([
      "blocks",
      0,
      "children",
      1,
      "children",
      0,
    ]);
  });

  it("returns the chain of blocks that contains a selection", () => {
    const document_ = readDocument();
    const blocks = listBlocks(document_, "1.1.0");
    const deep = blocks[3];
    if (deep === undefined) {
      throw new Error("fixture has no nested block");
    }
    // Outermost first, the selection last: a block that covers its parent can
    // only be reached by clicking a descendant, so the ancestors come back here.
    expect(
      blockAncestors(blocks, deep.path).map((block) => block.path)
    ).toEqual([
      ["blocks", 0],
      ["blocks", 0, "children", 1],
      ["blocks", 0, "children", 1, "children", 0],
    ]);
    expect(blockAncestors(blocks, ["meta"])).toEqual([]);
  });

  it("separates array items from blocks hanging off an object field", () => {
    // `architectureOverview.overview` is a *field*, not an array item: the row
    // must stay listed so its fields are editable, but it has no siblings to
    // reorder, so structural actions never run on it.
    const blocks = listBlocks(readDocument("html-blocks.airp.json"), "1.1.0");
    const nested = blocks.filter((block) => !block.inArray);

    expect(nested.map((block) => block.path.join("/"))).toEqual([
      "blocks/1/children/21/overview",
    ]);
    expect(blocks.filter((block) => block.inArray).length).toBeGreaterThan(50);
  });
});

describe("blockFieldSpecs", () => {
  it("describes the fields a block declares", () => {
    const specs = blockFieldSpecs(readDocument(), ["blocks", 0], "1.1.0");

    expect(specOf(specs, "title")).toMatchObject({
      required: true,
      shape: { kind: "plain" },
    });
    expect(specOf(specs, "level").shape).toEqual({ kind: "number" });
    expect(specOf(specs, "children").shape).toMatchObject({ kind: "array" });
    expect(specOf(specs, "importance").shape).toMatchObject({
      kind: "enum",
      values: ["hero", "primary", "secondary", "reference"],
    });
  });

  it("returns nothing for a path that is not a block", () => {
    expect(blockFieldSpecs(readDocument(), ["meta"], "1.1.0")).toEqual([]);
  });
});

describe("isScalarShape", () => {
  it("separates controls from structure", () => {
    expect(isScalarShape({ kind: "plain" })).toBe(true);
    expect(isScalarShape({ kind: "enum", values: ["a"] })).toBe(true);
    expect(isScalarShape({ kind: "array", items: { kind: "plain" } })).toBe(
      false
    );
    expect(isScalarShape({ kind: "block", types: [] })).toBe(false);
  });
});

describe("readAt", () => {
  it("reads a value and tolerates an absent one", () => {
    const document = readDocument();

    expect(readAt(document, ["blocks", 0, "title"])).toBe("Overview");
    expect(readAt(document, ["blocks", 0, "importance"])).toBeUndefined();
    expect(readAt(document, ["blocks", 9, "title"])).toBeUndefined();
  });
});

describe("setScalarText", () => {
  it("writes a text field into a new document", () => {
    const document = readDocument();
    const path = ["blocks", 0, "children", 0, "text"];
    const shape = specOf(
      blockFieldSpecs(document, ["blocks", 0, "children", 0], "1.1.0"),
      "text"
    ).shape;
    const next = setScalarText(document, path, shape, "改写后的正文。");
    const before = documentText(document).split("\n");
    const after = documentText(next).split("\n");

    expect(readAt(next, path)).toBe("改写后的正文。");
    expect(after.filter((line, index) => line !== before[index])).toHaveLength(
      1
    );
  });

  it("coerces numbers and booleans", () => {
    const document = readDocument();
    const level = specOf(
      blockFieldSpecs(document, ["blocks", 0], "1.1.0"),
      "level"
    ).shape;

    expect(
      readAt(setScalarText(document, ["blocks", 0, "level"], level, "3"), [
        "blocks",
        0,
        "level",
      ])
    ).toBe(3);

    const note = {
      schemaVersion: "1.1.0",
      blocks: [
        { type: "agentNote", "@id": "agentnote0", visible: false, text: "x" },
      ],
    };
    const visible = specOf(
      blockFieldSpecs(note, ["blocks", 0], "1.1.0"),
      "visible"
    ).shape;

    expect(
      readAt(setScalarText(note, ["blocks", 0, "visible"], visible, "true"), [
        "blocks",
        0,
        "visible",
      ])
    ).toBe(true);
  });

  it("rejects text it cannot coerce, and shapes a form does not edit", () => {
    const document = readDocument();
    const level = specOf(
      blockFieldSpecs(document, ["blocks", 0], "1.1.0"),
      "level"
    ).shape;

    expect(() =>
      setScalarText(document, ["blocks", 0, "level"], level, "abc")
    ).toThrow("level must be a number");
    expect(() =>
      setScalarText(
        document,
        ["blocks", 0, "children"],
        { kind: "array", items: { kind: "plain" } },
        "[]"
      )
    ).toThrow("Not a field a form edits: array");
  });
});

describe("appendArrayItem", () => {
  it("seeds a new item with a fresh handle and reports it", () => {
    const document = readDocument();
    const appended = appendArrayItem(
      document,
      ["blocks", 2, "columns"],
      columnShape(document),
      "1.1.0"
    );
    const columns = readAt(appended.document, [
      "blocks",
      2,
      "columns",
    ]) as Record<string, unknown>[];

    expect(columns).toHaveLength(3);
    expect(columns[2]?.["@id"]).toBe(appended.atId);
    expect(columns[2]?.key).toBe("");
    expect(columns[2]?.label).toBe("");

    const handles = indexDocumentAtIds(appended.document).occurrences.map(
      (occurrence) => occurrence.atId
    );
    expect(new Set(handles).size).toBe(handles.length);
    expect(readAt(document, ["blocks", 2, "columns"])).toHaveLength(2);
  });
});

describe("dropArrayItem", () => {
  it("removes exactly the addressed item", () => {
    const next = dropArrayItem(readDocument(), ["blocks", 2, "columns"], 0);
    const columns = readAt(next, ["blocks", 2, "columns"]) as Record<
      string,
      unknown
    >[];

    expect(columns).toHaveLength(1);
    expect(columns[0]?.["@id"]).toBe("jjjjjjjjjj");
  });
});

describe("visibleDiagnostics", () => {
  const noise = [
    {
      code: "protocol.schema.get-schema-set.validation",
      message: "must have required property 'metrics'",
      severity: "error" as const,
      details: { keyword: "required" },
      location: { path: "/blocks/2" },
    },
    {
      code: "protocol.schema.get-schema-set.validation",
      message: "must NOT have additional properties",
      severity: "error" as const,
      details: { keyword: "additionalProperties" },
      location: { path: "/blocks/2" },
    },
    {
      code: "protocol.schema.get-schema-set.validation",
      message: "must be string",
      severity: "error" as const,
      details: { keyword: "type" },
      location: { path: "/blocks/2/items/0" },
    },
    {
      code: "protocol.schema.get-schema-set.validation",
      message: "must match exactly one schema in oneOf",
      severity: "error" as const,
      details: { keyword: "oneOf" },
      location: { path: "/blocks/2" },
    },
    {
      code: "protocol.schema.get-schema-set.validation",
      message: "must NOT have fewer than 1 characters",
      severity: "error" as const,
      details: { keyword: "minLength" },
      location: { path: "/blocks/2/columns/0/label" },
    },
  ];

  it("keeps what an author can act on and drops the union noise", () => {
    const kept = visibleDiagnostics(readDocument(), noise, "1.1.0");

    expect(kept.map((diagnostic) => diagnostic.message)).toEqual([
      "must NOT have fewer than 1 characters",
    ]);
  });

  it("keeps a diagnostic that carries no location at all", () => {
    const kept = visibleDiagnostics(
      readDocument(),
      [
        {
          code: "validate.validators.at-id.duplicate",
          message: "dup",
          severity: "error",
        },
      ],
      "1.1.0"
    );

    expect(kept).toHaveLength(1);
  });
});

describe("diagnosticEntries", () => {
  it("points a duplicate handle at the block that carries it", () => {
    const document = readDocument("duplicate-at-id-1.1.0.airp.json", "invalid");
    const entries = diagnosticEntries(
      document,
      [
        {
          code: "validate.validators.at-id.duplicate",
          message: "Duplicate @id",
          severity: "error",
          location: { path: "/blocks/1/@id" },
        },
      ],
      "1.1.0"
    );

    expect(entries).toEqual([
      {
        atId: "abcdefghij",
        code: "validate.validators.at-id.duplicate",
        message: "Duplicate @id",
        nodePath: ["blocks", 1],
      },
    ]);
  });

  it("is empty without diagnostics", () => {
    expect(diagnosticEntries(readDocument(), [], "1.1.0")).toEqual([]);
  });
});

describe("documentText", () => {
  it("parses back to the same document and ends with a newline", () => {
    const document = readDocument();
    const text = documentText(document);

    expect(text.endsWith("\n")).toBe(true);
    expect(JSON.parse(text)).toEqual(document);
  });
});

describe("resolveSelection", () => {
  it("resolves a block handle to that block and its fields", () => {
    const document_ = readDocument();
    const blocks = listBlocks(document_, "1.1.0");
    const found = resolveSelection(document_, blocks, "bbbbbbbbbb", "1.1.0");

    expect(found?.isBlock).toBe(true);
    expect(found?.block.path).toEqual(["blocks", 0, "children", 0]);
    expect(found?.fields.map((field) => field.key)).toEqual(["text"]);
  });

  it("resolves an item handle to the object inside its block", () => {
    // A table column carries a handle of its own, so the canvas can address it
    // even though it is not a block.
    const document_ = readDocument();
    const blocks = listBlocks(document_, "1.1.0");
    const found = resolveSelection(document_, blocks, "iiiiiiiiii", "1.1.0");

    expect(found?.isBlock).toBe(false);
    expect(found?.block.type).toBe("table");
    expect(found?.block.path).toEqual(["blocks", 2]);
    expect(found?.trail).toEqual(["列", "第 1 项"]);
    expect(found?.fields.map((field) => field.key)).toEqual([
      "key",
      "label",
      "cellKind",
      "align",
    ]);
  });

  it("resolves a citation entry to its own fields", () => {
    const document_ = readDocument();
    const blocks = listBlocks(document_, "1.1.0");
    const found = resolveSelection(document_, blocks, "ffffffffff", "1.1.0");

    expect(found?.isBlock).toBe(false);
    expect(found?.block.type).toBe("citation");
    expect(found?.fields.map((field) => field.key)).toContain("source");
  });

  it("has nothing to say about a handle the document does not carry", () => {
    const document_ = readDocument();
    const blocks = listBlocks(document_, "1.1.0");
    expect(
      resolveSelection(document_, blocks, "zzzzzzzzzz", "1.1.0")
    ).toBeUndefined();
  });
});

describe("primaryTextField", () => {
  it("picks the text the block is mostly made of", () => {
    const document_ = readDocument();
    const blocks = listBlocks(document_, "1.1.0");
    const paragraph = blocks.find((block) => block.type === "paragraph");
    if (paragraph === undefined) {
      throw new Error("fixture has no paragraph");
    }
    expect(primaryTextField(document_, paragraph.path, "1.1.0")).toMatchObject({
      key: "text",
      shape: { kind: "markdown" },
    });
  });

  it("offers nothing for a block with no text of its own", () => {
    const document_ = {
      blocks: [{ "@id": "aaaaaaaaaa", type: "divider" }],
      i18n: { locale: "zh-CN" },
      meta: { title: "t" },
      schemaVersion: "1.1.0",
    };
    expect(primaryTextField(document_, ["blocks", 0], "1.1.0")).toBeUndefined();
  });

  it("skips a string field the document does not actually carry", () => {
    const document_ = {
      blocks: [{ "@id": "aaaaaaaaaa", type: "heading", level: 2 }],
      i18n: { locale: "zh-CN" },
      meta: { title: "t" },
      schemaVersion: "1.1.0",
    };
    expect(primaryTextField(document_, ["blocks", 0], "1.1.0")).toBeUndefined();
  });
});
