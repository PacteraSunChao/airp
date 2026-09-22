import type { AirpResult } from "@airp/diagnostics";
import type {
  AirpDocumentSnapshot,
  RenderContext,
  RenderOutput,
} from "@airp/renderer-contract";
import { rendererTargetCatalog } from "../catalog.js";
import { renderDocumentWithCatalog } from "./render-document-with-catalog.js";

/**
 * Render a document snapshot. Callers must validate first;
 * this entry point does not run validate.
 */
export function renderDocument(
  document: AirpDocumentSnapshot,
  target: string,
  input: RenderContext
): Promise<AirpResult<RenderOutput>> {
  return renderDocumentWithCatalog(
    document,
    target,
    input,
    rendererTargetCatalog
  );
}
