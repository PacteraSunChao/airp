import { type AirpDiagnostic, diagnostic } from "@airp/diagnostics";
import { isRecord } from "@airp/utils";
import {
  VALIDATE_VALIDATORS_AT_ID_DUPLICATE,
  VALIDATE_VALIDATORS_AT_ID_INVALID_PATTERN,
  VALIDATE_VALIDATORS_AT_ID_MISSING,
} from "../../diagnostic-codes.js";
import type { ValidationStageResult } from "../../types.js";
import { validationStageResult } from "../../validation-stage-result.js";

/** AIRP 1.1.0 machine-handle pattern (schema `$defs/AtId`). */
export const AT_ID_PATTERN = /^[a-z0-9]{10}$/;

const BLOCK_TYPES = new Set([
  "hero",
  "section",
  "group",
  "divider",
  "spacer",
  "heading",
  "paragraph",
  "lead",
  "pullQuote",
  "blockquote",
  "callout",
  "bulletList",
  "numberedList",
  "checklist",
  "definitionList",
  "table",
  "comparison",
  "collection",
  "keyValueList",
  "statusBoard",
  "code",
  "codeDiff",
  "fileTree",
  "fileChangeList",
  "mermaid",
  "architectureOverview",
  "flowSteps",
  "decision",
  "risk",
  "assumption",
  "constraint",
  "openQuestion",
  "timeline",
  "roadmap",
  "requirementTrace",
  "testResult",
  "apiInventory",
  "linkList",
  "glossary",
  "citation",
  "image",
  "embed",
  "collapsible",
  "tabs",
  "appendix",
  "agentNote",
]);

const ARRAY_PARENTS_NEED_OBJECT_AT_ID = new Set([
  "sourceRefs",
  "badges",
  "metrics",
  "modules",
  "items",
  "steps",
  "events",
  "phases",
  "options",
  "panels",
  "suites",
  "endpoints",
  "terms",
  "links",
  "columns",
  "rows",
]);

interface SeenAtId {
  path: string;
}

function needsAtId(
  value: Record<string, unknown>,
  parentKey: string | null
): boolean {
  const isBlock = typeof value.type === "string" && BLOCK_TYPES.has(value.type);
  const isFileTreeNode =
    (parentKey === "root" || parentKey === "children") &&
    typeof value.name === "string" &&
    !isBlock;
  const isArrayItemObject =
    parentKey !== null && ARRAY_PARENTS_NEED_OBJECT_AT_ID.has(parentKey);
  const isFooter = parentKey === "footerRow";
  const isOverview = parentKey === "overview";
  return (
    isBlock || isFileTreeNode || isArrayItemObject || isFooter || isOverview
  );
}

function recordAtId(
  raw: unknown,
  idPath: string,
  seen: Map<string, SeenAtId>,
  diagnostics: AirpDiagnostic[]
): void {
  if (typeof raw !== "string" || raw.length === 0) {
    diagnostics.push(
      diagnostic(
        VALIDATE_VALIDATORS_AT_ID_MISSING,
        "Missing required @id on structured object",
        { location: { path: idPath } }
      )
    );
    return;
  }
  if (!AT_ID_PATTERN.test(raw)) {
    diagnostics.push(
      diagnostic(
        VALIDATE_VALIDATORS_AT_ID_INVALID_PATTERN,
        `Invalid @id "${raw}" (expected /^[a-z0-9]{10}$/)`,
        { location: { path: idPath } }
      )
    );
    return;
  }
  const previous = seen.get(raw);
  if (previous) {
    diagnostics.push(
      diagnostic(
        VALIDATE_VALIDATORS_AT_ID_DUPLICATE,
        `Duplicate @id "${raw}" (also at ${previous.path})`,
        { location: { path: idPath } }
      )
    );
    return;
  }
  seen.set(raw, { path: idPath });
}

function walkAtIds(
  value: unknown,
  path: string,
  parentKey: string | null,
  seen: Map<string, SeenAtId>,
  diagnostics: AirpDiagnostic[]
): void {
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i += 1) {
      walkAtIds(value[i], `${path}/${i}`, parentKey, seen, diagnostics);
    }
    return;
  }
  if (!isRecord(value)) {
    return;
  }

  if (needsAtId(value, parentKey)) {
    recordAtId(value["@id"], `${path}/@id`, seen, diagnostics);
  } else if (Object.hasOwn(value, "@id")) {
    // Non-required site that still carries @id: enforce pattern + uniqueness.
    recordAtId(value["@id"], `${path}/@id`, seen, diagnostics);
  }

  for (const [key, child] of Object.entries(value)) {
    walkAtIds(child, `${path}/${key}`, key, seen, diagnostics);
  }
}

/**
 * schema 1.1.0 `@id` gate: required on agreed objects, pattern, document-wide unique.
 * Does not auto-complete missing handles.
 */
export function atId110(
  document: Record<string, unknown>
): ValidationStageResult {
  const diagnostics: AirpDiagnostic[] = [];
  const seen = new Map<string, SeenAtId>();
  walkAtIds(document, "", null, seen, diagnostics);
  return validationStageResult("at-id", diagnostics);
}
