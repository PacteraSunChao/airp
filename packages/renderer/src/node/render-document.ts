import type { AirpResult } from "@airp/diagnostics";
import type {
  AirpDocumentSnapshot,
  RenderContext,
  RenderOutput,
} from "@airp/renderer-contract";
import { renderDocumentWithCatalog } from "../pipeline/render-document-with-catalog.js";
import { rendererTargetCatalog } from "./catalog.js";

/**
 * Node render entry: HTML uses Mermaid→SVG via renderer-target-html/node.
 * Imported via `@airp/renderer/node/render` (not the `/node` hot-reload barrel).
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
