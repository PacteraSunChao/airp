import { escapeHtml } from "./escape-html.js";

/**
 * `wrapBlock` always emits `data-block-type` in the opening tag of the element a
 * block renders as, and a handler builds that element before anything else it
 * returns. So the *first* occurrence in a handler's output belongs to the block
 * being emitted, never to a nested child — which is what makes this a safe
 * anchor for the handle.
 */
const BLOCK_TYPE_ATTR = ' data-block-type="';

/**
 * Add a block's Machine Handle (`@id`) to the element it renders as, so a host
 * can map a rendered node back to the document node it came from.
 *
 * Machine handles are requested through `targetOptions.machineHandles` and are
 * off by default, so a render that does not ask for them stays byte-identical.
 * Output without the anchor (a handler that renders no wrapper) is returned
 * unchanged rather than annotated in the wrong place.
 */
export function injectMachineHandle(html: string, atId: string): string {
  const anchor = html.indexOf(BLOCK_TYPE_ATTR);
  if (anchor < 0) {
    return html;
  }
  // The attribute value is escaped, so the first quote after it ends the value.
  const valueEnd = html.indexOf('"', anchor + BLOCK_TYPE_ATTR.length);
  if (valueEnd < 0) {
    return html;
  }
  const cut = valueEnd + 1;
  return `${html.slice(0, cut)} data-airp-id="${escapeHtml(atId)}"${html.slice(cut)}`;
}

/**
 * `data-airp-id` for a structured object *inside* a block — a table column, a
 * checklist entry, a tabs panel. Same contract as the block attribute: only when
 * the host asked for handles, and only for an object that actually carries one.
 *
 * An item is emitted by its block's own handler, so unlike the block case there
 * is nothing central to hook: each handler interpolates this into the element it
 * renders the item as.
 */
export function itemHandleAttr(
  ctx: { machineHandles?: boolean },
  item: unknown
): string {
  if (ctx.machineHandles !== true) {
    return "";
  }
  const atId = (item as { "@id"?: unknown } | null | undefined)?.["@id"];
  return typeof atId === "string" && atId.length > 0
    ? ` data-airp-id="${escapeHtml(atId)}"`
    : "";
}

/** The handle a block carries, or `undefined` when it has none to emit. */
export function readBlockHandle(block: {
  [key: string]: unknown;
}): string | undefined {
  const atId = block["@id"];
  return typeof atId === "string" && atId.length > 0 ? atId : undefined;
}
