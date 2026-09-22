#!/usr/bin/env node
/**
 * Stage 1: wipe .tmp/screen-capture → export HTML → capture block PNGs.
 * Contract: .docs/screen-capture/*-screen-capture-pipeline.airp.json
 */
import { spawnSync } from "node:child_process";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../.."
);
const SCRIPTS = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(ROOT, ".tmp/screen-capture");

/**
 * @param {string} command
 * @param {string[]} args
 * @param {string} [cwd]
 */
function run(command, args, cwd = ROOT) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    env: process.env,
    shell: false,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

async function main() {
  console.log("=== Wipe .tmp/screen-capture ===");
  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(path.join(OUT_DIR, "export"), { recursive: true });
  await mkdir(path.join(OUT_DIR, "light-blocks"), { recursive: true });
  await mkdir(path.join(OUT_DIR, "dark-blocks"), { recursive: true });

  console.log("=== Export HTML ===");
  run("pnpm", [
    "--filter",
    "@airp/renderer-cli",
    "exec",
    "tsx",
    "src/cli.ts",
    "export",
    "--input",
    path.join(
      ROOT,
      ".docs/screen-capture/20260922-151750+0800-block-showcase.airp.json"
    ),
    "--out",
    path.join(OUT_DIR, "export/showcase.html"),
    "--target",
    "html",
  ]);

  console.log("=== Capture blocks ===");
  run(process.execPath, [path.join(SCRIPTS, "capture.mjs")]);
  console.log("OK: stage 1 complete; next: pnpm screen-capture:compose");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
