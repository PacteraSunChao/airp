/**
 * Editing a block where it is drawn.
 *
 * A click selects a block and hands it to the field panel; a double click says
 * "I want to change this text", and this overlay puts a control on top of the
 * rendered node so the author keeps looking at the report. It is deliberately
 * the same write path as the panel — `onInput` goes to the same document
 * mutation — the difference is only where the caret lives.
 */

export interface InlineEditorTarget {
  /** The node's box, in the canvas frame's coordinates. */
  box: { height: number; left: number; top: number; width: number };
  /** Whether the text is body copy (multi-line) or a short label. */
  multiline: boolean;
  value: string;
}

export interface InlineEditorOptions {
  /**
   * Called once, however the editor ended — `Escape`, blur, or a host that
   * closed it. The overlay closes itself on `Escape` and on blur, so a host that
   * only learned about an explicit `close()` would never hear about those.
   */
  onClose(): void;
  /** Called on every keystroke, like the field panel does. */
  onInput(text: string): void;
}

export interface InlineEditorHandle {
  close(): void;
}

/** Breathing room so the control covers the text it replaces, not just it. */
const PADDING = 6;
const MIN_WIDTH = 160;
const MIN_HEIGHT = 28;

const OVERLAY_CLASS = "inline-editor";

function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className !== undefined) {
    node.className = className;
  }
  return node;
}

/**
 * Put a control over `box` inside `container` and focus it.
 *
 * The overlay closes on `Escape` or on blur, and never writes on close: every
 * keystroke has already gone through `onInput`, so closing cannot lose work or
 * apply it twice.
 */
export function openInlineEditor(
  container: HTMLElement,
  target: InlineEditorTarget,
  options: InlineEditorOptions
): InlineEditorHandle {
  const control = target.multiline
    ? element("textarea", `${OVERLAY_CLASS} is-multiline`)
    : element("input", `${OVERLAY_CLASS} is-single`);
  control.value = target.value;
  control.style.left = `${target.box.left - PADDING}px`;
  control.style.top = `${target.box.top - PADDING}px`;
  control.style.width = `${Math.max(target.box.width + PADDING * 2, MIN_WIDTH)}px`;
  control.style.minHeight = `${Math.max(
    target.box.height + PADDING * 2,
    MIN_HEIGHT
  )}px`;
  control.setAttribute("aria-label", "就地编辑");

  // Closing runs twice on Escape — the key handler removes the control, which
  // blurs it, which asks to close again. Removing an already detached node
  // throws, and that throw would escape the caller that is trying to finish the
  // edit, so closing has to be idempotent.
  let closed = false;
  const close = (): void => {
    if (closed) {
      return;
    }
    closed = true;
    control.remove();
    options.onClose();
  };
  control.addEventListener("input", () => options.onInput(control.value));
  control.addEventListener("blur", close);
  control.addEventListener("keydown", (event) => {
    if (event instanceof KeyboardEvent && event.key === "Escape") {
      event.stopPropagation();
      close();
    }
  });
  // Clicking inside the overlay must not reach the canvas behind it, or the
  // click would re-select the block and close the editor.
  control.addEventListener("click", (event) => event.stopPropagation());

  container.append(control);
  control.focus();
  if (control instanceof HTMLTextAreaElement) {
    control.setSelectionRange(control.value.length, control.value.length);
  } else {
    control.select();
  }
  return { close };
}
