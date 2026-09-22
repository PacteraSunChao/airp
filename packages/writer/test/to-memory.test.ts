import { describe, expect, it } from "vitest";
import { createMemoryWriter } from "../src/to-memory.js";

const INVALID_REL_PATH = /Invalid output relative path/;

describe("createMemoryWriter", () => {
  it("stores, lists, and overwrites output files", async () => {
    const writer = createMemoryWriter();
    const first = new TextEncoder().encode("one");
    const second = new TextEncoder().encode("two");

    await writer.putOutputFile("assets/a.bin", first);
    await writer.putOutputFile("./report.md", second);

    expect(writer.hasOutputFile("assets/a.bin")).toBe(true);
    expect(writer.getOutputFile("assets/a.bin")).toEqual(first);
    expect(writer.getOutputFile("report.md")).toEqual(second);
    expect(writer.listOutputFiles()).toEqual(["assets/a.bin", "report.md"]);

    const replaced = new TextEncoder().encode("three");
    await writer.putOutputFile("report.md", replaced);
    expect(writer.getOutputFile("report.md")).toEqual(replaced);
  });

  it("rejects invalid relative paths", async () => {
    const writer = createMemoryWriter();
    await expect(
      writer.putOutputFile("../escape.txt", new Uint8Array([1]))
    ).rejects.toThrow(INVALID_REL_PATH);
  });
});
