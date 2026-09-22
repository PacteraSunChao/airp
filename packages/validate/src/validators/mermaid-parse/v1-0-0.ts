import { type AirpDiagnostic, diagnostic } from "@airp/diagnostics";
import type Mermaid from "mermaid";
import { VALIDATE_VALIDATORS_MERMAID_PARSE_FAILED } from "../../diagnostic-codes.js";
import { ensureMermaidDom } from "../../node/ensure-mermaid-dom.js";
import type { ValidationStageResult } from "../../types.js";
import { validationStageResult } from "../../validation-stage-result.js";
import { collectMermaidSources } from "../shared/collect-mermaid-sources/v1-0-0.js";

let mermaidApi: typeof Mermaid | undefined;

async function loadMermaid(): Promise<typeof Mermaid> {
  ensureMermaidDom();
  if (!mermaidApi) {
    const mod = await import("mermaid");
    const api = mod.default;
    api.initialize({ startOnLoad: false, securityLevel: "strict" });
    mermaidApi = api;
  }
  return mermaidApi;
}

/** Parse every Mermaid source in the document (Node; no render). */
export async function mermaidParse100(
  document: Record<string, unknown>
): Promise<ValidationStageResult> {
  const diagnostics: AirpDiagnostic[] = [];
  const sources = collectMermaidSources(document.blocks, "/blocks");
  if (sources.length === 0) {
    return validationStageResult("mermaid-parse", diagnostics);
  }

  const api = await loadMermaid();

  for (const item of sources) {
    try {
      await api.parse(item.source);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      diagnostics.push(
        diagnostic(
          VALIDATE_VALIDATORS_MERMAID_PARSE_FAILED,
          `Mermaid parse failed: ${message}`,
          { location: { path: item.path } }
        )
      );
    }
  }

  return validationStageResult("mermaid-parse", diagnostics);
}
