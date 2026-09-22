import { readFile } from "node:fs/promises";
import type { AirpResult } from "@airp/diagnostics";
import type {
  AirpDocumentSnapshot,
  RenderOutput,
} from "@airp/renderer-contract";
import { documentPath } from "@airp/test-kit";
import { renderDocument as renderDocumentIso } from "../src/index.js";
import { renderDocument as renderDocumentNode } from "../src/node/render-document.js";
import type { RendererCase } from "./render-case.js";

async function loadSnapshot(
  relDocument: string
): Promise<AirpDocumentSnapshot> {
  const raw = await readFile(documentPath(relDocument), "utf8");
  return JSON.parse(raw) as AirpDocumentSnapshot;
}

function assertOkBody(
  caseId: string,
  result: AirpResult<RenderOutput>,
  expect: Extract<RendererCase["expect"], { ok: true }>
): void {
  if (!result.ok) {
    throw new Error(
      `${caseId}: expected ok, got ${JSON.stringify(result.diagnostics)}`
    );
  }
  if (result.value.format !== expect.format) {
    throw new Error(
      `${caseId}: format ${result.value.format} !== ${expect.format}`
    );
  }
  const primary = result.value.files[0];
  if (!primary || typeof primary.body !== "string") {
    throw new Error(`${caseId}: missing string primary body`);
  }
  for (const needle of expect.contains) {
    if (!primary.body.includes(needle)) {
      throw new Error(
        `${caseId}: expected body to contain ${JSON.stringify(needle)}`
      );
    }
  }
  for (const needle of expect.notContains ?? []) {
    if (primary.body.includes(needle)) {
      throw new Error(
        `${caseId}: expected body not to contain ${JSON.stringify(needle)}`
      );
    }
  }
}

function assertFailCodes(
  caseId: string,
  result: AirpResult<RenderOutput>,
  codes: string[]
): void {
  if (result.ok) {
    throw new Error(`${caseId}: expected failure`);
  }
  for (const code of codes) {
    if (!result.diagnostics.some((d) => d.code === code)) {
      throw new Error(
        `${caseId}: expected code ${code}, got ${result.diagnostics.map((d) => d.code).join(", ")}`
      );
    }
  }
}

/** Package: render via closed catalog. */
export async function runRenderCase(case_: RendererCase): Promise<void> {
  const document = await loadSnapshot(case_.document);
  const render =
    case_.entry === "node" ? renderDocumentNode : renderDocumentIso;
  const result = await render(document, case_.target, {});

  if (case_.expect.ok) {
    assertOkBody(case_.id, result, case_.expect);
    return;
  }
  assertFailCodes(case_.id, result, case_.expect.codes);
}
