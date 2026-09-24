// @vitest-environment jsdom
/**
 * The table grid: the one block-specific builder, because `table.rows` is an
 * open object keyed by the table's own columns.
 */

import { JSDOM } from "jsdom";
import { beforeEach, describe, expect, it } from "vitest";
import { renderTableGrid, type TableGridActions } from "../src/table-grid.js";

interface Recorded {
  calls: string[];
}

function actions(recorded: Recorded): TableGridActions {
  const note = (call: string) => (): void => {
    recorded.calls.push(call);
  };
  return {
    addColumn: note("addColumn"),
    addRow: note("addRow"),
    dropColumn: (index) => recorded.calls.push(`dropColumn:${index}`),
    dropRow: (index) => recorded.calls.push(`dropRow:${index}`),
    setCell: (row, key, text) =>
      recorded.calls.push(`setCell:${row}:${key}:${text}`),
    setColumnLabel: (index, text) =>
      recorded.calls.push(`setColumnLabel:${index}:${text}`),
  };
}

function draw(
  columns: Record<string, unknown>[],
  rows: Record<string, unknown>[]
) {
  const dom = new JSDOM("<!doctype html><body><div id='root'></div></body>");
  const recorded: Recorded = { calls: [] };
  const root = dom.window.document.querySelector<HTMLElement>("#root");
  if (root === null) {
    throw new Error("no root");
  }
  renderTableGrid(root, {
    actions: actions(recorded),
    columns,
    path: ["blocks", 2],
    rows,
  });
  return { dom, recorded, root };
}

describe("table grid", () => {
  let columns: Record<string, unknown>[];
  let rows: Record<string, unknown>[];

  beforeEach(() => {
    columns = [
      { "@id": "cccccccccc", key: "name", label: "Name" },
      { "@id": "dddddddddd", key: "value", label: "Value" },
    ];
    rows = [
      { "@id": "eeeeeeeeee", name: "alpha", value: "1" },
      { "@id": "ffffffffff", name: "beta", value: "2" },
    ];
  });

  it("gives every cell a full document path", () => {
    const { root } = draw(columns, rows);
    const paths = [...root.querySelectorAll("[data-field-path]")].map((node) =>
      node.getAttribute("data-field-path")
    );

    expect(paths).toContain("/blocks/2/columns/0/label");
    expect(paths).toContain("/blocks/2/rows/1/value");
  });

  it("shows one row per row and one input per column", () => {
    const { root } = draw(columns, rows);
    expect(root.querySelectorAll("[data-table-row]")).toHaveLength(2);
    expect(root.querySelectorAll("[data-table-row='1'] input")).toHaveLength(2);
    expect(
      root.querySelector<HTMLInputElement>("[data-table-row='0'] input")?.value
    ).toBe("alpha");
  });

  it("reports an edit against the column key, not the position", () => {
    const { dom, recorded, root } = draw(columns, rows);
    const cell = root.querySelector<HTMLInputElement>(
      "[data-table-row='1'] input"
    );
    if (cell === null) {
      throw new Error("no cell");
    }
    cell.value = "beta-2";
    cell.dispatchEvent(new dom.window.Event("input"));

    expect(recorded.calls).toEqual(["setCell:1:name:beta-2"]);
  });

  it("keeps rows readable when a column has no key yet", () => {
    const { root } = draw([{ "@id": "cccccccccc", label: "Only" }], rows);
    // The key is what cells are stored under, and it is shown, never guessed.
    const key = root.querySelector(".table-key");
    expect(key?.textContent).toBe("");
    expect(root.querySelectorAll("[data-table-row='0'] input")).toHaveLength(1);
  });

  it("says what to do when there are no columns yet", () => {
    const { root } = draw([], []);
    expect(root.textContent).toContain("表格还没有列");
    expect(root.querySelector("[data-add-column]")).not.toBeNull();
  });
});
