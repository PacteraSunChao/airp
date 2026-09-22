import { readUseCustomFind } from "../custom-find-marker";

export interface MountFindBarHandle {
  dispose: () => void;
}

interface MatchSpan {
  end: number;
  node: Text;
  start: number;
}

function isExcludedFromFind(node: Node): boolean {
  if (node.nodeType !== 1) {
    return false;
  }
  const el = node as Element;
  if (el.hasAttribute("hidden") || (el as HTMLElement).hidden) {
    return true;
  }
  if (el.getAttribute("aria-hidden") === "true") {
    return true;
  }
  if (el.closest("[data-airp-find-bar],[data-airp-find-overlay]")) {
    return true;
  }
  return false;
}

function collectVisibleTextNodes(root: Node): Text[] {
  const doc = root.ownerDocument ?? document;
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node: Node): number {
      let parent = node.parentElement;
      while (parent) {
        if (isExcludedFromFind(parent)) {
          return NodeFilter.FILTER_REJECT;
        }
        parent = parent.parentElement;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  const nodes: Text[] = [];
  let current = walker.nextNode();
  while (current) {
    nodes.push(current as Text);
    current = walker.nextNode();
  }
  return nodes;
}

/** Visible, same-text-node matches only (hidden / find chrome excluded). */
export function collectMatchSpans(root: Node, query: string): MatchSpan[] {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return [];
  }
  const spans: MatchSpan[] = [];
  for (const node of collectVisibleTextNodes(root)) {
    const lower = (node.textContent ?? "").toLowerCase();
    let from = 0;
    while (from < lower.length) {
      const at = lower.indexOf(needle, from);
      if (at < 0) {
        break;
      }
      spans.push({ node, start: at, end: at + needle.length });
      from = at + needle.length;
    }
  }
  return spans;
}

function rangeFromSpan(span: MatchSpan): Range {
  const range = span.node.ownerDocument.createRange();
  range.setStart(span.node, span.start);
  range.setEnd(span.node, span.end);
  return range;
}

function clearOverlay(overlay: HTMLElement): void {
  overlay.replaceChildren();
}

function paintOverlay(
  doc: Document,
  overlay: HTMLElement,
  spans: readonly MatchSpan[],
  currentIndex: number
): void {
  clearOverlay(overlay);
  for (let index = 0; index < spans.length; index += 1) {
    const span = spans[index];
    if (!span) {
      continue;
    }
    const range = rangeFromSpan(span);
    const rects = range.getClientRects();
    for (let r = 0; r < rects.length; r += 1) {
      const rect = rects.item(r);
      if (!(rect && (rect.width > 0 || rect.height > 0))) {
        continue;
      }
      const hit = doc.createElement("div");
      hit.setAttribute("data-airp-find-hit", "");
      if (index === currentIndex) {
        hit.setAttribute("data-current", "");
      }
      hit.style.left = `${rect.left}px`;
      hit.style.top = `${rect.top}px`;
      hit.style.width = `${rect.width}px`;
      hit.style.height = `${rect.height}px`;
      overlay.appendChild(hit);
    }
  }
}

function scrollSpanIntoView(span: MatchSpan): void {
  const range = rangeFromSpan(span);
  const node = range.startContainer;
  const el =
    node.nodeType === 1
      ? (node as Element)
      : (node.parentElement as Element | null);
  el?.scrollIntoView({ block: "center", inline: "nearest" });
}

/**
 * Fixed find bar for Cursor webviews. No-op when `data-airp-use-custom-find`
 * is not `"true"`. Match paint uses a fixed overlay of boxes from
 * `Range.getClientRects()` — document content is not wrapped.
 */
