import { describe, expect, it } from "vitest";
import { collectMermaidSources } from "../src/validators/shared/collect-mermaid-sources/v1-0-0.js";

describe("collectMermaidSources", () => {
  it("finds mermaid and architectureOverview sources", () => {
    const found = collectMermaidSources(
      [
        { type: "mermaid", source: "flowchart LR\n A-->B" },
        {
          type: "architectureOverview",
          overview: { type: "mermaid", source: "flowchart TB\n X-->Y" },
        },
        {
          type: "section",
          title: "Nested",
          children: [
            { type: "mermaid", source: "sequenceDiagram\n A->>B: hi" },
          ],
        },
      ],
      "/blocks"
    );

    expect(found.map((item) => item.source)).toEqual([
      "flowchart LR\n A-->B",
      "flowchart TB\n X-->Y",
      "sequenceDiagram\n A->>B: hi",
    ]);
  });
});
