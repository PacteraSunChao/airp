import { describe, expect, it } from "vitest";
import {
  applyMermaidThemeVars,
  buildMermaidThemeOverrideCss,
  MERMAID_THEME_STYLE_ATTR,
} from "../src/node/mermaid-theme-vars.js";

describe("mermaid-theme-vars", () => {
  it("emits reader CSS variables scoped to the diagram id", () => {
    const css = buildMermaidThemeOverrideCss("airp-mmd-1");
    expect(css).toContain("#airp-mmd-1");
    expect(css).toContain("var(--airp-m-node-bg)");
    expect(css).toContain("var(--airp-m-text)");
    expect(css).toContain("var(--airp-m-line)");
  });

  it("injects a theme style once after Mermaid style", () => {
    const raw =
      '<svg id="airp-mmd-1"><style>#airp-mmd-1{fill:#333}</style><g></g></svg>';
    const once = applyMermaidThemeVars(raw, "airp-mmd-1");
    expect(once).toContain(`${MERMAID_THEME_STYLE_ATTR}="true"`);
    expect(once).toContain("var(--airp-m-node-bg)");
    expect(once.indexOf("<style")).toBeLessThan(
      once.indexOf(MERMAID_THEME_STYLE_ATTR)
    );

    const twice = applyMermaidThemeVars(once, "airp-mmd-1");
    expect(twice).toBe(once);
  });

  it("injects before body when Mermaid omits a style tag", () => {
    const raw = '<svg id="airp-mmd-2"><g class="node"></g></svg>';
    const themed = applyMermaidThemeVars(raw, "airp-mmd-2");
    expect(themed.startsWith('<svg id="airp-mmd-2">')).toBe(true);
    expect(themed).toContain(`${MERMAID_THEME_STYLE_ATTR}="true"`);
    expect(themed).toContain('<g class="node">');
  });
});
