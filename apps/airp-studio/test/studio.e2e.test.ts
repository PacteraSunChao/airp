/**
 * Drives the built app in a real browser.
 *
 * These are the assertions that need a browser rather than a unit test: the
 * canvas is the renderer's real output in an iframe, a click on it has to come
 * back as the right block, and a save has to end in a file whose only change is
 * the edit.
 */

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { serializeDocument } from "@airp/editor-core";
import { documentPath } from "@airp/test-kit";
import { type Browser, chromium } from "playwright";
import { createServer, type ViteDevServer } from "vite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const APP_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);
const FIXTURE = documentPath("valid", "section-at-id-1.1.0.airp.json");
/** The status line a completed refresh writes: `<file> · <n> 个块 · …`. */
const STATUS_RE = /·\s*\d+ 个块\s*·/;
const SECTION_AT_ID = "aaaaaaaaaa";
const PARAGRAPH_AT_ID = "bbbbbbbbbb";
const TABLE_AT_ID = "hhhhhhhhhh";
const TABLE_COLUMNS = "/blocks/2/columns";

let browser: Browser;
let server: ViteDevServer;
let url: string;

beforeAll(async () => {
  server = await createServer({ root: APP_ROOT, server: { port: 0 } });
  await server.listen();
  const [local] = server.resolvedUrls?.local ?? [];
  if (local === undefined) {
    throw new Error("Vite dev server exposed no local URL");
  }
  url = local;
  browser = await chromium.launch();
}, 60_000);

afterAll(async () => {
  await browser?.close();
  await server?.close();
});

/**
 * A page with the File System Access pickers removed.
 *
 * Whether `showSaveFilePicker` exists varies by Chromium build, and a picker in
 * a headless run can never be answered — so the save path is pinned to the
 * download fallback here. Writing back through a handle is covered by
 * `file-access.test.ts`, which does not need a browser.
 */
async function openPage(): Promise<Awaited<ReturnType<Browser["newPage"]>>> {
  const page = await browser.newPage();
  await page.addInitScript(() => {
    const target = window as {
      showOpenFilePicker?: unknown;
      showSaveFilePicker?: unknown;
    };
    target.showOpenFilePicker = undefined;
    target.showSaveFilePicker = undefined;
  });
  return page;
}

/** Which block the field panel is currently showing. */
async function selectedAtId(
  page: Awaited<ReturnType<Browser["newPage"]>>
): Promise<string | null> {
  return await page
    .locator("[data-selected-at-id]")
    .first()
    .getAttribute("data-selected-at-id");
}

/** Click a block on the rendered canvas, the way an author would. */
async function clickBlock(
  page: Awaited<ReturnType<Browser["newPage"]>>,
  atId: string
): Promise<void> {
  await page
    .frameLocator("#canvas")
    .locator(`[data-airp-id="${atId}"]`)
    .first()
    .click();
  await page.waitForSelector(`[data-selected-at-id="${atId}"]`);
}

