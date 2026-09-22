import { readFile } from "node:fs/promises";
import { AirpDiagnosticError } from "@airp/diagnostics";
import type { AirpDocumentSnapshot } from "@airp/renderer-contract";
import { documentRenderLocale } from "@airp/renderer-shared";
import { documentPath } from "@airp/test-kit";
import { emitDocument } from "../src/emit-document.js";
import type { MarkdownRenderCase } from "./render-case.js";

async function loadSnapshot(
  relDocument: string
): Promise<AirpDocumentSnapshot> {
  const raw = await readFile(documentPath(relDocument), "utf8");
  return JSON.parse(raw) as AirpDocumentSnapshot;
}

/** Package: emit Markdown from a document fixture. */
export async function runRenderCase(case_: MarkdownRenderCase): Promise<void> {
  const document = await loadSnapshot(case_.document);
  const locale = documentRenderLocale(document);
  if (!locale) {
    throw new Error(`${case_.id}: fixture has no document render locale`);
  }

  if (case_.expect.ok) {
    const body = emitDocument(document, locale);
    for (const needle of case_.expect.contains) {
      if (!body.includes(needle)) {
        throw new Error(
          `${case_.id}: expected body to contain ${JSON.stringify(needle)}\n---\n${body}`
        );
      }
    }
    for (const needle of case_.expect.notContains ?? []) {
      if (body.includes(needle)) {
        throw new Error(
          `${case_.id}: expected body not to contain ${JSON.stringify(needle)}`
        );
      }
    }
    return;
  }

  try {
    emitDocument(document, locale);
    throw new Error(`${case_.id}: expected emit failure`);
  } catch (error) {
    if (!(error instanceof AirpDiagnosticError)) {
      throw error;
    }
    const expected = case_.expect;
    if (expected.ok) {
      throw new Error(`${case_.id}: unreachable ok branch`);
    }
    const hasCode = error.diagnostics.some((d) => d.code === expected.code);
    if (!hasCode) {
      throw new Error(
        `${case_.id}: expected code ${expected.code}, got ${error.diagnostics.map((d) => d.code).join(", ")}`
      );
    }
  }
}
