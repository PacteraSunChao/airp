import {
  type AirpDiagnostic,
  airpResultFrom,
  diagnostic,
  withStage,
} from "@airp/diagnostics";
import { hasSchemaVersion } from "@airp/protocol";
import { isRecord } from "@airp/utils";
import { VALIDATE_SCHEMA_VERSION_UNSUPPORTED } from "./diagnostic-codes.js";
import { pipelineFor } from "./registry.js";
import { runValidationPipeline } from "./run-pipeline.js";
import type { ValidationPipeline, ValidationResult } from "./types.js";

function collectValidationDiagnostics(
  stages: import("./types.js").ValidationStageResult[]
): AirpDiagnostic[] {
  const failed = stages.some((stage) => !stage.ok);
  const relevant = failed ? stages.filter((stage) => !stage.ok) : stages;
  return relevant.flatMap((stage) => withStage(stage.diagnostics, stage.stage));
}

function unsupportedVersionResult(version: string): ValidationResult {
  return airpResultFrom(
    withStage(
      [
        diagnostic(
          VALIDATE_SCHEMA_VERSION_UNSUPPORTED,
          `Unsupported schemaVersion: ${version}`,
          { location: { path: "/schemaVersion" } }
        ),
      ],
      "schema-version"
    )
  );
}

async function validateWithPipeline(
  document: unknown,
  resolvePipeline: (
    version: import("@airp/protocol").SchemaVersion
  ) => ValidationPipeline
): Promise<ValidationResult> {
  if (!isRecord(document)) {
    // Ajv document gate expects an object; surface via schema-version when possible.
    return unsupportedVersionResult(String(document));
  }

  const version = document.schemaVersion;
  if (typeof version !== "string" || !hasSchemaVersion(version)) {
    return unsupportedVersionResult(
      typeof version === "string" ? version : String(version)
    );
  }

  const stages = await runValidationPipeline(
    document,
    version,
    resolvePipeline(version)
  );
  return airpResultFrom(collectValidationDiagnostics(stages));
}

/** Run the isomorphic validation pipeline (no Mermaid parse). */
export async function validateDocument(
  document: unknown
): Promise<ValidationResult> {
  return await validateWithPipeline(document, pipelineFor);
}

export { validateWithPipeline };
