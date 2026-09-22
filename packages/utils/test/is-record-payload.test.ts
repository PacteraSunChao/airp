import { describe, expect, it } from "vitest";
import { isRecord } from "../src/is-record";
import { getPayloadEntry, withPayloadEntry } from "../src/payload";

describe("isRecord", () => {
  it("accepts plain objects", () => {
    expect(isRecord({ a: 1 })).toBe(true);
  });

  it("rejects null, arrays, and primitives", () => {
    expect(isRecord(null)).toBe(false);
    expect(isRecord([1])).toBe(false);
    expect(isRecord("x")).toBe(false);
  });
});

describe("payload helpers", () => {
  it("writes and reads namespaced entries", () => {
    const next = withPayloadEntry(undefined, "airp.loader", {
      path: "a.airp.json",
    });
    expect(getPayloadEntry<{ path: string }>(next, "airp.loader")).toEqual({
      path: "a.airp.json",
    });
  });
});
