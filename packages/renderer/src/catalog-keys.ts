import type { RenderTargetModule } from "@airp/renderer-contract";

/** Closed isomorphic render-target catalog shape (no package bindings). */
export interface RendererTargetCatalog {
  readonly html: RenderTargetModule;
  readonly markdown: RenderTargetModule;
}

export function isRenderTargetKey(
  value: string
): value is keyof RendererTargetCatalog {
  return value === "html" || value === "markdown";
}
