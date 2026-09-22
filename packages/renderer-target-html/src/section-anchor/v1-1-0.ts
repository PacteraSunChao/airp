import { AirpDiagnosticError, diagnostic } from "@airp/diagnostics";
import { RENDERER_TARGETS_HTML_AT_ID_MISSING } from "../diagnostic-codes.js";
import type { SectionAnchorCtx } from "./v1-0-0.js";

const AT_ID_PATTERN = /^[a-z0-9]{10}$/;

/**
 * schema 1.1.0 section anchor: use machine handle `@id` only (no title slug fallback).
 */
export function sectionAnchor110(
  ctx: SectionAnchorCtx,
  block: { "@id"?: unknown; [key: string]: unknown },
  _titleText: string
): string {
  const raw = block["@id"];
  if (typeof raw !== "string" || !AT_ID_PATTERN.test(raw)) {
    throw new AirpDiagnosticError([
      diagnostic(
        RENDERER_TARGETS_HTML_AT_ID_MISSING,
        "Section is missing a valid @id machine handle",
        { details: { atId: raw } }
      ),
    ]);
  }
  ctx.sectionIds.add(raw);
  return raw;
}
