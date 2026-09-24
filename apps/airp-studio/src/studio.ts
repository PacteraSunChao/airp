/**
 * Studio logic that is worth testing: what the document contains, which fields a
 * node offers, and how an edit becomes a new document. DOM wiring stays in
 * `main.ts`, so nothing here needs a browser.
 *
 * The host is deliberately **form driven**: the document is edited through
 * schema-derived fields while a rendered preview updates beside it, so no
 * renderer change is required to make a report editable.
 */

import type { AirpDiagnostic } from "@airp/diagnostics";
import {
  createValue,
  fromJsonPointer,
  insertValue,
  type NodePath,
  readBlockShape,
  removeValue,
  resolveDiagnosticLocations,
  serializeDocument,
  setValue,
  toJsonPointer,
  type ValueShape,
} from "@airp/editor-core";
import type { SchemaVersion } from "@airp/protocol";

/** Shape kinds a form renders as a control; the rest are structured. */
const SCALAR_KINDS = new Set<ValueShape["kind"]>([
  "boolean",
  "enum",
  "markdown",
  "number",
  "plain",
  "string",
  "stringOrNumber",
]);

const LABEL_KEYS = ["title", "text", "name", "summary", "label"] as const;

export interface BlockEntry {
  atId?: string;
  /**
   * Whether the node sits at an index inside an array. Only such a block has
   * siblings, so only such a block can be moved, removed or inserted after: a
   * block hanging off an object field (`architectureOverview.overview`) is
   * edited with the block that owns it.
   */
  inArray: boolean;
  /** Human label: the block's own copy when it has any, else its type. */
  label: string;
  path: NodePath;
  type: string;
}

/** One field of a node, with the shape that says how to edit it. */
export interface FieldSpec {
  key: string;
  required: boolean;
  shape: ValueShape;
}

export interface DiagnosticEntry {
  atId?: string;
  code: string;
  message: string;
  nodePath: NodePath;
}

export function isScalarShape(shape: ValueShape): boolean {
  return SCALAR_KINDS.has(shape.kind);
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

/**
 * Read a path that may legitimately be absent: a form shows every declared field,
 * while an optional one is usually missing from the document.
 */
export function readAt(document: unknown, path: NodePath): unknown {
  let current = document;
  for (const key of path) {
    if (Array.isArray(current) && typeof key === "number") {
      current = current[key];
      continue;
    }
    const record = asRecord(current);
    if (record === undefined || !Object.hasOwn(record, key)) {
      return undefined;
    }
    current = record[key as string];
  }
  return current;
}

function labelOf(block: Record<string, unknown>): string {
  for (const key of LABEL_KEYS) {
    const value = block[key];
    if (typeof value === "string" && value.trim().length > 0) {
      const text = value.trim();
      return text.length > 40 ? `${text.slice(0, 40)}…` : text;
    }
  }
  const type = block.type;
  return typeof type === "string" ? type : "?";
}

function collectBlocks(
  value: unknown,
  path: (string | number)[],
  schemaVersion: SchemaVersion,
  out: BlockEntry[]
): void {
  if (Array.isArray(value)) {
    for (const [index, item] of value.entries()) {
      collectBlocks(item, [...path, index], schemaVersion, out);
    }
    return;
  }

  const record = asRecord(value);
  if (record === undefined) {
    return;
  }

  const type = record.type;
  if (typeof type === "string" && readBlockShape(type, schemaVersion)) {
    const atId = record["@id"];
    out.push({
      inArray: typeof path.at(-1) === "number",
      label: labelOf(record),
      path,
      type,
      ...(typeof atId === "string" && atId.length > 0 ? { atId } : {}),
    });
  }

  for (const [key, child] of Object.entries(record)) {
    if (key !== "@id") {
      collectBlocks(child, [...path, key], schemaVersion, out);
    }
  }
}

/** Every block in the document, depth first, with a label to show. */
export function listBlocks(
  document: unknown,
  schemaVersion: SchemaVersion
): BlockEntry[] {
  const blocks: BlockEntry[] = [];
  collectBlocks(document, [], schemaVersion, blocks);
  return blocks;
}

/**
 * The chain of blocks that contains `path`, outermost first, ending with the
 * block at `path` itself.
 *
 * A block that fills its parent — most of them — can never be reached by
 * clicking the canvas: the click lands on whichever descendant is under the
 * pointer. This chain is how a host offers the ancestors back.
 */
export function blockAncestors(
  blocks: readonly BlockEntry[],
  path: NodePath
): BlockEntry[] {
  const target = toJsonPointer(path);
  return blocks
    .filter((block) => {
      const pointer = toJsonPointer(block.path);
      return target === pointer || target.startsWith(`${pointer}/`);
    })
    .sort((left, right) => left.path.length - right.path.length);
}

/** The fields of the block at `path`, in schema order. */
export function blockFieldSpecs(
  document: unknown,
  path: NodePath,
  schemaVersion: SchemaVersion
): FieldSpec[] {
  const type = readAt(document, [...path, "type"]);
  const shape =
    typeof type === "string" ? readBlockShape(type, schemaVersion) : undefined;
  if (shape === undefined) {
    return [];
  }
  return shape.fields.map((field) => ({
    key: field.key,
    required: field.required,
    shape: field.shape,
  }));
}

/**
 * The one field worth editing straight on the canvas.
 *
 * A rendered block is mostly its text, so a click on it should be able to reach
 * that text without a detour through a panel. Only a string the author typed is
 * a candidate: enums, numbers and structured fields still belong in the panel,
 * where the control says what the value means.
 */
export function primaryTextField(
  document: unknown,
  path: NodePath,
  schemaVersion: SchemaVersion
): { key: string; shape: ValueShape } | undefined {
  for (const field of blockFieldSpecs(document, path, schemaVersion)) {
    const kind = field.shape.kind;
    if (kind !== "markdown" && kind !== "plain" && kind !== "string") {
      continue;
    }
    if (typeof readAt(document, [...path, field.key]) === "string") {
      return { key: field.key, shape: field.shape };
    }
  }
  return undefined;
}

function coerce(shape: ValueShape, text: string, name: string): unknown {
  if (shape.kind === "boolean") {
    return text === "true";
  }
  if (shape.kind === "number") {
    const parsed = Number(text);
    if (text.trim().length === 0 || Number.isNaN(parsed)) {
      throw new Error(`${name} must be a number`);
    }
    return parsed;
  }
  return text;
}

/** Write one scalar field, coercing the text a form produced. */
export function setScalarText(
  document: unknown,
  path: NodePath,
  shape: ValueShape,
  text: string
): unknown {
  if (!isScalarShape(shape)) {
    throw new Error(`Not a field a form edits: ${shape.kind}`);
  }
  return setValue(document, path, coerce(shape, text, String(path.at(-1))));
}

/**
 * Append an item to the array at `arrayPath`.
 *
 * Returns the new handle too: `insertValue` re-issues handles on inserted
 * content, so the one `createValue` picked is not the one that lands.
 */
export function appendArrayItem(
  document: unknown,
  arrayPath: NodePath,
  itemShape: ValueShape,
  schemaVersion: SchemaVersion
): { atId?: string; document: unknown } {
  const items = readAt(document, arrayPath);
  const index = Array.isArray(items) ? items.length : 0;
  const next = insertValue(
    document,
    arrayPath,
    index,
    createValue(itemShape, schemaVersion, document)
  );
  const atId = readAt(next, [...arrayPath, index, "@id"]);
  return {
    atId: typeof atId === "string" ? atId : undefined,
    document: next,
  };
}

/** Remove the item at `index` from the array at `arrayPath`. */
export function dropArrayItem(
  document: unknown,
  arrayPath: NodePath,
  index: number
): unknown {
  return removeValue(document, [...arrayPath, index]);
}

/**
 * Keywords that only carry union mechanics: `Block` is a `oneOf`, so Ajv reports
 * every variant's complaint when one variant fails, and the trailing
 * `oneOf`/`const` entries add nothing a reader can act on.
 */
const UNION_NOISE_KEYWORDS = new Set(["anyOf", "const", "not", "oneOf"]);

const REQUIRED_PROPERTY_RE = /required property '([^']+)'/;

