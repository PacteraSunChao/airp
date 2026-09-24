import { type AirpDiagnostic, AirpDiagnosticError } from "@airp/diagnostics";
import type {
  ResolvedRenderContext,
  TargetRenderOutput,
} from "@airp/renderer-contract";
import { assembleHtmlDocument } from "../assemble.js";
import { emitDocumentBody } from "../emit-document.js";
import { renderMermaidError } from "../shared/render-mermaid-error.js";
import { resolveHtmlTargetOptions } from "../shared/target-options.js";
import { collectCodeSources } from "./collect-code-sources.js";
import { collectMermaidSources } from "./collect-mermaid-sources.js";
import { highlightCodeHtml } from "./highlight-code.js";
import { renderMermaidSvg } from "./render-mermaid-svg.js";

const MERMAID_RENDER_FAILED_PREFIX = "Mermaid render failed: ";

/**
 * Node HTML export: Mermaid → SVG → svg-viewer; code/codeDiff → Shiki SSR.
 * Per-diagram Mermaid failures become danger-style error blocks + warning
 * diagnostics; the page still succeeds. Shiki failures degrade to plain text.
 */
export async function renderHtml(
  ctx: ResolvedRenderContext
): Promise<TargetRenderOutput> {
  const locale = ctx.locale;
  const sources = collectMermaidSources(ctx.document.blocks, "/blocks");
  const mermaidMarkups: string[] = [];
  const mermaidDiagnostics: AirpDiagnostic[] = [];

  for (let i = 0; i < sources.length; i += 1) {
    const ref = sources[i];
    if (!ref) {
      continue;
    }
    try {
      const svg = await renderMermaidSvg(ref.source, `airp-mmd-${i}`, ref.path);
      mermaidMarkups.push(svg);
    } catch (error) {
      if (!(error instanceof AirpDiagnosticError)) {
        throw error;
      }
      const rawMessage =
        error.diagnostics[0]?.message ??
        (error instanceof Error ? error.message : String(error));
      const displayMessage = rawMessage.startsWith(MERMAID_RENDER_FAILED_PREFIX)
        ? rawMessage.slice(MERMAID_RENDER_FAILED_PREFIX.length)
        : rawMessage;
      mermaidMarkups.push(renderMermaidError(displayMessage));
      mermaidDiagnostics.push(...error.diagnostics);
    }
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
      // The Node entry assembles the body itself, so it has to forward the
      // target options the caller asked for; otherwise `machineHandles` would
      // work through one entry point and silently do nothing through the other.
      machineHandles: resolveHtmlTargetOptions(ctx.targetOptions)
        .machineHandles,
      takeMermaidSvg: () => {
        const markup = mermaidMarkups[mermaidIndex];
        mermaidIndex += 1;
        if (markup === undefined) {
          throw new Error(
            "Mermaid SVG queue exhausted (collector/emit order mismatch)"
          );
        }
        return markup;
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
    diagnostics: mermaidDiagnostics,
  };
}
