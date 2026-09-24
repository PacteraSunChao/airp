/**
 * Guard for the label tables.
 *
 * The form is derived from the schema, so a field the tables do not name would
 * silently appear as `someNewKey` the day the schema gains one. These tests turn
 * that into a failure here instead of a surprise in the editor.
 */

import {
  listBlockTypes,
  readBlockShape,
  type ValueShape,
} from "@airp/editor-core";
import { describe, expect, it } from "vitest";
import { enumValueLabel, fieldLabel } from "../src/field-labels.js";

const SCHEMA_VERSION = "1.1.0";

/**
 * Values that read as themselves. An HTTP method has no better name in Chinese
 * than `GET`, and inventing one would make the panel harder to read.
 */
const SHOWN_AS_IS = new Set([
  "apiInventory.method=DELETE",
  "apiInventory.method=GET",
  "apiInventory.method=PATCH",
  "apiInventory.method=POST",
  "apiInventory.method=PUT",
]);

/**
 * Every field reachable from a block. `FileTreeNode` is self-recursive, so a
 * shape already walked is skipped — that is the visited set `readBlockShape`
 * documents as the caller's job.
 */
function fieldsOf(
  shape: ValueShape,
  out: { key: string; shape: ValueShape }[],
  seen: Set<ValueShape> = new Set()
): void {
  if (seen.has(shape)) {
    return;
  }
  seen.add(shape);
  if (shape.kind === "object") {
    for (const field of shape.fields) {
      out.push({ key: field.key, shape: field.shape });
      fieldsOf(field.shape, out, seen);
    }
    return;
  }
  if (shape.kind === "array") {
    fieldsOf(shape.items, out, seen);
  }
}

/** Every field of a block type, or an empty list for an unknown type. */
function blockFields(type: string): { key: string; shape: ValueShape }[] {
  const shape = readBlockShape(type, SCHEMA_VERSION);
  if (shape === undefined) {
    return [];
  }
  const out: { key: string; shape: ValueShape }[] = [];
  fieldsOf(
    {
      fields: shape.fields,
      kind: "object",
      open: false,
      requiresHandle: shape.requiresHandle,
    },
    out
  );
  return out;
}

describe("field labels", () => {
  it("names every field every block declares", () => {
    const unnamed: string[] = [];
    for (const type of listBlockTypes(SCHEMA_VERSION)) {
      for (const field of blockFields(type)) {
        if (fieldLabel(type, field.key) === field.key) {
          unnamed.push(`${type}.${field.key}`);
        }
      }
    }
    expect(unnamed).toEqual([]);
  });

  it("names every value of every enum a block declares", () => {
    const unnamed: string[] = [];
    for (const type of listBlockTypes(SCHEMA_VERSION)) {
      for (const field of blockFields(type)) {
        if (field.shape.kind !== "enum") {
          continue;
        }
        for (const value of field.shape.values) {
          const id = `${type}.${field.key}=${value}`;
          if (SHOWN_AS_IS.has(id)) {
            continue;
          }
          if (enumValueLabel(type, field.key, value) === value) {
            unnamed.push(id);
          }
        }
      }
    }
    expect(unnamed).toEqual([]);
  });

  it("falls back to the raw name rather than inventing one", () => {
    expect(fieldLabel("paragraph", "notAField")).toBe("notAField");
    expect(enumValueLabel("paragraph", "status", "notAValue")).toBe(
      "notAValue"
    );
  });
});
