/**
 * The table grid.
 *
 * `table.rows` is the one place the schema deliberately leaves a shape open: a
 * row is an object whose keys are the table's *columns*, so a shape-derived form
 * has no field list to render and would fall back to raw JSON. This module is
 * the grid that replaces it, and it is the only block-specific builder in the
 * app — everything else is generic.
 *
 * It reads values and reports intent, so it needs no document and no browser to
 * be reasoned about: the caller supplies the columns/rows it already read and
 * the actions that write back.
 */

import type { NodePath } from "@airp/editor-core";
import { toJsonPointer } from "@airp/editor-core";

export interface TableGridActions {
  /** Append a column, with a key no other column uses. */
  addColumn(): void;
  /** Append a row. */
  addRow(): void;
  dropColumn(index: number): void;
  dropRow(index: number): void;
  /** Write one cell of the row at `rowIndex`, under `key`. */
  setCell(rowIndex: number, key: string, text: string): void;
  /** Write the header label of the column at `index`. */
  setColumnLabel(index: number, text: string): void;
}

export interface TableGridContext {
  actions: TableGridActions;
  columns: readonly Record<string, unknown>[];
  path: NodePath;
  rows: readonly Record<string, unknown>[];
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

function textOf(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/**
 * One column per track plus a trailing track for the row's own remove button.
 * The header and every row must use the same template or the columns stop
 * lining up.
 */
function rowTemplate(columnCount: number): string {
  return `repeat(${Math.max(columnCount, 1)}, minmax(0, 1fr)) auto`;
}

function columnKey(column: Record<string, unknown>): string {
  return textOf(column.key);
}

function removeButton(label: string, onClick: () => void): HTMLElement {
  const button = element("button", "btn-remove");
  button.type = "button";
  button.title = label;
  button.setAttribute("aria-label", label);
  const icon = element("i", "ri-delete-bin-line");
  icon.setAttribute("aria-hidden", "true");
  button.append(icon);
  button.addEventListener("click", onClick);
  return button;
}

/** Header cell: the authored label, with the machine key shown beside it. */
function headerCell(
  column: Record<string, unknown>,
  index: number,
  path: NodePath,
  actions: TableGridActions
): HTMLElement {
  const cell = element("div", "table-head-cell");
  const input = element("input", "inline-input");
  input.type = "text";
  input.value = textOf(column.label);
  input.placeholder = `列 ${index + 1}`;
  input.setAttribute(
    "data-field-path",
    toJsonPointer([...path, "columns", index, "label"])
  );
  input.addEventListener("input", () =>
    actions.setColumnLabel(index, input.value)
  );
  const key = element("span", "table-key");
  key.textContent = columnKey(column);
  key.setAttribute("data-column-key", columnKey(column));
  key.title = "列的机器名（单元格按它取值）";
  const drop = removeButton("删除这一列", () => actions.dropColumn(index));
  drop.setAttribute("data-drop-column", String(index));
  cell.append(input, key, drop);
  return cell;
}

function rowNode(
  row: Record<string, unknown>,
  rowIndex: number,
  columns: readonly Record<string, unknown>[],
  context: TableGridContext
): HTMLElement {
  const node = element("div", "table-easy-row");
  node.setAttribute("data-table-row", String(rowIndex));
  node.style.gridTemplateColumns = rowTemplate(columns.length);
  for (const column of columns) {
    const key = columnKey(column);
    const input = element("input", "inline-input");
    input.type = "text";
    input.value = textOf(row[key]);
    input.placeholder = "单元格";
    input.setAttribute(
      "data-field-path",
      toJsonPointer([...context.path, "rows", rowIndex, key])
    );
    input.addEventListener("input", () =>
      context.actions.setCell(rowIndex, key, input.value)
    );
    node.append(input);
  }
  const drop = removeButton("删除这一行", () =>
    context.actions.dropRow(rowIndex)
  );
  drop.setAttribute("data-drop-row", String(rowIndex));
  node.append(drop);
  return node;
}

function footButton(
  label: string,
  attribute: string,
  onClick: () => void
): HTMLElement {
  const button = element("button", "btn btn-soft");
  button.type = "button";
  button.setAttribute(attribute, "true");
  button.textContent = label;
  button.addEventListener("click", onClick);
  return button;
}

/** Draw the whole table: header, rows, and the two "add" buttons. */
export function renderTableGrid(
  container: HTMLElement,
  context: TableGridContext
): void {
  const grid = element("div", "table-easy");
  grid.setAttribute("data-table-grid", toJsonPointer(context.path));

  const head = element("div", "table-easy-row head");
  head.style.gridTemplateColumns = rowTemplate(context.columns.length);
  for (const [index, column] of context.columns.entries()) {
    head.append(headerCell(column, index, context.path, context.actions));
  }
  head.append(element("span"));
  grid.append(head);

  for (const [index, row] of context.rows.entries()) {
    grid.append(rowNode(row, index, context.columns, context));
  }

  if (context.columns.length === 0) {
    const empty = element("p", "hint");
    empty.textContent = "表格还没有列：先加一列，再填单元格。";
    grid.append(empty);
  }

  const foot = element("div", "table-easy-foot");
  foot.append(
    footButton("＋ 添加行", "data-add-row", () => context.actions.addRow()),
    footButton("＋ 添加列", "data-add-column", () =>
      context.actions.addColumn()
    )
  );
  grid.append(foot);
  container.append(grid);
}
