import { describe, expect, it } from "vitest";
import { hostInjectedCss } from "../src/host-injected-css";

describe("hostInjectedCss", () => {
  it("disables smooth scrolling for immediate scroll restoration", () => {
    expect(hostInjectedCss()).toContain("html{scroll-behavior:auto!important}");
  });

  it("aligns export menu with sources popover chrome via data-open", () => {
    const css = hostInjectedCss();
    expect(css).toContain("[data-extra-app-header]{display:contents}");
    expect(css).toContain("[data-airp-export-menu]");
    expect(css).not.toContain(":hover [data-airp-export-menu]");
    expect(css).not.toContain("[data-airp-export-menu]{display:none");
    expect(css).toContain("var(--bg-surface)");
    expect(css).toContain("var(--shadow-float)");
    expect(css).toContain("border-radius:0.75rem");
    expect(css).toContain("background:#f8fafc");
    expect(css).not.toContain("CanvasText");
    expect(css).not.toContain("var(--card-shadow)");
  });

  it("styles the Cursor find bar with float chrome tokens", () => {
    const css = hostInjectedCss();
    expect(css).toContain("[data-airp-find-bar]");
    expect(css).toContain("z-index:80");
    expect(css).toContain("var(--bg-surface)");
    expect(css).toContain("var(--shadow-float)");
    expect(css).toContain("[data-airp-find-input]");
    expect(css).toContain("[data-airp-find-overlay]");
    expect(css).toContain("[data-airp-find-hit]");
    expect(css).not.toContain("::highlight(");
    expect(css).not.toContain("mark[data-airp-find-mark]");
  });
});
