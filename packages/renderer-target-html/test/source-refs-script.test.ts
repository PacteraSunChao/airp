import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";
import { buildSourceRefsScript } from "../src/client/source-refs-script.js";

describe("source refs menu popover", () => {
  it("positions in the viewport and tolerates brief pointer gaps", () => {
    const dom = new JSDOM(
      `<div data-doc-sources-menu>
        <button type="button" data-doc-sources-menu-trigger aria-expanded="false">Sources</button>
        <div data-doc-sources-menu-panel aria-hidden="true">Items</div>
      </div>`,
      { runScripts: "dangerously" }
    );
    const { window } = dom;
    let pendingClose: (() => void) | null = null;
    const flushPendingClose = (): void => {
      const callback = pendingClose;
      if (!callback) {
        throw new Error("Expected pending close callback");
      }
      callback();
    };
    Object.defineProperties(window, {
      clearTimeout: {
        value: () => {
          pendingClose = null;
        },
      },
      innerHeight: { value: 667 },
      innerWidth: { value: 375 },
      matchMedia: {
        value: () => ({ matches: true }),
      },
      setTimeout: {
        value: (callback: () => void) => {
          pendingClose = callback;
          return 1;
        },
      },
    });

    const trigger = window.document.querySelector<HTMLElement>(
      "[data-doc-sources-menu-trigger]"
    );
    const popover = window.document.querySelector<HTMLElement>(
      "[data-doc-sources-menu-panel]"
    );
    const root = window.document.querySelector<HTMLElement>(
      "[data-doc-sources-menu]"
    );
    if (!(trigger && popover && root)) {
      throw new Error("Expected source refs fixture");
    }
    trigger.getBoundingClientRect = () =>
      ({
        bottom: 532,
        left: 308,
        right: 340,
        top: 500,
      }) as DOMRect;
    Object.defineProperties(popover, {
      offsetWidth: { value: 320 },
      scrollHeight: { value: 300 },
    });

    window.eval(buildSourceRefsScript());
    window.document.dispatchEvent(new window.Event("DOMContentLoaded"));
    const pointerEnter = new window.Event("pointerenter");
    Object.defineProperty(pointerEnter, "pointerType", { value: "mouse" });
    root.dispatchEvent(pointerEnter);

    expect(root.hasAttribute("data-open")).toBe(true);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(popover.getAttribute("aria-hidden")).toBe("false");
    expect(Number.parseInt(popover.style.left, 10)).toBeGreaterThanOrEqual(12);
    expect(Number.parseInt(popover.style.left, 10)).toBeLessThanOrEqual(43);
    expect(Number.parseInt(popover.style.top, 10)).toBeLessThan(500);

    const pointerLeave = new window.Event("pointerleave");
    Object.defineProperty(pointerLeave, "pointerType", { value: "mouse" });
    root.dispatchEvent(pointerLeave);

    expect(root.hasAttribute("data-open")).toBe(true);
    expect(pendingClose).not.toBeNull();

    const menuEnter = new window.Event("pointerenter");
    Object.defineProperty(menuEnter, "pointerType", { value: "mouse" });
    popover.dispatchEvent(menuEnter);
    expect(pendingClose).toBeNull();
    expect(root.hasAttribute("data-open")).toBe(true);

    const menuLeave = new window.Event("pointerleave");
    Object.defineProperty(menuLeave, "pointerType", { value: "mouse" });
    popover.dispatchEvent(menuLeave);
    flushPendingClose();
    expect(root.hasAttribute("data-open")).toBe(false);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(popover.getAttribute("aria-hidden")).toBe("true");
    window.close();
  });
});
