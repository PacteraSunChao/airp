/**
 * The block library: every type the schema declares, grouped and named in
 * Chinese, with a one-line description of when to reach for it.
 *
 * The type list comes from `listBlockTypes` (the schema is the source of truth);
 * `block-catalog` only supplies how each one reads. Anything the schema has and
 * the catalog does not still shows up, under its raw type.
 */

import {
  BLOCK_CATALOG,
  type BlockCatalogCategory,
  type BlockCatalogItem,
  FREQUENT_BLOCKS,
} from "./block-catalog.js";

/** Data-transfer type carrying the block type being dragged onto the canvas. */
export const PALETTE_DRAG_TYPE = "application/x-airp-block-type";

export interface PaletteOptions {
  /** Types the schema actually declares; anything else is not offered. */
  availableTypes: readonly string[];
  /** Add a block of this type (position is the canvas's business). */
  onPick(type: string): void;
}

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

function matches(item: BlockCatalogItem, query: string): boolean {
  if (query.length === 0) {
    return true;
  }
  return (
    item.type.toLowerCase().includes(query) ||
    item.label.toLowerCase().includes(query) ||
    item.desc.toLowerCase().includes(query)
  );
}

function componentRow(
  item: BlockCatalogItem,
  onPick: (t: string) => void
): HTMLElement {
  const row = element("div", "comp");
  row.draggable = true;
  row.title = "拖到画布上的位置，或点击添加";
  const icon = element("div", "icon");
  const glyph = element("i", item.icon);
  glyph.setAttribute("aria-hidden", "true");
  icon.append(glyph);
  const text = element("div", "comp-text");
  const name = element("div", "name");
  name.textContent = item.label;
  const desc = element("div", "desc");
  desc.textContent = item.desc;
  text.append(name, desc);
  row.append(icon, text);

  row.addEventListener("dragstart", (event) => {
    (event as DragEvent).dataTransfer?.setData(PALETTE_DRAG_TYPE, item.type);
    row.classList.add("comp-dragging");
  });
  row.addEventListener("dragend", () => row.classList.remove("comp-dragging"));
  row.addEventListener("click", () => onPick(item.type));
  return row;
}

function categoryBody(
  items: readonly BlockCatalogItem[],
  onPick: (t: string) => void
): HTMLElement {
  const body = element("div", "cat-body");
  for (const item of items) {
    body.append(componentRow(item, onPick));
  }
  return body;
}

/** Frequent types, pinned at the top and never collapsible. */
function frequentSection(
  items: readonly BlockCatalogItem[],
  onPick: (t: string) => void
): HTMLElement {
  const section = element("section", "cat-section cat-frequent");
  const head = element("div", "cat-head cat-head-fixed");
  const name = element("span", "cat-name");
  name.textContent = "常用";
  const badge = element("span", "cat-badge");
  badge.textContent = "常驻";
  head.append(name, badge);
  section.append(head, categoryBody(items, onPick));
  return section;
}

function collapsibleSection(
  category: BlockCatalogCategory,
  items: readonly BlockCatalogItem[],
  onPick: (t: string) => void
): HTMLElement {
  const section = element("section", "cat-section");
  const open = element("button", "cat-head");
  open.type = "button";
  const chevron = element("span", "cat-chevron");
  chevron.setAttribute("aria-hidden", "true");
  chevron.textContent = "▸";
  const name = element("span", "cat-name");
  name.textContent = category.category;
  const count = element("span", "cat-count");
  count.textContent = String(items.length);
  open.append(chevron, name, count);
  const collapse = element("div", "cat-collapse");
  collapse.append(categoryBody(items, onPick));
  open.setAttribute("aria-expanded", "false");
  open.addEventListener("click", () => {
    const expanded = open.getAttribute("aria-expanded") === "true";
    open.setAttribute("aria-expanded", String(!expanded));
    open.classList.toggle("open", !expanded);
    chevron.classList.toggle("open", !expanded);
    collapse.classList.toggle("open", !expanded);
  });
  section.append(open, collapse);
  return section;
}

/**
 * Draw the whole library, then filter it in place as the author types. A query
 * opens every group, because a collapsed hit is a result nobody can see.
 */
export function renderPalette(
  container: HTMLElement,
  options: PaletteOptions
): void {
  const available = new Set(options.availableTypes);
  const known = (item: BlockCatalogItem): boolean => available.has(item.type);
  const onPick = options.onPick;

  container.replaceChildren();
  const title = element("div", "panel-title");
  const mark = element("span", "panel-title-mark");
  const titleText = element("span");
  titleText.textContent = "积木块";
  title.append(mark, titleText);

  const search = element("div", "palette-search");
  const input = element("input");
  input.type = "search";
  input.placeholder = "搜索积木块…";
  input.setAttribute("aria-label", "搜索积木块");
  search.append(input);

  const frequent = frequentSection(FREQUENT_BLOCKS.filter(known), onPick);
  // A type may appear in more than one group (`paragraph` is both frequent and
  // prose): the groups are a taxonomy, not a lookup table, so nothing is deduped.
  const groups = BLOCK_CATALOG.map((category) => ({
    category,
    items: category.items.filter(known),
  })).filter((group) => group.items.length > 0);

  const groupNodes = groups.map((group) =>
    collapsibleSection(group.category, group.items, onPick)
  );
  container.append(title, search, frequent, ...groupNodes);

  const applyFilter = (): void => {
    const query = input.value.trim().toLowerCase();
    const searching = query.length > 0;
    const rows = container.querySelectorAll<HTMLElement>(".comp");
    const items = [
      ...FREQUENT_BLOCKS,
      ...BLOCK_CATALOG.flatMap((category) => category.items),
    ];
    let index = 0;
    for (const row of rows) {
      const item = items[index];
      index += 1;
      if (item === undefined) {
        continue;
      }
      row.hidden = searching && !matches(item, query);
    }
    for (const section of container.querySelectorAll<HTMLElement>(
      ".cat-section"
    )) {
      const visible = [...section.querySelectorAll<HTMLElement>(".comp")].some(
        (row) => !row.hidden
      );
      section.hidden = !visible;
    }
    for (const head of container.querySelectorAll<HTMLElement>(".cat-head")) {
      head.classList.toggle("open", searching);
    }
    for (const collapse of container.querySelectorAll<HTMLElement>(
      ".cat-collapse"
    )) {
      collapse.classList.toggle("open", searching);
    }
    for (const chevron of container.querySelectorAll<HTMLElement>(
      ".cat-chevron"
    )) {
      chevron.classList.toggle("open", searching);
    }
  };
  input.addEventListener("input", applyFilter);
}
