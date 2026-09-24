/**
 * Editable shape of a block, derived from the versioned document schema.
 *
 * A host renders an editor from these shapes instead of hand-writing one form
 * per `Block.type`: the schema stays the single source of truth, and a new block
 * type gains a basic editor as soon as it is added there.
 *
 * `@id` and `type` are never fields — the document index owns the handle and the
 * host owns the type. `importance` is a field, but only for the block types that
 * declare it.
 *
 * A self-recursive type (`FileTreeNode`) reuses the shape it is still building,
 * so the result mirrors the schema instead of recursing forever. Hosts that walk
 * shapes without walking a value need a visited set; hosts that render a
 * concrete value recurse on the value and need none.
 */

import {
  assertSchemaVersion,
  documentSchemaRelPath,
  getSchema,
  type SchemaVersion,
} from "@airp/protocol";

/** How a host edits one value. */
export type ValueShape =
  | { kind: "plain" }
  | { kind: "markdown" }
  | { kind: "string" }
  | { kind: "stringOrNumber" }
  | { kind: "number" }
  | { kind: "boolean" }
  | { kind: "enum"; values: readonly string[] }
  | { kind: "array"; items: ValueShape; minItems?: number }
  | ObjectShape
  | { kind: "block"; types: readonly string[] }
  | { kind: "unknown" };

export interface FieldShape {
  key: string;
  required: boolean;
  shape: ValueShape;
}

/**
 * `open` reports whether the schema also accepts keys it does not declare
 * (table rows, free-form `meta`). An open object with no fields takes its keys
 * from elsewhere in the document — `table.rows` takes them from `columns`.
 */
export interface ObjectShape {
  fields: readonly FieldShape[];
  kind: "object";
  open: boolean;
}

export interface BlockShape {
  /** Schema definition carrying this block, e.g. `TableBlock`. */
  def: string;
  fields: readonly FieldShape[];
  type: string;
}

interface SchemaNode {
  $ref?: string;
  additionalProperties?: boolean;
  allOf?: readonly SchemaNode[];
  const?: unknown;
  enum?: readonly string[];
  items?: SchemaNode;
  minItems?: number;
  oneOf?: readonly SchemaNode[];
  properties?: Readonly<Record<string, SchemaNode>>;
  required?: readonly string[];
  type?: string | readonly string[];
}

interface DocumentSchema extends SchemaNode {
  $defs?: Readonly<Record<string, SchemaNode>>;
}

interface ShapeContext {
  blockDefs: ReadonlySet<string>;
  blockTypes: readonly string[];
  defs: Readonly<Record<string, SchemaNode>>;
  /** Object shapes still being derived, keyed by schema definition name. */
  pending: Map<string, ObjectShape>;
  typeByDef: ReadonlyMap<string, string>;
}

interface BlockCatalog {
  byType: ReadonlyMap<string, BlockShape>;
  types: readonly string[];
}

const BLOCK_UNION_DEF = "Block";
const NON_CONTENT_KEYS = new Set(["@id", "type"]);

const catalogs = new Map<SchemaVersion, BlockCatalog>();

function defNameOf(ref: string): string {
  return ref.slice(ref.lastIndexOf("/") + 1);
}

function derefNode(
  node: SchemaNode,
  defs: Readonly<Record<string, SchemaNode>>
): { def?: string; node: SchemaNode } {
  const ref = node.$ref;
  if (ref === undefined) {
    return { node };
  }
  const def = defNameOf(ref);
  const target = defs[def];
  return target === undefined ? { node } : { def, node: target };
}

/** The node plus every member it inherits through `allOf`. */
function membersOf(
  node: SchemaNode,
  defs: Readonly<Record<string, SchemaNode>>
): SchemaNode[] {
  const { node: resolved } = derefNode(node, defs);
  const members = [resolved];
  for (const member of resolved.allOf ?? []) {
    members.push(...membersOf(member, defs));
  }
  return members;
}

/** The `type` discriminator a block definition declares, e.g. `"table"`. */
function readTypeConst(
  node: SchemaNode,
  defs: Readonly<Record<string, SchemaNode>>
): string | undefined {
  for (const member of membersOf(node, defs)) {
    const declared = member.properties?.type?.const;
    if (typeof declared === "string") {
      return declared;
    }
  }
  return undefined;
}

function declaredTypesOf(node: SchemaNode): readonly (string | undefined)[] {
  const declared = node.type;
  if (typeof declared === "string" || declared === undefined) {
    return [declared];
  }
  return declared;
}

/** The nested-block shape, or `undefined` when the node is not a block. */
function readBlockValueShape(
  def: string | undefined,
  ctx: ShapeContext
): ValueShape | undefined {
  if (def === BLOCK_UNION_DEF) {
    return { kind: "block", types: ctx.blockTypes };
  }
  if (def === undefined || !ctx.blockDefs.has(def)) {
    return undefined;
  }
  const type = ctx.typeByDef.get(def);
  return { kind: "block", types: type === undefined ? [] : [type] };
}