/**
 * The diagnostics worth showing for a document.
 *
 * A `Block` is a `oneOf`, so a single content mistake makes Ajv report every
 * other variant's requirements too — one empty table column produced ~190
 * diagnostics. Rather than dump that on an author, drop the union noise:
 *
 * - a complaint about a path this document does not contain (other variants'
 *   fields) — a real complaint always points at a node the document has;
 * - a `required` complaint naming a property the node's own block does not
 *   declare;
 * - pure union mechanics (`oneOf`/`anyOf`/`not`/`const`).
 *
 * This is presentation only: the diagnostics themselves are untouched, and
 * `@airp/validate` stays the source of truth.
 */
export function visibleDiagnostics(
  document: unknown,
  diagnostics: readonly AirpDiagnostic[],
  schemaVersion: SchemaVersion
): AirpDiagnostic[] {
  return diagnostics.filter((diagnostic) => {
    const pointer = diagnostic.location?.path;
    if (pointer === undefined) {
      return true;
    }
    const nodePath = fromJsonPointer(pointer);
    const keyword = (diagnostic.details as { keyword?: string } | undefined)
      ?.keyword;
    if (keyword !== undefined && UNION_NOISE_KEYWORDS.has(keyword)) {
      return false;
    }
    if (readAt(document, nodePath) === undefined) {
      return false;
    }
    const missing = REQUIRED_PROPERTY_RE.exec(diagnostic.message)?.[1];
    if (keyword === "required" && missing !== undefined) {
      const declared = blockFieldSpecs(document, nodePath, schemaVersion);
      if (declared.length > 0) {
        return declared.some((field) => field.key === missing);
      }
    }
    if (keyword === "additionalProperties") {
      // Real only when the node itself carries a key its own shape does not
      // declare; the other variants' complaints are about this node's fields.
      const declared = new Set(
        blockFieldSpecs(document, nodePath, schemaVersion).map(
          (field) => field.key
        )
      );
      const record = asRecord(readAt(document, nodePath));
      if (declared.size > 0 && record !== undefined) {
        return Object.keys(record).some(
          (key) => key !== "@id" && key !== "type" && !declared.has(key)
        );
      }
    }
    return true;
  });
}

/** Where each diagnostic points, ready for a list in the UI. */
export function diagnosticEntries(
  document: unknown,
  diagnostics: readonly AirpDiagnostic[],
  schemaVersion: SchemaVersion
): DiagnosticEntry[] {
  return resolveDiagnosticLocations(
    visibleDiagnostics(document, diagnostics, schemaVersion),
    document
  ).map((location) => ({
    code: location.diagnostic.code,
    message: location.diagnostic.message,
    nodePath: location.nodePath,
    ...(location.atId === undefined ? {} : { atId: location.atId }),
  }));
}

/** The document as it should be written back to disk. */
export function documentText(document: unknown): string {
  return serializeDocument(document);
}
