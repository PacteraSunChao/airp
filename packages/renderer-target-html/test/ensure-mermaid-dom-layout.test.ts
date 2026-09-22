import { describe, expect, it } from "vitest";
import { renderMermaidSvg } from "../src/node/render-mermaid-svg.js";

const NODE_CLASS_RE = /class="node /;
const FOREIGN_OBJECT_WIDTH_RE =
  /<foreignObject[^>]*\bwidth="([1-9]\d*(?:\.\d+)?)"/;
const VIEW_BOX_RE = /viewBox="(-?[\d.]+)\s+(-?[\d.]+)\s+([\d.]+)\s+([\d.]+)"/;

function foreignObjectWidths(svg: string): number[] {
  return [...svg.matchAll(/<foreignObject[^>]*\bwidth="([1-9]\d*(?:\.\d+)?)"/g)]
    .map((match) => Number(match[1]))
    .filter((width) => Number.isFinite(width));
}

function foreignObjectHeights(svg: string): number[] {
  return [
    ...svg.matchAll(/<foreignObject[^>]*\bheight="([1-9]\d*(?:\.\d+)?)"/g),
  ]
    .map((match) => Number(match[1]))
    .filter((height) => Number.isFinite(height));
}

describe("ensureMermaidDom layout stubs", () => {
  it("produces measurable flowchart nodes and a real viewBox extent", async () => {
    const svg = await renderMermaidSvg(
      `flowchart LR
  Doc["*.airp.json"] --> V["airp-validate"]
  V --> R["airp-render export"]`,
      "airp-mmd-layout"
    );

    expect(svg).toMatch(NODE_CLASS_RE);
    expect(svg).toMatch(FOREIGN_OBJECT_WIDTH_RE);
    expect(svg).toContain('data-airp-mermaid-theme="true"');
    expect(svg).toContain("var(--airp-m-node-bg)");

    const viewBox = svg.match(VIEW_BOX_RE);
    expect(viewBox).not.toBeNull();
    const width = Number(viewBox?.[3]);
    const height = Number(viewBox?.[4]);
    // Old fixed getBBox stub yielded ~116×56; a real LR flowchart is wider.
    expect(width).toBeGreaterThan(200);
    expect(height).toBeGreaterThan(56);
  });

  it("sizes htmlLabel nodes by longest line when labels use <br/>", async () => {
    const multiLine = await renderMermaidSvg(
      `flowchart LR
  A["Skill Engine<br/>LLM Output<br/>仅生成 + 校验"]`,
      "airp-mmd-br"
    );
    const singleLine = await renderMermaidSvg(
      `flowchart LR
  A["Skill Engine LLM Output 仅生成 + 校验"]`,
      "airp-mmd-br-flat"
    );

    const multiWidths = foreignObjectWidths(multiLine);
    const singleWidths = foreignObjectWidths(singleLine);
    expect(multiWidths.length).toBeGreaterThan(0);
    expect(singleWidths.length).toBeGreaterThan(0);

    const multiMax = Math.max(...multiWidths);
    const singleMax = Math.max(...singleWidths);
    // Concatenated single-line measurement must be meaningfully wider.
    expect(singleMax).toBeGreaterThan(multiMax * 1.35);

    const commonMark = await renderMermaidSvg(
      `flowchart LR
  M["Markdown<br/>CommonMark"]`,
      "airp-mmd-commonmark"
    );
    // "CommonMark" ≈10×10px + slack; old 8.5px/glyph yielded 85 and clipped the final k.
    expect(Math.max(...foreignObjectWidths(commonMark))).toBeGreaterThanOrEqual(
      100
    );

    const multiHeights = foreignObjectHeights(multiLine);
    expect(multiHeights.length).toBeGreaterThan(0);
    // 3 lines × Mermaid line-height 1.5 (~24px) — not the old 18px stub.
    expect(Math.max(...multiHeights)).toBeGreaterThanOrEqual(72);

    const viewBox = multiLine.match(VIEW_BOX_RE);
    expect(viewBox).not.toBeNull();
    expect(Number(viewBox?.[4])).toBeGreaterThan(90);
  });
});
