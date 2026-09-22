import { AirpDiagnosticError, diagnostic } from "@airp/diagnostics";
import { RENDERER_TARGETS_HTML_MERMAID_RENDER_FAILED } from "../diagnostic-codes.js";
import { loadMermaid } from "./load-mermaid.js";
import { applyMermaidThemeVars } from "./mermaid-theme-vars.js";

/** Render one Mermaid source to an SVG markup string (unique `id` isolates defs). */
export async function renderMermaidSvg(
  source: string,
  id: string,
  locationPath?: string
): Promise<string> {
  const api = await loadMermaid();
  try {
    const { svg } = await api.render(id, source);
    return applyMermaidThemeVars(svg, id);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new AirpDiagnosticError([
      diagnostic(
        RENDERER_TARGETS_HTML_MERMAID_RENDER_FAILED,
        `Mermaid render failed: ${message}`,
        locationPath
          ? { location: { path: locationPath } }
          : { details: { id } }
      ),
    ]);
  }
}
