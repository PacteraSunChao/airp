import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";
import { buildSvgViewerScript } from "../src/client/svg-viewer-script.js";

describe("svg viewer touch behavior", () => {
  it("keeps touch gestures available for page scrolling", () => {
    const dom = new JSDOM(
      `<div class="svg-viewer" data-min-height="320">
        <div data-svg-viewer-chrome><div data-svg-viewer-zoom></div></div>
        <svg viewBox="0 0 100 100"></svg>
      </div>`,
      { runScripts: "dangerously" }
    );

    dom.window.eval(buildSvgViewerScript());
    dom.window.document.dispatchEvent(new dom.window.Event("DOMContentLoaded"));

    const surface = dom.window.document.querySelector(
      "[data-svg-viewer-surface]"
    );
    expect(surface).not.toBeNull();

    const touchStart = new dom.window.Event("pointerdown", {
      bubbles: true,
    });
    Object.defineProperties(touchStart, {
      button: { value: 0 },
      pointerId: { value: 1 },
      pointerType: { value: "touch" },
    });
    surface?.dispatchEvent(touchStart);

    expect(surface?.classList.contains("svg-viewer-surface--dragging")).toBe(
      false
    );
    dom.window.close();
  });

  it("animates toolbar zoom and keeps pan transforms instant", () => {
    const dom = new JSDOM(
      `<div class="svg-viewer" data-min-height="320">
        <div data-svg-viewer-chrome><div data-svg-viewer-zoom></div></div>
        <svg viewBox="0 0 100 100"></svg>
      </div>`,
      { runScripts: "dangerously", pretendToBeVisual: true }
    );

    Object.defineProperty(dom.window.HTMLElement.prototype, "clientWidth", {
      configurable: true,
      get() {
        return 400;
      },
    });
    Object.defineProperty(dom.window.HTMLElement.prototype, "clientHeight", {
      configurable: true,
      get() {
        return 320;
      },
    });

    dom.window.eval(buildSvgViewerScript());
    dom.window.document.dispatchEvent(new dom.window.Event("DOMContentLoaded"));

    const stage = dom.window.document.querySelector("[data-svg-viewer-stage]");
    const zoomIn = dom.window.document.querySelector(
      "[data-svg-viewer-zoom-in]"
    );
    const surface = dom.window.document.querySelector(
      "[data-svg-viewer-surface]"
    );
    expect(stage).not.toBeNull();
    expect(zoomIn).not.toBeNull();

    expect(stage?.classList.contains("svg-viewer-stage--no-transition")).toBe(
      true
    );

    zoomIn?.dispatchEvent(new dom.window.Event("click", { bubbles: true }));
    expect(stage?.classList.contains("svg-viewer-stage--no-transition")).toBe(
      false
    );

    const pointerDown = new dom.window.Event("pointerdown", {
      bubbles: true,
    });
    Object.defineProperties(pointerDown, {
      button: { value: 0 },
      pointerId: { value: 2 },
      pointerType: { value: "mouse" },
      clientX: { value: 10 },
      clientY: { value: 10 },
    });
    Object.defineProperty(surface as Element, "setPointerCapture", {
      value() {
        return undefined;
      },
    });
    surface?.dispatchEvent(pointerDown);

    const pointerMove = new dom.window.Event("pointermove", {
      bubbles: true,
    });
    Object.defineProperties(pointerMove, {
      buttons: { value: 1 },
      clientX: { value: 40 },
      clientY: { value: 40 },
    });
    surface?.dispatchEvent(pointerMove);

    expect(stage?.classList.contains("svg-viewer-stage--no-transition")).toBe(
      true
    );
    dom.window.close();
  });
});
