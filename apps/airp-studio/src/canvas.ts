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

/**
 * Painted inside the frame so it lines up with the rendered report. The app's
 * own stylesheet cannot reach across the frame boundary, so this mirrors the
 * palette's ink colour.
 */
const INDICATOR_CSS = `
[data-airp-insert] {
  position: absolute;
  z-index: 30;
  display: flex;
  gap: 8px;
  align-items: center;
  right: 16px;
  left: 16px;
  pointer-events: none;
  transform: translateY(-50%);
}
[data-airp-insert] .insert-indicator-line {
  flex: 1;
  height: 2px;
  background: #0f6b5c;
  border-radius: 2px;
}
[data-airp-insert] .insert-indicator-dot {
  width: 7px;
  height: 7px;
  background: #0f6b5c;
  border-radius: 50%;
}
[data-airp-insert] .insert-indicator-label {
  padding: 3px 9px;
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
  background: #0f6b5c;
  border-radius: 6px;
}
`;

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

/** Where a node sits in the canvas frame's own coordinates. */
export interface NodeBox {
  height: number;
  left: number;
  top: number;
  width: number;
}

export interface CanvasOptions {
  /** The click landed outside any annotated node. */
  onClear(): void;
  /** A palette item was dropped on the node carrying `atId` (or the page). */
  onDrop(atId: string | undefined, blockType: string): void;
  /** A node was double clicked: the author wants to edit it where it is. */
  onEdit(atId: string, box: NodeBox): void;
  /** A node was clicked. */
  onSelect(atId: string, box: NodeBox): void;
}

/** The element's box relative to the iframe's own viewport. */
function boxOf(frame: HTMLIFrameElement, element: Element): NodeBox {
  const rect = element.getBoundingClientRect();
  const frameRect = frame.getBoundingClientRect();
  return {
    height: rect.height,
    left: rect.left - frameRect.left,
    top: rect.top - frameRect.top,
    width: rect.width,
  };
}

function annotated(target: EventTarget | null): Element | null {
  return (target as Element | null)?.closest("[data-airp-id]") ?? null;
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

/** Whether the drag in flight is one this canvas knows how to accept. */
function isPaletteDrag(event: DragEvent): boolean {
  return [...(event.dataTransfer?.types ?? [])].includes(PALETTE_DRAG_TYPE);
}

/**
 * Show where a dragged block will land: directly under the block the pointer is
 * over, because that is where the shell inserts it. Nothing is shown when the
 * pointer is not over a block — the drop then appends to the end of the report.
 */
function paintIndicator(
  frame: HTMLIFrameElement,
  target: Element | null
): void {
  const document_ = frame.contentDocument;
  if (document_ === null) {
    return;
  }
  if (target === null) {
    clearIndicator();
    return;
  }
  const rect = target.getBoundingClientRect();
  const scrollY = frame.contentWindow?.scrollY ?? 0;
  let indicator = document_.querySelector<HTMLElement>("[data-airp-insert]");
  if (indicator === null) {
    indicator = document_.createElement("div");
    indicator.setAttribute("data-airp-insert", "after");
    for (const className of ["insert-indicator-dot", "insert-indicator-line"]) {
      const part = document_.createElement("span");
      part.className = className;
      indicator.append(part);
    }
    const label = document_.createElement("span");
    label.className = "insert-indicator-label";
    label.textContent = "插入到此后";
    indicator.append(label);
    document_.body.append(indicator);
  }
  indicator.style.top = `${rect.bottom + scrollY}px`;
}

function clearIndicator(): void {
  for (const frame of document.querySelectorAll("iframe")) {
    frame.contentDocument?.querySelector("[data-airp-insert]")?.remove();
  }
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
    style.textContent = `${HIGHLIGHT_CSS}${INDICATOR_CSS}`;
    document_.head.append(style);

    document_.addEventListener("mouseover", (event) => {
      const target = (event.target as Element | null)?.closest(
        "[data-airp-id]"
      );
      mark(target ?? null, HOVER_ATTR);
    });
    document_.addEventListener("click", (event) => {
      const mouse = event as MouseEvent;
      // A report is full of links; in the editor a click means "edit this",
      // never "navigate away from my document".
      if ((mouse.target as Element | null)?.closest("a[href]") != null) {
        mouse.preventDefault();
      }
      const target = annotated(mouse.target);
      const atId = target?.getAttribute("data-airp-id");
      if (target === null || atId === undefined || atId === null) {
        options.onClear();
        return;
      }
      options.onSelect(atId, boxOf(frame, target));
    });
    document_.addEventListener("dblclick", (event) => {
      const target = annotated(event.target);
      const atId = target?.getAttribute("data-airp-id");
      if (target !== null && atId !== undefined && atId !== null) {
        options.onEdit(atId, boxOf(frame, target));
      }
    });

    // A block dragged out of the palette lands where it was dropped: the handle
    // under the pointer says which block it should follow.
    document_.addEventListener("dragover", (event) => {
      const over = event as DragEvent;
      over.preventDefault();
      if (!isPaletteDrag(over)) {
        return;
      }
      paintIndicator(frame, annotated(over.target));
    });
    document_.addEventListener("dragleave", (event) => {
      // Leaving the document entirely: drop the indicator rather than strand it.
      if (event.target === document_.documentElement) {
        clearIndicator();
      }
    });
    document_.addEventListener("dragend", () => clearIndicator());
    document_.addEventListener("drop", (event) => {
      const drop = event as DragEvent;
      drop.preventDefault();
      clearIndicator();
      const type = drop.dataTransfer?.getData(PALETTE_DRAG_TYPE);
      if (type === undefined || type.length === 0) {
        return;
      }
      const target = annotated(drop.target);
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
