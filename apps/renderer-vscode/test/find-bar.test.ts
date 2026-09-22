import { Window } from "happy-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { customFindMarkerHtml } from "../src/custom-find-marker";
import { collectMatchSpans, mountFindBar } from "../src/webview/find-bar";

function setupDoc(markerHtml: string): {
  document: Document;
  window: Window;
} {
  const window = new Window();
  const { document } = window;
  document.body.innerHTML = `
    <p>Alpha beta gamma</p>
    <p hidden>Hidden needle</p>
    ${markerHtml}
  `;
  (globalThis as { document: Document }).document =
    document as unknown as Document;
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: window,
  });
  return { document: document as unknown as Document, window };
}

function stubClientRects(window: Window): () => void {
  const RangeCtor = (
    window as unknown as {
      Range: { prototype: { getClientRects: () => DOMRectList } };
    }
  ).Range;
  const proto = RangeCtor.prototype;
  const original = proto.getClientRects.bind(proto);
  proto.getClientRects = function getClientRects(): DOMRectList {
    const rect = {
      bottom: 36,
      height: 16,
      left: 12,
      right: 52,
      top: 20,
      width: 40,
      x: 12,
      y: 20,
      toJSON: () => ({}),
    };
    return {
      length: 1,
      item: (index: number) => (index === 0 ? rect : null),
      *[Symbol.iterator]() {
        yield rect;
      },
    } as unknown as DOMRectList;
  };
  return () => {
    proto.getClientRects = original;
  };
}

describe("collectMatchSpans", () => {
  it("finds visible matches and skips hidden text", () => {
    const { document } = setupDoc("");
    const spans = collectMatchSpans(document.body, "beta");
    expect(spans).toHaveLength(1);
    expect(collectMatchSpans(document.body, "needle")).toHaveLength(0);
  });
});

describe("mountFindBar", () => {
  afterEach(() => {
    Reflect.deleteProperty(globalThis, "document");
    vi.restoreAllMocks();
  });

  it("is a no-op when the custom-find marker is false", () => {
    const { document } = setupDoc(customFindMarkerHtml(false));
    const handle = mountFindBar(document);
    document.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "f",
        metaKey: true,
        bubbles: true,
        cancelable: true,
      })
    );
    expect(document.querySelector("[data-airp-find-bar]")).toBeNull();
    expect(document.querySelector("[data-airp-find-overlay]")).toBeNull();
    handle.dispose();
  });

  it("opens on Cmd+F, paints overlay hits, keeps input focus", () => {
    const { document, window } = setupDoc(customFindMarkerHtml(true));
    const restoreRects = stubClientRects(window);

    const handle = mountFindBar(document);
    const bar = document.querySelector(
      "[data-airp-find-bar]"
    ) as HTMLElement | null;
    const overlay = document.querySelector(
      "[data-airp-find-overlay]"
    ) as HTMLElement | null;
    expect(bar).not.toBeNull();
    expect(overlay).not.toBeNull();
    expect(bar?.hidden).toBe(true);

    document.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "f",
        metaKey: true,
        bubbles: true,
        cancelable: true,
      })
    );
    expect(bar?.hidden).toBe(false);

    const input = document.querySelector(
      "[data-airp-find-input]"
    ) as HTMLInputElement;
    input.value = "beta";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    expect(document.querySelector("[data-airp-find-count]")?.textContent).toBe(
      "1/1"
    );
    expect(document.activeElement).toBe(input);
    expect(document.querySelectorAll("[data-airp-find-hit]").length).toBe(1);
    expect(
      document.querySelector("[data-airp-find-hit][data-current]")
    ).not.toBeNull();
    expect(document.querySelector("mark[data-airp-find-mark]")).toBeNull();

    document.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
        cancelable: true,
      })
    );
    expect(bar?.hidden).toBe(true);
    expect(document.querySelector("[data-airp-find-hit]")).toBeNull();

    handle.dispose();
    expect(document.querySelector("[data-airp-find-bar]")).toBeNull();
    expect(document.querySelector("[data-airp-find-overlay]")).toBeNull();
    restoreRects();
  });

  it("does not count hidden text in the match total", () => {
    const { document } = setupDoc(customFindMarkerHtml(true));

    const handle = mountFindBar(document);
    document.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "f",
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      })
    );
    const input = document.querySelector(
      "[data-airp-find-input]"
    ) as HTMLInputElement;
    input.value = "needle";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    expect(document.querySelector("[data-airp-find-count]")?.textContent).toBe(
      "0/0"
    );
    handle.dispose();
  });
});
