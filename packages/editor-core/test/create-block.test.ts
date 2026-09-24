import { readFileSync } from "node:fs";
import { AT_ID_PATTERN, type SchemaVersion } from "@airp/protocol";
import { documentPath } from "@airp/test-kit";
import { validateDocument } from "@airp/validate";
import { describe, expect, it } from "vitest";
import {
  createBlock,
  indexDocumentAtIds,
  listBlockTypes,
  readBlockShape,
  type ValueShape,
} from "../src/index.js";

const VERSION: SchemaVersion = "1.1.0";

function readDocument(): unknown {
  return JSON.parse(
    readFileSync(documentPath("valid", "section-at-id-1.1.0.airp.json"), "utf8")
  );
}

function documentWith(block: Record<string, unknown>): unknown {
  return {
    schemaVersion: VERSION,
    meta: {
      title: "t",
      kind: "generic",
      createdAt: "2026-01-01T00:00:00.000Z",
      createdBy: "AIRP",
    },
    i18n: { locale: "en" },
    blocks: [block],
  };
}

function arrayOf(block: Record<string, unknown>, key: string): unknown[] {
  const value = block[key];
  if (!Array.isArray(value)) {
    throw new Error(`${key} is not an array: ${JSON.stringify(value)}`);
  }
  return value;
}

function handleOf(node: unknown): string {
  const handle = (node as Record<string, unknown>)["@id"];
  if (typeof handle !== "string") {
    throw new Error(`node carries no handle: ${JSON.stringify(node)}`);
  }
  return handle;
}

/** Assert a seeded value matches the shape it was seeded from, recursively. */
function expectSeeded(value: unknown, shape: ValueShape, where: string): void {
  switch (shape.kind) {
    case "plain":
    case "markdown":
    case "string":
    case "stringOrNumber":
      expect(typeof value, where).toBe("string");
      return;
    case "number":
      expect(typeof value, where).toBe("number");
      return;
    case "boolean":
      expect(typeof value, where).toBe("boolean");
      return;
    case "enum":
      expect(shape.values, where).toContain(value);
      return;
    case "array": {
      expect(Array.isArray(value), where).toBe(true);
      const items = value as unknown[];
      expect(items.length, where).toBeGreaterThanOrEqual(shape.minItems ?? 0);
      for (const [index, item] of items.entries()) {
        expectSeeded(item, shape.items, `${where}[${index}]`);
      }
      return;
    }
    case "object": {
      const record = value as Record<string, unknown>;
      if (shape.requiresHandle) {
        expect(handleOf(record), where).toMatch(AT_ID_PATTERN);
      }
      for (const field of shape.fields) {
        if (field.required) {
          expectSeeded(record[field.key], field.shape, `${where}.${field.key}`);
        }
      }
      return;
    }
    case "block": {
      const type = (value as Record<string, unknown>).type;
      expect(shape.types, where).toContain(type);
      return;
    }
    default:
      throw new Error(`unknown shape at ${where}`);
  }
}

describe("createBlock", () => {
  it("seeds the required fields and nothing else", () => {
    const block = createBlock("paragraph", VERSION, readDocument());

    expect(block.type).toBe("paragraph");
    expect(handleOf(block)).toMatch(AT_ID_PATTERN);
    expect(block.text).toBe("");
    expect(block.importance).toBeUndefined();
  });

  it("seeds minItems-many objects for an array that demands them", () => {
    const block = createBlock("table", VERSION, readDocument());
    const columns = arrayOf(block, "columns");
    const column = columns[0] as Record<string, unknown>;

    expect(columns).toHaveLength(1);
    expect(handleOf(column)).toMatch(AT_ID_PATTERN);
    expect(column.key).toBe("");
    expect(column.label).toBe("");
    expect(block.rows).toEqual([]);
    expect(block.caption).toBeUndefined();
  });

  it("seeds a legal enum value", () => {
    const shape = readBlockShape("collection", VERSION)?.fields.find(
      (field) => field.key === "variant"
    )?.shape;
    const block = createBlock("collection", VERSION, readDocument());

    expect(shape?.kind).toBe("enum");
    expect(shape?.kind === "enum" && shape.values).toContain(block.variant);
    expect(arrayOf(block, "items")).toHaveLength(1);
  });

  it("seeds every panel a required tabs block asks for", () => {
    const panels = arrayOf(
      createBlock("tabs", VERSION, readDocument()),
      "panels"
    );

    expect(panels).toHaveLength(2);
    for (const panel of panels) {
      expect(handleOf(panel)).toMatch(AT_ID_PATTERN);
      expect((panel as Record<string, unknown>).label).toBe("");
      expect((panel as Record<string, unknown>).children).toEqual([]);
    }
  });

  it("seeds a plain string array through its item shape", () => {
    const block = createBlock("bulletList", VERSION, readDocument());

    expect(block.items).toEqual([""]);
  });

  it("leaves a block without a handle requirement unhandled", () => {
    const block = createBlock("paragraph", "1.0.0", readDocument());

    expect(block.type).toBe("paragraph");
    expect(block["@id"]).toBeUndefined();
  });

  it("throws for a block type the schema does not declare", () => {
    expect(() => createBlock("not-a-block", VERSION, readDocument())).toThrow(
      "Unknown block type: not-a-block"
    );
  });

  it("seeds every block type from its own shape", () => {
    const document = readDocument();
    const used = new Set(indexDocumentAtIds(document).byAtId.keys());

    for (const type of listBlockTypes(VERSION)) {
      const shape = readBlockShape(type, VERSION);
      const block = createBlock(type, VERSION, document);

      expect(block.type).toBe(type);
      if (shape?.requiresHandle) {
        const handle = handleOf(block);
        expect(handle).toMatch(AT_ID_PATTERN);
        expect(used.has(handle)).toBe(false);
        used.add(handle);
      }
      for (const field of shape?.fields ?? []) {
        if (field.required) {
          expectSeeded(block[field.key], field.shape, `${type}.${field.key}`);
        } else {
          expect(block[field.key], `${type}.${field.key}`).toBeUndefined();
        }
      }
    }
  });

  it("validates cleanly when its required copy type has no length floor", async () => {
    const result = await validateDocument(
      documentWith(createBlock("paragraph", VERSION, readDocument()))
    );

    expect(result.diagnostics).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it("leaves content floors for the author to satisfy", async () => {
    const result = await validateDocument(
      documentWith(createBlock("section", VERSION, readDocument()))
    );
    const complaints = result.diagnostics.map(
      (diagnostic) => diagnostic.details?.keyword
    );

    // A required PlainString carries `minLength: 1`; an inserted empty block is
    // therefore invalid — and flagged — until the author types into it.
    expect(result.ok).toBe(false);
    expect(complaints).toContain("minLength");
  });
});
