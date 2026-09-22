import { mkdirSync, mkdtempSync } from "node:fs";
import { mkdir, mkdtemp } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);
const repoRoot = path.resolve(packageRoot, "..", "..");

/** Monorepo root (airp). */
export function resolveRepoRoot(): string {
  return repoRoot;
}

/** Absolute path to fixtures/airp/. */
export function airpFixturesRoot(): string {
  return path.join(repoRoot, "fixtures", "airp");
}

/** Path under fixtures/airp/. */
export function fixturePath(...segments: string[]): string {
  return path.join(airpFixturesRoot(), ...segments);
}

/** Path under fixtures/airp/documents/. */
export function documentPath(...segments: string[]): string {
  return fixturePath("documents", ...segments);
}

/** Absolute path to repo `.tmp/`. */
export function resolveTmpRoot(): string {
  return path.join(repoRoot, ".tmp");
}

/** Absolute path under `.tmp/testing/...`. */
export function resolveTestingPath(...segments: string[]): string {
  return path.join(resolveTmpRoot(), "testing", ...segments);
}

/**
 * Repo-relative path under `.tmp/testing/...` (forward slashes for CLI args).
 */
export function testingRelPath(...segments: string[]): string {
  return [".tmp", "testing", ...segments].join("/");
}

/** Unique temp dir under `.tmp/testing/unit/<packageName>/`. */
export async function mkdtempTestingUnit(
  packageName: string,
  prefix: string
): Promise<string> {
  const base = resolveTestingPath("unit", packageName);
  await mkdir(base, { recursive: true });
  return mkdtemp(path.join(base, prefix));
}

/** Sync unique temp dir under `.tmp/testing/unit/<packageName>/`. */
export function mkdtempSyncTestingUnit(
  packageName: string,
  prefix: string
): string {
  const base = resolveTestingPath("unit", packageName);
  mkdirSync(base, { recursive: true });
  return mkdtempSync(path.join(base, prefix));
}
