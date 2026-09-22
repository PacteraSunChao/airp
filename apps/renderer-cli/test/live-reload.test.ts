import { describe, expect, it } from "vitest";
import {
  ERROR_BANNER_ATTR,
  hasLiveReloadScript,
  injectLiveReloadScript,
  LIVE_RELOAD_ATTR,
} from "../src/watch-serve/live-reload.js";
import { AIRP_RENDER_ERROR_EVENT } from "../src/watch-serve/watch-serve-server.js";

describe("injectLiveReloadScript", () => {
  it("injects SSE client before closing body", () => {
    const html = "<!DOCTYPE html><html><body><main></main></body></html>";
    const result = injectLiveReloadScript(html);
    expect(hasLiveReloadScript(result)).toBe(true);
    expect(result).toContain(LIVE_RELOAD_ATTR);
    expect(result).toContain('EventSource("/__airp/events")');
    expect(result).toContain(AIRP_RENDER_ERROR_EVENT);
    expect(result).toContain(ERROR_BANNER_ATTR);
    expect(result.indexOf("<script")).toBeLessThan(result.indexOf("</body>"));
  });

  it("does not double-inject", () => {
    const html = injectLiveReloadScript(
      "<!DOCTYPE html><html><body></body></html>"
    );
    expect(injectLiveReloadScript(html)).toBe(html);
  });
});
