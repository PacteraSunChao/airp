import { describe, it } from "vitest";
import { pipelineCases } from "./pipeline-cases.js";
import { runPipelineCase } from "./run-pipeline-case.js";

describe.each(pipelineCases)("$id", (case_) => {
  it("matches pipeline expectation", async () => {
    await runPipelineCase(case_);
  });
});
