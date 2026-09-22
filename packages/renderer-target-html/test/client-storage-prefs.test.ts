import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";
import { buildClientStorageScript } from "../src/client/client-storage-script.js";
import { buildCollapsibleScript } from "../src/client/collapsible-script.js";
import {
  buildColorSchemeApplyScript,
  buildColorSchemeScript,
} from "../src/client/color-scheme-script.js";
import {
  APP_COLOR_SCHEME_KEY,
  COLOR_SCHEME_EVENT,
} from "../src/shared/client-storage-keys.js";

describe("color-scheme localStorage", () => {
  it("uses airp-app-color-scheme and omits light", () => {
    expect(APP_COLOR_SCHEME_KEY).toBe("airp-app-color-scheme");

    const dom = new JSDOM(
      `<!doctype html><html><body>
        <button id="app-color-scheme-toggle" data-color-scheme="light"></button>
      </body></html>`,
      {
        runScripts: "dangerously",
        url: "https://example.test/",
      }
    );
    const { localStorage } = dom.window;
    localStorage.clear();

    dom.window.eval(buildColorSchemeApplyScript());
    dom.window.eval(
      buildColorSchemeScript(
        { light: "Light", dark: "Dark" },
        { light: "<span>L</span>", dark: "<span>D</span>" }
      )
    );
    dom.window.document.dispatchEvent(new dom.window.Event("DOMContentLoaded"));

    const button = dom.window.document.getElementById(
      "app-color-scheme-toggle"
    );
    expect(localStorage.getItem(APP_COLOR_SCHEME_KEY)).toBeNull();

    button?.click();
    expect(localStorage.getItem(APP_COLOR_SCHEME_KEY)).toBe('"dark"');
    expect(dom.window.document.documentElement.classList.contains("dark")).toBe(
      true
    );

    button?.click();
    expect(localStorage.getItem(APP_COLOR_SCHEME_KEY)).toBeNull();
    expect(dom.window.document.documentElement.classList.contains("dark")).toBe(
      false
    );

    dom.window.close();
  });

  it("applies preference from airp-color-scheme document event", () => {
    expect(COLOR_SCHEME_EVENT).toBe("airp-color-scheme");
    const dom = new JSDOM(
      `<!doctype html><html><body>
        <button id="app-color-scheme-toggle" data-color-scheme="light"></button>
      </body></html>`,
      {
        runScripts: "dangerously",
        url: "https://example.test/",
      }
    );
    const { localStorage } = dom.window;
    localStorage.clear();

    dom.window.eval(
      buildColorSchemeScript(
        { light: "Light", dark: "Dark" },
        { light: "<span>L</span>", dark: "<span>D</span>" }
      )
    );
    dom.window.document.dispatchEvent(new dom.window.Event("DOMContentLoaded"));

    dom.window.document.dispatchEvent(
      new dom.window.CustomEvent(COLOR_SCHEME_EVENT, { detail: "dark" })
    );

    const button = dom.window.document.getElementById(
      "app-color-scheme-toggle"
    );
    expect(localStorage.getItem(APP_COLOR_SCHEME_KEY)).toBe('"dark"');
    expect(dom.window.document.documentElement.classList.contains("dark")).toBe(
      true
    );
    expect(button?.getAttribute("data-color-scheme")).toBe("dark");
    expect(button?.getAttribute("aria-label")).toBe("Dark");

    dom.window.close();
  });
});

describe("collapsible localStorage", () => {
  it("persists only when open differs from defaultOpen", () => {
    const storageKey = "airp-collapsible:/:cccccccccc";
    const dom = new JSDOM(
      `<!doctype html><html><body>
        <details data-block-type="collapsible" data-default-open="true" open data-storage-key="${storageKey}">
          <summary data-collapsible-trigger="true">Notes</summary>
          <div>Body</div>
        </details>
      </body></html>`,
      {
        runScripts: "dangerously",
        url: "https://example.test/",
      }
    );
    const { localStorage } = dom.window;
    localStorage.clear();

    dom.window.eval(buildClientStorageScript());
    dom.window.eval(buildCollapsibleScript());
    dom.window.document.dispatchEvent(new dom.window.Event("DOMContentLoaded"));

    const root = dom.window.document.querySelector(
      "[data-block-type='collapsible']"
    ) as HTMLDetailsElement;
    expect(root.open).toBe(true);
    expect(localStorage.getItem(storageKey)).toBeNull();

    root.open = false;
    root.dispatchEvent(new dom.window.Event("toggle"));
    expect(localStorage.getItem(storageKey)).toBe(
      JSON.stringify({ open: false })
    );

    root.open = true;
    root.dispatchEvent(new dom.window.Event("toggle"));
    expect(localStorage.getItem(storageKey)).toBeNull();

    dom.window.close();
  });

  it("applies stored open that differs from defaultOpen", () => {
    const storageKey = "airp-collapsible:/:cccccccccc";
    const dom = new JSDOM(
      `<!doctype html><html><body>
        <details data-block-type="collapsible" data-default-open="false" data-storage-key="${storageKey}">
          <summary>Notes</summary>
        </details>
      </body></html>`,
      {
        runScripts: "dangerously",
        url: "https://example.test/",
      }
    );
    dom.window.localStorage.setItem(storageKey, JSON.stringify({ open: true }));

    dom.window.eval(buildClientStorageScript());
    dom.window.eval(buildCollapsibleScript());
    dom.window.document.dispatchEvent(new dom.window.Event("DOMContentLoaded"));

    const root = dom.window.document.querySelector(
      "[data-block-type='collapsible']"
    ) as HTMLDetailsElement;
    expect(root.open).toBe(true);

    dom.window.close();
  });
});
