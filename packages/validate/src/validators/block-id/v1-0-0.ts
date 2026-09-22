import { type AirpDiagnostic, diagnostic } from "@airp/diagnostics";
import { isRecord } from "@airp/utils";
import { VALIDATE_VALIDATORS_BLOCK_ID_DUPLICATE } from "../../diagnostic-codes.js";
import type { ValidationStageResult } from "../../types.js";
import { validationStageResult } from "../../validation-stage-result.js";

interface SeenId {
  path: string;
}

/** Collect block `id` values under the blocks tree (objects with `type`). */
function walkBlockIds(
  value: unknown,
  path: string,
  seen: Map<string, SeenId>,
  diagnostics: AirpDiagnostic[]
): void {
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i += 1) {
      walkBlockIds(value[i], `${path}/${i}`, seen, diagnostics);
    }
    return;
  }
  if (!isRecord(value)) {
    return;
  }

  const isBlock = typeof value.type === "string";
  if (isBlock && typeof value.id === "string") {
    const previous = seen.get(value.id);
    if (previous) {
      diagnostics.push(
        diagnostic(
          VALIDATE_VALIDATORS_BLOCK_ID_DUPLICATE,
          `Duplicate block id "${value.id}" (also at ${previous.path})`,
          { location: { path: `${path}/id` } }
        )
      );
    } else {
      seen.set(value.id, { path: `${path}/id` });
    }
  }

  for (const [key, child] of Object.entries(value)) {
    walkBlockIds(child, `${path}/${key}`, seen, diagnostics);
  }
}

/** Require globally unique block ids across the blocks tree. */
export function blockId100(
  document: Record<string, unknown>
): ValidationStageResult {
  const diagnostics: AirpDiagnostic[] = [];
  const seen = new Map<string, SeenId>();
  walkBlockIds(document.blocks, "/blocks", seen, diagnostics);
  return validationStageResult("block-id", diagnostics);
}
