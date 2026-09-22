import { JSDOM } from "jsdom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildPageTocScript } from "../src/client/page-toc-script.js";
import {
  PAGE_TOC_MIN_ENTRIES,
  renderPageToc,
} from "../src/components/page-toc.js";

afterEach(() => {
  vi.useRealTimers();
});

describe("page TOC render", () => {
  it("omits markup below the minimum entry count", () => {
    expect(renderPageToc([{ id: "only", level: 1, title: "Only" }], "en")).toBe(
      ""
    );
    expect(PAGE_TOC_MIN_ENTRIES).toBe(2);
  });

  it("emits mini ticks and panel links 1:1 with entries", () => {
    const html = renderPageToc(
      [
        { id: "a", level: 1, title: "Alpha" },
        { id: "b", level: 2, title: "Beta" },
        { id: "c", level: 3, title: "Gamma" },
      ],
      "en"
    );
    const dom = new JSDOM(html);
    const toc = dom.window.document.querySelector("[data-page-toc]");
    const ticks = toc?.querySelectorAll("[data-page-toc-tick]") ?? [];
    const items = toc?.querySelectorAll("[data-page-toc-item]") ?? [];
    expect(toc?.getAttribute("aria-label")).toBe("On this page");
    expect(toc?.className).toContain("md:block");
    expect(toc?.className).toContain("hidden");
    expect(ticks).toHaveLength(3);
    expect(items).toHaveLength(3);
    expect(ticks[1]?.getAttribute("href")).toBe("#b");
    expect(ticks[1]?.getAttribute("data-toc-level")).toBe("2");
    expect(items[2]?.textContent).toBe("Gamma");
    dom.window.close();
  });
});

