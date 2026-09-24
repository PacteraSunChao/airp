import { AirpDiagnosticError, diagnostic } from "@airp/diagnostics";
import { RENDERER_TARGETS_HTML_MERMAID_RENDER_FAILED } from "../diagnostic-codes.js";
import { loadMermaid } from "./load-mermaid.js";
import { applyMermaidThemeVars } from "./mermaid-theme-vars.js";

/** Render one Mermaid source to an SVG markup string (unique `id` isolates defs).
 * Failures throw `AirpDiagnosticError` with warning severity; Node `renderHtml`
 * converts them to page error blocks so the document still succeeds.
 */
/**
 * Mermaid numbers some of its internal ids — sequence diagrams use bare
 * `actor11`, `root-11` — from a counter that keeps climbing inside a process.
 * The same document rendered twice, a canvas and an export or two exports in one
 * CLI run, therefore came out with different ids. Ids Mermaid derives from the
 * figure id (flowcharts) are already stable and are left alone.
 *
 * Rewriting the bare ones to `<figure>-n<i>` in document order, together with
 * every reference to them, makes the markup a function of the document again.
 */
function normalizeInternalIds(svg: string, figureId: string): string {
  const replacement = new Map<string, string>();
  for (const match of svg.matchAll(/\sid="([^"]+)"/g)) {
    const id = match[1];
    if (id === undefined || id.startsWith(figureId)) {
      continue;
    }
    if (!replacement.has(id)) {
      replacement.set(id, `${figureId}-n${replacement.size + 1}`);
    }
  }
  if (replacement.size === 0) {
    return svg;
  }
  // One pass, longest id first, so `#actor1` cannot eat into `#actor11`, and an
  // id is only rewritten where it appears as an id or as a reference to one.
  const ids = [...replacement.keys()].sort((a, b) => b.length - a.length);
  const alternation = ids
    .map((value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
  const pattern = new RegExp(`"(${alternation})"|#(${alternation})`, "g");
  return svg.replace(pattern, (full, quoted?: string, hashed?: string) => {
    const id = quoted ?? hashed;
    const next = id === undefined ? undefined : replacement.get(id);
    if (next === undefined) {
      return full;
    }
    return quoted === undefined ? `#${next}` : `"${next}"`;
  });
}

export async function renderMermaidSvg(
  source: string,
  id: string,
  locationPath?: string
): Promise<string> {
  const api = await loadMermaid();
  try {
    const { svg } = await api.render(id, source);
    return applyMermaidThemeVars(normalizeInternalIds(svg, id), id);
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
