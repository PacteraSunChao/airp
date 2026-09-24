/**
 * Where a validation diagnostic points inside the document.
 *
 * `@airp/validate` reports `AirpDiagnostic.location.path` as an AJV JSON
 * Pointer; a host needs the node behind it to badge the offending block and jump
 * to it. This module is that translation and nothing else — it does not run
 * validation, so the layers stay put: validate validates, a host calls it, this
 * maps the result.
 *
 * Resolution never walks the document: it looks each prefix up in the handle
 * index, so a path the document does not contain resolves without throwing.
 * When no prefix carries a handle, `nodePath` is the diagnostic's own path.
 */

import type { AirpDiagnostic } from "@airp/diagnostics";
import {
  atIdAtPath,
  type DocumentAtIdIndex,
  indexDocumentAtIds,
} from "./document-index.js";
import { fromJsonPointer, type NodePath } from "./paths.js";

export interface DiagnosticLocation {
  /**
   * Handle the node carries, when it carries one. It may be malformed — for an
   * invalid `@id` diagnostic that value is exactly the complaint.
   */
  atId?: string;
  diagnostic: AirpDiagnostic;
  /**
   * Node to badge: the nearest node carrying a handle. When nothing on the way
   * carries one, it is the diagnostic's own path — or the document root when the
   * diagnostic has no location — so a host can still address the offender.
   */
  nodePath: NodePath;
  /** Where the diagnostic itself points, when it carries a location. */
  path?: NodePath;
}

function readDiagnosticPath(diagnostic: AirpDiagnostic): NodePath | undefined {
  const pointer = diagnostic.location?.path;
  return pointer === undefined ? undefined : fromJsonPointer(pointer);
}

/** Nearest enclosing node that carries a handle, walking up from `path`. */
function locateNode(
  index: DocumentAtIdIndex,
  path: NodePath | undefined
): { atId?: string; nodePath: NodePath } {
  const segments = path ?? [];
  for (let length = segments.length; length > 0; length -= 1) {
    const candidate = segments.slice(0, length);
    const atId = atIdAtPath(index, candidate);
    if (atId !== undefined) {
      return { atId, nodePath: candidate };
    }
  }
  return { nodePath: segments };
}

/** Pair every diagnostic with the node it belongs to. */
export function resolveDiagnosticLocations(
  diagnostics: readonly AirpDiagnostic[],
  document: unknown
): readonly DiagnosticLocation[] {
  const index = indexDocumentAtIds(document);
  return diagnostics.map((diagnostic) => {
    const path = readDiagnosticPath(diagnostic);
    return {
      diagnostic,
      ...(path === undefined ? {} : { path }),
      ...locateNode(index, path),
    };
  });
}
