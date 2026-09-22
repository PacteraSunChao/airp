#!/usr/bin/env node
/**
 * Capture light/dark block PNGs from the exported showcase HTML.
 * Contract: .docs/screen-capture/*-screen-capture-pipeline.airp.json
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../.."
);
const HTML_PATH = path.join(ROOT, ".tmp/screen-capture/export/showcase.html");
const LIGHT_DIR = path.join(ROOT, ".tmp/screen-capture/light-blocks");
const DARK_DIR = path.join(ROOT, ".tmp/screen-capture/dark-blocks");

const BLOCK_TYPES = [
  "hero",
  "comparison",
  "statusBoard",
  "codeDiff",
  "fileTree",
  "mermaid",
  "architectureOverview",
  "flowSteps",
  "decision",
  "risk",
  "timeline",
  "roadmap",
];

const VIEWPORT = { width: 1200, height: 1100 };
const DEVICE_SCALE_FACTOR = 2;
const COLOR_SCHEME_KEY = "airp-app-color-scheme";

/**
 * @param {import('playwright').Browser} browser
 * @param {"light" | "dark"} scheme
 * @param {string} outDir
 */
async function captureScheme(browser, scheme, outDir) {
  await mkdir(outDir, { recursive: true });

  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: DEVICE_SCALE_FACTOR,
  });

  if (scheme === "dark") {
    await context.addInitScript(
      ({ key }) => {
        localStorage.setItem(key, JSON.stringify("dark"));
      },
      { key: COLOR_SCHEME_KEY }
    );
  } else {
    await context.addInitScript(
      ({ key }) => {
        localStorage.removeItem(key);
      },
      { key: COLOR_SCHEME_KEY }
    );
  }

  const page = await context.newPage();
  await page.goto(pathToFileURL(HTML_PATH).href, { waitUntil: "networkidle" });

  // Ensure theme class matches scheme (head script already applied localStorage).
  await page.evaluate((pref) => {
    document.documentElement.classList.toggle("dark", pref === "dark");
  }, scheme);

  // Mermaid / fonts may settle after first paint.
  await page.waitForTimeout(500);

  const sizes = {};

  for (const type of BLOCK_TYPES) {
    const locator = page.locator(`[data-block-type="${type}"]`).first();
    await locator.waitFor({ state: "visible", timeout: 15_000 });
    await locator.scrollIntoViewIfNeeded();
    await page.waitForTimeout(100);

    const outPath = path.join(outDir, `${type}.png`);
    await locator.screenshot({ path: outPath, type: "png" });

    const box = await locator.boundingBox();
    if (!box) {
      throw new Error(`Missing bounding box for ${scheme}/${type}`);
    }
    sizes[type] = {
      width: Math.round(box.width),
      height: Math.round(box.height),
    };
    console.log(
      `  ${scheme}/${type}.png  ${sizes[type].width}×${sizes[type].height}`
    );
  }

  await context.close();
  return sizes;
}

function assertSameClip(lightSizes, darkSizes) {
  for (const type of BLOCK_TYPES) {
    const light = lightSizes[type];
    const dark = darkSizes[type];
    if (!(light && dark)) {
      throw new Error(`Missing size for ${type}`);
    }
    if (light.width !== dark.width || light.height !== dark.height) {
      throw new Error(
        `Clip mismatch for ${type}: light ${light.width}×${light.height} vs dark ${dark.width}×${dark.height}`
      );
    }
  }
}

async function main() {
  console.log(`Capturing from ${HTML_PATH}`);
  const browser = await chromium.launch();
  try {
    console.log("Light…");
    const lightSizes = await captureScheme(browser, "light", LIGHT_DIR);
    console.log("Dark…");
    const darkSizes = await captureScheme(browser, "dark", DARK_DIR);
    assertSameClip(lightSizes, darkSizes);
    console.log(`OK: ${BLOCK_TYPES.length}×2 block PNGs`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
