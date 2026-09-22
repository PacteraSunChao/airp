import { htmlTarget } from "@airp/renderer-target-html";
import { markdownTarget } from "@airp/renderer-target-markdown";
import type { RendererTargetCatalog } from "./catalog-keys.js";

/** Closed isomorphic render-target catalog. */
export const rendererTargetCatalog: RendererTargetCatalog = {
  html: htmlTarget,
  markdown: markdownTarget,
};
