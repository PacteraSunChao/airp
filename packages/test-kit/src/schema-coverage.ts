import type { SchemaCase } from "./types";

/** Verify each schemaRef has at least one valid and one invalid Package case. */
export function assertSchemaCoverage(
  schemaRefs: string[],
  cases: SchemaCase[]
): void {
  const missing: string[] = [];

  for (const schemaRef of schemaRefs) {
    const forRef = cases.filter((c) => c.schemaRef === schemaRef);
    const hasValid = forRef.some((c) => c.expect.ok);
    const hasInvalid = forRef.some((c) => !c.expect.ok);
    if (!(hasValid && hasInvalid)) {
      missing.push(`${schemaRef} (valid=${hasValid}, invalid=${hasInvalid})`);
    }
  }

  if (missing.length > 0) {
    throw new Error(`schema coverage gaps:\n${missing.join("\n")}`);
  }
}
