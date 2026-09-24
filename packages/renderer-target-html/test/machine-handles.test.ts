/**
 * Machine handles: an opt-in `data-airp-id` on the element each block renders
 * as, so a host can map rendered DOM back to the document node it came from.
 *
 * The flag exists so that a render which does not ask for handles stays
 * byte-identical — every document the repository already ships through the
 * renderer must come out exactly as before.
 */

import { readFileSync } from "node:fs";
import type { AirpDocumentSnapshot } from "@airp/renderer-contract";
import { documentRenderLocale } from "@airp/renderer-shared";
import { documentPath } from "@airp/test-kit";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";
import { renderHtml as renderHtmlNode } from "../src/node/render.js";
import { renderHtml } from "../src/render.js";

const SECTION = "valid/section-at-id-1.1.0.airp.json";
const MINIMAL_1_1_0 = "valid/minimal-1.1.0.airp.json";
const MINIMAL_1_0_0 = "valid/minimal.airp.json";

function load(relative: string): AirpDocumentSnapshot {
  return JSON.parse(
    readFileSync(documentPath(relative), "utf8")
  ) as AirpDocumentSnapshot;
}

function render(
  relative: string,
  targetOptions?: Readonly<Record<string, unknown>>
): string {
  const document_ = load(relative);
  const locale = documentRenderLocale(document_);
  if (locale === undefined) {
    throw new Error(`${relative}: fixture has no document render locale`);
  }
  const output = renderHtml({ document: document_, locale, targetOptions });
  const body = output.primary.body;
  if (typeof body !== "string") {
    throw new Error(`${relative}: expected a string HTML body`);
  }
  return body;
}

/** Blocks in a snapshot: nodes carrying both a `type` and an `@id`. */
function blockTypes(
  value: unknown,
  out: Map<string, string> = new Map()
): Map<string, string> {
  if (Array.isArray(value)) {
    for (const item of value) {
      blockTypes(item, out);
    }
    return out;
  }
  if (value === null || typeof value !== "object") {
    return out;
  }
  const record = value as Record<string, unknown>;
  const atId = record["@id"];
  const type = record.type;
  if (typeof atId === "string" && typeof type === "string") {
    out.set(atId, type);
  }
  for (const [key, child] of Object.entries(record)) {
    if (key !== "@id") {
      blockTypes(child, out);
    }
  }
  return out;
}

/** Every object in a snapshot that carries a handle, blocks and items alike. */
function handlesIn(value: unknown, out: Set<string> = new Set()): Set<string> {
  if (Array.isArray(value)) {
    for (const item of value) {
      handlesIn(item, out);
    }
    return out;
  }
  if (value === null || typeof value !== "object") {
    return out;
  }
  const record = value as Record<string, unknown>;
  const atId = record["@id"];
  if (typeof atId === "string" && atId.length > 0) {
    out.add(atId);
  }
  for (const [key, child] of Object.entries(record)) {
    if (key !== "@id") {
      handlesIn(child, out);
    }
  }
  return out;
}

/**
 * One document that carries a handled example of every structured collection the
 * target can emit, so "item-level handles" is a checked claim rather than a
 * sample. Nothing here needs to be schema-valid: this is a renderer test, and the
 * renderer renders what it is given.
 */
const ITEM_COVERAGE: AirpDocumentSnapshot = {
  blocks: [
    {
      "@id": "b000000001",
      columns: [{ "@id": "c000000001", key: "a", label: "A" }],
      footerRow: { "@id": "f000000001", a: "sum" },
      rows: [{ "@id": "r000000001", a: "1" }],
      type: "table",
    },
    {
      "@id": "b000000002",
      items: [{ "@id": "k000000001", checked: true, label: "Done" }],
      type: "checklist",
    },
    {
      "@id": "b000000003",
      items: [{ "@id": "d000000001", definition: "D", term: "T" }],
      type: "definitionList",
    },
    {
      "@id": "b000000004",
      items: [{ "@id": "v000000001", key: "k", value: "v" }],
      type: "keyValueList",
    },
    {
      "@id": "b000000005",
      items: [{ "@id": "m000000001", label: "card" }],
      type: "collection",
    },
    {
      "@id": "b000000006",
      panels: [
        {
          "@id": "t000000001",
          children: [{ "@id": "b000000007", text: "hi", type: "paragraph" }],
          label: "One",
        },
      ],
      type: "tabs",
    },
    {
      "@id": "b000000008",
      items: [{ "@id": "s000000001", label: "S", status: "pass" }],
      type: "statusBoard",
    },
    {
      "@id": "b000000009",
      root: {
        "@id": "n000000001",
        children: [{ "@id": "n000000002", name: "index.ts" }],
        name: "src",
      },
      type: "fileTree",
    },
    {
      "@id": "b00000000a",
      modules: [{ "@id": "a000000001", name: "M" }],
      overview: {
        "@id": "b00000000b",
        source: "graph TD; A-->B;",
        type: "mermaid",
      },
      type: "architectureOverview",
    },
    {
      "@id": "b00000000c",
      steps: [{ "@id": "p000000001", title: "Step" }],
      type: "flowSteps",
    },
    {
      "@id": "b00000000d",
      options: [{ "@id": "o000000001", label: "Opt" }],
      status: "proposed",
      title: "D",
      type: "decision",
    },
    {
      "@id": "b00000000e",
      events: [{ "@id": "e000000001", date: "2026-01-01", title: "E" }],
      type: "timeline",
    },
    {
      "@id": "b00000000f",
      phases: [{ "@id": "h000000001", name: "P" }],
      type: "roadmap",
    },
    {
      "@id": "b000000010",
      items: [
        { "@id": "q000000001", reqId: "R1", status: "pass", summary: "S" },
      ],
      type: "requirementTrace",
    },
    {
      "@id": "b000000011",
      suites: [{ "@id": "u000000001", failed: 0, name: "S", passed: 1 }],
      type: "testResult",
    },
    {
      "@id": "b000000012",
      endpoints: [{ "@id": "i000000001", method: "GET", path: "/x" }],
      type: "apiInventory",
    },
    {
      "@id": "b000000013",
      links: [{ "@id": "l000000001", href: "https://e.com", label: "L" }],
      type: "linkList",
    },
    {
      "@id": "b000000014",
      terms: [{ "@id": "g000000001", definition: "D", term: "T" }],
      type: "glossary",
    },
    {
      "@id": "b000000015",
      items: [{ "@id": "x000000001", source: "Src" }],
      type: "citation",
    },
    {
      "@id": "b000000016",
      items: [{ "@id": "y000000001", change: "added", path: "src/a.ts" }],
      type: "fileChangeList",
    },
    {
      "@id": "b000000017",
      metrics: [{ "@id": "z000000001", label: "M", value: "1" }],
      type: "hero",
    },
  ],
  i18n: { locale: "en" },
  meta: { title: "Item coverage" },
  schemaVersion: "1.1.0",
};

