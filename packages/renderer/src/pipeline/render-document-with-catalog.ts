import {
  type AirpDiagnostic,
  AirpDiagnosticError,
  type AirpResult,
  airpResultFrom,
  diagnostic,
} from "@airp/diagnostics";
import type {
  AirpDocumentSnapshot,
  RenderContext,
  RenderOutput,
  RenderTargetModule,
} from "@airp/renderer-contract";
import {
  isRenderTargetKey,
  type RendererTargetCatalog,
} from "../catalog-keys.js";
import { RENDERER_PIPELINE_UNKNOWN_TARGET } from "../diagnostic-codes.js";
import { resolveRenderLocales } from "./resolve-locales.js";

function mergeDiagnostics(
  ...groups: (AirpDiagnostic[] | undefined | readonly AirpDiagnostic[])[]
): AirpDiagnostic[] {
  return groups.flatMap((group) => [...(group ?? [])]);
}

function unknownTargetDiagnostic(target: string): AirpDiagnostic {
  return diagnostic(
    RENDERER_PIPELINE_UNKNOWN_TARGET,
    `Unknown render target "${target}"`,
    { details: { target } }
  );
}

function moduleForTarget(
  target: string,
  catalog: RendererTargetCatalog
): RenderTargetModule | undefined {
  if (!isRenderTargetKey(target)) {
    return undefined;
  }
  return catalog[target];
}

/**
 * Render a document snapshot against a closed target catalog.
 * Callers must validate first; this entry point does not run validate.
 * Unknown targets return a failed result (do not throw).
 * Target `AirpDiagnosticError` is forwarded into `ok: false` (no remap).
 */
export async function renderDocumentWithCatalog(
  document: AirpDocumentSnapshot,
  target: string,
  input: RenderContext,
  catalog: RendererTargetCatalog
): Promise<AirpResult<RenderOutput>> {
  const module = moduleForTarget(target, catalog);
  if (!module) {
    return airpResultFrom([
      unknownTargetDiagnostic(target),
    ]) as AirpResult<RenderOutput>;
  }

  const { ctx, diagnostics: localeDiagnostics } = resolveRenderLocales(
    document,
    input,
    module
  );
  if (!ctx) {
    return airpResultFrom(localeDiagnostics) as AirpResult<RenderOutput>;
  }

  try {
    const targetOutput = await Promise.resolve(module.render(ctx));
    const diagnostics = mergeDiagnostics(
      localeDiagnostics,
      targetOutput.diagnostics
    );

    return airpResultFrom(diagnostics, {
      format: targetOutput.format,
      files: [
        {
          path: targetOutput.primary.relPath,
          body: targetOutput.primary.body,
        },
      ],
    });
  } catch (error) {
    if (error instanceof AirpDiagnosticError) {
      return airpResultFrom(
        mergeDiagnostics(localeDiagnostics, error.diagnostics)
      ) as AirpResult<RenderOutput>;
    }
    throw error;
  }
}
