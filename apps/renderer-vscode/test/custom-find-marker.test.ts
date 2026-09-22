import { Window } from "happy-dom";
import { describe, expect, it } from "vitest";
import {
  CUSTOM_FIND_ATTR,
  customFindMarkerHtml,
  readUseCustomFind,
} from "../src/custom-find-marker";

describe("customFindMarker", () => {
  it("emits true/false marker HTML", () => {
    expect(customFindMarkerHtml(true)).toContain(`${CUSTOM_FIND_ATTR}="true"`);
    expect(customFindMarkerHtml(false)).toContain(
      `${CUSTOM_FIND_ATTR}="false"`
    );
  });

  it("reads useCustomFind from the document marker", () => {
    const window = new Window();
    const { document } = window;
    document.body.innerHTML = customFindMarkerHtml(true);
    expect(readUseCustomFind(document as unknown as Document)).toBe(true);

    document.body.innerHTML = customFindMarkerHtml(false);
    expect(readUseCustomFind(document as unknown as Document)).toBe(false);

    document.body.innerHTML = "";
    expect(readUseCustomFind(document as unknown as Document)).toBe(false);
  });
});
