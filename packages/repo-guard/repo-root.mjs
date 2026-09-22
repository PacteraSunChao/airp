import path from "node:path";
import { fileURLToPath } from "node:url";

/** Monorepo root (parent of `packages/` and `apps/`). */
export const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../.."
);
