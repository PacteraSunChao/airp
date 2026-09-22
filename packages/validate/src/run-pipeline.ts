import type { ValidationPipeline, ValidationStageResult } from "./types.js";

/** Run gates then semantics on an already-loaded document object. */
export async function runValidationPipeline(
  document: Record<string, unknown>,
  schemaVersion: import("@airp/protocol").SchemaVersion,
  pipeline: ValidationPipeline
): Promise<ValidationStageResult[]> {
  const stages: ValidationStageResult[] = [];

  for (const validate of pipeline.gates) {
    const stage = await validate(document, schemaVersion);
    stages.push(stage);
    if (!stage.ok) {
      return stages;
    }
  }

  for (const validate of pipeline.semantics) {
    stages.push(await validate(document, schemaVersion));
  }

  return stages;
}
