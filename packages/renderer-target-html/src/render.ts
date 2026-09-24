import type {
  ResolvedRenderContext,
  TargetRenderOutput,
} from "@airp/renderer-contract";
import { assembleHtmlDocument } from "./assemble.js";
import { emitDocumentBody } from "./emit-document.js";
import { resolveHtmlTargetOptions } from "./shared/target-options.js";

/** Render an AIRP document snapshot to a self-contained HTML document. */
export function renderHtml(ctx: ResolvedRenderContext): TargetRenderOutput {
  const locale = ctx.locale;
  const { machineHandles } = resolveHtmlTargetOptions(ctx.targetOptions);
  const { bodyHtml, pageTocHtml, schemaVersion, title } = emitDocumentBody(
    ctx.document,
    locale,
    { machineHandles }
  );
  const body = assembleHtmlDocument({
    title,
    locale,
    bodyHtml,
    pageTocHtml,
    schemaVersion,
    targetOptions: ctx.targetOptions,
  });
  return {
    format: "html",
    primary: {
      relPath: "document.html",
      mimeType: "text/html",
      body,
    },
  };
}
