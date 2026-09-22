import { readFile } from "node:fs/promises";
import { documentPath, type SchemaCase } from "@airp/test-kit";
import { getSchemaSet, hasSchemaVersion } from "../src/index.js";

/** Package: validate document JSON against the registered document schema. */
export async function runSchemaCase(case_: SchemaCase): Promise<void> {
  const raw = await readFile(documentPath(case_.document), "utf8");
  const data = JSON.parse(raw);
  const version =
    typeof data.schemaVersion === "string" &&
    hasSchemaVersion(data.schemaVersion)
      ? data.schemaVersion
      : "1.0.0";
  const result = getSchemaSet(version).validate(data);

  if (case_.expect.ok) {
    if (!result.ok) {
      throw new Error(
        `${case_.id}: expected valid, got ${JSON.stringify(result)}`
      );
    }
    return;
  }

  if (result.ok) {
    throw new Error(`${case_.id}: expected invalid`);
  }

  const expected = case_.expect;
  const hasCode = result.diagnostics.some((d) => d.code === expected.code);
  if (!hasCode) {
    throw new Error(
      `${case_.id}: expected code ${expected.code}, got ${result.diagnostics.map((i) => i.code).join(", ")}`
    );
  }
}
