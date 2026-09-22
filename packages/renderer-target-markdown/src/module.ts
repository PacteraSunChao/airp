import type { SchemaVersion } from "@airp/protocol";
import type {
  RenderTargetModule,
  ResolvedRenderContext,
} from "@airp/renderer-contract";
import { renderMarkdown } from "./render.js";

export const markdownTarget: RenderTargetModule = {
  target: "markdown",
  render: (ctx: ResolvedRenderContext) => renderMarkdown(ctx),
  assertComplete: (_version: SchemaVersion) => {
    // All schema 1.0.0 block types are implemented in emit-block.
  },
};
