import type { SchemaVersion, VersionRegistry } from "@airp/protocol";
import type { ValidationPipeline } from "./types.js";
import { atId110 } from "./validators/at-id/v1-1-0.js";
import { blockId100 } from "./validators/block-id/v1-0-0.js";
import { document100 } from "./validators/document/v1-0-0.js";
import { i18n100 } from "./validators/i18n/v1-0-0.js";
import { i18n110 } from "./validators/i18n/v1-1-0.js";

const VALIDATION_PIPELINES = {
  "1.0.0": {
    gates: [document100, i18n100, blockId100],
    semantics: [],
  },
  "1.1.0": {
    gates: [document100, i18n110, atId110],
    semantics: [],
  },
} satisfies VersionRegistry<ValidationPipeline>;

/** Isomorphic validation pipeline for a supported schema version. */
export function pipelineFor(version: SchemaVersion): ValidationPipeline {
  return VALIDATION_PIPELINES[version];
}