describe("studio app", () => {
  it("opens a document, edits it on the inspector, and saves a minimal diff", async () => {
    const page = await openPage();
    await page.goto(url, { waitUntil: "load" });

    await page.setInputFiles("#file", FIXTURE);
    await page.waitForFunction((pattern) => {
      const status = document.querySelector("#status")?.textContent ?? "";
      return new RegExp(pattern).test(status);
    }, STATUS_RE.source);
    expect(await page.locator("#status").innerText()).toContain("校验通过");

    await clickBlock(page, PARAGRAPH_AT_ID);
    const paragraph = page.locator("[data-field-path]").first();
    await paragraph.fill("改写后的正文。");

    // The canvas is the renderer's own output, so the edit has to show up there.
    await page.waitForFunction(
      () =>
        (
          document.querySelector<HTMLIFrameElement>("#canvas")?.contentDocument
            ?.body?.textContent ?? ""
        ).includes("改写后的正文。") === true,
      null,
      { timeout: 10_000 }
    );

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.click("#save"),
    ]);
    const savedPath = await download.path();
    const saved = readFileSync(savedPath, "utf8");
    // Saving rewrites the document in the protocol's canonical form, and this
    // fixture is not canonical, so the baseline is the canonical form of the
    // same document rather than the file's original bytes.
    const baseline = serializeDocument(
      JSON.parse(readFileSync(FIXTURE, "utf8"))
    ).split("\n");
    const changed = baseline.filter(
      (line, index) => line !== saved.split("\n")[index]
    );

    expect(saved).toContain("改写后的正文。");
    expect(changed).toHaveLength(1);
    await page.close();
  }, 60_000);

  it("refuses a document that is not schema 1.1.0", async () => {
    const page = await openPage();
    await page.goto(url, { waitUntil: "load" });

    await page.setInputFiles(
      "#file",
      documentPath("valid", "minimal.airp.json")
    );
    expect(await page.locator("#status").innerText()).toContain(
      "只支持 schema 1.1.0"
    );
    await page.close();
  }, 60_000);

  it("opens every 1.1.0 fixture and lists its blocks", async () => {
    const page = await openPage();
    // Mermaid figures need the Node-side renderer, so a document containing one
    // draws the failure panel on the canvas instead of blocks. That case is
    // asserted on its own below rather than smuggled into this loop.
    const fixtures = readdirSync(documentPath("valid")).filter(
      (name) => name.endsWith("1.1.0.airp.json") && !name.startsWith("mermaid")
    );
    expect(fixtures.length).toBeGreaterThan(1);

    for (const name of fixtures) {
      await page.goto(url, { waitUntil: "load" });
      await page.setInputFiles("#file", documentPath("valid", name));
      // A thrown error leaves a bare message instead of the `<file> · N 个块`
      // shape, so matching that shape is what proves the refresh finished.
      await page.waitForFunction(
        (fileName) =>
          document.querySelector("#status")?.textContent?.includes(fileName) ===
          true,
        name,
        { timeout: 10_000 }
      );
      const status = await page.locator("#status").innerText();
      expect(status, name).toMatch(STATUS_RE);
      await page
        .frameLocator("#canvas")
        .locator("[data-airp-id]")
        .first()
        .waitFor({ timeout: 10_000 });
    }
    await page.close();
  }, 180_000);

  it("says why a Mermaid document cannot be drawn on the canvas", async () => {
    const page = await openPage();
    await page.goto(url, { waitUntil: "load" });

    await page.setInputFiles(
      "#file",
      documentPath("valid", "mermaid-ok-1.1.0.airp.json")
    );
    await page.waitForFunction(
      () =>
        (
          document.querySelector<HTMLIFrameElement>("#canvas")?.contentDocument
            ?.body?.textContent ?? ""
        ).includes("画布渲染失败") === true,
      null,
      { timeout: 10_000 }
    );
    // The document is still loaded and still editable.
    expect(await page.locator("#status").innerText()).toMatch(STATUS_RE);
    await page.close();
  }, 60_000);

  it("adds a table column on the field panel and removes it again", async () => {
    const page = await openPage();
    await page.goto(url, { waitUntil: "load" });

    await page.setInputFiles("#file", FIXTURE);
    await clickBlock(page, TABLE_AT_ID);

    const columns = `[data-array-path="${TABLE_COLUMNS}"]`;
    const count = `${columns} [data-array-item]`;
    expect(await page.locator(count).count()).toBe(2);

    await page.click(`${columns} [data-add-item]`);
    await page.waitForFunction(
      (selector) => document.querySelectorAll(selector).length === 3,
      count
    );
    // A new column is seeded empty, so the content floor on `label` flags it —
    // and only it: the union noise the renderer's `oneOf` produces is filtered
    // out of the panel on purpose.
    expect(await page.locator("#status").innerText()).toContain("1 条校验问题");

    // `key` accepts an empty string, so the content floor is on `label`.
    await page
      .locator('[data-field-path="/blocks/2/columns/2/label"]')
      .fill("备注");
    await page.waitForFunction(
      () =>
        document.querySelector("#status")?.textContent?.includes("校验通过") ===
        true
    );

    await page.locator(count).last().locator("[data-drop-item]").click();
    await page.waitForFunction(
      (selector) => document.querySelectorAll(selector).length === 2,
      count
    );
    await page.close();
  }, 60_000);

  it("selects the block that was clicked on the canvas, not a neighbour", async () => {
    const page = await openPage();
    await page.goto(url, { waitUntil: "load" });

    await page.setInputFiles("#file", FIXTURE);
    await clickBlock(page, PARAGRAPH_AT_ID);
    expect(await selectedAtId(page)).toBe(PARAGRAPH_AT_ID);
    // The paragraph is inside the first section, so the chain back out is there
    // to click: a block that covers its parent cannot be clicked directly.
    expect(
      await page
        .locator("[data-ancestor-at-id]")
        .first()
        .getAttribute("data-ancestor-at-id")
    ).toBe(SECTION_AT_ID);

    await page.click(`[data-ancestor-at-id="${SECTION_AT_ID}"]`);
    await page.waitForSelector(`[data-selected-at-id="${SECTION_AT_ID}"]`);
    expect(await selectedAtId(page)).toBe(SECTION_AT_ID);
    await page.close();
  }, 60_000);
});
