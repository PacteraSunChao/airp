import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { UsageError } from "../src/node/usage-error";
import {
  findWorkspaceRoot,
  WORKSPACE_ROOT_MARKER,
} from "../src/node/workspace-root";

describe("findWorkspaceRoot", () => {
  it("finds the monorepo root from this package", () => {
    const here = path.dirname(fileURLToPath(import.meta.url));
    const root = findWorkspaceRoot(here);
    expect(path.basename(root)).toBe("airp");
    expect(WORKSPACE_ROOT_MARKER).toBe("pnpm-workspace.yaml");
  });
});

describe("UsageError", () => {
  it("is named UsageError", () => {
    const err = new UsageError("bad flag");
    expect(err.name).toBe("UsageError");
    expect(err.message).toBe("bad flag");
  });
});
