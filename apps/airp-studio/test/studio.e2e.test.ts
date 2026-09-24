/**
 * Drives the built app in a real browser: open a document, edit a field, save.
 * The save step is the point — it proves the round trip ends in a file whose only
 * change is the edited line.
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

describe("studio app", () => {
  it("opens a document, edits a field, and saves a minimal diff", async () => {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "load" });

    await page.setInputFiles("#file", FIXTURE);
    await page.waitForSelector('[data-block-at-id="bbbbbbbbbb"]');
    expect(await page.locator("#blocks li").count()).toBe(6);
    expect(await page.locator("#status").innerText()).toContain("校验通过");

    await page.click('[data-block-at-id="bbbbbbbbbb"]');
    const field = page.locator('[data-field-key="text"]');
    await field.fill("改写后的正文。");
    await page.waitForFunction(
      () =>
        document
          .querySelector<HTMLIFrameElement>("#preview")
          ?.srcdoc.includes("改写后的正文。") === true,
      null,
      { timeout: 10_000 }
    );

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.click("#save"),
    ]);
    const savedPath = await download.path();
    const saved = readFileSync(savedPath, "utf8");
    const original = readFileSync(FIXTURE, "utf8");
    // Saving rewrites the document in the protocol's canonical form, and this
    // fixture is not canonical (it keeps some objects on one line), so the
    // baseline for "only the edit changed" is the canonical form of the same
    // document rather than the file's original bytes.
    const baseline = serializeDocument(JSON.parse(original)).split("\n");
    const changed = baseline.filter(
      (line, index) => line !== saved.split("\n")[index]
    );

    expect(saved).toContain("改写后的正文。");
    expect(changed).toHaveLength(1);
    await page.close();
  }, 60_000);

  it("reports a document the schema rejects", async () => {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "load" });

    await page.setInputFiles(
      "#file",
      documentPath("invalid", "duplicate-at-id-1.1.0.airp.json")
    );
    await page.waitForSelector("[data-diagnostic-at-id]");

    expect(await page.locator("#status").innerText()).toContain("校验问题");
    expect(
      await page.locator("[data-diagnostic-at-id]").first().innerText()
    ).toContain("validate.validators.at-id.duplicate");
    await page.close();
  }, 60_000);

  it("adds and removes a block from the list", async () => {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "load" });

    await page.setInputFiles("#file", FIXTURE);
    await page.waitForSelector('[data-block-at-id="bbbbbbbbbb"]');
    expect(
      await page
        .locator("li:has([data-block-at-id='aaaaaaaaaa']) [data-move-up]")
        .isDisabled()
    ).toBe(true);

    await page.click('[data-block-at-id="bbbbbbbbbb"]');
    await page.selectOption("#add-type", "paragraph");
    await page.click("#add-block");
    await page.waitForFunction(
      () => document.querySelectorAll("#blocks li").length === 7
    );

    // The block that was just created is selected, so it can be dropped again.
    await page.click('li:has(button[aria-current="true"]) [data-remove]');
    await page.waitForFunction(
      () => document.querySelectorAll("#blocks li").length === 6
    );
    expect(await page.locator("#status").innerText()).toContain("校验通过");
    await page.close();
  }, 60_000);

  it("adds a table column through the form and removes it again", async () => {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "load" });

    await page.setInputFiles("#file", FIXTURE);
    await page.waitForSelector('[data-block-at-id="hhhhhhhhhh"]');
    await page.click('[data-block-at-id="hhhhhhhhhh"]');

    const columns = 'fieldset[data-field-path="/blocks/2/columns"]';
    const countColumns = `document.querySelectorAll('${columns} [data-array-item]').length`;
    expect(await page.locator(`${columns} [data-array-item]`).count()).toBe(2);

    await page.click(`${columns} [data-add-item]`);
    await page.waitForFunction(`${countColumns} === 3`);
    // A new column is seeded empty, so the content floor on `label` flags it.
    expect(await page.locator("#status").innerText()).toContain("校验问题");

    await page
      .locator(`${columns} [data-array-item]`)
      .last()
      .locator('[data-field-key="label"]')
      .fill("备注");
    await page.waitForFunction(
      () =>
        document.querySelector("#status")?.textContent?.includes("校验通过") ===
        true
    );

    await page
      .locator(`${columns} [data-array-item]`)
      .last()
      .locator("[data-drop-item]")
      .click();
    await page.waitForFunction(`${countColumns} === 2`);
    await page.close();
  }, 60_000);

  // Every valid fixture in the repository, not just the one the tests above use:
  // a document shape the app cannot list must fail here rather than in a
  // reviewer's browser.
  it("opens every valid fixture and lists its blocks", async () => {
    const page = await browser.newPage();
    const fixtures = readdirSync(documentPath("valid")).filter((name) =>
      name.endsWith(".airp.json")
    );
    expect(fixtures.length).toBeGreaterThan(0);

    for (const name of fixtures) {
      await page.goto(url, { waitUntil: "load" });
      await page.setInputFiles("#file", documentPath("valid", name));
      // The status line is rewritten as `<file> · <n> 个块 · …` only when a
      // refresh ran to completion; a thrown error leaves a bare message instead.
      await page.waitForFunction(
        (fileName) =>
          document.querySelector("#status")?.textContent?.includes(fileName) ===
          true,
        name,
        { timeout: 10_000 }
      );
      const status = await page.locator("#status").innerText();
      expect(status, name).toMatch(STATUS_RE);
      expect(await page.locator("#blocks li").count(), name).toBeGreaterThan(0);
    }
    await page.close();
  }, 180_000);

  it("offers no structural actions for a block nested in an object field", async () => {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "load" });

    await page.setInputFiles(
      "#file",
      documentPath("valid", "html-blocks.airp.json")
    );
    await page.waitForFunction(
      () => document.querySelectorAll("#blocks li").length > 0
    );

    const nested = page
      .locator("#blocks li")
      .filter({ hasNot: page.locator("[data-move-up]") });
    expect(await nested.count()).toBe(1);
    await nested.first().locator("button").first().click();

    // Neither an array to insert into…
    expect(await page.locator("#add-block").isDisabled()).toBe(true);
    // …nor one to remove from or reorder within.
    expect(await page.locator("#blocks [data-remove]").count()).toBe(
      (await page.locator("#blocks li").count()) - 1
    );
    await page.close();
  }, 60_000);
});
