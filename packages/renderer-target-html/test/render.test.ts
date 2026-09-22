import { describe, it } from "vitest";
import { renderCases } from "./render-cases.js";
import { runRenderCase } from "./run-render-case.js";

describe.each(renderCases)("html render case $id", (case_) => {
  it("matches expectation", async () => {
    await runRenderCase(case_);
  });
});
