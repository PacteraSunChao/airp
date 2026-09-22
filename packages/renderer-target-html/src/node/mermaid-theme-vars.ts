/** Marker so theme CSS is applied at most once. */
export const MERMAID_THEME_STYLE_ATTR = "data-airp-mermaid-theme";

/** Escape an SVG id for use as a CSS #<id> selector. */
export function cssEscapeIdent(value: string): string {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(value);
  }
  return value.replaceAll(/[^a-zA-Z0-9_-]/g, (ch) => {
    const hex = ch.codePointAt(0)?.toString(16) ?? "0";
    return `\\${hex} `;
  });
}

/**
 * Override Mermaid-baked fills/strokes with reader CSS variables.
 * Scoped to the diagram root id so multi-figure pages stay isolated.
 */
export function buildMermaidThemeOverrideCss(diagramId: string): string {
  const id = cssEscapeIdent(diagramId);
  const root = `#${id}`;
  return [
    `${root}{color:var(--airp-m-text);fill:var(--airp-m-text)!important}`,
    `${root} .label,${root} .cluster-label span,${root} .label text,${root} span,${root} .cluster-label text,${root} .cluster text,${root} .cluster span,${root} .messageText,${root} .labelText,${root} .labelText>tspan,${root} .loopText,${root} .loopText>tspan,${root} .noteText,${root} .noteText>tspan,${root} text.actor>tspan{fill:var(--airp-m-text)!important;color:var(--airp-m-text)!important;stroke:none!important}`,
    `${root} .node rect,${root} .node circle,${root} .node ellipse,${root} .node polygon,${root} .node path,${root} .actor,${root} .labelBox,${root} .actorPopupMenuPanel,${root} .actor-man circle{fill:var(--airp-m-node-bg)!important;stroke:var(--airp-m-node-border)!important}`,
    `${root} .actor-man line,${root} .actor-line,${root} .loopLine{fill:none!important;stroke:var(--airp-m-node-border)!important}`,
    `${root} .cluster rect{fill:var(--airp-m-cluster-bg)!important;stroke:var(--airp-m-cluster-border)!important}`,
    `${root} .marker,${root} .marker.cross,${root} .arrowheadPath,${root} .root .anchor path,${root} #arrowhead path,${root} #crosshead path,${root} #sequencenumber{fill:var(--airp-m-line)!important;stroke:var(--airp-m-line)!important}`,
    `${root} .edgePath .path,${root} .flowchart-link,${root} .messageLine0,${root} .messageLine1{fill:none!important;stroke:var(--airp-m-line)!important}`,
    `${root} .edgeLabel,${root} .edgeLabel p,${root} .labelBkg{background-color:var(--airp-m-label-bg)!important}`,
    `${root} .edgeLabel rect{fill:var(--airp-m-label-bg)!important;background-color:var(--airp-m-label-bg)!important}`,
    `${root} .note{fill:var(--airp-m-note-bg)!important;stroke:var(--airp-m-note-border)!important}`,
    `${root} .activation0,${root} .activation1,${root} .activation2{fill:var(--airp-m-activation-bg)!important;stroke:var(--airp-m-activation-border)!important}`,
    `${root} .sequenceNumber{fill:var(--airp-m-on-node)!important}`,
    `${root} .error-icon,${root} .error-text{fill:var(--airp-m-error)!important;stroke:var(--airp-m-error)!important}`,
    `${root} .node .katex path{fill:var(--airp-m-text)!important;stroke:var(--airp-m-text)!important}`,
  ].join("");
}

/** Inject reader theme overrides into a Mermaid SVG markup string. */
export function applyMermaidThemeVars(svg: string, diagramId: string): string {
  if (svg.includes(MERMAID_THEME_STYLE_ATTR)) {
    return svg;
  }
  const style = `<style ${MERMAID_THEME_STYLE_ATTR}="true">${buildMermaidThemeOverrideCss(diagramId)}</style>`;
  const closeStyle = svg.lastIndexOf("</style>");
  if (closeStyle >= 0) {
    const insertAt = closeStyle + "</style>".length;
    return `${svg.slice(0, insertAt)}${style}${svg.slice(insertAt)}`;
  }
  const openEnd = svg.indexOf(">");
  if (openEnd >= 0 && svg.startsWith("<svg")) {
    return `${svg.slice(0, openEnd + 1)}${style}${svg.slice(openEnd + 1)}`;
  }
  return `${style}${svg}`;
}
