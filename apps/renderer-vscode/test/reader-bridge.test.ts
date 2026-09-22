import { Window } from "happy-dom";
import { describe, expect, it } from "vitest";
import { mountReaderBridge } from "../src/webview/reader-bridge";

describe("reader-bridge", () => {
  it("opens export menu on hover with close delay and posts format on item click", () => {
    const window = new Window();
    const { document } = window;
    document.body.innerHTML = `
      <div data-airp-export>
        <button type="button" data-airp-export-trigger aria-expanded="false">Export</button>
        <div class="airp-float-panel" data-airp-export-menu role="menu" aria-hidden="true">
          <button type="button" data-airp-export-format="markdown">Markdown</button>
        </div>
      </div>
      <div hidden data-airp-host-toast-copy data-succeeded="ok" data-failed="bad"></div>
      <div id="toaster" class="airp-toaster"></div>
    `;
    (globalThis as { document: Document }).document =
      document as unknown as Document;
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: window,
    });

    let pendingClose: (() => void) | null = null;
    Object.defineProperty(globalThis, "matchMedia", {
      configurable: true,
      value: () => ({ matches: true }),
    });
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: () => ({ matches: true }),
    });
    Object.defineProperty(globalThis, "setTimeout", {
      configurable: true,
      value: (callback: () => void) => {
        pendingClose = callback;
        return 1 as unknown as ReturnType<typeof setTimeout>;
      },
    });
    Object.defineProperty(globalThis, "clearTimeout", {
      configurable: true,
      value: () => {
        pendingClose = null;
      },
    });

    const posted: unknown[] = [];
    const bridge = mountReaderBridge({
      postMessage: (message) => {
        posted.push(message);
      },
    });

    expect(posted).toEqual([{ type: "ready" }]);

    const root = document.querySelector(
      "[data-airp-export]"
    ) as unknown as HTMLElement;
    const trigger = document.querySelector(
      "[data-airp-export-trigger]"
    ) as unknown as HTMLElement;
    const menu = document.querySelector(
      "[data-airp-export-menu]"
    ) as unknown as HTMLElement;

    const enter = new window.Event("pointerenter");
    Object.defineProperty(enter, "pointerType", { value: "mouse" });
    root.dispatchEvent(enter as unknown as Event);
    expect(root.hasAttribute("data-open")).toBe(true);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(menu.getAttribute("aria-hidden")).toBe("false");

    const leave = new window.Event("pointerleave");
    Object.defineProperty(leave, "pointerType", { value: "mouse" });
    root.dispatchEvent(leave as unknown as Event);
    expect(root.hasAttribute("data-open")).toBe(true);
    expect(pendingClose).not.toBeNull();

    const reenter = new window.Event("pointerenter");
    Object.defineProperty(reenter, "pointerType", { value: "mouse" });
    root.dispatchEvent(reenter as unknown as Event);
    expect(pendingClose).toBeNull();
    expect(root.hasAttribute("data-open")).toBe(true);

    const button = document.querySelector("[data-airp-export-format]");
    (button as unknown as HTMLElement).click();
    expect(posted).toContainEqual({ type: "export", format: "markdown" });
    expect(root.hasAttribute("data-open")).toBe(false);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(menu.getAttribute("aria-hidden")).toBe("true");

    bridge.receive({ type: "toast", kind: "failed" });
    const toast = document.querySelector(".airp-toast");
    expect(toast?.textContent).toBe("bad");

    bridge.dispose();
  });

  it("toggles export menu on trigger click when hover is unavailable", () => {
    const window = new Window();
    const { document } = window;
    document.body.innerHTML = `
      <div data-airp-export>
        <button type="button" data-airp-export-trigger aria-expanded="false">Export</button>
        <div class="airp-float-panel" data-airp-export-menu role="menu" aria-hidden="true"></div>
      </div>
    `;
    (globalThis as { document: Document }).document =
      document as unknown as Document;
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: window,
    });
    Object.defineProperty(globalThis, "matchMedia", {
      configurable: true,
      value: () => ({ matches: false }),
    });
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: () => ({ matches: false }),
    });

    const bridge = mountReaderBridge({
      postMessage: () => undefined,
    });
    const root = document.querySelector(
      "[data-airp-export]"
    ) as unknown as HTMLElement;
    const trigger = document.querySelector(
      "[data-airp-export-trigger]"
    ) as unknown as HTMLElement;

    trigger.click();
    expect(root.hasAttribute("data-open")).toBe(true);
    trigger.click();
    expect(root.hasAttribute("data-open")).toBe(false);
    bridge.dispose();
  });

  it("closes export menu when clicking outside", () => {
    const window = new Window();
    const { document } = window;
    document.body.innerHTML = `
      <div data-airp-export data-open>
        <button type="button" data-airp-export-trigger aria-expanded="true">Export</button>
        <div data-airp-export-menu role="menu"></div>
      </div>
      <button type="button" data-outside>Outside</button>
    `;
    (globalThis as { document: Document }).document =
      document as unknown as Document;

    const bridge = mountReaderBridge({
      postMessage: () => undefined,
    });
    const root = document.querySelector(
      "[data-airp-export]"
    ) as unknown as HTMLElement;
    const trigger = document.querySelector(
      "[data-airp-export-trigger]"
    ) as unknown as HTMLElement;
    expect(root.hasAttribute("data-open")).toBe(true);

    (
      document.querySelector("[data-outside]") as unknown as HTMLElement
    ).click();
    expect(root.hasAttribute("data-open")).toBe(false);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    bridge.dispose();
  });

  it("auto-toasts when host shell opens in error mode", () => {
    const window = new Window();
    const { document } = window;
    document.body.innerHTML = `
      <main data-airp-host-shell data-mode="error">
        <a href="#" data-airp-open-output>Open Output</a>
      </main>
      <div hidden data-airp-host-toast-copy data-succeeded="ok" data-failed="bad"></div>
      <div id="toaster" class="airp-toaster"></div>
    `;
    (globalThis as { document: Document }).document =
      document as unknown as Document;

    const posted: unknown[] = [];
    const bridge = mountReaderBridge({
      postMessage: (message) => {
        posted.push(message);
      },
    });
    expect(document.querySelector(".airp-toast")?.textContent).toBe("bad");
    const link = document.querySelector("[data-airp-open-output]");
    (link as unknown as { click: () => void }).click();
    expect(posted).toContainEqual({ type: "openOutput" });
    bridge.dispose();
  });

  it("posts editSource when Edit Source is clicked", () => {
    const window = new Window();
    const { document } = window;
    document.body.innerHTML = `
      <button type="button" data-airp-edit-source>Edit Source</button>
    `;
    (globalThis as { document: Document }).document =
      document as unknown as Document;

    const posted: unknown[] = [];
    const bridge = mountReaderBridge({
      postMessage: (message) => {
        posted.push(message);
      },
    });
    (
      document.querySelector(
        "[data-airp-edit-source]"
      ) as unknown as HTMLElement
    ).click();
    expect(posted).toContainEqual({ type: "editSource" });
    bridge.dispose();
  });

  it("dispatches airp-color-scheme when host sends colorScheme", () => {
    const window = new Window();
    const { document } = window;
    document.body.innerHTML = "<div></div>";
    (globalThis as { document: Document }).document =
      document as unknown as Document;

    const bridge = mountReaderBridge({
      postMessage: () => undefined,
    });
    let detail: unknown;
    document.addEventListener("airp-color-scheme", (event) => {
      detail = (event as unknown as CustomEvent).detail;
    });

    bridge.receive({ type: "colorScheme", value: "dark" });
    expect(detail).toBe("dark");
    bridge.dispose();
  });
});
