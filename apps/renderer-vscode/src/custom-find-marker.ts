/** Host → webview: enable in-page find bar (Cursor). Value is `"true"` | `"false"`. */
export const CUSTOM_FIND_ATTR = "data-airp-use-custom-find";

export function customFindMarkerHtml(useCustomFind: boolean): string {
  return `<div hidden ${CUSTOM_FIND_ATTR}="${useCustomFind ? "true" : "false"}"></div>`;
}

export function readUseCustomFind(doc: Document): boolean {
  return (
    doc
      .querySelector(`[${CUSTOM_FIND_ATTR}]`)
      ?.getAttribute(CUSTOM_FIND_ATTR) === "true"
  );
}
