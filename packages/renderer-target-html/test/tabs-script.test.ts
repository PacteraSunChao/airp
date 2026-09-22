import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";
import { buildClientStorageScript } from "../src/client/client-storage-script.js";
import { buildTabsScript } from "../src/client/tabs-script.js";

describe("tabs client", () => {
  it("switches panels with pointer and keyboard input", () => {
    const dom = new JSDOM(
      `<div data-block-type="tabs">
        <div role="tablist">
          <button role="tab" data-tabs-tab aria-selected="true">One</button>
          <button role="tab" data-tabs-tab aria-selected="false" tabindex="-1">Two</button>
        </div>
        <div>
          <section role="tabpanel" data-tabs-panel>First</section>
          <section role="tabpanel" data-tabs-panel hidden>Second</section>
        </div>
      </div>`,
      { runScripts: "dangerously" }
    );

    dom.window.eval(buildTabsScript());
    dom.window.document.dispatchEvent(new dom.window.Event("DOMContentLoaded"));

    const tabs =
      dom.window.document.querySelectorAll<HTMLElement>("[data-tabs-tab]");
    const panels =
      dom.window.document.querySelectorAll<HTMLElement>("[data-tabs-panel]");

    tabs[1]?.click();
    expect(tabs[1]?.getAttribute("aria-selected")).toBe("true");
    expect(panels[0]?.hidden).toBe(true);
    expect(panels[1]?.hidden).toBe(false);

    tabs[1]?.dispatchEvent(
      new dom.window.KeyboardEvent("keydown", {
        bubbles: true,
        key: "ArrowLeft",
      })
    );
    expect(tabs[0]?.getAttribute("aria-selected")).toBe("true");
    expect(dom.window.document.activeElement).toBe(tabs[0]);

    dom.window.close();
  });

  it("persists a non-default panel and removes the default", () => {
    const storageKey = "airp-tabs:/:tttttttttt";
    const dom = new JSDOM(
      `<div data-block-type="tabs" data-default-panel="aaaaaaaaaa" data-storage-key="${storageKey}">
        <div role="tablist">
          <button role="tab" data-tabs-tab data-tabs-panel-key="aaaaaaaaaa" aria-selected="true">One</button>
          <button role="tab" data-tabs-tab data-tabs-panel-key="bbbbbbbbbb" aria-selected="false" tabindex="-1">Two</button>
        </div>
        <div>
          <section role="tabpanel" data-tabs-panel>First</section>
          <section role="tabpanel" data-tabs-panel hidden>Second</section>
        </div>
      </div>`,
      { runScripts: "dangerously", url: "https://example.test/" }
    );

    dom.window.eval(buildClientStorageScript());
    dom.window.eval(buildTabsScript());
    dom.window.document.dispatchEvent(new dom.window.Event("DOMContentLoaded"));

    const tabs =
      dom.window.document.querySelectorAll<HTMLElement>("[data-tabs-tab]");
    tabs[1]?.click();
    expect(dom.window.localStorage.getItem(storageKey)).toBe(
      JSON.stringify({ panel: "bbbbbbbbbb" })
    );

    tabs[0]?.click();
    expect(dom.window.localStorage.getItem(storageKey)).toBeNull();

    dom.window.close();
  });

  it("restores a stored panel by key and removes invalid records", () => {
    const storageKey = "airp-tabs:/:tttttttttt";
    const markup = `<div data-block-type="tabs" data-default-panel="aaaaaaaaaa" data-storage-key="${storageKey}">
      <div role="tablist">
        <button role="tab" data-tabs-tab data-tabs-panel-key="aaaaaaaaaa" aria-selected="true">One</button>
        <button role="tab" data-tabs-tab data-tabs-panel-key="bbbbbbbbbb" aria-selected="false" tabindex="-1">Two</button>
      </div>
      <div>
        <section role="tabpanel" data-tabs-panel>First</section>
        <section role="tabpanel" data-tabs-panel hidden>Second</section>
      </div>
    </div>`;
    const dom = new JSDOM(markup, {
      runScripts: "dangerously",
      url: "https://example.test/",
    });
    dom.window.localStorage.setItem(
      storageKey,
      JSON.stringify({ panel: "bbbbbbbbbb" })
    );

    dom.window.eval(buildClientStorageScript());
    dom.window.eval(buildTabsScript());
    dom.window.document.dispatchEvent(new dom.window.Event("DOMContentLoaded"));

    const tabs =
      dom.window.document.querySelectorAll<HTMLElement>("[data-tabs-tab]");
    expect(tabs[1]?.getAttribute("aria-selected")).toBe("true");

    dom.window.close();

    const invalidDom = new JSDOM(markup, {
      runScripts: "dangerously",
      url: "https://example.test/",
    });
    invalidDom.window.localStorage.setItem(
      storageKey,
      JSON.stringify({ panel: "missing" })
    );
    invalidDom.window.eval(buildClientStorageScript());
    invalidDom.window.eval(buildTabsScript());
    invalidDom.window.document.dispatchEvent(
      new invalidDom.window.Event("DOMContentLoaded")
    );

    expect(invalidDom.window.localStorage.getItem(storageKey)).toBeNull();
    invalidDom.window.close();
  });
});
