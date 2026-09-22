import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createDiskWriter } from "../src/node/to-disk.js";

const INVALID_REL_PATH = /Invalid output relative path/;

describe("createDiskWriter", () => {
  let root: string | undefined;

  afterEach(async () => {
    if (root) {
      await rm(root, { force: true, recursive: true });
      root = undefined;
    }
  });

  it("writes under the output root", async () => {
    root = await mkdtemp(path.join(tmpdir(), "airp-writer-"));
    const writer = createDiskWriter(root);
    const body = new TextEncoder().encode("# hi\n");
    await writer.putOutputFile("out/report.md", body);
    const written = await readFile(path.join(root, "out/report.md"));
    expect(written).toEqual(Buffer.from(body));
  });

  it("rejects paths that escape the root", async () => {
    root = await mkdtemp(path.join(tmpdir(), "airp-writer-"));
    const writer = createDiskWriter(root);
    await expect(
      writer.putOutputFile("../escape.md", new Uint8Array([1]))
    ).rejects.toThrow(INVALID_REL_PATH);
  });
});
