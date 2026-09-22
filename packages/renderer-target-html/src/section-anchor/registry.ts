import type { SchemaVersion, VersionRegistry } from "@airp/protocol";
import type { SectionAnchorCtx } from "./v1-0-0.js";
import { sectionAnchor100 } from "./v1-0-0.js";
import { sectionAnchor110 } from "./v1-1-0.js";

export type SectionAnchorResolver = (
  ctx: SectionAnchorCtx,
  block: { [key: string]: unknown },
  titleText: string
) => string;

const SECTION_ANCHORS = {
  "1.0.0": sectionAnchor100,
  "1.1.0": sectionAnchor110,
} as const satisfies VersionRegistry<SectionAnchorResolver>;

/** Resolve section HTML `id` for a supported schema version. */
export function sectionAnchorFor(
  version: SchemaVersion
): SectionAnchorResolver {
  return SECTION_ANCHORS[version];
}
