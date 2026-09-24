/**
 * Block structure edits on top of the `@airp/editor-core` commands: they work out
 * which path an operation needs, so the host UI stays thin.
 *
 * A block path always lives in an array — the top-level `blocks`, a `children`
 * list, or an `items` list — which is what these helpers rely on.
 */

import {
  createBlock,
  insertValue,
  moveValue,
  type NodePath,
  readValue,
  removeValue,
} from "@airp/editor-core";
import type { SchemaVersion } from "@airp/protocol";

/** The array holding the node at `path`, plus the node's index inside it. */
function parentOf(path: NodePath): { index: number; parentPath: NodePath } {
  const index = path.at(-1);
  if (typeof index !== "number") {
    throw new Error(`Not a node inside an array: ${path.join("/")}`);
  }
  return { index, parentPath: path.slice(0, -1) };
}

/** How many nodes share the array that holds the node at `path`. */
export function siblingCount(document: unknown, path: NodePath): number {
  const { parentPath } = parentOf(path);
  const siblings = readValue(document, parentPath);
  return Array.isArray(siblings) ? siblings.length : 0;
}

/** Whether the node at `path` can move `delta` places inside its own array. */
export function canMove(
  document: unknown,
  path: NodePath,
  delta: number
): boolean {
  const { index } = parentOf(path);
  const target = index + delta;
  return target >= 0 && target < siblingCount(document, path);
}

/**
 * Insert a freshly seeded block right after the one at `path`.
 *
 * Returns the handle too, so a host can select the block it just created. The
 * handle is read back from the new document: `insertValue` re-issues handles on
 * inserted content, so the one `createBlock` picked is not the one that lands.
 */
export function insertBlockAfter(
  document: unknown,
  path: NodePath,
  type: string,
  schemaVersion: SchemaVersion
): { atId?: string; document: unknown } {
  const { index, parentPath } = parentOf(path);
  const block = createBlock(type, schemaVersion, document);
  const next = insertValue(document, parentPath, index + 1, block);
  const atId = readValue(next, [...parentPath, index + 1, "@id"]);
  return {
    atId: typeof atId === "string" ? atId : undefined,
    document: next,
  };
}

/** Remove the block at `path`. */
export function removeBlock(document: unknown, path: NodePath): unknown {
  parentOf(path);
  return removeValue(document, path);
}

/** Move the block at `path` by `delta` places inside its own array. */
export function moveBlock(
  document: unknown,
  path: NodePath,
  delta: number
): unknown {
  const { index } = parentOf(path);
  if (!canMove(document, path, delta)) {
    throw new Error("Cannot move past the end of the list");
  }
  return moveValue(document, path, index + delta);
}
