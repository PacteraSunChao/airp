/**
 * Machine handle (`@id`) index for parsed AIRP documents.
 *
 * Schema Version `1.1.0` requires a document-unique handle on every Block and on
 * every structured object (`TableColumn`, `CollectionItem`, `FileTreeNode`, …),
 * not only on top-level blocks. A host therefore addresses a node by handle:
 * emit it into the DOM, then resolve the node's current path from it.
 *
 * The index is deliberately tolerant. Malformed and duplicated handles are
 * recorded rather than rejected, because a host still has to locate and repair
 * them; rejecting them stays the validation stage's job (`@airp/validate`).
 */

import { isAtId } from "@airp/protocol";
import { isRecord } from "@airp/utils";
import { type NodePath, toJsonPointer } from "./paths.js";

/** One `@id` occurrence, in document order. */
export interface AtIdOccurrence {
  /** Raw handle value; may be malformed. */
  atId: string;
  /** Whether the value satisfies the machine-handle pattern. */
  isWellFormed: boolean;
  /** Structural address of the node carrying it. */
  path: NodePath;
  /** Node `type` when the carrier declares a string one. */
  type?: string;
}

export interface DocumentAtIdIndex {
  /** Handle carried by the node at a path, keyed by `toJsonPointer(path)`. */
  atIdByPointer: ReadonlyMap<string, string>;
  /** First occurrence per handle; malformed handles included. */
  byAtId: ReadonlyMap<string, NodePath>;
  /** Handles occurring more than once, in first-appearance order. */
  duplicateAtIds: readonly string[];
  /** Every occurrence, in document order. */
  occurrences: readonly AtIdOccurrence[];
  /** All occurrences per handle, in document order. */
  pathsByAtId: ReadonlyMap<string, readonly NodePath[]>;
}

function collectOccurrences(
  value: unknown,
  path: (string | number)[],
  occurrences: AtIdOccurrence[],
  seen: Set<object>
): void {
  if (typeof value !== "object" || value === null || seen.has(value)) {
    return;
  }
  seen.add(value);

  if (Array.isArray(value)) {
    for (const [index, item] of value.entries()) {
      path.push(index);
      collectOccurrences(item, path, occurrences, seen);
      path.pop();
    }
    return;
  }

  if (!isRecord(value)) {
    return;
  }

  const raw = value["@id"];
  if (typeof raw === "string" && raw.length > 0) {
    const occurrence: AtIdOccurrence = {
      atId: raw,
      isWellFormed: isAtId(raw),
      path: [...path],
    };
    if (typeof value.type === "string" && value.type.length > 0) {
      occurrence.type = value.type;
    }
    occurrences.push(occurrence);
  }

  for (const [key, child] of Object.entries(value)) {
    if (key === "@id") {
      continue;
    }
    path.push(key);
    collectOccurrences(child, path, occurrences, seen);
    path.pop();
  }
}

/** Index every machine handle in a parsed document (or any sub-tree of one). */
export function indexDocumentAtIds(document: unknown): DocumentAtIdIndex {
  const occurrences: AtIdOccurrence[] = [];
  collectOccurrences(document, [], occurrences, new Set<object>());

  const byAtId = new Map<string, NodePath>();
  const pathsByAtId = new Map<string, NodePath[]>();
  const atIdByPointer = new Map<string, string>();

  for (const occurrence of occurrences) {
    if (!byAtId.has(occurrence.atId)) {
      byAtId.set(occurrence.atId, occurrence.path);
    }
    const paths = pathsByAtId.get(occurrence.atId);
    if (paths) {
      paths.push(occurrence.path);
    } else {
      pathsByAtId.set(occurrence.atId, [occurrence.path]);
    }
    atIdByPointer.set(toJsonPointer(occurrence.path), occurrence.atId);
  }

  const duplicateAtIds: string[] = [];
  for (const [atId, paths] of pathsByAtId) {
    if (paths.length > 1) {
      duplicateAtIds.push(atId);
    }
  }

  return { atIdByPointer, byAtId, duplicateAtIds, occurrences, pathsByAtId };
}

/** Path of the first node carrying `atId`, or `undefined` when absent. */
export function pathOfAtId(
  index: DocumentAtIdIndex,
  atId: string
): NodePath | undefined {
  return index.byAtId.get(atId);
}

/** Handle carried by the node at `path`, or `undefined` when it has none. */
export function atIdAtPath(
  index: DocumentAtIdIndex,
  path: NodePath
): string | undefined {
  return index.atIdByPointer.get(toJsonPointer(path));
}
