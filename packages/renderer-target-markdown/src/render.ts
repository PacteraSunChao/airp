import type {
  ResolvedRenderContext,
  TargetRenderOutput,
} from "@airp/renderer-contract";
import { emitDocument } from "./emit-document.js";

/** Render an AIRP document snapshot to Markdown. */
export function renderMarkdown(ctx: ResolvedRenderContext): TargetRenderOutput {
  const body = emitDocument(ctx.document, ctx.locale);
  return {
    format: "markdown",
    primary: {
      relPath: "report.md",
      mimeType: "text/markdown",
      body,
    },
  };
}
