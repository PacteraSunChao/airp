import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";
import {
  renderCodeShell,
  renderPlainCodePre,
} from "../src/shared/render-code-shell.js";

/** Mirrors client `codeText` selector (must not match filename <code>). */
function readCodeCopyText(root: ParentNode): string {
  const code = root.querySelector("pre code, .shiki code");
  return code ? (code.textContent ?? "") : "";
}

describe("code copy target", () => {
  it("reads body code when filename chrome uses <code>", () => {
    const shell = renderCodeShell({
      bodyHtml: renderPlainCodePre("const x = 1;\n", "typescript"),
      filename: "sample.ts",
      language: "typescript",
    });
    const { window } = new JSDOM(
      `<div data-code-block="true" data-block-type="code">${shell}</div>`
    );
    const root = window.document.querySelector("[data-code-block]");
    expect(root).not.toBeNull();
    expect(readCodeCopyText(root as ParentNode)).toBe("const x = 1;\n");
    expect(root?.querySelector("[data-code-filename]")?.textContent).toBe(
      "sample.ts"
    );
    expect(root?.querySelector("[data-code-dots]")).toBeNull();
  });
});