describe("page TOC client", () => {
  it("pins beside main and marks the nearest section active", () => {
    const dom = new JSDOM(
      `<!DOCTYPE html>
      <html><body style="margin:0">
        <header style="height:56px"></header>
        <main data-route-path="/">
          <header data-doc-header="true"><h1>Title</h1></header>
          <section id="a" data-block-type="section" style="height:400px">A</section>
          <section id="b" data-block-type="section" style="height:400px">B</section>
        </main>
        <nav data-page-toc class="page-toc" style="position:fixed; top: 10rem">
          <div data-page-toc-shell>
            <a data-page-toc-tick href="#a"></a>
            <a data-page-toc-tick href="#b"></a>
            <a data-page-toc-item href="#a">A</a>
            <a data-page-toc-item href="#b">B</a>
          </div>
        </nav>
      </body></html>`,
      {
        runScripts: "dangerously",
        url: "https://example.test/",
        pretendToBeVisual: true,
      }
    );

    Object.defineProperty(dom.window, "innerWidth", {
      configurable: true,
      value: 1600,
    });
    Object.defineProperty(dom.window, "innerHeight", {
      configurable: true,
      value: 900,
    });

    Object.defineProperty(dom.window, "matchMedia", {
      configurable: true,
      writable: true,
      value: (query: string) => ({
        matches: query.includes("min-width: 768px"),
        media: query,
        addEventListener() {
          /* jsdom stub */
        },
        removeEventListener() {
          /* jsdom stub */
        },
        addListener() {
          /* jsdom stub */
        },
        removeListener() {
          /* jsdom stub */
        },
        dispatchEvent() {
          return false;
        },
        onchange: null,
      }),
    });

    Object.defineProperty(
      dom.window.HTMLElement.prototype,
      "getBoundingClientRect",
      {
        configurable: true,
        value() {
          const el = this as HTMLElement;
          if (el.matches?.("body > header")) {
            return {
              top: 0,
              bottom: 56,
              left: 0,
              right: 1600,
              width: 1600,
              height: 56,
              x: 0,
              y: 0,
              toJSON() {
                return {};
              },
            };
          }
          if (el.matches?.('main[data-route-path="/"]')) {
            return {
              top: 56,
              bottom: 900,
              left: 352,
              right: 1248,
              width: 896,
              height: 844,
              x: 352,
              y: 56,
              toJSON() {
                return {};
              },
            };
          }
          if (el.matches?.("[data-doc-header] h1") || el.tagName === "H1") {
            return {
              top: 120,
              bottom: 160,
              left: 352,
              right: 800,
              width: 448,
              height: 40,
              x: 352,
              y: 120,
              toJSON() {
                return {};
              },
            };
          }
          const id = el.id;
          if (id === "a") {
            return {
              top: -120,
              bottom: 280,
              left: 352,
              right: 1248,
              width: 896,
              height: 400,
              x: 352,
              y: -120,
              toJSON() {
                return {};
              },
            };
          }
          if (id === "b") {
            return {
              top: 280,
              bottom: 680,
              left: 352,
              right: 1248,
              width: 896,
              height: 400,
              x: 352,
              y: 280,
              toJSON() {
                return {};
              },
            };
          }
          return {
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            width: 0,
            height: 0,
            x: 0,
            y: 0,
            toJSON() {
              return {};
            },
          };
        },
      }
    );

    Object.defineProperty(dom.window.HTMLElement.prototype, "offsetWidth", {
      configurable: true,
      get() {
        return 20;
      },
    });
    Object.defineProperty(dom.window.HTMLElement.prototype, "offsetHeight", {
      configurable: true,
      get() {
        return 80;
      },
    });

    dom.window.eval(buildPageTocScript());
    dom.window.document.dispatchEvent(new dom.window.Event("DOMContentLoaded"));

    const toc = dom.window.document.querySelector(
      "[data-page-toc]"
    ) as HTMLElement;
    // 1600 - 1248(main.right) - 16(gap) - 20(shell) = 316
    expect(toc.style.top).toBe("10rem");
    expect(toc.style.right).toBe("316px");

    const activeTick = dom.window.document.querySelector(
      '[data-page-toc-tick][data-toc-active="true"]'
    );
    const activeItem = dom.window.document.querySelector(
      '[data-page-toc-item][data-toc-active="true"]'
    );
    expect(activeTick?.getAttribute("href")).toBe("#a");
    expect(activeItem?.getAttribute("href")).toBe("#a");
    expect(activeItem?.getAttribute("aria-current")).toBe("location");

    dom.window.close();
  });

  it("keeps the panel open briefly after pointer leave", () => {
    vi.useFakeTimers();
    const dom = new JSDOM(
      `<!DOCTYPE html>
      <html><body>
        <main data-route-path="/"></main>
        <nav data-page-toc class="page-toc">
          <a data-page-toc-tick href="#a"></a>
          <a data-page-toc-tick href="#b"></a>
          <a data-page-toc-item href="#a">A</a>
          <a data-page-toc-item href="#b">B</a>
        </nav>
        <section id="a"></section>
        <section id="b"></section>
      </body></html>`,
      { runScripts: "dangerously", url: "https://example.test/" }
    );

    Object.defineProperty(dom.window, "matchMedia", {
      configurable: true,
      writable: true,
      value: (query: string) => ({
        matches:
          query.includes("min-width: 768px") ||
          query.includes("(hover: hover)"),
        media: query,
        addEventListener() {
          /* jsdom stub */
        },
        removeEventListener() {
          /* jsdom stub */
        },
        addListener() {
          /* jsdom stub */
        },
        removeListener() {
          /* jsdom stub */
        },
        dispatchEvent() {
          return false;
        },
        onchange: null,
      }),
    });

    Object.defineProperty(
      dom.window.HTMLElement.prototype,
      "getBoundingClientRect",
      {
        configurable: true,
        value() {
          return {
            top: 0,
            bottom: 0,
            left: 0,
            right: 800,
            width: 0,
            height: 0,
            x: 0,
            y: 0,
            toJSON() {
              return {};
            },
          };
        },
      }
    );

    dom.window.eval(buildPageTocScript());
    dom.window.document.dispatchEvent(new dom.window.Event("DOMContentLoaded"));

    const toc = dom.window.document.querySelector(
      "[data-page-toc]"
    ) as HTMLElement;
    function dispatchPointer(type: string) {
      const event = new dom.window.Event(type, { bubbles: true });
      Object.defineProperty(event, "pointerType", {
        configurable: true,
        value: "mouse",
      });
      toc.dispatchEvent(event);
    }

    dispatchPointer("pointerenter");
    expect(toc.getAttribute("data-page-toc-open")).toBe("true");

    dispatchPointer("pointerleave");
    expect(toc.getAttribute("data-page-toc-open")).toBe("true");

    vi.advanceTimersByTime(349);
    expect(toc.getAttribute("data-page-toc-open")).toBe("true");
    vi.advanceTimersByTime(1);
    expect(toc.getAttribute("data-page-toc-open")).toBeNull();

    dom.window.close();
  });

  it("keeps the panel open after chapter click while pointer stays inside", () => {
    vi.useFakeTimers();
    const dom = new JSDOM(
      `<!DOCTYPE html>
      <html><body>
        <main data-route-path="/"></main>
        <nav data-page-toc class="page-toc">
          <a data-page-toc-tick href="#a"></a>
          <a data-page-toc-tick href="#b"></a>
          <a data-page-toc-item href="#a">A</a>
          <a data-page-toc-item href="#b">B</a>
        </nav>
        <section id="a"></section>
        <section id="b"></section>
      </body></html>`,
      { runScripts: "dangerously", url: "https://example.test/" }
    );

    Object.defineProperty(dom.window, "matchMedia", {
      configurable: true,
      writable: true,
      value: (query: string) => ({
        matches:
          query.includes("min-width: 768px") ||
          query.includes("(hover: hover)") ||
          query.includes("(pointer: fine)"),
        media: query,
        addEventListener() {
          /* jsdom stub */
        },
        removeEventListener() {
          /* jsdom stub */
        },
        addListener() {
          /* jsdom stub */
        },
        removeListener() {
          /* jsdom stub */
        },
        dispatchEvent() {
          return false;
        },
        onchange: null,
      }),
    });

    Object.defineProperty(
      dom.window.HTMLElement.prototype,
      "getBoundingClientRect",
      {
        configurable: true,
        value() {
          return {
            top: 0,
            bottom: 0,
            left: 0,
            right: 800,
            width: 0,
            height: 0,
            x: 0,
            y: 0,
            toJSON() {
              return {};
            },
          };
        },
      }
    );

    dom.window.eval(buildPageTocScript());
    dom.window.document.dispatchEvent(new dom.window.Event("DOMContentLoaded"));

    const toc = dom.window.document.querySelector(
      "[data-page-toc]"
    ) as HTMLElement;
    const item = toc.querySelector(
      '[data-page-toc-item][href="#b"]'
    ) as HTMLElement;

    function dispatchPointer(type: string) {
      const event = new dom.window.Event(type, { bubbles: true });
      Object.defineProperty(event, "pointerType", {
        configurable: true,
        value: "mouse",
      });
      toc.dispatchEvent(event);
    }

    dispatchPointer("pointerenter");
    expect(toc.getAttribute("data-page-toc-open")).toBe("true");

    item.click();
    // Simulate focus moving to the jumped section after navigation.
    item.dispatchEvent(
      new dom.window.FocusEvent("focusout", {
        bubbles: true,
        relatedTarget: null,
      })
    );
    toc.dispatchEvent(
      new dom.window.FocusEvent("focusout", {
        bubbles: true,
        relatedTarget: null,
      })
    );

    vi.advanceTimersByTime(500);
    expect(toc.getAttribute("data-page-toc-open")).toBe("true");

    dom.window.close();
  });

  it("opens on tap when closed in coarse-pointer mode", () => {
    const dom = new JSDOM(
      `<!DOCTYPE html>
      <html><body>
        <main data-route-path="/"></main>
        <nav data-page-toc class="page-toc">
          <a data-page-toc-tick href="#a"></a>
          <a data-page-toc-tick href="#b"></a>
          <a data-page-toc-item href="#a">A</a>
          <a data-page-toc-item href="#b">B</a>
        </nav>
        <section id="a"></section>
        <section id="b"></section>
      </body></html>`,
      { runScripts: "dangerously", url: "https://example.test/" }
    );

    Object.defineProperty(dom.window, "matchMedia", {
      configurable: true,
      writable: true,
      value: (query: string) => ({
        matches:
          query.includes("min-width: 768px") ||
          query.includes("(pointer: coarse)"),
        media: query,
        addEventListener() {
          /* jsdom stub */
        },
        removeEventListener() {
          /* jsdom stub */
        },
        addListener() {
          /* jsdom stub */
        },
        removeListener() {
          /* jsdom stub */
        },
        dispatchEvent() {
          return false;
        },
        onchange: null,
      }),
    });

    Object.defineProperty(
      dom.window.HTMLElement.prototype,
      "getBoundingClientRect",
      {
        configurable: true,
        value() {
          return {
            top: 0,
            bottom: 0,
            left: 0,
            right: 800,
            width: 0,
            height: 0,
            x: 0,
            y: 0,
            toJSON() {
              return {};
            },
          };
        },
      }
    );

    dom.window.eval(buildPageTocScript());
    dom.window.document.dispatchEvent(new dom.window.Event("DOMContentLoaded"));

    const toc = dom.window.document.querySelector(
      "[data-page-toc]"
    ) as HTMLElement;
    const tick = toc.querySelector(
      '[data-page-toc-tick][href="#a"]'
    ) as HTMLAnchorElement;

    tick.click();
    expect(toc.getAttribute("data-page-toc-open")).toBe("true");
    expect(dom.window.location.hash).toBe("");

    dom.window.close();
  });
});
