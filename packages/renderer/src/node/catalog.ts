import { htmlTarget } from "@airp/renderer-target-html/node";
import { markdownTarget } from "@airp/renderer-target-markdown";
import type { RendererTargetCatalog } from "../catalog-keys.js";

/** Closed Node render-target catalog (HTML includes Mermaid→SVG). */
export const rendererTargetCatalog: RendererTargetCatalog = {
  html: htmlTarget,
  markdown: markdownTarget,
};
