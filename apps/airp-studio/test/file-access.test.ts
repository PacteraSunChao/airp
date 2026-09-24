import { describe, expect, it } from "vitest";
import {
  type FileHandleLike,
  type WritableFile,
  writeDocument,
} from "../src/file-access.js";

interface Recording {
  calls: string[];
  writable: WritableFile;
}

function recordingHandle(failOnWrite = false): {
  handle: FileHandleLike;
  recording: Recording;
} {
  const calls: string[] = [];
  const writable: WritableFile = {
    close: () => {
      calls.push("close");
      return Promise.resolve();
    },
    write: (text: string) => {
      calls.push(`write:${text}`);
      return failOnWrite
        ? Promise.reject(new Error("disk full"))
        : Promise.resolve();
    },
  };
  const handle: FileHandleLike = {
    createWritable: () => {
      calls.push("createWritable");
      return Promise.resolve(writable);
    },
    getFile: () => Promise.resolve({ text: () => Promise.resolve("") }),
    name: "report.airp.json",
  };
  return { handle, recording: { calls, writable } };
}

describe("writeDocument", () => {
  it("writes the text and closes the writable", async () => {
    const { handle, recording } = recordingHandle();

    await writeDocument(handle, '{"a":1}\n');

    expect(recording.calls).toEqual([
      "createWritable",
      'write:{"a":1}\n',
      "close",
    ]);
  });

  it("still closes when the write fails", async () => {
    const { handle, recording } = recordingHandle(true);

    await expect(writeDocument(handle, "{}")).rejects.toThrow("disk full");
    expect(recording.calls).toContain("close");
  });
});
