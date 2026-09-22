import { Window } from "happy-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  removeWebviewDefaultStyles,
  WEBVIEW_HOST_CSS,
  WEBVIEW_HOST_RESET_CSS,
  WEBVIEW_REMOVE_DEFAULT_STYLES_JS,
  webviewHostHeadExtras,
  webviewHostStyleTag,
  webviewRemoveDefaultStylesScriptTag,
} from "../src/webview-code-reset";

describe("webview-code-reset", () => {
  let windowRef: Window | undefined;

  afterEach(() => {
    vi.unstubAllGlobals();
    windowRef?.happyDOM.close();
    windowRef = undefined;
  });

  it("exposes unlayered reset for vscode-default body and code", () => {
    expect(WEBVIEW_HOST_RESET_CSS).toContain("padding: 0");
    expect(WEBVIEW_HOST_RESET_CSS).toContain("margin: 0");
    expect(WEBVIEW_HOST_RESET_CSS).toContain(
      "background-color: var(--bg-page, Canvas)"
    );
    expect(WEBVIEW_HOST_RESET_CSS).toContain("background-color: transparent");
    expect(WEBVIEW_HOST_RESET_CSS).not.toContain("max-width: revert");
    expect(WEBVIEW_HOST_RESET_CSS).not.toContain("max-height: revert");
  });

  it("composes reset with host chrome and remove-default script", () => {
    expect(WEBVIEW_HOST_CSS).toContain(WEBVIEW_HOST_RESET_CSS);
    expect(WEBVIEW_HOST_CSS).toContain("#app-color-scheme-toggle");
    expect(WEBVIEW_HOST_CSS).toContain("var(--shadow-float)");
    expect(webviewHostStyleTag()).toContain("<style>");
    expect(webviewRemoveDefaultStylesScriptTag()).toContain(
      WEBVIEW_REMOVE_DEFAULT_STYLES_JS
    );
    expect(webviewHostHeadExtras()).toContain(webviewHostStyleTag());
    expect(webviewHostHeadExtras()).toContain(
      webviewRemoveDefaultStylesScriptTag()
    );
  });

  it("removes #_defaultStyles when present", () => {
    windowRef = new Window();
    vi.stubGlobal("document", windowRef.document);
    const style = windowRef.document.createElement("style");
    style.id = "_defaultStyles";
    windowRef.document.head.append(style);
    expect(windowRef.document.getElementById("_defaultStyles")).not.toBeNull();
    removeWebviewDefaultStyles();
    expect(windowRef.document.getElementById("_defaultStyles")).toBeNull();
  });
});
