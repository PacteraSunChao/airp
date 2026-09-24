import type { SchemaVersion, VersionRegistry } from "@airp/protocol";
import { citationItemsHtml100 } from "./v1-0-0.js";
import { citationItemsHtml110 } from "./v1-1-0.js";

/**
 * Options a version emitter may read. `machineHandles` is opt-in for the same
 * reason it is everywhere else: a render that does not ask for handles has to
 * stay byte-identical to what this target always produced.
 */
export interface CitationItemsHtmlOptions {
  machineHandles?: boolean;
}

export type CitationItemsHtmlEmitter = (
  items: unknown[],
  options: CitationItemsHtmlOptions
) => string;

const CITATION_ITEMS_HTML = {
  "1.0.0": citationItemsHtml100,
  "1.1.0": citationItemsHtml110,
} as const satisfies VersionRegistry<CitationItemsHtmlEmitter>;

/** Resolve citation item HTML emitter for a supported schema version. */
export function citationItemsHtmlFor(
  version: SchemaVersion
): CitationItemsHtmlEmitter {
  return CITATION_ITEMS_HTML[version];
}
