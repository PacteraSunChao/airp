import type { SchemaVersion, VersionRegistry } from "@airp/protocol";
import type { ValidationPipeline } from "../types.js";
import { atId110 } from "../validators/at-id/v1-1-0.js";
import { blockId100 } from "../validators/block-id/v1-0-0.js";
import { document100 } from "../validators/document/v1-0-0.js";
import { i18n100 } from "../validators/i18n/v1-0-0.js";
import { i18n110 } from "../validators/i18n/v1-1-0.js";
import { mermaidParse100 } from "../validators/mermaid-parse/v1-0-0.js";

const NODE_VALIDATION_PIPELINES = {
  "1.0.0": {
    gates: [document100, i18n100, blockId100, mermaidParse100],
    semantics: [],
  },
  "1.1.0": {
    gates: [document100, i18n110, atId110, mermaidParse100],
    semantics: [],
  },
} satisfies VersionRegistry<ValidationPipeline>;

/** Node validation pipeline (includes Mermaid parse). */
export function nodePipelineFor(version: SchemaVersion): ValidationPipeline {
  return NODE_VALIDATION_PIPELINES[version];
}
