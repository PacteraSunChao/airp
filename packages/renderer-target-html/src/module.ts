import type { SchemaVersion } from "@airp/protocol";
import type {
  RenderTargetModule,
  ResolvedRenderContext,
} from "@airp/renderer-contract";
import { renderHtml } from "./render.js";

export const htmlTarget: RenderTargetModule = {
  target: "html",
  render: (ctx: ResolvedRenderContext) => renderHtml(ctx),
  assertComplete: (_version: SchemaVersion) => {
    // All schema 1.0.0 block types are implemented in emit-handlers.
  },
};
