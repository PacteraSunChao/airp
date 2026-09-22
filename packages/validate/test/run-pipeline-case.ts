import { readFile } from "node:fs/promises";
import { documentPath, type PipelineCase } from "@airp/test-kit";
import { validateDocument as validateIso } from "../src/index.js";
import { validateDocument as validateNode } from "../src/node/index.js";

/** Package: run isomorphic or Node validation against a fixture document. */
export async function runPipelineCase(case_: PipelineCase): Promise<void> {
  const raw = await readFile(documentPath(case_.document), "utf8");
  const data = JSON.parse(raw);
  const result =
    case_.mode === "node" ? await validateNode(data) : await validateIso(data);

  if (case_.expect.ok) {
    if (!result.ok) {
      throw new Error(
        `${case_.id}: expected ok, got ${JSON.stringify(result.diagnostics)}`
      );
    }
    return;
  }

  if (result.ok) {
    throw new Error(`${case_.id}: expected failure`);
  }

  const expected = case_.expect;
  for (const code of expected.codes) {
    const match = result.diagnostics.find((d) => d.code === code);
    if (!match) {
      throw new Error(
        `${case_.id}: missing code ${code}; got ${result.diagnostics.map((d) => d.code).join(", ")}`
      );
    }
    if (match.stage !== expected.failedStage) {
      throw new Error(
        `${case_.id}: code ${code} stage ${match.stage}, expected ${expected.failedStage}`
      );
    }
  }
}
