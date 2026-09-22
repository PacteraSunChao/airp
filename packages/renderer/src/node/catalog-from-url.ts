import type { RenderTargetModule } from "@airp/renderer-contract";
import { markdownTarget } from "@airp/renderer-target-markdown";
import type { RendererTargetCatalog } from "../catalog-keys.js";

/**
 * Build a catalog whose HTML target is loaded from `moduleUrl`
 * (CLI hot-reload of html dist). Does not import the html package export,
 * so it works while `dist/` is being rebuilt.
 */
export async function catalogWithHtmlTargetFromUrl(
  moduleUrl: string
): Promise<RendererTargetCatalog> {
  const htmlMod = (await import(moduleUrl)) as {
    htmlTarget: RenderTargetModule;
  };
  return {
    html: htmlMod.htmlTarget,
    markdown: markdownTarget,
  };
}
