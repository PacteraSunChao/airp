import { describe, expect, it } from "vitest";
import {
  type BlockShape,
  type FieldShape,
  listBlockTypes,
  type ObjectShape,
  readBlockShape,
  type ValueShape,
} from "../src/index.js";

const VERSION = "1.1.0";
const BLOCK_TYPE_COUNT = 46;

function readShape(type: string): BlockShape {
  const shape = readBlockShape(type, VERSION);
  if (shape === undefined) {
    throw new Error(`missing shape for ${type}`);
  }
  return shape;
}

function fieldOf(shape: BlockShape, key: string): FieldShape {
  const field = shape.fields.find((candidate) => candidate.key === key);
  if (field === undefined) {
    throw new Error(`${shape.type} has no field ${key}`);
  }
  return field;
}

function arrayItemsOf(shape: ValueShape): ValueShape {
  if (shape.kind !== "array") {
    throw new Error(`expected an array shape, got ${shape.kind}`);
  }
  return shape.items;
}

function objectOf(shape: ValueShape): ObjectShape {
  if (shape.kind !== "object") {
    throw new Error(`expected an object shape, got ${shape.kind}`);
  }
  return shape;
}

function objectFieldOf(shape: ObjectShape, key: string): FieldShape {
  const field = shape.fields.find((candidate) => candidate.key === key);
  if (field === undefined) {
    throw new Error(`object has no field ${key}`);
  }
  return field;
}

function everyShape(
  shape: ValueShape,
  visit: (value: ValueShape) => void,
  seen = new Set<ValueShape>()
): void {
  if (seen.has(shape)) {
    return;
  }
  seen.add(shape);
  visit(shape);
  if (shape.kind === "array") {
    everyShape(shape.items, visit, seen);
  }
  if (shape.kind === "object") {
    for (const field of shape.fields) {
      everyShape(field.shape, visit, seen);
    }
  }
}

describe("listBlockTypes", () => {
  it("lists every declared block type in schema order", () => {
    const types = listBlockTypes(VERSION);

    expect(types).toHaveLength(BLOCK_TYPE_COUNT);
    expect(types[0]).toBe("hero");
    expect(types.at(-1)).toBe("agentNote");
  });

  it("covers every supported schema version", () => {
    expect(listBlockTypes("1.0.0")).toHaveLength(BLOCK_TYPE_COUNT);
    expect(readBlockShape("paragraph", "1.0.0")).toBeDefined();
  });
});

