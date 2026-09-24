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
    // A handle is never invented for a node that does not carry one.
    expect(html.querySelectorAll("[data-airp-id]")).toHaveLength(expected.size);
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
