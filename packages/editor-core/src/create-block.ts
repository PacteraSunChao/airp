/**
 * Build a new block to insert.
 *
 * Seeds exactly the fields the schema requires — taken from `readBlockShape` —
 * with the smallest value their shape allows: an empty string, `0`, `false`, the
 * first enum value, or `minItems`-many items for an array that demands them.
 * Content constraints such as `minLength` stay the author's to satisfy: a host
 * inserts an empty block and the author types into it.
 *
 * The handle is issued against `document`, so it never collides with a handle the
 * document already carries.
 */

import { generateAtId, type SchemaVersion } from "@airp/protocol";
import {
  type FieldShape,
  type ObjectShape,
  readBlockShape,
  type ValueShape,
} from "./block-shape.js";
import { withUniqueAtIds } from "./commands.js";

/** Child block used when a required nested block has to be created from scratch. */
const NEUTRAL_BLOCK_TYPE = "paragraph";

interface SeedContext {
  document: unknown;
  schemaVersion: SchemaVersion;
}

function withRequiredFields(
  value: Record<string, unknown>,
  fields: readonly FieldShape[],
  ctx: SeedContext
): Record<string, unknown> {
  for (const field of fields) {
    if (field.required) {
      value[field.key] = seedValue(field.shape, ctx);
    }
  }
  return value;
}

function seedObject(
  shape: ObjectShape,
  ctx: SeedContext
): Record<string, unknown> {
  const value: Record<string, unknown> = {};
  if (shape.requiresHandle) {
    value["@id"] = generateAtId();
  }
  return withRequiredFields(value, shape.fields, ctx);
}

function seedBlock(
  types: readonly string[],
  ctx: SeedContext
): Record<string, unknown> {
  const type = types.includes(NEUTRAL_BLOCK_TYPE)
    ? NEUTRAL_BLOCK_TYPE
    : types[0];
  return type === undefined
    ? {}
    : createBlock(type, ctx.schemaVersion, ctx.document);
}

function seedValue(shape: ValueShape, ctx: SeedContext): unknown {
  switch (shape.kind) {
    case "boolean":
      return false;
    case "number":
      return 0;
    case "enum":
      return shape.values[0] ?? "";
    case "array":
      return Array.from({ length: shape.minItems ?? 0 }, () =>
        seedValue(shape.items, ctx)
      );
    case "object":
      return seedObject(shape, ctx);
    case "block":
      return seedBlock(shape.types, ctx);
    default:
      return "";
  }
}

/** A new block of `type`, with the fields the schema requires already seeded. */
export function createBlock(
  type: string,
  schemaVersion: SchemaVersion,
  document: unknown
): Record<string, unknown> {
  const shape = readBlockShape(type, schemaVersion);
  if (shape === undefined) {
    throw new Error(`Unknown block type: ${type}`);
  }

  const block: Record<string, unknown> = { type };
  if (shape.requiresHandle) {
    block["@id"] = generateAtId();
  }
  withRequiredFields(block, shape.fields, { document, schemaVersion });
  return withUniqueAtIds(block, document);
}
