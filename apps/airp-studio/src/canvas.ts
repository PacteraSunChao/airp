/**
 * The editing canvas: the document exactly as the renderer produces it, in an
 * iframe, plus the bridge that turns a click on it back into a document node.
 *
 * The renderer only annotates blocks when asked (`targetOptions.machineHandles`),
 * and `@airp/editor-core` owns the handle↔path mapping; this module only reports
 * which handle was clicked and paints the highlight.
 */

import { PALETTE_DRAG_TYPE } from "./palette.js";

/** Marks painted into the rendered document, never written back to it. */
const SELECTED_ATTR = "data-airp-selected";
const HOVER_ATTR = "data-airp-hover";
const ANY_MARK = `[${SELECTED_ATTR}],[${HOVER_ATTR}]`;

const HIGHLIGHT_CSS = `
[${SELECTED_ATTR}] {
  outline: 2px solid #0f6b5c;
  outline-offset: 3px;
  border-radius: 4px;
}
[${HOVER_ATTR}] {
  outline: 1px dashed rgba(15, 107, 92, 0.55);
  outline-offset: 3px;
  border-radius: 4px;
}
`;

export interface CanvasOptions {
  /** A node on the canvas was activated (click or double click). */
  onActivate(atId: string, event: MouseEvent): void;
  /** The click landed outside any annotated node. */
  onClear(): void;
  /** A palette item was dropped on the node carrying `atId` (or the page). */
  onDrop(atId: string | undefined, blockType: string): void;
}

export interface CanvasHandle {
  /** Mark the node carrying this handle, if it is on screen. */
  highlight(atId: string | undefined): void;
  /** Paint a new revision of the document. */
  render(html: string): void;
}

function attrSelector(atId: string): string {
  return `[data-airp-id="${atId}"]`;
}

/**
 * Keep the author's place while the document they are editing is repainted: the
 * iframe reloads on every render, which would otherwise scroll back to the top.
 */
function readScrollY(frame: HTMLIFrameElement): number {
  return frame.contentWindow?.scrollY ?? 0;
}

export function createCanvas(
  frame: HTMLIFrameElement,
  options: CanvasOptions
): CanvasHandle {
  let pendingScrollY = 0;
  let selected: string | undefined;

  const mark = (element: Element | null, attribute: string): void => {
    // Quoted as an attribute selector: bare `data-airp-selected` would look for
    // an element *named* that, and nothing would ever be cleared.
    for (const marked of frame.contentDocument?.querySelectorAll(
      `[${attribute}]`
    ) ?? []) {
      marked.removeAttribute(attribute);
    }
    element?.setAttribute(attribute, "true");
  };

  const installBridge = (): void => {
    const document_ = frame.contentDocument;
    if (document_ === null) {
      return;
    }
    const style = document_.createElement("style");
    style.textContent = HIGHLIGHT_CSS;
    document_.head.append(style);

    document_.addEventListener("mouseover", (event) => {
      const target = (event.target as Element | null)?.closest(
        "[data-airp-id]"
      );
      mark(target ?? null, HOVER_ATTR);
    });
    document_.addEventListener("click", (event) => {
      const mouse = event as MouseEvent;
      const anchor = (mouse.target as Element | null)?.closest("a[href]");
      // A report is full of links; in the editor a click means "edit this",
      // never "navigate away from my document".
      if (anchor !== null) {
        mouse.preventDefault();
      }
      const target = (mouse.target as Element | null)?.closest(
        "[data-airp-id]"
      );
      const atId = target?.getAttribute("data-airp-id");
      if (atId === undefined || atId === null) {
        options.onClear();
        return;
      }
      options.onActivate(atId, mouse);
    });
    document_.addEventListener("dblclick", (event) => {
      const target = (event.target as Element | null)?.closest(
        "[data-airp-id]"
      );
      const atId = target?.getAttribute("data-airp-id");
      if (atId !== undefined && atId !== null) {
        options.onActivate(atId, event as MouseEvent);
      }
    });

    // A block dragged out of the palette lands where it was dropped: the handle
    // under the pointer says which block it should follow.
    document_.addEventListener("dragover", (event) => {
      event.preventDefault();
    });
    document_.addEventListener("drop", (event) => {
      const drop = event as DragEvent;
      drop.preventDefault();
      const type = drop.dataTransfer?.getData(PALETTE_DRAG_TYPE);
      if (type === undefined || type.length === 0) {
        return;
      }
      const target = (drop.target as Element | null)?.closest("[data-airp-id]");
      options.onDrop(target?.getAttribute("data-airp-id") ?? undefined, type);
    });

    if (pendingScrollY > 0) {
      frame.contentWindow?.scrollTo({ top: pendingScrollY });
    }
    if (selected !== undefined) {
      mark(document_.querySelector(attrSelector(selected)), SELECTED_ATTR);
    }
  };

  frame.addEventListener("load", installBridge);

  return {
    highlight(atId: string | undefined): void {
      selected = atId;
      const document_ = frame.contentDocument;
      if (document_ === null) {
        return;
      }
      const target =
        atId === undefined ? null : document_.querySelector(attrSelector(atId));
      mark(target, SELECTED_ATTR);
      target?.scrollIntoView({ block: "nearest" });
    },

    render(html: string): void {
      pendingScrollY = readScrollY(frame);
      if (frame.contentDocument !== null) {
        for (const marked of frame.contentDocument.querySelectorAll(ANY_MARK)) {
          marked.removeAttribute(SELECTED_ATTR);
          marked.removeAttribute(HOVER_ATTR);
        }
      }
      frame.removeAttribute("sandbox");
      frame.srcdoc = html;
    },
  };
}
