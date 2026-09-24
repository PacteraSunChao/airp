/**
 * Schema-derived form controls.
 *
 * One generic walker replaces the form the previous editor kept by hand for all
 * 46 block types: the shape says how a value is edited, `field-labels` says what
 * to call it, and this module builds the control. A block type added to the
 * schema therefore gains an editor without any host change.
 *
 * Every edit goes out through `FieldHost`, so this module never mutates a
 * document itself and needs no browser to be reasoned about.
 */

import type { NodePath, ValueShape } from "@airp/editor-core";
import { toJsonPointer } from "@airp/editor-core";
import { enumValueLabel, fieldLabel } from "./field-labels.js";
import { type FieldSpec, readAt } from "./studio.js";

/** What a control does when the author changes it. */
export interface FieldHost {
  /** Append a seeded item to the array at `arrayPath`. */
  addItem(arrayPath: NodePath, itemShape: ValueShape): void;
  /** The block whose fields are on screen, for label lookups. */
  blockType: string;
  document: unknown;
  /** Remove item `index` from the array at `arrayPath`. */
  dropItem(arrayPath: NodePath, index: number): void;
  /** Select the block at `path` on the canvas. */
  selectPath(path: NodePath): void;
  /** Write a scalar a control produced. */
  setText(path: NodePath, shape: ValueShape, text: string): void;
  /** Replace the value at `path` outright (raw-JSON fallback). */
  setValueAt(path: NodePath, value: unknown): void;
}

/** Longest enum value still worth showing as a chip instead of a select. */
const CHIP_VALUE_MAX = 14;

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
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
  if (value === undefined || value === null) {
    return "";
  }
  return typeof value === "object"
    ? JSON.stringify(value, null, 2)
    : String(value);
}

/**
 * Tag a control with the path it edits. The panel is repainted while the author
 * types (so validation stays live), and this is how the caret finds its way back
 * to the same control afterwards.
 */
function markPath<T extends HTMLElement>(node: T, path: NodePath): T {
  node.dataset.fieldPath = toJsonPointer(path);
  return node;
}

