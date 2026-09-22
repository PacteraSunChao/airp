import type { AirpResult } from "@airp/diagnostics";
import type {
  AirpDocumentSnapshot,
  RenderContext,
  RenderOutput,
} from "@airp/renderer-contract";
import { renderDocumentWithCatalog } from "../pipeline/render-document-with-catalog.js";
import { catalogWithHtmlTargetFromUrl } from "./catalog-from-url.js";

/**
 * Render using an HTML target loaded from `moduleUrl` (CLI dist hot-reload).
 * Markdown still comes from the package export.
 */
export async function renderDocumentWithHtmlFromUrl(
  document: AirpDocumentSnapshot,
  target: string,
  input: RenderContext,
  htmlModuleUrl: string
): Promise<AirpResult<RenderOutput>> {
  const catalog = await catalogWithHtmlTargetFromUrl(htmlModuleUrl);
  return renderDocumentWithCatalog(document, target, input, catalog);
}
