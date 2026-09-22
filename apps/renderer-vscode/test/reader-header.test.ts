import { describe, expect, it } from "vitest";
import { buildAppHeader, buildExportHeader } from "../src/reader-header";

describe("reader-header", () => {
  it("emits Edit Source and export menu with sources-aligned chrome", () => {
    const html = buildAppHeader();
    expect(html).toContain("data-airp-edit-source");
    expect(html).toContain('href="#airp-icon-file-text"');
    expect(html).toContain("Edit Source");
    expect(html).toContain("data-airp-export");
    expect(html).toContain("data-airp-export-menu-header");
    expect(html).toContain("data-airp-export-menu-items");
    expect(html).toContain("airp-float-panel");
    expect(html).toContain("airp-interactive");
    expect(html).toContain("inline-flex items-center justify-center");
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('href="#airp-icon-download"');
    expect(html).toContain('data-airp-export-format="html"');
    expect(html).toContain('data-airp-export-format="markdown"');
  });

  it("export header stays available alone", () => {
    const html = buildExportHeader();
    expect(html).toContain("data-airp-export");
    expect(html).not.toContain("data-airp-edit-source");
  });
});
