import path from "node:path";
import { fileURLToPath } from "node:url";
import type { InlineConfig } from "vitest/node";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)));

/** Shared Vitest settings; coverage output goes to .tmp/coverage/<dirName>/. */
export function vitestConfig(dirName: string): InlineConfig {
  return {
    coverage: {
      provider: "v8",
      reportsDirectory: path.join(repoRoot, ".tmp/coverage", dirName),
      reporter: ["text", "html"],
      include: ["src/**/*.ts"],
      exclude: ["**/*.test.ts", "**/test/**", "**/node_modules/**"],
    },
  };
}
