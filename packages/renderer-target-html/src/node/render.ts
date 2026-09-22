import type {
  ResolvedRenderContext,
  TargetRenderOutput,
} from "@airp/renderer-contract";
import { assembleHtmlDocument } from "../assemble.js";
import { emitDocumentBody } from "../emit-document.js";
import { collectCodeSources } from "./collect-code-sources.js";
import { collectMermaidSources } from "./collect-mermaid-sources.js";
import { highlightCodeHtml } from "./highlight-code.js";
import { renderMermaidSvg } from "./render-mermaid-svg.js";

/**
 * Node HTML export: Mermaid → SVG → svg-viewer; code/codeDiff → Shiki SSR.
 * Fail-closed on Mermaid render error; Shiki failures degrade to plain text.
 */
export async function renderHtml(
  ctx: ResolvedRenderContext
): Promise<TargetRenderOutput> {
  const locale = ctx.locale;
  const sources = collectMermaidSources(ctx.document.blocks, "/blocks");
  const svgs: string[] = [];

  for (let i = 0; i < sources.length; i += 1) {
    const ref = sources[i];
    if (!ref) {
      continue;
    }
    const svg = await renderMermaidSvg(ref.source, `airp-mmd-${i}`, ref.path);
    svgs.push(svg);
  }

  const codeSources = collectCodeSources(ctx.document.blocks, "/blocks");
  const highlightedCodes = await Promise.all(
    codeSources.map((ref) =>
      highlightCodeHtml({
        code: ref.code,
        language: ref.language,
        diff: ref.diff,
      })
    )
  );

  let mermaidIndex = 0;
  let codeIndex = 0;
  const { bodyHtml, pageTocHtml, schemaVersion, title } = emitDocumentBody(
    ctx.document,
    locale,
    {
      takeMermaidSvg: () => {
        const svg = svgs[mermaidIndex];
        mermaidIndex += 1;
        if (svg === undefined) {
          throw new Error(
            "Mermaid SVG queue exhausted (collector/emit order mismatch)"
          );
        }
        return svg;
      },
      takeHighlightedCode: () => {
        const html = highlightedCodes[codeIndex];
        codeIndex += 1;
        return html;
      },
    }
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