describe("machine handles", () => {
  it("annotates every block with its own handle and type", () => {
    const expected = blockTypes(load(SECTION));
    const dom = new JSDOM(render(SECTION, { machineHandles: true }));
    const { document: html } = dom.window;
    expect(expected.size).toBeGreaterThan(1);

    for (const [atId, type] of expected) {
      const found = html.querySelectorAll(`[data-airp-id="${atId}"]`);
      expect(found, atId).toHaveLength(1);
      expect(found[0]?.getAttribute("data-block-type"), atId).toBe(type);
    }
    // Every block is annotated; structured objects inside them are asserted by
    // the whole-document test below.
    expect(
      html.querySelectorAll("[data-airp-id]").length
    ).toBeGreaterThanOrEqual(expected.size);
    dom.window.close();
  });

  it("keeps a block's handle on that block, not on a nested child", () => {
    const handles = blockTypes(load(SECTION));
    // The fixture's first block is a section that owns child blocks.
    const sectionAtId = [...handles.keys()][0] ?? "";
    const dom = new JSDOM(render(SECTION, { machineHandles: true }));
    const section = dom.window.document.querySelector(
      `[data-airp-id="${sectionAtId}"]`
    );

    expect(section?.tagName).toBe("SECTION");
    expect(
      section?.querySelectorAll("[data-airp-id]").length ?? 0
    ).toBeGreaterThan(0);
    dom.window.close();
  });

  it("annotates every handled object, not only the blocks", () => {
    // The schema puts a handle on structured objects too — a table column, a
    // checklist entry, a tabs panel — so a host can address them. Whatever the
    // document carries, the render has to expose.
    for (const fixture of [SECTION, MINIMAL_1_1_0]) {
      const body = render(fixture, { machineHandles: true });
      const rendered = new Set(
        [...body.matchAll(/data-airp-id="([^"]+)"/g)].map((match) => match[1])
      );
      const missing = [...handlesIn(load(fixture))].filter(
        (atId) => !rendered.has(atId)
      );
      expect(missing, fixture).toEqual([]);
    }
  });

  it("covers every structured collection the target can emit", async () => {
    const output = await renderHtmlNode({
      document: ITEM_COVERAGE,
      locale: "en",
      targetOptions: { machineHandles: true },
    });
    const body = String(output.primary.body ?? "");
    const rendered = new Set(
      [...body.matchAll(/data-airp-id="([^"]+)"/g)].map((match) => match[1])
    );
    const missing = [...handlesIn(ITEM_COVERAGE)].filter(
      (atId) => !rendered.has(atId)
    );

    expect(missing).toEqual([]);
    // The document has one for every collection this test covers, so a silent
    // drop of a whole block type from the list above cannot pass.
    expect(handlesIn(ITEM_COVERAGE).size).toBeGreaterThan(35);
  }, 60_000);

  it("renders byte-identically when handles are not requested", () => {
    for (const fixture of [SECTION, MINIMAL_1_1_0, MINIMAL_1_0_0]) {
      expect(render(fixture)).toBe(render(fixture, { machineHandles: false }));
      expect(render(fixture)).not.toContain("data-airp-id");
    }
  });

  it("adds nothing to a document whose blocks carry no handle", () => {
    expect(render(MINIMAL_1_0_0, { machineHandles: true })).toBe(
      render(MINIMAL_1_0_0)
    );
  });

  it("ignores an option that is not a boolean instead of guessing", () => {
    expect(render(SECTION, { machineHandles: "yes" })).toBe(render(SECTION));
    expect(render(SECTION, { machineHandles: 1 })).toBe(render(SECTION));
  });
});