/** One labelled field: name (and whether it is optional) above the control. */
function fieldRow(
  label: string,
  control: HTMLElement,
  tip?: string
): HTMLElement {
  const row = element("div", "easy-field");
  const head = element("div", "easy-field-head");
  const name = element("label", "field-label");
  name.textContent = label;
  head.append(name);
  if (tip !== undefined) {
    const hint = element("span", "easy-tip");
    hint.textContent = tip;
    head.append(hint);
  }
  row.append(head, control);
  return row;
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

function chipRow(
  values: readonly string[],
  current: string,
  path: NodePath,
  labelOf: (value: string) => string,
  onPick: (value: string) => void
): HTMLElement {
  const row = element("div", "chip-row");
  row.setAttribute("role", "group");
  for (const value of values) {
    const chip = markPath(element("button", "chip"), path);
    chip.type = "button";
    chip.textContent = labelOf(value);
    if (value === current) {
      chip.classList.add("active");
    }
    chip.addEventListener("click", () => onPick(value));
    row.append(chip);
  }
  return row;
}

function textControl(
  shape: ValueShape,
  path: NodePath,
  host: FieldHost,
  current: unknown
): HTMLElement {
  if (shape.kind === "markdown") {
    const area = markPath(element("textarea", "inline-area easy-area"), path);
    area.value = textOf(current);
    area.placeholder = "在这里输入内容…";
    area.addEventListener("input", () => host.setText(path, shape, area.value));
    return area;
  }
  const input = markPath(element("input", "inline-input"), path);
  input.type = shape.kind === "number" ? "number" : "text";
  input.value = textOf(current);
  input.addEventListener("input", () => {
    // A half-typed number ("", "-") is not an edit yet: keep the document as it
    // is until the text parses, so typing a negative number does not clear it.
    if (
      shape.kind === "number" &&
      (input.value.trim().length === 0 || Number.isNaN(Number(input.value)))
    ) {
      return;
    }
    host.setText(path, shape, input.value);
  });
  return input;
}

function booleanControl(
  path: NodePath,
  host: FieldHost,
  current: unknown
): HTMLElement {
  const shape: ValueShape = { kind: "boolean" };
  return chipRow(
    ["true", "false"],
    current === true ? "true" : "false",
    path,
    (value) => (value === "true" ? "是" : "否"),
    (value) => host.setText(path, shape, value)
  );
}

function enumControl(
  shape: Extract<ValueShape, { kind: "enum" }>,
  path: NodePath,
  key: string,
  host: FieldHost,
  current: unknown
): HTMLElement {
  const label = (value: string): string =>
    enumValueLabel(host.blockType, key, value);
  const currentValue = typeof current === "string" ? current : "";
  if (shape.values.every((value) => value.length <= CHIP_VALUE_MAX)) {
    return chipRow(shape.values, currentValue, path, label, (value) =>
      host.setText(path, shape, value)
    );
  }
  const select = markPath(element("select", "inline-input"), path);
  for (const value of shape.values) {
    const option = element("option");
    option.value = value;
    option.textContent = label(value);
    option.selected = value === currentValue;
    select.append(option);
  }
  select.addEventListener("change", () =>
    host.setText(path, shape, select.value)
  );
  return select;
}

/** Raw JSON for a shape with no dedicated control; applied on blur. */
function jsonControl(
  path: NodePath,
  host: FieldHost,
  current: unknown
): HTMLElement {
  const wrapper = element("div");
  const area = markPath(element("textarea", "inline-area easy-area"), path);
  area.value = current === undefined ? "" : JSON.stringify(current, null, 2);
  const hint = element("span", "easy-tip");
  area.addEventListener("blur", () => {
    try {
      host.setValueAt(path, JSON.parse(area.value));
      hint.textContent = "";
    } catch {
      hint.textContent = "JSON 格式有误，未写入";
    }
  });
  wrapper.append(area, hint);
  return wrapper;
}

/** A block nested inside another one: reached by selecting it on the canvas. */
function nestedBlockControl(
  path: NodePath,
  host: FieldHost,
  current: unknown
): HTMLElement {
  const inner = asRecord(current);
  const type = typeof inner?.type === "string" ? inner.type : "";
  const wrapper = element("div", "hint");
  const text = element("span");
  text.textContent =
    type.length > 0 ? `此处是一个 ${type} 块` : "此处是一个嵌套块";
  const pick = element("button", "btn btn-ghost");
  pick.type = "button";
  pick.textContent = "在画布中选中";
  pick.addEventListener("click", () => host.selectPath(path));
  wrapper.append(text, pick);
  return wrapper;
}

function arrayControl(
  shape: Extract<ValueShape, { kind: "array" }>,
  path: NodePath,
  list: readonly unknown[],
  host: FieldHost
): HTMLElement {
  const wrapper = element("div");
  wrapper.setAttribute("data-array-path", toJsonPointer(path));
  for (const [index, item] of list.entries()) {
    const card = element("div", "item-card");
    card.setAttribute("data-array-item", String(index));
    const head = element("div", "item-row");
    const ordinal = element("span", "item-index");
    ordinal.textContent = `${index + 1}.`;
    const drop = removeButton("删除这一项", () => host.dropItem(path, index));
    drop.setAttribute("data-drop-item", "true");
    head.append(ordinal, drop);
    const body = element("div");
    renderInto(body, shape.items, [...path, index], host, item);
    card.append(head, body);
    wrapper.append(card);
  }
  const label = fieldLabel(host.blockType, String(path.at(-1) ?? ""));
  const add = element("button", "btn btn-soft");
  add.type = "button";
  add.setAttribute("data-add-item", "true");
  add.textContent = `＋ 添加${label}`;
  add.addEventListener("click", () => host.addItem(path, shape.items));
  wrapper.append(add);
  return wrapper;
}

/** Control for one value, appended to `container`. */
export function renderInto(
  container: HTMLElement,
  shape: ValueShape,
  path: NodePath,
  host: FieldHost,
  current?: unknown
): void {
  const value = current === undefined ? readAt(host.document, path) : current;
  const key = String(path.at(-1) ?? "");

  switch (shape.kind) {
    case "boolean":
      container.append(booleanControl(path, host, value));
      return;
    case "enum":
      container.append(enumControl(shape, path, key, host, value));
      return;
    case "block":
      container.append(nestedBlockControl(path, host, value));
      return;
    case "unknown":
      container.append(jsonControl(path, host, value));
      return;
    case "array":
      container.append(
        arrayControl(shape, path, Array.isArray(value) ? value : [], host)
      );
      return;
    case "object":
      if (shape.fields.length === 0) {
        container.append(jsonControl(path, host, value));
        return;
      }
      for (const field of shape.fields) {
        renderField(container, field, [...path, field.key], host);
      }
      return;
    default:
      container.append(textControl(shape, path, host, value));
  }
}

function renderField(
  container: HTMLElement,
  field: FieldSpec,
  path: NodePath,
  host: FieldHost
): void {
  const body = element("div");
  renderInto(body, field.shape, path, host);
  container.append(
    fieldRow(
      fieldLabel(host.blockType, field.key),
      body,
      field.required ? undefined : "可选"
    )
  );
}

/**
 * Add the fields to whatever is already in `container`, in schema order.
 *
 * A host that interleaves its own markup between fields needs this: it cannot
 * call `renderFields` once per field, because that clears the container first.
 */
export function appendFields(
  container: HTMLElement,
  fields: readonly FieldSpec[],
  path: NodePath,
  host: FieldHost
): void {
  for (const field of fields) {
    renderField(container, field, [...path, field.key], host);
  }
}

/** Every declared field of a node, in schema order, replacing the container. */
export function renderFields(
  container: HTMLElement,
  fields: readonly FieldSpec[],
  path: NodePath,
  host: FieldHost
): void {
  container.replaceChildren();
  if (fields.length === 0) {
    const empty = element("p", "hint");
    empty.textContent = "这个块没有可编辑的字段。";
    container.append(empty);
    return;
  }
  appendFields(container, fields, path, host);
}
