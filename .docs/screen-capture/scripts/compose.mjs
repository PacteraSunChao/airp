#!/usr/bin/env node
/**
 * Compose light/dark column grids, then midline-merge + slider chrome → screen-capture.png.
 * Contract: .docs/screen-capture/*-screen-capture-pipeline.airp.json
 */
import { copyFile, mkdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../.."
);
const OUT_DIR = path.join(ROOT, ".tmp/screen-capture");
/** Published marketing image destinations (repo root + VS Code extension). */
const PUBLISH_PATHS = [
  path.join(ROOT, "screen-capture.png"),
  path.join(ROOT, "apps/renderer-vscode/screen-capture.png"),
];

/** True-lossless PNG encode for the final marketing asset. */
const FINAL_PNG = { compressionLevel: 9, effort: 10 };

/** Capture / showcase order (stage 1 writes these PNGs). */
const BLOCK_ORDER = [
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

const CANVAS = { width: 2400, height: 1350 };
/** Outer padding and inter-block / column gap (same rhythm). */
const PAD = 48;
const GAP = 24;
/** Match packages/renderer-target-html/src/styles/tokens.css --bg-page. */
const BACKGROUND = {
  light: "#f8fafc",
  dark: "#0b0f17",
};

/**
 * @typedef {{ type: string, input: Buffer, srcW: number, srcH: number }} BlockMeta
 */

/**
 * Left column starts with hero; right with architectureOverview.
 * Remaining types keep BLOCK_ORDER and alternate left → right.
 * @returns {{ left: string[], right: string[] }}
 */
function splitColumns() {
  const left = ["hero"];
  const right = ["architectureOverview"];
  const rest = BLOCK_ORDER.filter(
    (type) => type !== "hero" && type !== "architectureOverview"
  );
  for (const [index, type] of rest.entries()) {
    if (index % 2 === 0) {
      left.push(type);
    } else {
      right.push(type);
    }
  }
  return { left, right };
}

/**
 * @param {string} blocksDir
 * @param {string[]} types
 * @param {string} scheme
 * @returns {Promise<BlockMeta[]>}
 */
async function loadBlockMetas(blocksDir, types, scheme) {
  /** @type {BlockMeta[]} */
  const metas = [];
  for (const type of types) {
    const input = await readFile(path.join(blocksDir, `${type}.png`));
    const meta = await sharp(input).metadata();
    const srcW = meta.width ?? 0;
    const srcH = meta.height ?? 0;
    if (srcW < 1 || srcH < 1) {
      throw new Error(`Invalid PNG ${scheme}/${type}`);
    }
    metas.push({ type, input, srcW, srcH });
  }
  return metas;
}

/**
 * @param {BlockMeta} block
 * @param {number} colW
 * @param {number} displayH
 * @param {number} naturalH
 * @returns {Promise<Buffer>}
 */
async function renderBlock(block, colW, displayH, naturalH) {
  let pipeline = sharp(block.input).resize({
    width: colW,
    height: naturalH,
    fit: "fill",
  });
  if (displayH < naturalH) {
    pipeline = pipeline.extract({
      left: 0,
      top: 0,
      width: colW,
      height: displayH,
    });
  }
  return await pipeline.png().toBuffer();
}

/**
 * @param {string} blocksDir
 * @param {string[]} types
 * @param {number} colX
 * @param {number} colY
 * @param {number} colW
 * @param {number} colH
 * @param {string} scheme
 * @returns {Promise<import('sharp').OverlayOptions[]>}
 */
async function composeColumn(blocksDir, types, colX, colY, colW, colH, scheme) {
  const metas = await loadBlockMetas(blocksDir, types, scheme);
  const colBottom = colY + colH;
  /** @type {import('sharp').OverlayOptions[]} */
  const overlays = [];
  let y = colY;

  for (let i = 0; i < metas.length; i += 1) {
    const block = metas[i];
    const naturalH = Math.max(1, Math.round((block.srcH * colW) / block.srcW));
    const remaining = colBottom - Math.round(y);

    if (remaining < 1) {
      console.log(
        `  ${scheme} skip ${block.type} (and below): no space left in column`
      );
      break;
    }

    const fitsFull = naturalH <= remaining;
    const displayH = fitsFull ? naturalH : remaining;
    const buf = await renderBlock(block, colW, displayH, naturalH);
    overlays.push({ input: buf, left: colX, top: Math.round(y) });
    console.log(
      `  ${scheme} ${block.type} @ (${colX},${Math.round(y)}) ${colW}×${displayH}` +
        (fitsFull ? "" : ` crop↓${naturalH - displayH}`)
    );

    if (!fitsFull) {
      break;
    }

    y += displayH;
    if (i >= metas.length - 1) {
      break;
    }
    if (y + GAP >= colBottom) {
      console.log(
        `  ${scheme} stop after ${block.type}: gap would leave no room below`
      );
      break;
    }
    y += GAP;
  }

  return overlays;
}

/**
 * @param {"light" | "dark"} scheme
 */
async function composeScheme(scheme) {
  const blocksDir = path.join(OUT_DIR, `${scheme}-blocks`);
  const { left, right } = splitColumns();

  const innerW = CANVAS.width - PAD * 2;
  const innerH = CANVAS.height - PAD * 2;
  const leftW = Math.round((innerW - GAP) * (2 / 5));
  const rightW = innerW - GAP - leftW;
  const leftX = PAD;
  const rightX = PAD + leftW + GAP;
  const colY = PAD;

  const overlays = [
    ...(await composeColumn(
      blocksDir,
      left,
      leftX,
      colY,
      leftW,
      innerH,
      scheme
    )),
    ...(await composeColumn(
      blocksDir,
      right,
      rightX,
      colY,
      rightW,
      innerH,
      scheme
    )),
  ];

  const outPath = path.join(OUT_DIR, `${scheme}-final.png`);
  await sharp({
    create: {
      width: CANVAS.width,
      height: CANVAS.height,
      channels: 3,
      background: BACKGROUND[scheme],
    },
  })
    .composite(overlays)
    .png()
    .toFile(outPath);

  console.log(
    `Wrote ${outPath} (left ${leftW}px / right ${rightW}px, pad=${PAD} gap=${GAP})`
  );
}

/**
 * Before/after comparison slider chrome on the vertical midline.
 * @param {number} w
 * @param {number} h
 * @param {number} mid
 * @returns {Buffer}
 */
function sliderChromeSvg(w, h, mid) {
  const cy = Math.round(h / 2);
  const knobR = 28;
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <defs>
    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="1" stdDeviation="3" flood-color="#000000" flood-opacity="0.35"/>
    </filter>
  </defs>
  <!-- divider line -->
  <line x1="${mid}" y1="0" x2="${mid}" y2="${h}" stroke="#ffffff" stroke-opacity="0.92" stroke-width="3" filter="url(#shadow)"/>
  <!-- knob -->
  <circle cx="${mid}" cy="${cy}" r="${knobR}" fill="#ffffff" fill-opacity="0.96" filter="url(#shadow)"/>
  <circle cx="${mid}" cy="${cy}" r="${knobR - 1.5}" fill="none" stroke="#0f172a" stroke-opacity="0.12" stroke-width="1"/>
  <!-- left / right chevrons -->
  <polyline points="${mid - 10},${cy - 8} ${mid - 16},${cy} ${mid - 10},${cy + 8}" fill="none" stroke="#334155" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  <polyline points="${mid + 10},${cy - 8} ${mid + 16},${cy} ${mid + 10},${cy + 8}" fill="none" stroke="#334155" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`);
}

/**
 * Split light/dark finals on the vertical midline (left dark, right light),
 * with a comparison-slider handle → screen-capture.png, then publish copies.
 */
async function mergeScreenCapture() {
  const { width: w, height: h } = CANVAS;
  const mid = Math.floor(w / 2);
  const rightW = w - mid;
  const outPath = path.join(OUT_DIR, "screen-capture.png");

  const darkHalf = await sharp(
    await readFile(path.join(OUT_DIR, "dark-final.png"))
  )
    .extract({ left: 0, top: 0, width: mid, height: h })
    .png()
    .toBuffer();
  const lightHalf = await sharp(
    await readFile(path.join(OUT_DIR, "light-final.png"))
  )
    .extract({ left: mid, top: 0, width: rightW, height: h })
    .png()
    .toBuffer();

  const slider = await sharp(sliderChromeSvg(w, h, mid))
    .png()
    .toBuffer();

  const uncompressed = await sharp({
    create: {
      width: w,
      height: h,
      channels: 3,
      background: BACKGROUND.dark,
    },
  })
    .composite([
      { input: darkHalf, left: 0, top: 0 },
      { input: lightHalf, left: mid, top: 0 },
      { input: slider, left: 0, top: 0 },
    ])
    .png()
    .toBuffer();

  await sharp(uncompressed).png(FINAL_PNG).toFile(outPath);
  const outStat = await stat(outPath);
  console.log(
    `Wrote ${outPath} (midline dark|light + slider; raw ${uncompressed.length} → ${outStat.size} bytes)`
  );

  for (const dest of PUBLISH_PATHS) {
    await copyFile(outPath, dest);
    console.log(`Published ${dest}`);
  }
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const { left, right } = splitColumns();
  console.log(
    `Grid ${CANVAS.width}×${CANVAS.height} pad=${PAD} gap=${GAP} ratio 2:3`
  );
  console.log(`  left:  ${left.join(", ")}`);
  console.log(`  right: ${right.join(", ")}`);
  await composeScheme("light");
  await composeScheme("dark");
  await mergeScreenCapture();
  console.log("OK: light-final.png + dark-final.png + screen-capture.png");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
