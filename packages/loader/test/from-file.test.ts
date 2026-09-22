import { describe, it } from "vitest";
import { loadCases } from "./load-cases.js";
import { runLoadCase } from "./run-load-case.js";

describe.each(loadCases)("$id", (case_) => {
  it("matches load expectation", async () => {
    await runLoadCase(case_);
  });
});
