import { stat } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import {
  renderDocumentWithHtmlFromUrl,
  resolveHtmlTargetDistDir,
  resolveHtmlTargetNodeDistIndex,
} from "@airp/renderer/node";
import type { renderDocument } from "@airp/renderer/node/render";
import { isRendererCliDevMode } from "../staging/staging-paths.js";

export type RenderDocumentFn = typeof renderDocument;

export interface RendererModule {
  renderDocument: RenderDocumentFn;
}

const DIST_WAIT_MS = 30_000;
const DIST_POLL_MS = 100;

async function waitForDistIndex(distIndex: string): Promise<void> {
  const deadline = Date.now() + DIST_WAIT_MS;
  while (Date.now() < deadline) {
    try {
      await stat(distIndex);
      return;
    } catch {
      await new Promise((resolve) => {
        setTimeout(resolve, DIST_POLL_MS);
      });
    }
  }
  throw new Error(`Timed out waiting for html target dist: ${distIndex}`);
}

async function loadFromPackage(): Promise<RendererModule> {
  const orch = await import("@airp/renderer/node/render");
  return {
    renderDocument: orch.renderDocument,
  };
}

/** Dev: wait for html node dist, then render with that dist (cache-bust). */
async function loadForDev(): Promise<RendererModule> {
  const distIndex = resolveHtmlTargetNodeDistIndex();
  await waitForDistIndex(distIndex);
  const htmlModuleUrl = `${pathToFileURL(distIndex).href}?t=${Date.now()}`;
  return {
    renderDocument: (document, target, input) =>
      renderDocumentWithHtmlFromUrl(document, target, input, htmlModuleUrl),
  };
}

/** Load renderer entrypoints — wait for html dist in CLI dev mode. */
export function loadRendererModule(): Promise<RendererModule> {
  if (isRendererCliDevMode()) {
    return loadForDev();
  }
  return loadFromPackage();
}

export function rendererDistDirForWatch(): string | null {
  return isRendererCliDevMode() ? resolveHtmlTargetDistDir() : null;
}
