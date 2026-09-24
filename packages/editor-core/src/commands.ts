/**
 * Document mutations for a host editor.
 *
 * Every command is pure: it returns a new document that shares untouched
 * subtrees with the input, so a host keeps undo cheap and re-renders little.
 * Nothing here validates the result — `@airp/validate` owns that.
 *
 * Paths are the ones `indexDocumentAtIds` and validation diagnostics produce. A
 * path the document does not contain is a caller precondition violation, not a
 * document problem, so commands throw instead of returning a result (see
 * `registry://rules.failure-channels` → throw line).
 */

import { generateAtId } from "@airp/protocol";
import { isRecord } from "@airp/utils";
import { indexDocumentAtIds } from "./document-index.js";
import { type NodePath, toJsonPointer } from "./paths.js";

function missingPath(path: NodePath): Error {
  return new Error(`Document path not found: ${toJsonPointer(path)}`);
}

function invalidTarget(path: NodePath, reason: string): Error {
  return new Error(`Cannot change ${toJsonPointer(path)}: ${reason}`);
}

/** Read the value at `key` of `container`, or throw when it is not there. */
function readChild(
  container: unknown,
  key: string | number,
  path: NodePath
): unknown {
  if (Array.isArray(container) && typeof key === "number") {
    if (key < 0 || key >= container.length) {
      throw missingPath(path);
    }
    return container[key];
  }
  if (
    isRecord(container) &&
    typeof key === "string" &&
    Object.hasOwn(container, key)
  ) {
    return container[key];
  }
  throw missingPath(path);
}

/** Copy `container` with `key` set to `value`, sharing everything else. */
function writeChild(
  container: unknown,
  key: string | number,
  value: unknown,
  path: NodePath
): unknown {
  if (Array.isArray(container) && typeof key === "number") {
    const next = [...container];
    next[key] = value;
    return next;
  }
  if (isRecord(container) && typeof key === "string") {
    return { ...container, [key]: value };
  }
  throw invalidTarget(path, "the parent is neither an array nor an object");
}

/** Rebuild the document down to `path`, replacing the value it holds. */
function updateAt(
  document: unknown,
  path: NodePath,
  replace: (current: unknown) => unknown,
  offset = 0
): unknown {
  const key = path[offset];
  if (key === undefined) {
    return replace(document);
  }
  // The full path travels with every step, so a miss reports what was asked for.
  const child = readChild(document, key, path);
  const updated = updateAt(child, path, replace, offset + 1);
  return writeChild(document, key, updated, path);
}

/** Rebuild the container holding the last segment of `path`. */
function updateParent(
  document: unknown,
  path: NodePath,
  change: (parent: unknown, key: string | number) => unknown
): unknown {
  const key = path.at(-1);
  if (key === undefined) {
    throw invalidTarget(path, "the document root has no parent");
  }
  return updateAt(document, path.slice(0, -1), (parent) => {
    readChild(parent, key, path);
    return change(parent, key);
  });
}

function freshAtId(used: ReadonlySet<string>): string {
  let handle = generateAtId();
  while (used.has(handle)) {
    handle = generateAtId();
  }
  return handle;
}

function rekeyAtIds(value: unknown, used: Set<string>): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => rekeyAtIds(item, used));
  }
  if (!isRecord(value)) {
    return value;
  }

  const copy: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value)) {
    copy[key] = rekeyAtIds(child, used);
  }
  if (typeof value["@id"] === "string") {
    const handle = freshAtId(used);
    copy["@id"] = handle;
    used.add(handle);
  }
  return copy;
}

/**
 * Copy `value`, re-issuing every machine handle it carries so that no handle
 * collides with `document` or with another one inside the copy. Nodes that
 * declare no handle keep none: which nodes need one is the schema's call.
 */
export function withUniqueAtIds<T>(value: T, document: unknown): T {
  return rekeyAtIds(
    value,
    new Set(indexDocumentAtIds(document).byAtId.keys())
  ) as T;
}

/** Read the value at `path`. */
export function readValue(document: unknown, path: NodePath): unknown {
  let current = document;
  for (const key of path) {
    current = readChild(current, key, path);
  }
  return current;
}

/** Replace the value at `path`. */
export function setValue(
  document: unknown,
  path: NodePath,
  value: unknown
): unknown {
  return updateAt(document, path, () => value);
}

/**
 * Insert `value` at `index` of the array at `path`.
 *
 * Handles inside `value` are re-issued, because inserted content is new by
 * definition.
 */
export function insertValue(
  document: unknown,
  path: NodePath,
  index: number,
  value: unknown
): unknown {
  const inserted = withUniqueAtIds(value, document);
  return updateAt(document, path, (current) => {
    if (!Array.isArray(current)) {
      throw invalidTarget(path, "the target is not an array");
    }
    if (!Number.isInteger(index) || index < 0 || index > current.length) {
      throw invalidTarget(path, `index ${index} is out of range`);
    }
    return [...current.slice(0, index), inserted, ...current.slice(index)];
  });
}

/** Remove the array item or object key at `path`. */
export function removeValue(document: unknown, path: NodePath): unknown {
  return updateParent(document, path, (parent, key) => {
    if (Array.isArray(parent) && typeof key === "number") {
      return parent.filter((_, index) => index !== key);
    }
    if (isRecord(parent) && typeof key === "string") {
      const { [key]: _removed, ...rest } = parent;
      return rest;
    }
    throw invalidTarget(path, "the parent is neither an array nor an object");
  });
}

/** Move the array item at `path` to `index` of the same array. */
export function moveValue(
  document: unknown,
  path: NodePath,
  index: number
): unknown {
  return updateParent(document, path, (parent, from) => {
    if (!Array.isArray(parent) || typeof from !== "number") {
      throw invalidTarget(path, "the parent is not an array");
    }
    if (!Number.isInteger(index) || index < 0 || index >= parent.length) {
      throw invalidTarget(path, `index ${index} is out of range`);
    }
    const next = [...parent];
    const [item] = next.splice(from, 1);
    next.splice(index, 0, item);
    return next;
  });
}

/**
 * Copy the node at `path`, with fresh handles throughout the copy, and insert
 * the copy directly after it in the same array.
 */
export function duplicateValue(document: unknown, path: NodePath): unknown {
  return updateParent(document, path, (parent, from) => {
    if (!Array.isArray(parent) || typeof from !== "number") {
      throw invalidTarget(path, "the parent is not an array");
    }
    const copy = withUniqueAtIds(readChild(parent, from, path), document);
    const next = [...parent];
    next.splice(from + 1, 0, copy);
    return next;
  });
}
