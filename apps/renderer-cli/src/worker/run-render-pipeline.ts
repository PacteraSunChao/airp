import path from "node:path";
import { type AirpResult, airpResultFrom, withStage } from "@airp/diagnostics";
import { loadDocumentFile } from "@airp/loader/node";
import type {
  AirpDocumentSnapshot,
  RenderFile,
  RenderTarget,
} from "@airp/renderer";
import { validateDocument } from "@airp/validate/node";
import { createDiskWriter } from "@airp/writer/to-disk";
import type { RendererCliScene } from "../command-types.js";
import { loadRendererModule } from "../renderer/load-render-document.js";

export interface RunRenderPipelineOptions {
  input: string;
  /** Absolute path of the primary output file. */
  outFile: string;
  scene: RendererCliScene;
  target: RenderTarget;
}

export interface RunRenderPipelineValue {
  /** Absolute paths of every file the host wrote. */
  files: string[];
  /** Basename of the primary output file. */
  primaryFilename: string;
  /** Absolute path of the primary render file. */
  primaryPath: string;
}

export type RunRenderPipelineResult = AirpResult<RunRenderPipelineValue>;

type FailResult = Extract<RunRenderPipelineResult, { ok: false }>;

async function writeRenderFiles(
  outFile: string,
  files: readonly RenderFile[]
): Promise<{
  written: string[];
  primaryPath: string;
  primaryFilename: string;
}> {
  const outDir = path.dirname(outFile);
  const primaryFilename = path.basename(outFile);
  const writer = createDiskWriter(outDir);
  const encoder = new TextEncoder();
  const written: string[] = [];

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    if (!file) {
      continue;
    }
    const relPath = index === 0 ? primaryFilename : file.path;
    const body =
      typeof file.body === "string" ? encoder.encode(file.body) : file.body;
    await writer.putOutputFile(relPath, body);
    written.push(path.join(outDir, relPath));
  }

  return {
    written,
    primaryPath: outFile,
    primaryFilename,
  };
}

/** Load → validate → render → write primary to `outFile`. */
export async function runRenderPipeline(
  options: RunRenderPipelineOptions
): Promise<RunRenderPipelineResult> {
  const inputFile = path.resolve(options.input);
  const outFile = path.resolve(options.outFile);

  const loadResult = await loadDocumentFile(inputFile);
  if (!loadResult.ok) {
    return airpResultFrom(
      withStage(loadResult.diagnostics, "bootstrap")
    ) as FailResult;
  }

  const validation = await validateDocument(loadResult.value.document);
  if (!validation.ok) {
    return airpResultFrom(validation.diagnostics) as FailResult;
  }

  const { renderDocument } = await loadRendererModule();
  const renderResult = await renderDocument(
    loadResult.value.document as unknown as AirpDocumentSnapshot,
    options.target,
    {}
  );
  if (!renderResult.ok) {
    return airpResultFrom(renderResult.diagnostics) as FailResult;
  }

  const { written, primaryPath, primaryFilename } = await writeRenderFiles(
    outFile,
    renderResult.value.files
  );

  return airpResultFrom(
    [...validation.diagnostics, ...renderResult.diagnostics],
    {
      files: written,
      primaryPath,
      primaryFilename,
    }
  );
}
