import type { SchemaVersion, VersionRegistry } from "@airp/protocol";
import { citationItemsMd100 } from "./v1-0-0.js";
import { citationItemsMd110 } from "./v1-1-0.js";

export type CitationItemsMdEmitter = (items: unknown[]) => string;

const CITATION_ITEMS_MD = {
  "1.0.0": citationItemsMd100,
  "1.1.0": citationItemsMd110,
} as const satisfies VersionRegistry<CitationItemsMdEmitter>;

/** Resolve citation Markdown emitter for a supported schema version. */
export function citationItemsMdFor(
  version: SchemaVersion
): CitationItemsMdEmitter {
  return CITATION_ITEMS_MD[version];
}
