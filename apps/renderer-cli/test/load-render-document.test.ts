import path from "node:path";
import {
  resolveHtmlTargetDistDir,
  resolveHtmlTargetNodeDistIndex,
} from "@airp/renderer/node";
import { afterEach, describe, expect, it } from "vitest";
import { loadRendererModule } from "../src/renderer/load-render-document.js";

describe("loadRendererModule", () => {
  const previous = process.env.AIRP_RENDER_CLI_DEV;

  afterEach(() => {
    process.env.AIRP_RENDER_CLI_DEV = previous;
  });

  it("reloads html target dist in dev mode", async () => {
    process.env.AIRP_RENDER_CLI_DEV = "1";
    const distDir = resolveHtmlTargetDistDir();
    expect(distDir.endsWith(`${path.sep}dist`)).toBe(true);
    expect(resolveHtmlTargetNodeDistIndex()).toBe(
      path.join(distDir, "node", "index.mjs")
    );

    const mod = await loadRendererModule();
    expect(typeof mod.renderDocument).toBe("function");
  });

  it("imports package export outside dev mode", async () => {
    process.env.AIRP_RENDER_CLI_DEV = undefined;
    const mod = await loadRendererModule();
    expect(typeof mod.renderDocument).toBe("function");
  });
});