function readScalarShape(
  def: string | undefined,
  types: readonly (string | undefined)[]
): ValueShape {
  if (types.includes("boolean")) {
    return { kind: "boolean" };
  }
  if (types.includes("number") || types.includes("integer")) {
    if (types.includes("string")) {
      return { kind: "stringOrNumber" };
    }
    return { kind: "number" };
  }
  if (!types.includes("string")) {
    return { kind: "unknown" };
  }
  if (def === "MarkdownString") {
    return { kind: "markdown" };
  }
  if (def === "PlainString") {
    return { kind: "plain" };
  }
  return { kind: "string" };
}

function readArrayShape(node: SchemaNode, ctx: ShapeContext): ValueShape {
  const minItems = node.minItems;
  return {
    kind: "array",
    items: readValueShape(node.items ?? {}, ctx),
    ...(minItems === undefined ? {} : { minItems }),
  };
}

function readValueShape(node: SchemaNode, ctx: ShapeContext): ValueShape {
  const { def, node: resolved } = derefNode(node, ctx.defs);

  const block = readBlockValueShape(def, ctx);
  if (block !== undefined) {
    return block;
  }
  if (resolved.enum !== undefined) {
    return { kind: "enum", values: resolved.enum };
  }
  if (resolved.oneOf !== undefined) {
    return { kind: "unknown" };
  }

  const types = declaredTypesOf(resolved);
  if (types.includes("array")) {
    return readArrayShape(resolved, ctx);
  }
  if (types.includes("object") || resolved.properties !== undefined) {
    return readObjectShape(def, resolved, ctx);
  }
  return readScalarShape(def, types);
}

function readObjectShape(
  def: string | undefined,
  node: SchemaNode,
  ctx: ShapeContext
): ObjectShape {
  if (def !== undefined) {
    const pending = ctx.pending.get(def);
    if (pending !== undefined) {
      return pending;
    }
  }

  const shape: ObjectShape = { kind: "object", fields: [], open: false };
  if (def !== undefined) {
    ctx.pending.set(def, shape);
  }

  const declared = new Map<string, SchemaNode>();
  const required = new Set<string>();
  let open = false;

  for (const member of membersOf(node, ctx.defs)) {
    for (const [key, value] of Object.entries(member.properties ?? {})) {
      if (!NON_CONTENT_KEYS.has(key)) {
        declared.set(key, value);
      }
    }
    for (const key of member.required ?? []) {
      required.add(key);
    }
    if (member.additionalProperties === true) {
      open = true;
    }
  }

  const fields: FieldShape[] = [];
  for (const [key, value] of declared) {
    fields.push({
      key,
      required: required.has(key),
      shape: readValueShape(value, ctx),
    });
  }

  shape.fields = fields;
  shape.open = open || fields.length === 0;

  if (def !== undefined) {
    ctx.pending.delete(def);
  }
  return shape;
}

function buildCatalog(schemaVersion: SchemaVersion): BlockCatalog {
  const schema = getSchema(
    schemaVersion,
    documentSchemaRelPath(schemaVersion)
  ) as DocumentSchema;
  const defs = schema.$defs ?? {};

  const byType = new Map<string, BlockShape>();
  const blockDefs = new Set<string>();
  const typeByDef = new Map<string, string>();
  const types: string[] = [];

  for (const variant of defs[BLOCK_UNION_DEF]?.oneOf ?? []) {
    const ref = variant.$ref;
    if (ref === undefined) {
      continue;
    }
    const def = defNameOf(ref);
    const defNode = defs[def];
    if (defNode === undefined) {
      continue;
    }
    const type = readTypeConst(defNode, defs);
    if (type === undefined) {
      continue;
    }
    types.push(type);
    blockDefs.add(def);
    typeByDef.set(def, type);
  }

  const pending = new Map<string, ObjectShape>();
  const ctx: ShapeContext = {
    blockDefs,
    blockTypes: types,
    defs,
    pending,
    typeByDef,
  };
  for (const [def, type] of typeByDef) {
    const shape = readObjectShape(def, defs[def] ?? {}, ctx);
    byType.set(type, { def, fields: shape.fields, type });
  }

  return { byType, types };
}

function catalogFor(schemaVersion: SchemaVersion): BlockCatalog {
  assertSchemaVersion(schemaVersion);
  const cached = catalogs.get(schemaVersion);
  if (cached !== undefined) {
    return cached;
  }
  const catalog = buildCatalog(schemaVersion);
  catalogs.set(schemaVersion, catalog);
  return catalog;
}

/** Every block type the schema declares, in schema order. */
export function listBlockTypes(
  schemaVersion: SchemaVersion
): readonly string[] {
  return catalogFor(schemaVersion).types;
}

/** Editable shape of one block type, or `undefined` when it is not declared. */
export function readBlockShape(
  type: string,
  schemaVersion: SchemaVersion
): BlockShape | undefined {
  return catalogFor(schemaVersion).byType.get(type);
}
