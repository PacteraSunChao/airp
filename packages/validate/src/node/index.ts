import type { ValidationResult } from "../types.js";
import { validateWithPipeline } from "../validate-document.js";
import { nodePipelineFor } from "./registry.js";

/** Run the Node validation pipeline (includes Mermaid parse). */
export async function validateDocument(
  document: unknown
): Promise<ValidationResult> {
  return await validateWithPipeline(document, nodePipelineFor);
}

export type { ValidationResult } from "../types.js";
