/**
 * Node addressing for parsed AIRP documents.
 *
 * A `NodePath` is the structural address of one value inside a parsed
 * `*.airp.json`: object keys and array indexes from the document root. The JSON
 * Pointer form matches `AirpDiagnostic.location.path`, so validation diagnostics
 * resolve onto nodes without a second translation table.
 */

/** Structural address of a value inside a parsed document. */
export type NodePath = readonly (string | number)[];

/** Canonical non-negative array index (`0`, `1`, …; never `01`). */
const ARRAY_INDEX_TOKEN = /^(?:0|[1-9]\d*)$/;

const TILDE_ESCAPE = /~/g;
const SLASH_ESCAPE = /\//g;
const SLASH_UNESCAPE = /~1/g;
const TILDE_UNESCAPE = /~0/g;

/** Encode a path as an RFC 6901 JSON Pointer; the document root is `""`. */
export function toJsonPointer(path: NodePath): string {
  if (path.length === 0) {
    return "";
  }
  let pointer = "";
  for (const segment of path) {
    const token = String(segment)
      .replace(TILDE_ESCAPE, "~0")
      .replace(SLASH_ESCAPE, "~1");
    pointer += `/${token}`;
  }
  return pointer;
}

/**
 * Decode an RFC 6901 JSON Pointer into a path.
 *
 * The root is accepted as `""` or `"/"`: AJV reports the root as `"/"` in
 * `AirpDiagnostic.location.path`, while RFC 6901 reserves `""`. Canonical
 * non-negative integer tokens become array indexes.
 */
export function fromJsonPointer(pointer: string): NodePath {
  if (pointer === "" || pointer === "/") {
    return [];
  }
  const body = pointer.startsWith("/") ? pointer.slice(1) : pointer;
  const path: (string | number)[] = [];
  for (const token of body.split("/")) {
    const unescaped = token
      .replace(SLASH_UNESCAPE, "/")
      .replace(TILDE_UNESCAPE, "~");
    path.push(
      ARRAY_INDEX_TOKEN.test(unescaped) ? Number(unescaped) : unescaped
    );
  }
  return path;
}
