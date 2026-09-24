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
/** The block count inside the status line. */
const BLOCK_COUNT_RE = /·\s*(\d+) 个块/;
const SECTION_AT_ID = "aaaaaaaaaa";
const PARAGRAPH_AT_ID = "bbbbbbbbbb";
const TABLE_AT_ID = "hhhhhhhhhh";
const TABLE_PATH = "/blocks/2";
const TABLE_ROW_AT_ID = "kkkkkkkkkk";

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

/** How many blocks the status line says the document has. */
async function blockCount(
  page: Awaited<ReturnType<Browser["newPage"]>>
): Promise<number> {
  const status = await page.locator("#status").innerText();
  return Number(BLOCK_COUNT_RE.exec(status)?.[1] ?? "0");
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

/**
 * Select a block the way an author reaches one that covers its children: click
 * inside it on the canvas, then step back out through the ancestor breadcrumb.
 */
async function selectBlock(
  page: Awaited<ReturnType<Browser["newPage"]>>,
  atId: string
): Promise<void> {
  await page
    .frameLocator("#canvas")
    .locator(`[data-airp-id="${atId}"]`)
    .first()
    .click();
  const ancestor = page.locator(`[data-ancestor-at-id="${atId}"]`);
  if ((await ancestor.count()) > 0) {
    await ancestor.first().click();
  }
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

    await selectBlock(page, PARAGRAPH_AT_ID);
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

  it("edits a block in place on the canvas", async () => {
    const page = await openPage();
    await page.goto(url, { waitUntil: "load" });

    await page.setInputFiles("#file", FIXTURE);
    await page
      .frameLocator("#canvas")
      .locator(`[data-airp-id="${PARAGRAPH_AT_ID}"]`)
      .first()
      .dblclick();

    // Double clicking the rendered paragraph puts a control on top of it, so the
    // author keeps looking at the report while typing.
    const overlay = page.locator(".inline-editor");
    await overlay.waitFor({ timeout: 10_000 });
    expect(await overlay.inputValue()).toContain("Body with");

    await overlay.fill("就地改过的正文。");
    await page.keyboard.press("Escape");
    await overlay.waitFor({ state: "detached" });

    await page.waitForFunction(
      () =>
        (
          document.querySelector<HTMLIFrameElement>("#canvas")?.contentDocument
            ?.body?.textContent ?? ""
        ).includes("就地改过的正文。") === true,
      null,
      { timeout: 10_000 }
    );
    expect(await page.locator("#status").innerText()).toContain("校验通过");
    await page.close();
  }, 60_000);

  it("selects the table row under the pointer, not the whole table", async () => {
    const page = await openPage();
    await page.goto(url, { waitUntil: "load" });

    await page.setInputFiles("#file", FIXTURE);
    // A cell carries no handle of its own; the row it belongs to does, so the
    // click resolves to that row and the panel says where it is.
    await page
      .frameLocator("#canvas")
      .locator(`[data-airp-id="${TABLE_ROW_AT_ID}"]`)
      .first()
      .click();
    await page.waitForSelector(`[data-selected-at-id="${TABLE_ROW_AT_ID}"]`);
    expect(await page.locator(".breadcrumb-chip").allInnerTexts()).toEqual([
      "表格",
      "行",
      "第 1 项",
    ]);

    await page.click(`[data-ancestor-at-id="${TABLE_AT_ID}"]`);
    await page.waitForSelector(`[data-selected-at-id="${TABLE_AT_ID}"]`);
    await page.close();
  }, 60_000);

  it("shows where a dragged block will land, and lands it there", async () => {
    const page = await openPage();
    await page.goto(url, { waitUntil: "load" });

    await page.setInputFiles("#file", FIXTURE);
    await page.waitForSelector('[data-selected-at-id="aaaaaaaaaa"]');

    // A palette drag has to be simulated: Playwright cannot carry a drag across
    // an iframe boundary, and the point here is the canvas's own reaction to it.
    const before = await blockCount(page);
    await page.evaluate((atId) => {
      const frame = document.querySelector<HTMLIFrameElement>("#canvas");
      const target = frame?.contentDocument?.querySelector(
        `[data-airp-id="${atId}"]`
      );
      if (!(frame && target)) {
        throw new Error("missing canvas or target");
      }
      const data = new DataTransfer();
      data.setData("application/x-airp-block-type", "paragraph");
      const rect = target.getBoundingClientRect();
      const drag = (type: string): DragEvent =>
        new DragEvent(type, {
          bubbles: true,
          cancelable: true,
          clientX: rect.left + 12,
          clientY: rect.bottom - 2,
          dataTransfer: data,
        });
      target.dispatchEvent(drag("dragover"));
    }, PARAGRAPH_AT_ID);

    const indicator = page
      .frameLocator("#canvas")
      .locator("[data-airp-insert]");
    await indicator.waitFor({ timeout: 10_000 });
    expect(await indicator.innerText()).toContain("插入到此后");

    await page.evaluate((atId) => {
      const frame = document.querySelector<HTMLIFrameElement>("#canvas");
      const target = frame?.contentDocument?.querySelector(
        `[data-airp-id="${atId}"]`
      );
      if (!target) {
        throw new Error("missing target");
      }
      const data = new DataTransfer();
      data.setData("application/x-airp-block-type", "paragraph");
      const rect = target.getBoundingClientRect();
      target.dispatchEvent(
        new DragEvent("drop", {
          bubbles: true,
          cancelable: true,
          clientX: rect.left + 12,
          clientY: rect.bottom - 2,
          dataTransfer: data,
        })
      );
    }, PARAGRAPH_AT_ID);

    await page.waitForFunction(
      (count) => {
        const frame = document.querySelector<HTMLIFrameElement>("#canvas");
        return (
          (frame?.contentDocument?.querySelectorAll("[data-airp-id]").length ??
            0) > count
        );
      },
      before,
      { timeout: 10_000 }
    );
    expect(await blockCount(page)).toBe(before + 1);
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

  it("edits table cells in the grid and shows them on the canvas", async () => {
    const page = await openPage();
    await page.goto(url, { waitUntil: "load" });

    await page.setInputFiles("#file", FIXTURE);
    await selectBlock(page, TABLE_AT_ID);

    const grid = `[data-table-grid="${TABLE_PATH}"]`;
    expect(
      await page.locator(`${grid} .table-easy-row.head input`).count()
    ).toBe(2);
    expect(await page.locator(`${grid} [data-table-row]`).count()).toBe(2);

    // The whole point of the grid: a cell is a cell, not raw JSON.
    await page
      .locator('[data-field-path="/blocks/2/rows/0/name"]')
      .fill("gamma");
    await page.waitForFunction(
      () =>
        (
          document.querySelector<HTMLIFrameElement>("#canvas")?.contentDocument
            ?.body?.textContent ?? ""
        ).includes("gamma") === true,
      null,
      { timeout: 10_000 }
    );
    await page.close();
  }, 60_000);

  it("adds a table column, names it, and removes it again", async () => {
    const page = await openPage();
    await page.goto(url, { waitUntil: "load" });

    await page.setInputFiles("#file", FIXTURE);
    await selectBlock(page, TABLE_AT_ID);

    const grid = `[data-table-grid="${TABLE_PATH}"]`;
    const header = `${grid} .table-easy-row.head`;
    expect(await page.locator(`${header} input`).count()).toBe(2);

    await page.click(`${grid} [data-add-column]`);
    await page.waitForFunction(
      (selector) => document.querySelectorAll(selector).length === 3,
      `${header} input`
    );
    // A new column gets a key (rows are keyed by it) but no label, so the
    // content floor on `label` flags exactly it — and only it: the union noise
    // the renderer's `oneOf` produces is filtered out of the panel on purpose.
    expect(await page.locator("#status").innerText()).toContain("1 条校验问题");
    expect(await page.locator(`${header} .table-key`).last().innerText()).toBe(
      "col1"
    );

    await page
      .locator('[data-field-path="/blocks/2/columns/2/label"]')
      .fill("备注");
    await page.waitForFunction(
      () =>
        document.querySelector("#status")?.textContent?.includes("校验通过") ===
        true
    );

    // A new row is seeded with a handle and an empty cell per column.
    await page.click(`${grid} [data-add-row]`);
    await page.waitForFunction(
      (selector) => document.querySelectorAll(selector).length === 3,
      `${grid} [data-table-row]`
    );
    await page
      .locator(`${grid} [data-table-row="2"] input`)
      .first()
      .fill("delta");

    await page
      .locator(`${grid} [data-table-row="2"] .btn-remove`)
      .first()
      .click();
    await page.waitForFunction(
      (selector) => document.querySelectorAll(selector).length === 2,
      `${grid} [data-table-row]`
    );

    await page.click(`${grid} [data-drop-column="2"]`);
    await page.waitForFunction(
      (selector) => document.querySelectorAll(selector).length === 2,
      `${header} input`
    );
    await page.close();
  }, 60_000);

  it("selects the block that was clicked on the canvas, not a neighbour", async () => {
    const page = await openPage();
    await page.goto(url, { waitUntil: "load" });

    await page.setInputFiles("#file", FIXTURE);
    await selectBlock(page, PARAGRAPH_AT_ID);
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
