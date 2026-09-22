import { describe, it } from "vitest";
import { runSchemaCase } from "./run-schema-case.js";
import { schemaCases } from "./schema-cases.js";

describe.each(schemaCases)("$id", (case_) => {
  it("matches schema expectation", async () => {
    await runSchemaCase(case_);
  });
});
