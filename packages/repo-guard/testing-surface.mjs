/**
 * Workspace package discovery and test/surface.json loading.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { ROOT } from "./repo-root.mjs";

export const SURFACE_FILENAME = "surface.json";
export const AIRP_PREFIX = "@airp/";

export const VALID_TIERS = new Set(["Unit", "Package", "E2E"]);

/** @param {string} value */
function toPosixPath(value) {
  return value.replace(/\\/g, "/");
}

/** @param {string} absPath */
export function relFromRoot(absPath) {
  return toPosixPath(path.relative(ROOT, absPath));
}

/** @returns {string[]} */
export function listWorkspacePackageJsonPaths() {
  const paths = [];
  for (const scope of ["packages", "apps"]) {
    const base = path.join(ROOT, scope);
    if (!existsSync(base)) {
      continue;
    }
    for (const name of readdirSync(base)) {
      const dir = path.join(base, name);
      if (!statSync(dir).isDirectory()) {
        continue;
      }
      const pkgJson = path.join(dir, "package.json");
      if (existsSync(pkgJson)) {
        paths.push(pkgJson);
      }
    }
  }
  return paths;
}

/** @param {string} pkgJsonPath */
export function readPackageMeta(pkgJsonPath) {
  const raw = readFileSync(pkgJsonPath, "utf8");
  const data = JSON.parse(raw);
  const pkgDir = path.dirname(pkgJsonPath);
  return {
    name: typeof data.name === "string" ? data.name : "",
    scripts:
      data.scripts && typeof data.scripts === "object" ? data.scripts : {},
    pkgDir,
    pkgRel: relFromRoot(pkgDir),
    isApp: relFromRoot(pkgDir).startsWith("apps/"),
    surfacePath: path.join(pkgDir, "test", SURFACE_FILENAME),
  };
}

/** @param {string} exportName @param {string} absFilePath */
export function exportExistsInFile(exportName, absFilePath) {
  if (!existsSync(absFilePath)) {
    return false;
  }
  const content = readFileSync(absFilePath, "utf8");
  const patterns = [
    new RegExp(`export\\s+const\\s+${exportName}\\b`),
    new RegExp(`export\\s*\\{[^}]*\\b${exportName}\\b`),
  ];
  return patterns.some((re) => re.test(content));
}

/** @returns {ReturnType<typeof readPackageMeta>[]} */
export function listTestablePackages() {
  return listWorkspacePackageJsonPaths()
    .map(readPackageMeta)
    .filter((pkg) => pkg.name.startsWith(AIRP_PREFIX) && "test" in pkg.scripts)
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * @param {ReturnType<typeof readPackageMeta>} pkg
 * @returns {{ surface?: Record<string, unknown>; parseError?: string }}
 */
export function readSurfaceFile(pkg) {
  if (!existsSync(pkg.surfacePath)) {
    return {};
  }
  try {
    return { surface: JSON.parse(readFileSync(pkg.surfacePath, "utf8")) };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { parseError: message };
  }
}
