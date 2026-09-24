/**
 * The field panel: what the author edits once a node is selected on the canvas.
 *
 * It is deliberately the only form in the app. The canvas shows the report as it
 * will be exported — the real renderer's output — and this panel holds the
 * controls for whatever was clicked there, so there is exactly one place a value
 * can be changed and one place it is displayed.
 */

import type { NodePath, ValueShape } from "@airp/editor-core";
import type { SchemaVersion } from "@airp/protocol";
import { blockLabel } from "./block-catalog.js";
import type { FieldHost } from "./fields.js";
import { appendFields, renderFields } from "./fields.js";
import {
  type BlockEntry,
  blockAncestors,
  type DiagnosticEntry,
  type NodeSelection,
  readAt,
} from "./studio.js";
import { renderTableGrid, type TableGridActions } from "./table-grid.js";

export interface InspectorActions {
  /** Add a table column carrying a key nothing else uses. */
  addColumn(tablePath: NodePath, columnShape: ValueShape): void;
  /** Move the selected block inside its own array. */
  move(delta: number): void;
  /** Remove the selected block. */
  remove(): void;
  /** Select the block at this handle. */
  selectAtId(atId: string): void;
  /** Write a document-meta string field. */
  setMeta(key: string, text: string): void;
}

export interface InspectorContext {
  /** Every block in the document, for the ancestor chain of the selection. */
  blocks: readonly BlockEntry[];
  diagnostics: readonly DiagnosticEntry[];
  document: unknown;
  host: FieldHost;
  schemaVersion: SchemaVersion;
  selection?: NodeSelection;
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

function panelHead(title: string, hint?: string): HTMLElement {
  const head = element("div", "live-preview-head");
  const dot = element("span", "live-dot");
  dot.setAttribute("aria-hidden", "true");
  const text = element("span");
  text.textContent = title;
  head.append(dot, text);
  if (hint !== undefined) {
    const badge = element("span", "live-preview-hint");
    badge.textContent = hint;
    head.append(badge);
  }
  return head;
}

/** A labelled single-line control for a document-meta string. */
function metaField(
  label: string,
  value: unknown,
  onInput: (text: string) => void
): HTMLElement {
  const field = element("div", "easy-field");
  const head = element("div", "easy-field-head");
  const name = element("label", "field-label");
  name.textContent = label;
  head.append(name);
  const input = element("input", "inline-input");
  input.type = "text";
  input.value = typeof value === "string" ? value : "";
  input.addEventListener("input", () => onInput(input.value));
  field.append(head, input);
  return field;
}

function issueRow(
  entry: DiagnosticEntry,
  actions: InspectorActions
): HTMLElement {
  const row = element("button", "issue");
  row.type = "button";
  if (entry.atId !== undefined) {
    row.setAttribute("data-diagnostic-at-id", entry.atId);
  }
  const code = element("span", "issue-path");
  code.textContent = entry.code;
  const message = element("span");
  message.textContent = entry.message;
  row.append(code, message);
  if (entry.atId !== undefined) {
    row.addEventListener("click", () => actions.selectAtId(entry.atId ?? ""));
  }
  return row;
}

function issuesBlock(
  diagnostics: readonly DiagnosticEntry[],
  actions: InspectorActions
): HTMLElement {
  const wrapper = element(
    "div",
    diagnostics.length === 0 ? "issues ok" : "issues"
  );
  const head = element("div", "panel-title");
  const mark = element("span", "panel-title-mark");
  const text = element("span");
  text.textContent =
    diagnostics.length === 0 ? "校验通过" : `校验问题 ${diagnostics.length}`;
  head.append(mark, text);
  wrapper.append(head);
  if (diagnostics.length === 0) {
    return wrapper;
  }
  for (const entry of diagnostics) {
    wrapper.append(issueRow(entry, actions));
  }
  return wrapper;
}

/**
 * Where the selection sits in the block tree, outermost first. A block that
 * covers its whole parent can only be reached by clicking a descendant, so the
 * ancestors have to be reachable some other way; this is that way.
 */
function breadcrumb(
  context: InspectorContext,
  actions: InspectorActions
): HTMLElement {
  const selection = context.selection;
  const chain = blockAncestors(context.blocks, selection?.path ?? []);
  const row = element("div", "breadcrumb");
  for (const [index, block] of chain.entries()) {
    if (index > 0) {
      const separator = element("span", "breadcrumb-sep");
      separator.textContent = "›";
      row.append(separator);
    }
    const chip = element("button", "breadcrumb-chip");
    chip.type = "button";
    chip.textContent = blockLabel(block.type);
    const isCurrent = index === chain.length - 1;
    chip.classList.toggle("active", isCurrent);
    if (block.atId === undefined) {
      chip.disabled = true;
    } else {
      chip.setAttribute("data-ancestor-at-id", block.atId);
      chip.addEventListener("click", () =>
        actions.selectAtId(block.atId ?? "")
      );
    }
    row.append(chip);
  }
  // An item is not a block, so its own steps are shown but not clickable: the
  // handles the canvas reports are what selects them.
  for (const step of selection?.isBlock === false ? selection.trail : []) {
    const separator = element("span", "breadcrumb-sep");
    separator.textContent = "›";
    const chip = element("span", "breadcrumb-chip is-item");
    chip.textContent = step;
    row.append(separator, chip);
  }
  return row;
}

function blockHeader(
  selection: NodeSelection,
  actions: InspectorActions
): HTMLElement {
  const selected = selection.block;
  const wrapper = element("div");
  const row = element("div", "title-row");
  const pill = element("span", "type-pill");
  pill.textContent = blockLabel(selected.type);
  // The *selected* handle, which is an item's when an item is what was clicked.
  const nodeAtId = selection.atId ?? selected.atId;
  if (nodeAtId !== undefined) {
    wrapper.setAttribute("data-selected-at-id", nodeAtId);
  }
  const actionsRow = element("div", "actions");
  const up = element("button", "btn btn-ghost btn-icon");
  up.type = "button";
  up.title = "上移";
  up.setAttribute("aria-label", "上移");
  up.disabled = !(selection.isBlock && selected.inArray);
  up.append(icon("ri-arrow-up-line"));
  up.addEventListener("click", () => actions.move(-1));
  const down = element("button", "btn btn-ghost btn-icon");
  down.type = "button";
  down.title = "下移";
  down.setAttribute("aria-label", "下移");
  down.disabled = !(selection.isBlock && selected.inArray);
  down.append(icon("ri-arrow-down-line"));
  down.addEventListener("click", () => actions.move(1));
  const remove = element("button", "btn btn-ghost btn-icon btn-action-danger");
  remove.type = "button";
  remove.title = "删除这个块";
  remove.setAttribute("aria-label", "删除这个块");
  remove.disabled = !(selection.isBlock && selected.inArray);
  remove.append(icon("ri-delete-bin-line"));
  remove.addEventListener("click", () => actions.remove());
  actionsRow.append(up, down, remove);
  row.append(pill, actionsRow);
  wrapper.append(row);
  const atId = selection.atId ?? selected.atId;
  if (atId !== undefined) {
    const handle = element("div", "hint");
    handle.textContent = `句柄 ${atId}`;
    wrapper.append(handle);
  }
  return wrapper;
}

function icon(className: string): HTMLElement {
  const node = element("i", className);
  node.setAttribute("aria-hidden", "true");
  return node;
}

/** Draw the whole panel for the current selection. */
export function renderInspector(
  container: HTMLElement,
  context: InspectorContext,
  actions: InspectorActions
): void {
  container.replaceChildren();
  container.append(panelHead("字段", context.selection ? "已选中" : "文档"));

  const body = element("div", "inspector-body");
  body.append(issuesBlock(context.diagnostics, actions));

  const meta = element("div", "inspector-section");
  meta.append(
    metaField("标题", readMeta(context.document, "title"), (text) =>
      actions.setMeta("title", text)
    ),
    metaField("副标题", readMeta(context.document, "subtitle"), (text) =>
      actions.setMeta("subtitle", text)
    )
  );
  body.append(meta);

  const { selection } = context;
  if (selection === undefined) {
    const hint = element("p", "hint");
    hint.textContent = "在中间画布上点一个块，或从左侧积木块里添加一个。";
    body.append(hint);
  } else {
    const section = element("div", "inspector-section");
    section.append(
      breadcrumb(context, actions),
      blockHeader(selection, actions)
    );
    const fields = element("div");
    renderBlockFields(fields, context, selection, actions);
    section.append(fields);
    body.append(section);
  }

  container.append(body);
}

/** Column and row field names the grid owns instead of the generic walker. */
const GRID_KEYS = new Set(["columns", "rows"]);

/**
 * A table's `rows` are objects keyed by its `columns`, so the generic walker has
 * no fields to render for them; the grid takes over those two and everything
 * else on the block still goes through the schema.
 */
function renderBlockFields(
  container: HTMLElement,
  context: InspectorContext,
  selection: NodeSelection,
  actions: InspectorActions
): void {
  const specs = selection.fields;
  const selected = selection.block;
  if (!(selected.type === "table" && selection.isBlock)) {
    if (specs.length === 0) {
      const note = element("p", "hint");
      note.textContent = "这个节点没有可编辑的字段，改它所属的块即可。";
      container.append(note);
      return;
    }
    renderFields(container, specs, selection.path, context.host);
    return;
  }
  const rowsShape = specs.find((spec) => spec.key === "rows")?.shape;
  const columnShape = specs.find((spec) => spec.key === "columns")?.shape;
  const isArray = (
    shape: ValueShape | undefined
  ): shape is Extract<ValueShape, { kind: "array" }> => shape?.kind === "array";
  if (!(isArray(rowsShape) && isArray(columnShape))) {
    renderFields(container, specs, selected.path, context.host);
    return;
  }
  const asRecords = (value: unknown): Record<string, unknown>[] =>
    Array.isArray(value)
      ? value.filter(
          (item): item is Record<string, unknown> =>
            typeof item === "object" && item !== null
        )
      : [];
  const gridActions: TableGridActions = {
    addColumn: () => actions.addColumn(selected.path, columnShape.items),
    addRow: () =>
      context.host.addItem([...selected.path, "rows"], rowsShape.items),
    dropColumn: (index) =>
      context.host.dropItem([...selected.path, "columns"], index),
    dropRow: (index) =>
      context.host.dropItem([...selected.path, "rows"], index),
    setCell: (rowIndex, key, text) =>
      context.host.setText(
        [...selected.path, "rows", rowIndex, key],
        { kind: "markdown" },
        text
      ),
    setColumnLabel: (index, text) =>
      context.host.setText(
        [...selected.path, "columns", index, "label"],
        { kind: "plain" },
        text
      ),
  };
  // Keep the block's own field order: the grid stands where `columns` sits.
  for (const spec of specs) {
    if (!GRID_KEYS.has(spec.key)) {
      appendFields(container, [spec], selected.path, context.host);
      continue;
    }
    if (spec.key === "columns") {
      const label = element("div", "easy-field-head");
      const name = element("label", "field-label");
      name.textContent = "表格内容";
      const hint = element("span", "easy-tip");
      hint.textContent = "列名与单元格";
      label.append(name, hint);
      const wrapper = element("div");
      renderTableGrid(wrapper, {
        actions: gridActions,
        columns: asRecords(
          readAt(context.document, [...selected.path, "columns"])
        ),
        path: selected.path,
        rows: asRecords(readAt(context.document, [...selected.path, "rows"])),
      });
      const field = element("div", "easy-field");
      field.append(label, wrapper);
      container.append(field);
    }
  }
}

function readMeta(document_: unknown, key: string): unknown {
  const meta =
    typeof document_ === "object" && document_ !== null
      ? (document_ as { meta?: unknown }).meta
      : undefined;
  return typeof meta === "object" && meta !== null
    ? (meta as Record<string, unknown>)[key]
    : undefined;
}
