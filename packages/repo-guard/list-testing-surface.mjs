#!/usr/bin/env node
/**
 * List per-package test/surface.json manifests across the workspace.
 * Usage: pnpm list-testing-surface [--json]
 */
import process from "node:process";
import {
  listTestablePackages,
  readSurfaceFile,
  relFromRoot,
} from "./testing-surface.mjs";

const jsonMode = process.argv.includes("--json");

/** @typedef {{ name: string; path: string; surfacePath: string; surface?: Record<string, unknown>; missingSurface?: boolean; parseError?: string }} Entry */

/** @returns {Entry[]} */
function collectEntries() {
  /** @type {Entry[]} */
  const entries = [];

  for (const pkg of listTestablePackages()) {
    const { surface, parseError } = readSurfaceFile(pkg);
    /** @type {Entry} */
    const entry = {
      name: pkg.name,
      path: pkg.pkgRel,
      surfacePath: relFromRoot(pkg.surfacePath),
    };
    if (parseError) {
      entry.parseError = parseError;
    } else if (surface) {
      entry.surface = surface;
    } else {
      entry.missingSurface = true;
    }
    entries.push(entry);
  }

  return entries;
}

/** @param {Entry} entry */
function printTestCommand(entry) {
  console.log(`  test: pnpm --filter ${entry.name} test`);
  console.log("");
}

/** @param {Record<string, unknown>} surface */
function printSurfaceDetails(surface) {
  const tiers = Array.isArray(surface.tiers) ? surface.tiers.join(", ") : "—";
  console.log(`  tiers: ${tiers}`);
  console.log(`  caseDriven: ${String(surface.caseDriven === true)}`);
  console.log(`  usesFixtures: ${String(surface.usesFixtures === true)}`);

  if (!Array.isArray(surface.cases) || surface.cases.length === 0) {
    return;
  }

  console.log("  cases:");
  for (const caseEntry of surface.cases) {
    const tier = caseEntry?.tier ?? "?";
    const file = caseEntry?.file ?? "?";
    const exportName = caseEntry?.export ?? "?";
    console.log(`    - ${tier} ${file} → ${exportName}`);
  }
}

/** @param {Entry} entry */
function printHumanEntry(entry) {
  console.log(entry.name);
  console.log(`  path: ${entry.path}`);
  console.log(`  surface: ${entry.surfacePath}`);

  if (entry.missingSurface) {
    console.log("  status: missing surface.json");
    printTestCommand(entry);
    return;
  }
  if (entry.parseError) {
    console.log(`  status: invalid JSON (${entry.parseError})`);
    printTestCommand(entry);
    return;
  }

  printSurfaceDetails(entry.surface ?? {});
  printTestCommand(entry);
}

/** @param {Entry[]} entries */
function printHuman(entries) {
  console.log(`[list-testing-surface] ${entries.length} package(s)\n`);
  for (const entry of entries) {
    printHumanEntry(entry);
  }
}

const entries = collectEntries();

if (jsonMode) {
  console.log(JSON.stringify(entries, null, 2));
} else {
  printHuman(entries);
}
