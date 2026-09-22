/**
 * Host-only CSS/JS for VS Code / Cursor webviews (not HTML target tokens).
 * Unlayered reset counters @layer vscode-default (#_defaultStyles).
 * Do not revert img/video max-size: unlayered revert beats @layer components
 * max-w-full / object-contain on media.
 */

import { hostInjectedCss } from "./host-injected-css";

export const WEBVIEW_HOST_RESET_CSS = `html {
  scrollbar-color: auto;
}

body {
  overscroll-behavior-x: auto;
  background-color: var(--bg-page, Canvas);
  color: inherit;
  font-family: inherit;
  font-weight: inherit;
  font-size: inherit;
  margin: 0;
  padding: 0;
}

code {
  background-color: transparent;
  border-radius: 0;
  color: inherit;
  font-family: inherit;
  padding: 0;
}

pre code {
  padding: 0;
}

blockquote {
  background: revert;
  border-color: revert;
}

kbd {
  all: revert;
}

a:focus,
input:focus,
select:focus,
textarea:focus {
  outline: revert;
  outline-offset: revert;
}`;

export const WEBVIEW_HOST_CSS = `${WEBVIEW_HOST_RESET_CSS}\n${hostInjectedCss()}`;

export const WEBVIEW_REMOVE_DEFAULT_STYLES_JS =
  'document.getElementById("_defaultStyles")?.remove();';

/** Remove VS Code host #_defaultStyles if present. Safe to call repeatedly. */
export function removeWebviewDefaultStyles(): void {
  document.getElementById("_defaultStyles")?.remove();
}

export function webviewRemoveDefaultStylesScriptTag(): string {
  return `<script>${WEBVIEW_REMOVE_DEFAULT_STYLES_JS}</script>`;
}

export function webviewHostStyleTag(): string {
  return `<style>${WEBVIEW_HOST_CSS}</style>`;
}

/** Unlayered reset + chrome + early removal of #_defaultStyles for extraHead. */
export function webviewHostHeadExtras(): string {
  return `${webviewHostStyleTag()}\n${webviewRemoveDefaultStylesScriptTag()}`;
}
