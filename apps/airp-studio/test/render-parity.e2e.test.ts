/**
 * The canvas must look like the Renderer's own output.
 *
 * Byte equality is checked without a browser (`render-service.test.ts`), and the
 * canvas is checked to show the service's bytes (`studio.e2e.test.ts`). What is
 * left is the step a reader actually cares about: does the thing on screen look
 * like the thing the Renderer draws?
 *
 * Both captures happen in the same Chromium, so a machine's fonts affect both
 * sides equally and cannot make this flaky. A document without a diagram has to
 * match exactly; one with a diagram is allowed a sliver of difference, because
 * the Renderer's SVG is rasterised in two different embedding contexts and shape
 * edges antialias a little differently. The tolerance is tiny enough that losing
 * the render service — the bug this guards against — fails it loudly.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { documentPath } from "@airp/test-kit";
import { type Browser, chromium, type Page } from "playwright";
import { createServer, type ViteDevServer } from "vite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const APP_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);
const PLAIN = documentPath("valid", "section-at-id-1.1.0.airp.json");
const DIAGRAM = documentPath("valid", "mermaid-ok-1.1.0.airp.json");
const CANVAS_TIMEOUT_MS = 30_000;

/** Fraction of pixels allowed to differ for a document with a diagram. */
const DIAGRAM_TOLERANCE = 0.005;

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

/** Ask the service for a document, the way the canvas does. */
async function serviceHtml(fixture: string): Promise<string> {
  const response = await fetch(`${url}__airp/render`, {
    body: JSON.stringify({
      document: JSON.parse(await readFixture(fixture)),
      machineHandles: true,
      target: "html",
    }),
    headers: { "content-type": "application/json" },
    method: "POST",
  });
  const result = (await response.json()) as { body?: string };
  return result.body ?? "";
}

async function readFixture(fixture: string): Promise<string> {
  const { readFileSync } = await import("node:fs");
  return readFileSync(fixture, "utf8");
}

/** Count the pixels two screenshots disagree on, inside the browser. */
async function differingPixels(
  page: Page,
  left: Buffer,
  right: Buffer
): Promise<{ differing: number; total: number }> {
  return await page.evaluate(
    async ([a, b]) => {
      const load = async (base64: string): Promise<ImageBitmap> =>
        await createImageBitmap(
          await (await fetch(`data:image/png;base64,${base64}`)).blob()
        );
      const [first, second] = await Promise.all([load(a), load(b)]);
      const width = Math.min(first.width, second.width);
      const height = Math.min(first.height, second.height);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (context === null) {
        throw new Error("no 2d context");
      }
      context.drawImage(first, 0, 0);
      const leftPixels = context.getImageData(0, 0, width, height).data;
      context.clearRect(0, 0, width, height);
      context.drawImage(second, 0, 0);
      const rightPixels = context.getImageData(0, 0, width, height).data;

      let differing = 0;
      for (let i = 0; i < leftPixels.length; i += 4) {
        if (
          leftPixels[i] !== rightPixels[i] ||
          leftPixels[i + 1] !== rightPixels[i + 1] ||
          leftPixels[i + 2] !== rightPixels[i + 2] ||
          leftPixels[i + 3] !== rightPixels[i + 3]
        ) {
          differing += 1;
        }
      }
      return { differing, total: width * height };
    },
    [left.toString("base64"), right.toString("base64")]
  );
}

/** Screenshot the canvas, and the same bytes rendered at the same size. */
async function compareWithRenderer(
  fixture: string
): Promise<{ differing: number; total: number }> {
  const html = await serviceHtml(fixture);
  const page = await browser.newPage({
    viewport: { width: 1500, height: 950 },
  });
  await page.goto(url, { waitUntil: "load" });
  await page.setInputFiles("#file", fixture);
  await page.waitForFunction(
    () =>
      (
        document.querySelector<HTMLIFrameElement>("#canvas")?.contentDocument
          ?.body?.innerHTML ?? ""
      ).length > 2000,
    null,
    { timeout: CANVAS_TIMEOUT_MS }
  );
  // Drop the editor's own chrome: clicking the document header selects nothing,
  // and the pointer is parked so nothing is hovered.
  await page.frameLocator("#canvas").locator("[data-doc-header]").click();
  await page.mouse.move(2, 2);
  await page.waitForTimeout(400);

  const canvas = page.locator("#canvas");
  const box = await canvas.boundingBox();
  if (box === null) {
    throw new Error("canvas has no box");
  }
  const shotCanvas = await canvas.screenshot();

  const renderer = await browser.newPage({
    viewport: { width: Math.ceil(box.width), height: Math.ceil(box.height) },
  });
  await renderer.setContent(
    `<!doctype html><html><head><style>html,body{margin:0;padding:0}iframe{display:block;border:0}</style></head><body><iframe id="f" srcdoc="${html.replace(/&/g, "&amp;").replace(/"/g, "&quot;")}"></iframe></body></html>`
  );
  await renderer.evaluate(
    ([width, height]) => {
      const frame = document.querySelector("#f");
      if (frame instanceof HTMLElement) {
        frame.style.width = `${width}px`;
        frame.style.height = `${height}px`;
      }
    },
    [box.width, box.height]
  );
  await renderer.waitForTimeout(400);
  const shotRenderer = await renderer.locator("#f").screenshot();

  const result = await differingPixels(page, shotCanvas, shotRenderer);
  await page.close();
  await renderer.close();
  return result;
}

describe("canvas and Renderer", () => {
  it("draw the same pixels for a document without a diagram", async () => {
    const { differing, total } = await compareWithRenderer(PLAIN);
    expect(differing, `${differing}/${total} pixels differ`).toBe(0);
  }, 180_000);

  it("draw a diagram in the same place, down to shape edges", async () => {
    const { differing, total } = await compareWithRenderer(DIAGRAM);
    const ratio = differing / total;
    expect(ratio, `${differing}/${total} pixels differ`).toBeLessThan(
      DIAGRAM_TOLERANCE
    );
  }, 180_000);
});
