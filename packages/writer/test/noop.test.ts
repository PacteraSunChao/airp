import { describe, expect, it } from "vitest";
import { createNoopWriter } from "../src/noop.js";

describe("createNoopWriter", () => {
  it("discards writes without throwing", async () => {
    const writer = createNoopWriter();
    await expect(
      writer.putOutputFile("report.md", new TextEncoder().encode("x"))
    ).resolves.toBeUndefined();
  });
});
