/**
 * The canvas and the export must be the AIRP Renderer's own output, not a
 * lookalike.
 *
 * These tests pin that down: every document renders (the browser entry used to
 * throw on anything with a diagram), an export is byte-identical to what the
 * Renderer's Node entry writes, and the canvas handles the editor needs are
 * opt-in so they never leak into an exported file.
 *
 * The service is called with the same loader the dev server uses, and compared
 * against `@airp/renderer/node/render` — the function behind `airp-render` and
 * the VS Code worker. If the Studio ever asks for different options, the export
 * comparison fails here rather than in someone's reviewed diff.
 */

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { renderDocument } from "@airp/renderer/node/render";
import { documentPath } from "@airp/test-kit";
import { describe, expect, it } from "vitest";
import {
  type RenderDocumentLoader,
  renderForStudio,
} from "../render-service.js";

const load: RenderDocumentLoader = async () => renderDocument;
const SECTION = "section-at-id-1.1.0.airp.json";
const MERMAID = "mermaid-ok-1.1.0.airp.json";

function readFixture(name: string): unknown {
  return JSON.parse(
    readFileSync(path.join(documentPath("valid"), name), "utf8")
  );
}

/** Every valid fixture in the repository, whatever its schema version. */
function fixtureNames(): string[] {
  return readdirSync(documentPath("valid"))
    .filter((name) => name.endsWith(".airp.json"))
    .sort();
}

describe("render service", () => {
  it("renders every fixture, including the ones only the Node pipeline can", async () => {
    const failures: string[] = [];
    for (const name of fixtureNames()) {
      const result = await renderForStudio(
        { document: readFixture(name), target: "html" },
        load
      );
      if (!result.ok) {
        failures.push(`${name}: ${result.message}`);
      }
    }
    // Before the service existed, five of these fixtures — every one with a
    // Mermaid diagram — could not be opened at all in the browser.
    expect(failures).toEqual([]);
  }, 300_000);

  it("exports exactly the bytes the Renderer writes", async () => {
    const mismatched: string[] = [];
    for (const name of fixtureNames()) {
      const document_ = readFixture(name);
      const ours = await renderForStudio(
        { document: document_, target: "html" },
        load
      );
      const theirs = await renderDocument(document_ as never, "html", {});
      if (!(ours.ok && theirs.ok)) {
        mismatched.push(`${name}: render failed`);
        continue;
      }
      if (ours.body !== String(theirs.value.files[0]?.body ?? "")) {
        mismatched.push(
          `${name}: ${ours.body.length} bytes vs ${String(theirs.value.files[0]?.body ?? "").length}`
        );
      }
    }
    expect(mismatched).toEqual([]);
  }, 300_000);

  it("renders markdown through the same pipeline", async () => {
    const document_ = readFixture(SECTION);
    const ours = await renderForStudio(
      { document: document_, target: "markdown" },
      load
    );
    const theirs = await renderDocument(document_ as never, "markdown", {});
    expect(ours.ok).toBe(true);
    expect(theirs.ok).toBe(true);
    if (ours.ok && theirs.ok) {
      expect(ours.body).toBe(String(theirs.value.files[0]?.body ?? ""));
    }
  }, 120_000);

  it("draws a diagram instead of refusing the document", async () => {
    const rendered = await renderForStudio(
      { document: readFixture(MERMAID), target: "html" },
      load
    );

    expect(rendered.ok).toBe(true);
    if (rendered.ok) {
      expect(rendered.body).toContain("svg-viewer");
      expect(rendered.body).not.toContain("mermaid.node-required");
    }
  }, 120_000);

  it("adds the canvas handles only when the canvas asks", async () => {
    const document_ = readFixture(SECTION);
    const exported = await renderForStudio(
      { document: document_, target: "html" },
      load
    );
    const canvas = await renderForStudio(
      { document: document_, machineHandles: true, target: "html" },
      load
    );

    expect(exported.ok && canvas.ok).toBe(true);
    if (exported.ok && canvas.ok) {
      // An export is the Renderer's file; the canvas is that file plus invisible
      // handles, which is what makes a click resolve to a document node.
      expect(exported.body).not.toContain("data-airp-id");
      expect(canvas.body).toContain('data-airp-id="aaaaaaaaaa"');
    }
  }, 120_000);
});