describe("readBlockShape", () => {
  it("returns undefined for a type the schema does not declare", () => {
    expect(readBlockShape("not-a-block", VERSION)).toBeUndefined();
  });

  it("derives a usable shape for every block type", () => {
    const unknown: string[] = [];
    const empty: string[] = [];
    const duplicated: string[] = [];

    for (const type of listBlockTypes(VERSION)) {
      const shape = readShape(type);
      if (shape.fields.length === 0) {
        empty.push(type);
      }
      const keys = shape.fields.map((field) => field.key);
      if (new Set(keys).size !== keys.length) {
        duplicated.push(type);
      }
      for (const field of shape.fields) {
        everyShape(field.shape, (value) => {
          if (value.kind === "unknown") {
            unknown.push(`${type}.${field.key}`);
          }
        });
      }
    }

    expect(unknown).toEqual([]);
    expect(empty).toEqual([]);
    expect(duplicated).toEqual([]);
  });

  it("drops @id and type, and keeps importance only where declared", () => {
    expect(readShape("paragraph").fields.map((field) => field.key)).toEqual([
      "text",
    ]);
    expect(fieldOf(readShape("table"), "importance").shape).toEqual({
      kind: "enum",
      values: ["hero", "primary", "secondary", "reference"],
    });
  });

  it("marks the fields the schema requires", () => {
    const table = readShape("table");

    expect(fieldOf(table, "columns").required).toBe(true);
    expect(fieldOf(table, "rows").required).toBe(true);
    expect(fieldOf(table, "caption").required).toBe(false);
    expect(fieldOf(table, "importance").required).toBe(false);
    expect(fieldOf(readShape("code"), "code").required).toBe(true);
  });

  it("separates the two copy types from other strings", () => {
    expect(fieldOf(readShape("paragraph"), "text").shape).toEqual({
      kind: "markdown",
    });
    expect(fieldOf(readShape("table"), "caption").shape).toEqual({
      kind: "plain",
    });
    expect(fieldOf(readShape("code"), "code").shape).toEqual({
      kind: "string",
    });
    expect(fieldOf(readShape("code"), "language").shape).toEqual({
      kind: "string",
    });
    expect(fieldOf(readShape("mermaid"), "source").shape).toEqual({
      kind: "string",
    });
  });

  it("keeps enum values", () => {
    expect(fieldOf(readShape("keyValueList"), "layout").shape).toEqual({
      kind: "enum",
      values: ["auto", "stacked", "inline"],
    });
  });

  it("reads a string-or-number union as one scalar field", () => {
    const items = arrayItemsOf(fieldOf(readShape("collection"), "items").shape);
    const item = objectOf(items);

    expect(item.fields.find((field) => field.key === "value")?.shape).toEqual({
      kind: "stringOrNumber",
    });
  });

  it("models arrays through their item shape", () => {
    const bullets = fieldOf(readShape("bulletList"), "items").shape;

    expect(bullets).toEqual({
      kind: "array",
      items: { kind: "markdown" },
      minItems: 1,
    });

    const columns = fieldOf(readShape("table"), "columns").shape;
    expect(columns).toMatchObject({ kind: "array", minItems: 1 });
    const column = objectOf(arrayItemsOf(columns));
    expect(column.fields.map((field) => field.key)).toEqual([
      "key",
      "label",
      "cellKind",
      "align",
    ]);
    expect(column.fields.find((field) => field.key === "label")?.shape).toEqual(
      {
        kind: "plain",
      }
    );
  });

  it("marks nested blocks with the types the schema allows", () => {
    expect(
      fieldOf(readShape("architectureOverview"), "overview").shape
    ).toEqual({ kind: "block", types: ["mermaid"] });

    const children = arrayItemsOf(
      fieldOf(readShape("section"), "children").shape
    );
    expect(children).toEqual({ kind: "block", types: listBlockTypes(VERSION) });
  });

  it("keeps a self-recursive type finite", () => {
    const node = objectOf(fieldOf(readShape("fileTree"), "root").shape);

    expect(node.fields.map((field) => field.key)).toEqual([
      "name",
      "change",
      "annotation",
      "children",
    ]);
    expect(arrayItemsOf(objectFieldOf(node, "children").shape)).toBe(node);
  });

  it("reports open objects whose keys live elsewhere", () => {
    const rows = arrayItemsOf(fieldOf(readShape("table"), "rows").shape);

    expect(rows).toEqual({
      kind: "object",
      fields: [],
      open: true,
      requiresHandle: true,
    });
    expect(fieldOf(readShape("table"), "footerRow").shape).toEqual({
      kind: "object",
      fields: [],
      open: true,
      requiresHandle: true,
    });

    const items = arrayItemsOf(fieldOf(readShape("collection"), "items").shape);
    const meta = objectOf(items).fields.find((field) => field.key === "meta");
    expect(meta?.shape).toEqual({
      kind: "object",
      fields: [],
      open: true,
      requiresHandle: false,
    });
  });

  it("reports whether a node needs a machine handle", () => {
    const column = objectOf(
      arrayItemsOf(fieldOf(readShape("table"), "columns").shape)
    );

    expect(column.requiresHandle).toBe(true);
    expect(readShape("paragraph").requiresHandle).toBe(true);
    expect(readBlockShape("paragraph", "1.0.0")?.requiresHandle).toBe(false);
  });
});
