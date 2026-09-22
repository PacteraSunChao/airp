#!/usr/bin/env node
/**
 * Validate per-package test/surface.json manifests across the workspace.
 * Usage: pnpm check-testing-surface
 */
import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import {
  exportExistsInFile,
  listTestablePackages,
  readSurfaceFile,
  relFromRoot,
  VALID_TIERS,
} from "./testing-surface.mjs";

/** @type {string[]} */
const errors = [];

function fail(message) {
  errors.push(message);
}

for (const pkg of listTestablePackages()) {
  const label = pkg.name;
  const surfaceRel = relFromRoot(pkg.surfacePath);
  const { surface, parseError } = readSurfaceFile(pkg);

  if (parseError) {
    fail(`${label}: invalid JSON in ${surfaceRel}: ${parseError}`);
    continue;
  }
  if (!surface) {
    fail(
      `${label} has a test script but missing ${surfaceRel} — add test/surface.json in that package`
    );
    continue;
  }

  const tiers = surface.tiers;
  if (!Array.isArray(tiers) || tiers.length === 0) {
    fail(`${label}: ${surfaceRel} must declare non-empty "tiers" array`);
    continue;
  }

  for (const tier of tiers) {
    if (typeof tier !== "string" || !VALID_TIERS.has(tier)) {
      fail(
        `${label}: invalid tier "${String(tier)}" in ${surfaceRel} — use Unit / Package / E2E`
      );
    }
  }

  if (pkg.isApp) {
    if (!tiers.includes("Unit")) {
      fail(`${label}: apps must include "Unit" in ${surfaceRel}`);
    }
    if (!tiers.includes("E2E")) {
      fail(`${label}: apps must include "E2E" in ${surfaceRel}`);
    }
  }

  if (surface.caseDriven === true) {
    const cases = surface.cases;
    if (!Array.isArray(cases) || cases.length === 0) {
      fail(
        `${label}: ${surfaceRel} has caseDriven true but "cases" is empty or missing`
      );
      continue;
    }

    for (const [index, entry] of cases.entries()) {
      const caseLabel = `${label} cases[${index}]`;
      const file = entry?.file;
      const exportName = entry?.export;
      const tier = entry?.tier;

      if (!(file && exportName && tier)) {
        fail(`${caseLabel}: each case must have tier, file, and export`);
        continue;
      }
      if (!VALID_TIERS.has(tier) || tier === "Unit") {
        fail(`${caseLabel}: tier must be Package or E2E`);
        continue;
      }
      if (!tiers.includes(tier)) {
        fail(
          `${caseLabel}: tier "${tier}" is not listed in package tiers in ${surfaceRel}`
        );
      }

      const caseAbs = path.join(pkg.pkgDir, "test", file);
      const caseRel = relFromRoot(caseAbs);
      if (!existsSync(caseAbs)) {
        fail(`${caseLabel}: case file missing: ${caseRel}`);
        continue;
      }
      if (!exportExistsInFile(exportName, caseAbs)) {
        fail(`${caseLabel}: export "${exportName}" not found in ${caseRel}`);
      }
    }
  }
}

if (errors.length) {
  console.error(`[check-testing-surface] ${errors.length} error(s):\n`);
  for (const e of errors) {
    console.error(`  - ${e}`);
  }
  process.exit(1);
}

console.log("[check-testing-surface] OK");
process.exit(0);
