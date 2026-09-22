import { describe, it } from "vitest";
import { renderCases } from "./render-cases.js";
import { runRenderCase } from "./run-render-case.js";

describe.each(renderCases)("markdown emit: $id", (case_) => {
  it("matches expectation", async () => {
    await runRenderCase(case_);
  });
});
