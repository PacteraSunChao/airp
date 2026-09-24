/**
 * A diagram must render to the same markup every time.
 *
 * Mermaid numbers some of its internal ids (`actor11`, `root-11`) from a counter
 * that keeps climbing inside a process, so the same source rendered twice — a
 * preview and an export, or two exports in one CLI run — came out different.
 * That is what these tests pin down: the exported file has to be a function of
 * the document, or nothing downstream can compare two renders at all.
 *
 * Flowcharts already derived their ids from the figure id and are left alone;
 * sequence diagrams are the case that was broken.
 */

import { describe, expect, it } from "vitest";
import { renderMermaidSvg } from "../src/node/render-mermaid-svg.js";

const SEQUENCE = [
  "sequenceDiagram",
  "  participant A as Agent",
  "  participant B as Tool",
  "  A->>B: run",
  "  B-->>A: ok",
].join("\n");

const FLOWCHART = "flowchart LR\n  A --> B";

const BARE_ID_RE = /\sid="(?!airp-mmd-\d+)[^"]+"/g;

describe("mermaid id determinism", () => {
  it("renders a sequence diagram to the same markup twice", async () => {
    const first = await renderMermaidSvg(SEQUENCE, "airp-mmd-0");
    const second = await renderMermaidSvg(SEQUENCE, "airp-mmd-0");

    expect(second).toBe(first);
  });

  it("renders it the same way after other diagrams have been rendered", async () => {
    // The counter only climbs when something else is rendered in between, which
    // is exactly what a reader does: open another report, come back.
    const first = await renderMermaidSvg(SEQUENCE, "airp-mmd-0");
    await renderMermaidSvg(FLOWCHART, "airp-mmd-1");
    await renderMermaidSvg(SEQUENCE, "airp-mmd-2");
    const again = await renderMermaidSvg(SEQUENCE, "airp-mmd-0");

    expect(again).toBe(first);
  });

  it("scopes every id it rewrites to the figure", async () => {
    const svg = await renderMermaidSvg(SEQUENCE, "airp-mmd-0");

    // No bare, process-wide id survives, and every reference still resolves to
    // something declared in the same document.
    expect(svg.match(BARE_ID_RE)).toBeNull();
    const declared = new Set(
      [...svg.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1])
    );
    for (const reference of svg.matchAll(/(?:url\(#|href="#)([^")]+)/g)) {
      expect(declared.has(reference[1] ?? "")).toBe(true);
    }
  });
});
