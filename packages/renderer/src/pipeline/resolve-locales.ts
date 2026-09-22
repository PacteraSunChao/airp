import { type AirpDiagnostic, diagnostic } from "@airp/diagnostics";
import type {
  AirpDocumentSnapshot,
  RenderContext,
  RenderTargetModule,
  ResolvedRenderContext,
} from "@airp/renderer-contract";
import { documentRenderLocale } from "@airp/renderer-shared";
import { RENDERER_PIPELINE_LOCALE_UNRESOLVED } from "../diagnostic-codes.js";

export interface ResolveLocalesResult {
  ctx?: ResolvedRenderContext;
  diagnostics: AirpDiagnostic[];
}

/** Resolve render locale from the document and build target context. */
export function resolveRenderLocales(
  document: AirpDocumentSnapshot,
  input: RenderContext,
  _module: RenderTargetModule
): ResolveLocalesResult {
  const resolved = documentRenderLocale(document);
  if (!resolved) {
    return {
      diagnostics: [
        diagnostic(
          RENDERER_PIPELINE_LOCALE_UNRESOLVED,
          "document.i18n has no renderable locale (1.1.0: locale; 1.0.0: defaultLocale); render stopped"
        ),
      ],
    };
  }

  return {
    diagnostics: [],
    ctx: {
      document,
      locale: resolved,
      renderRoot: input.renderRoot,
      showDiagnostics: input.showDiagnostics,
      targetOptions: input.targetOptions,
    },
  };
}
