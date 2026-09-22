import { documentPath, type LoadCase } from "@airp/test-kit";
import { loadDocumentFile } from "../src/node/index.js";

/** Package: load a document fixture from disk. */
export async function runLoadCase(case_: LoadCase): Promise<void> {
  const result = await loadDocumentFile(documentPath(case_.document));

  if (case_.expect.ok) {
    if (!result.ok) {
      throw new Error(
        `${case_.id}: expected load ok, got ${JSON.stringify(result)}`
      );
    }
    if (result.value.schemaVersion !== case_.expect.schemaVersion) {
      throw new Error(
        `${case_.id}: schemaVersion ${result.value.schemaVersion}`
      );
    }
    return;
  }

  if (result.ok) {
    throw new Error(`${case_.id}: expected load failure`);
  }

  const expectedCode = case_.expect.code;
  const hasCode = result.diagnostics.some((d) => d.code === expectedCode);
  if (!hasCode) {
    throw new Error(
      `${case_.id}: expected code ${expectedCode}, got ${result.diagnostics.map((d) => d.code).join(", ")}`
    );
  }
}
