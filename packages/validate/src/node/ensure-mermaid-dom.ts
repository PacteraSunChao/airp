import { JSDOM } from "jsdom";

let shimmed = false;

interface SvgBBox {
  height: number;
  width: number;
  x: number;
  y: number;
}

interface DomRectLike {
  bottom: number;
  height: number;
  left: number;
  right: number;
  top: number;
  width: number;
  x: number;
  y: number;
}

interface SvgMeasurable extends Element {
  getBBox?: () => SvgBBox;
}

const CJK_OR_FULLWIDTH =
  /[\u1100-\u115F\u2E80-\uA4CF\uAC00-\uD7A3\uF900-\uFAFF\uFE10-\uFE6F\uFF00-\uFF60\uFFE0-\uFFE6]/;
const TRANSLATE_RE = /translate\(\s*(-?\d*\.?\d+)(?:[,\s]+(-?\d*\.?\d+))?/;
const PATH_ML_COORDS_RE = /[ML]\s*(-?\d*\.?\d+)[,\s]+(-?\d*\.?\d+)/gi;

const BLOCK_LAYOUT_TAGS = new Set([
  "blockquote",
  "div",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "li",
  "p",
  "pre",
  "tr",
]);

/** Rough CSS-px width for Mermaid htmlLabels (jsdom has no text metrics). */
function estimateTextWidth(text: string): number {
  let width = 0;
  for (const char of text) {
    // Arial/~16px: CJK ≈1em; Latin averages ~0.6em (caps/m wider than 0.5em).
    width += CJK_OR_FULLWIDTH.test(char) ? 16 : 10;
  }
  return Math.ceil(width);
}

/**
 * Split htmlLabels into visual lines.
 * `<br>` is not a `\n` in `textContent`, so treat BR / block tags as breaks.
 */
function collectHtmlLines(root: Element): string[] {
  const lines: string[] = [];
  let current = "";

  const flush = (): void => {
    const trimmed = current.replace(/\s+/g, " ").trim();
    if (trimmed.length > 0) {
      lines.push(trimmed);
    }
    current = "";
  };

  const walk = (node: Node): void => {
    if (node.nodeType === 3) {
      current += node.textContent ?? "";
      return;
    }
    if (node.nodeType !== 1) {
      return;
    }
    const element = node as Element;
    const tag = element.tagName.toLowerCase();
    if (tag === "br") {
      flush();
      return;
    }
    if (BLOCK_LAYOUT_TAGS.has(tag) && element !== root) {
      flush();
      for (const child of element.childNodes) {
        walk(child);
      }
      flush();
      return;
    }
    for (const child of element.childNodes) {
      walk(child);
    }
  };

  walk(root);
  flush();
  return lines;
}

function estimateHtmlBox(el: Element): DomRectLike {
  const lines = collectHtmlLines(el);
  const nonempty = lines.filter((line) => line.length > 0);
  const width =
    nonempty.length === 0
      ? 0
      : Math.max(24, ...nonempty.map((line) => estimateTextWidth(line))) + 4;
  // Mermaid htmlLabels set `line-height: 1.5` (~16px font → 24px/line).
  const lineCount = nonempty.length;
  const height = lineCount * 24;
  return {
    x: 0,
    y: 0,
    width,
    height,
    top: 0,
    left: 0,
    bottom: height,
    right: width,
  };
}

function readNumberAttr(el: Element, name: string, fallback = 0): number {
  const raw = el.getAttribute(name);
  if (raw == null || raw === "") {
    return fallback;
  }
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

function parseTranslate(transform: string): { tx: number; ty: number } {
  const match = TRANSLATE_RE.exec(transform);
  if (!match) {
    return { tx: 0, ty: 0 };
  }
  return {
    tx: Number(match[1]),
    ty: match[2] == null ? 0 : Number(match[2]),
  };
}

function bboxFromPath(d: string): SvgBBox | undefined {
  const coords = [...d.matchAll(PATH_ML_COORDS_RE)].map(
    (match) => [Number(match[1]), Number(match[2])] as const
  );
  if (coords.length === 0) {
    return undefined;
  }
  const xs = coords.map(([x]) => x);
  const ys = coords.map(([, y]) => y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return {
    x: minX,
    y: minY,
    width: Math.max(maxX - minX, 1),
    height: Math.max(maxY - minY, 1),
  };
}

function shapeBBox(el: Element): SvgBBox | undefined {
  const tag = el.tagName.toLowerCase();
  if (tag === "text" || tag === "tspan") {
    const text = el.textContent ?? "";
    return {
      x: 0,
      y: -14,
      width: Math.max(estimateTextWidth(text), 20),
      height: 18,
    };
  }
  if (tag === "rect") {
    return {
      x: readNumberAttr(el, "x"),
      y: readNumberAttr(el, "y"),
      width: Math.max(readNumberAttr(el, "width"), 1),
      height: Math.max(readNumberAttr(el, "height"), 1),
    };
  }
  if (tag === "circle") {
    const cx = readNumberAttr(el, "cx");
    const cy = readNumberAttr(el, "cy");
    const r = Math.max(readNumberAttr(el, "r", 5), 1);
    return { x: cx - r, y: cy - r, width: r * 2, height: r * 2 };
  }
  if (tag === "ellipse") {
    const cx = readNumberAttr(el, "cx");
    const cy = readNumberAttr(el, "cy");
    const rx = Math.max(readNumberAttr(el, "rx", 5), 1);
    const ry = Math.max(readNumberAttr(el, "ry", 5), 1);
    return { x: cx - rx, y: cy - ry, width: rx * 2, height: ry * 2 };
  }
  if (tag === "line") {
    const x1 = readNumberAttr(el, "x1");
    const y1 = readNumberAttr(el, "y1");
    const x2 = readNumberAttr(el, "x2");
    const y2 = readNumberAttr(el, "y2");
    return {
      x: Math.min(x1, x2),
      y: Math.min(y1, y2),
      width: Math.max(Math.abs(x2 - x1), 1),
      height: Math.max(Math.abs(y2 - y1), 1),
    };
  }
  if (tag === "path") {
    return bboxFromPath(el.getAttribute("d") ?? "");
  }
  if (tag === "foreignobject") {
    return {
      x: readNumberAttr(el, "x"),
      y: readNumberAttr(el, "y"),
      width: Math.max(readNumberAttr(el, "width"), 1),
      height: Math.max(readNumberAttr(el, "height"), 1),
    };
  }
  return undefined;
}

function unionChildBBoxes(el: Element): SvgBBox | undefined {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  let any = false;

  for (const child of el.children) {
    const measurable = child as SvgMeasurable;
    if (typeof measurable.getBBox !== "function") {
      continue;
    }
    try {
      const raw = measurable.getBBox();
      if (!(raw.width || raw.height)) {
        continue;
      }
      const { tx, ty } = parseTranslate(child.getAttribute("transform") ?? "");
      any = true;
      minX = Math.min(minX, raw.x + tx);
      minY = Math.min(minY, raw.y + ty);
      maxX = Math.max(maxX, raw.x + raw.width + tx);
      maxY = Math.max(maxY, raw.y + raw.height + ty);
    } catch {
      // Ignore elements jsdom cannot measure.
    }
  }

  if (!any) {
    return undefined;
  }
  return {
    x: minX,
    y: minY,
    width: Math.max(maxX - minX, 1),
    height: Math.max(maxY - minY, 1),
  };
}

function installSvgLayoutStubs(svgElement: typeof SVGElement): void {
  const proto = svgElement.prototype as SVGElement & {
    getBBox?: () => SvgBBox;
    getComputedTextLength?: () => number;
  };

  proto.getBBox = function getBBox(this: SVGElement): SvgBBox {
    return (
      shapeBBox(this) ??
      unionChildBBoxes(this) ?? { x: 0, y: 0, width: 10, height: 10 }
    );
  };

  proto.getComputedTextLength = function getComputedTextLength(
    this: SVGElement
  ): number {
    return Math.max(estimateTextWidth(this.textContent ?? ""), 10);
  };
}

function installHtmlLayoutStubs(htmlElement: typeof HTMLElement): void {
  const proto = htmlElement.prototype;

  proto.getBoundingClientRect = function getBoundingClientRect(
    this: HTMLElement
  ): DOMRect {
    const box = estimateHtmlBox(this);
    return {
      ...box,
      toJSON() {
        return box;
      },
    } as DOMRect;
  };

  for (const prop of ["offsetWidth", "clientWidth", "scrollWidth"] as const) {
    Object.defineProperty(proto, prop, {
      configurable: true,
      get(this: HTMLElement) {
        return estimateHtmlBox(this).width;
      },
    });
  }
  for (const prop of [
    "offsetHeight",
    "clientHeight",
    "scrollHeight",
  ] as const) {
    Object.defineProperty(proto, prop, {
      configurable: true,
      get(this: HTMLElement) {
        return estimateHtmlBox(this).height;
      },
    });
  }
}

/**
 * Install a minimal DOM so Mermaid can parse/render in Node.
 * Must run before the first `import("mermaid")` so DOMPurify binds to `window`.
 * Safe to call repeatedly; only the first call installs globals.
 */
export function ensureMermaidDom(): void {
  if (shimmed) {
    return;
  }

  const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
    url: "https://airp.local/",
    pretendToBeVisual: true,
  });

  const { window } = dom;

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: window,
  });
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: window.document,
  });
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: window.navigator,
  });
  Object.defineProperty(globalThis, "DOMParser", {
    configurable: true,
    value: window.DOMParser,
  });
  Object.defineProperty(globalThis, "HTMLElement", {
    configurable: true,
    value: window.HTMLElement,
  });
  Object.defineProperty(globalThis, "SVGElement", {
    configurable: true,
    value: window.SVGElement,
  });
  Object.defineProperty(globalThis, "Node", {
    configurable: true,
    value: window.Node,
  });

  installSvgLayoutStubs(window.SVGElement);
  installHtmlLayoutStubs(window.HTMLElement);
  shimmed = true;
}
