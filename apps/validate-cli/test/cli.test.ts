import { defaultValidateCliPath, runCliCase } from "@airp/test-kit";
import { describe, it } from "vitest";
import { cliCases } from "./cli-cases.js";

describe.each(cliCases)("$id", (case_) => {
  it("matches CLI expectation", async () => {
    await runCliCase(case_, { cliEntryPath: defaultValidateCliPath() });
  });
});