export function mountFindBar(doc: Document = document): MountFindBarHandle {
  if (!readUseCustomFind(doc)) {
    return { dispose: () => undefined };
  }

  const win = doc.defaultView ?? window;
  const overlay = doc.createElement("div");
  overlay.setAttribute("data-airp-find-overlay", "");
  overlay.setAttribute("aria-hidden", "true");
  doc.body.appendChild(overlay);

  const root = doc.createElement("div");
  root.setAttribute("data-airp-find-bar", "");
  root.hidden = true;
  root.innerHTML = `
<input type="search" data-airp-find-input aria-label="Find" autocomplete="off" spellcheck="false" />
<span data-airp-find-count aria-live="polite"></span>
<button type="button" data-airp-find-prev aria-label="Previous match">↑</button>
<button type="button" data-airp-find-next aria-label="Next match">↓</button>
<button type="button" data-airp-find-close aria-label="Close">✕</button>
`.trim();
  doc.body.appendChild(root);

  const input = root.querySelector(
    "[data-airp-find-input]"
  ) as HTMLInputElement;
  const countEl = root.querySelector("[data-airp-find-count]") as HTMLElement;
  const prevBtn = root.querySelector(
    "[data-airp-find-prev]"
  ) as HTMLButtonElement;
  const nextBtn = root.querySelector(
    "[data-airp-find-next]"
  ) as HTMLButtonElement;
  const closeBtn = root.querySelector(
    "[data-airp-find-close]"
  ) as HTMLButtonElement;

  let matchIndex = 0;
  let matchTotal = 0;
  let spans: MatchSpan[] = [];

  const updateCount = (): void => {
    if (matchTotal <= 0) {
      countEl.textContent = input.value.trim() ? "0/0" : "";
      return;
    }
    countEl.textContent = `${matchIndex}/${matchTotal}`;
  };

  const clearPaint = (): void => {
    clearOverlay(overlay);
  };

  const repaint = (): void => {
    if (spans.length === 0 || matchIndex <= 0) {
      clearPaint();
      return;
    }
    paintOverlay(doc, overlay, spans, matchIndex - 1);
  };

  const close = (): void => {
    root.hidden = true;
    matchIndex = 0;
    matchTotal = 0;
    spans = [];
    countEl.textContent = "";
    clearPaint();
  };

  const open = (): void => {
    root.hidden = false;
    input.focus();
    input.select();
  };

  const restoreInputFocus = (
    caretStart: number | null,
    caretEnd: number | null
  ): void => {
    input.focus({ preventScroll: true });
    if (caretStart !== null && caretEnd !== null) {
      input.setSelectionRange(caretStart, caretEnd);
    }
  };

  const runFind = (backwards: boolean): void => {
    const query = input.value;
    const caretStart = input.selectionStart;
    const caretEnd = input.selectionEnd;
    const searchRoot = doc.body ?? doc.documentElement;

    if (!query.trim()) {
      matchIndex = 0;
      matchTotal = 0;
      spans = [];
      updateCount();
      clearPaint();
      restoreInputFocus(caretStart, caretEnd);
      return;
    }

    spans = collectMatchSpans(searchRoot, query);
    matchTotal = spans.length;
    if (matchTotal === 0) {
      matchIndex = 0;
      updateCount();
      clearPaint();
      restoreInputFocus(caretStart, caretEnd);
      return;
    }

    if (backwards) {
      matchIndex = matchIndex <= 1 ? matchTotal : matchIndex - 1;
    } else if (matchIndex === 0 || matchIndex >= matchTotal) {
      matchIndex = 1;
    } else {
      matchIndex += 1;
    }

    const current = spans[matchIndex - 1];
    if (!current) {
      matchIndex = 0;
      updateCount();
      clearPaint();
      restoreInputFocus(caretStart, caretEnd);
      return;
    }

    updateCount();
    scrollSpanIntoView(current);
    paintOverlay(doc, overlay, spans, matchIndex - 1);
    restoreInputFocus(caretStart, caretEnd);
  };

  const onDocKeydown = (event: Event): void => {
    const keyEvent = event as KeyboardEvent;
    const mod = keyEvent.metaKey || keyEvent.ctrlKey;
    if (mod && keyEvent.key.toLowerCase() === "f") {
      keyEvent.preventDefault();
      keyEvent.stopPropagation();
      open();
      return;
    }
    if (keyEvent.key === "Escape" && !root.hidden) {
      keyEvent.preventDefault();
      keyEvent.stopPropagation();
      close();
    }
  };

  const onInputKeydown = (event: Event): void => {
    const keyEvent = event as KeyboardEvent;
    if (keyEvent.key === "Enter") {
      keyEvent.preventDefault();
      runFind(keyEvent.shiftKey);
      return;
    }
    if (keyEvent.key === "Escape") {
      keyEvent.preventDefault();
      close();
    }
  };

  const onInput = (): void => {
    matchIndex = 0;
    runFind(false);
  };

  const onScrollOrResize = (): void => {
    repaint();
  };

  doc.addEventListener("keydown", onDocKeydown, true);
  input.addEventListener("keydown", onInputKeydown);
  input.addEventListener("input", onInput);
  prevBtn.addEventListener("click", () => runFind(true));
  nextBtn.addEventListener("click", () => runFind(false));
  closeBtn.addEventListener("click", () => close());
  win.addEventListener("scroll", onScrollOrResize, true);
  win.addEventListener("resize", onScrollOrResize);

  return {
    dispose: () => {
      clearPaint();
      doc.removeEventListener("keydown", onDocKeydown, true);
      input.removeEventListener("keydown", onInputKeydown);
      input.removeEventListener("input", onInput);
      win.removeEventListener("scroll", onScrollOrResize, true);
      win.removeEventListener("resize", onScrollOrResize);
      overlay.remove();
      root.remove();
    },
  };
}
