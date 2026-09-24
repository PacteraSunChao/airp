/**
 * Studio shell: open a document, edit it field by field or block by block, and
 * keep a rendered preview beside it.
 *
 * The form is rendered **recursively from the schema**: scalars get a control,
 * objects a field set, and arrays an item list with add/remove — so structured
 * content (table columns, checklist entries) is editable without a hand-written
 * form per block type. Everything schema-shaped lives in `studio.ts`.
 */

import type { NodePath, ValueShape } from "@airp/editor-core";
import { listBlockTypes, toJsonPointer } from "@airp/editor-core";
import { loadDocumentJson } from "@airp/loader";
import { hasSchemaVersion, type SchemaVersion } from "@airp/protocol";
import { type AirpDocumentSnapshot, renderDocument } from "@airp/renderer";
import { validateDocument } from "@airp/validate";
import {
  canWriteBack,
  downloadDocument,
  type FileHandleLike,
  openWithPicker,
  pickSaveHandle,
  writeDocument,
} from "./file-access.js";
import {
  canMove,
  insertBlockAfter,
  moveBlock,
  removeBlock,
} from "./structure.js";
import {
  appendArrayItem,
  type BlockEntry,
  blockFieldSpecs,
  type DiagnosticEntry,
  diagnosticEntries,
  documentText,
  dropArrayItem,
  isScalarShape,
  listBlocks,
  readAt,
  setScalarText,
} from "./studio.js";

const PREVIEW_DEBOUNCE_MS = 150;

interface StudioState {
  blocks: BlockEntry[];
  diagnostics: DiagnosticEntry[];
  document: unknown;
  fileName: string;
  /** Present once the author picked a file to write back to. */
  handle?: FileHandleLike;
  schemaVersion: SchemaVersion;
  selected?: BlockEntry;
  valid: boolean;
}

function element<T extends HTMLElement>(id: string): T {
  const found = document.querySelector<T>(`#${id}`);
  if (found === null) {
    throw new Error(`Missing element: #${id}`);
  }
  return found;
}

const addBlockButton = element<HTMLButtonElement>("add-block");
const addTypeSelect = element<HTMLSelectElement>("add-type");
const blocksList = element<HTMLUListElement>("blocks");
const diagnosticsList = element<HTMLUListElement>("diagnostics");
const fileInput = element<HTMLInputElement>("file");
const form = element<HTMLDivElement>("form");
const openButton = element<HTMLButtonElement>("open");
const preview = element<HTMLIFrameElement>("preview");
const saveAsButton = element<HTMLButtonElement>("save-as");
const saveButton = element<HTMLButtonElement>("save");
const status = element<HTMLSpanElement>("status");

let state: StudioState | undefined;
let previewTimer: ReturnType<typeof setTimeout> | undefined;

function setStatus(message: string): void {
  status.textContent = message;
}

/** Run a task and surface a failure in the status line instead of dropping it. */
function run(task: Promise<unknown>): void {
  task.catch((error: unknown) => {
    setStatus(error instanceof Error ? error.message : String(error));
  });
}

function paragraph(text: string): HTMLParagraphElement {
  const element = document.createElement("p");
  element.textContent = text;
  return element;
}

function button(label: string, attribute: string): HTMLButtonElement {
  const element = document.createElement("button");
  element.type = "button";
  element.textContent = label;
  element.setAttribute(attribute, "true");
  return element;
}

function applyDocument(next: unknown, selectAtId?: string): void {
  if (state === undefined) {
    return;
  }
  const keepAtId = selectAtId ?? state.selected?.atId;
  state.document = next;
  state.blocks = listBlocks(next, state.schemaVersion);
  state.selected = state.blocks.find((block) => block.atId === keepAtId);
  run(refresh());
}

/**
 * Apply a form edit without re-rendering the form: replacing the control the
 * author is typing into would take the caret with it.
 */
function applyQuietly(next: unknown): void {
  if (state === undefined) {
    return;
  }
  state.document = next;
  state.blocks = listBlocks(next, state.schemaVersion);
  paintBlocks();
  scheduleRefresh();
}

function blockAction(
  entry: BlockEntry,
  change: (document: unknown, path: BlockEntry["path"]) => unknown
): void {
  if (state === undefined) {
    return;
  }
  try {
    applyDocument(change(state.document, entry.path));
  } catch (error) {
    setStatus(error instanceof Error ? error.message : String(error));
  }
}

function paintBlocks(): void {
  blocksList.replaceChildren();
  for (const block of state?.blocks ?? []) {
    const item = document.createElement("li");
    const button_ = document.createElement("button");
    const selected = state?.selected?.path.join(".") === block.path.join(".");
    button_.type = "button";
    button_.textContent = block.label;
    button_.setAttribute("aria-current", String(selected));
    if (block.atId !== undefined) {
      button_.dataset.blockAtId = block.atId;
    }
    button_.addEventListener("click", () => {
      if (state !== undefined) {
        state.selected = block;
        paintBlocks();
        paintForm();
        paintSelection();
      }
    });

    const meta = document.createElement("small");
    const suffix = block.inArray ? "" : " · 嵌套块";
    meta.textContent =
      block.atId === undefined
        ? `${block.type}${suffix}`
        : `${block.type} · ${block.atId}${suffix}`;

    item.append(button_, meta);

    // A block that is not an array item has no siblings to reorder and no slot to
    // insert into; its row only selects it, so the form can edit it.
    if (block.inArray) {
      const actions = document.createElement("span");
      actions.className = "row-actions";

      const up = button("↑", "data-move-up");
      up.disabled =
        state === undefined || !canMove(state.document, block.path, -1);
      up.addEventListener("click", () => {
        blockAction(block, (document_, path) => moveBlock(document_, path, -1));
      });

      const down = button("↓", "data-move-down");
      down.disabled =
        state === undefined || !canMove(state.document, block.path, 1);
      down.addEventListener("click", () => {
        blockAction(block, (document_, path) => moveBlock(document_, path, 1));
      });

      const remove = button("✕", "data-remove");
      remove.addEventListener("click", () => {
        blockAction(block, (document_, path) => removeBlock(document_, path));
      });

      actions.append(up, down, remove);
      item.append(actions);
    }

    blocksList.append(item);
  }
}

/**
 * Reflect the current selection in the controls that depend on it. A block that
 * is not an array item cannot be inserted after, so adding has nowhere to go.
 */
function paintSelection(): void {
  addBlockButton.disabled =
    state?.selected === undefined || !state.selected.inArray;
}

function textOf(value: unknown): string {
  if (value === undefined || value === null) {
    return "";
  }
  return typeof value === "object" ? JSON.stringify(value) : String(value);
}

function controlFor(
  path: NodePath,
  shape: ValueShape
): HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement {
  const name = String(path.at(-1));
  const value = textOf(readAt(state?.document, path));

  if (shape.kind === "enum") {
    const select = document.createElement("select");
    select.dataset.fieldKey = name;
    select.dataset.fieldPath = toJsonPointer(path);
    for (const option of shape.values) {
      const element_ = document.createElement("option");
      element_.value = option;
      element_.textContent = option;
      element_.selected = option === value;
      select.append(element_);
    }
    return select;
  }

  if (shape.kind === "markdown" || shape.kind === "stringOrNumber") {
    const textarea = document.createElement("textarea");
    textarea.dataset.fieldKey = name;
    textarea.dataset.fieldPath = toJsonPointer(path);
    textarea.value = value;
    return textarea;
  }

  const field = document.createElement("input");
  field.dataset.fieldKey = name;
  field.dataset.fieldPath = toJsonPointer(path);
  field.type = shape.kind === "boolean" ? "checkbox" : "text";
  if (field.type === "checkbox") {
    field.checked = value === "true";
  } else {
    field.value = value;
  }
  return field;
}

function applyScalar(
  path: NodePath,
  shape: ValueShape,
  control: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
): void {
  if (state === undefined) {
    return;
  }
  const text =
    control instanceof HTMLInputElement && control.type === "checkbox"
      ? String(control.checked)
      : control.value;
  try {
    applyQuietly(setScalarText(state.document, path, shape, text));
  } catch (error) {
    setStatus(error instanceof Error ? error.message : String(error));
  }
}

/** Render one value: a control, a field set, or an array with add/remove. */
function renderValue(
  host: HTMLElement,
  path: NodePath,
  shape: ValueShape,
  label: string,
  required: boolean
): void {
  const caption = required ? `${label} *` : label;

  if (shape.kind === "block") {
    host.append(paragraph(`${caption}：嵌套块请在左侧「积木块」里编辑`));
    return;
  }
  if (shape.kind === "unknown") {
    host.append(paragraph(`${caption}：暂不支持编辑`));
    return;
  }

  if (shape.kind === "object") {
    const box = document.createElement("fieldset");
    box.dataset.fieldPath = toJsonPointer(path);
    const legend = document.createElement("legend");
    legend.textContent = caption;
    box.append(legend);
    for (const field of shape.fields) {
      renderValue(
        box,
        [...path, field.key],
        field.shape,
        field.key,
        field.required
      );
    }
    host.append(box);
    return;
  }

  if (shape.kind === "array") {
    const box = document.createElement("fieldset");
    box.dataset.fieldPath = toJsonPointer(path);
    const items = readAt(state?.document, path);
    const list = Array.isArray(items) ? items : [];
    const legend = document.createElement("legend");
    legend.textContent = `${caption}（${list.length} 项）`;
    box.append(legend);

    list.forEach((_, index) => {
      const item = document.createElement("div");
      item.className = "array-item";
      item.dataset.arrayItem = String(index);
      const head = document.createElement("div");
      head.className = "array-item-head";
      const title = document.createElement("span");
      title.textContent = `条目 ${index + 1}`;
      const drop = button("✕", "data-drop-item");
      drop.addEventListener("click", () => {
        if (state !== undefined) {
          applyDocument(dropArrayItem(state.document, path, index));
        }
      });
      head.append(title, drop);
      item.append(head);
      renderValue(item, [...path, index], shape.items, "", false);
      box.append(item);
    });

    const add = button("＋ 添加", "data-add-item");
    add.addEventListener("click", () => {
      if (state === undefined) {
        return;
      }
      try {
        const appended = appendArrayItem(
          state.document,
          path,
          shape.items,
          state.schemaVersion
        );
        // Keep the current block selected: the new item is a node inside it,
        // not a block the list could select.
        applyDocument(appended.document);
      } catch (error) {
        setStatus(error instanceof Error ? error.message : String(error));
      }
    });
    box.append(add);
    host.append(box);
    return;
  }

  if (!isScalarShape(shape)) {
    host.append(paragraph(`${caption}：暂不支持编辑`));
    return;
  }

  const control = controlFor(path, shape);
  control.addEventListener("input", () => applyScalar(path, shape, control));
  control.addEventListener("change", () => applyScalar(path, shape, control));
  const wrapper = document.createElement("label");
  wrapper.textContent = caption;
  wrapper.append(control);
  host.append(wrapper);
}

function paintForm(): void {
  form.replaceChildren();
  if (state === undefined || state.selected === undefined) {
    form.append(paragraph("先选择左侧一个块。"));
    return;
  }
  const specs = blockFieldSpecs(
    state.document,
    state.selected.path,
    state.schemaVersion
  );
  if (specs.length === 0) {
    form.append(paragraph("该块没有可编辑字段。"));
    return;
  }
  for (const spec of specs) {
    renderValue(
      form,
      [...state.selected.path, spec.key],
      spec.shape,
      spec.key,
      spec.required
    );
  }
}

function paintDiagnostics(): void {
  diagnosticsList.replaceChildren();
  for (const entry of state?.diagnostics ?? []) {
    const item = document.createElement("li");
    item.dataset.severity = "error";
    const message = document.createElement("div");
    message.textContent = entry.message;
    const code = document.createElement("code");
    code.textContent = `${entry.code} @ ${entry.nodePath.join("/") || "/"}`;
    item.append(message, code);
    if (entry.atId !== undefined) {
      item.dataset.diagnosticAtId = entry.atId;
      item.addEventListener("click", () => selectByAtId(entry.atId));
    }
    diagnosticsList.append(item);
  }
}

function selectByAtId(atId: string | undefined): void {
  const match = state?.blocks.find((block) => block.atId === atId);
  if (match !== undefined && state !== undefined) {
    state.selected = match;
    paintBlocks();
    paintForm();
  }
}

async function paintPreview(): Promise<void> {
  if (state === undefined) {
    return;
  }
  const rendered = await renderDocument(
    state.document as AirpDocumentSnapshot,
    "html",
    {}
  );
  if (rendered.ok) {
    preview.srcdoc = String(rendered.value.files[0]?.body ?? "");
    return;
  }
  const codes = rendered.diagnostics.map((diagnostic) => diagnostic.code);
  preview.srcdoc = `<body style="font:14px -apple-system,sans-serif;padding:24px;color:#b91c1c">
    <p><strong>预览渲染失败</strong>（文档内容仍然保留，可继续编辑）：</p>
    <ul>${codes.map((code) => `<li><code>${code}</code></li>`).join("")}</ul>
  </body>`;
}

function scheduleRefresh(): void {
  if (previewTimer !== undefined) {
    clearTimeout(previewTimer);
  }
  previewTimer = setTimeout(() => {
    run(refresh());
  }, PREVIEW_DEBOUNCE_MS);
}

async function refresh(): Promise<void> {
  if (state === undefined) {
    return;
  }
  const validation = await validateDocument(state.document);
  state.diagnostics = diagnosticEntries(
    state.document,
    validation.diagnostics,
    state.schemaVersion
  );
  state.valid = validation.ok;
  state.blocks = listBlocks(state.document, state.schemaVersion);
  paintBlocks();
  paintForm();
  paintDiagnostics();
  saveButton.disabled = false;
  saveAsButton.disabled = false;
  paintSelection();
  const writable = state.handle === undefined ? "" : " · 可写回";
  setStatus(
    `${state.fileName} · ${state.blocks.length} 个块 · ${
      state.valid ? "校验通过" : `${state.diagnostics.length} 条校验问题`
    }${writable}`
  );
  await paintPreview();
}

function openText(
  fileName: string,
  text: string,
  handle?: FileHandleLike
): void {
  const loaded = loadDocumentJson(text);
  if (!loaded.ok) {
    setStatus(
      `无法读取：${loaded.diagnostics.map((d) => d.message).join("；")}`
    );
    return;
  }
  const version = loaded.value.schemaVersion;
  if (!hasSchemaVersion(version)) {
    setStatus(`不支持的 schemaVersion：${version}`);
    return;
  }
  const schemaVersion: SchemaVersion = version;
  const blocks = listBlocks(loaded.value.document, schemaVersion);
  state = {
    blocks,
    diagnostics: [],
    document: loaded.value.document,
    fileName,
    schemaVersion,
    selected: blocks[0],
    valid: true,
    ...(handle === undefined ? {} : { handle }),
  };
  addTypeSelect.replaceChildren();
  for (const type of listBlockTypes(schemaVersion)) {
    const option = document.createElement("option");
    option.value = type;
    option.textContent = type;
    addTypeSelect.append(option);
  }
  addTypeSelect.disabled = false;
  run(refresh());
}

async function openDocument(): Promise<void> {
  if (canWriteBack()) {
    const picked = await openWithPicker();
    if (picked !== undefined) {
      openText(picked.handle.name, picked.text, picked.handle);
    }
    return;
  }
  fileInput.click();
}

async function saveDocument(): Promise<void> {
  if (state === undefined) {
    return;
  }
  const text = documentText(state.document);
  if (state.handle === undefined) {
    downloadDocument(state.fileName, text);
    setStatus(`${state.fileName} · 已下载（该浏览器不支持写回原文件）`);
    return;
  }
  await writeDocument(state.handle, text);
  setStatus(`${state.fileName} · 已写回原文件`);
}

async function saveDocumentAs(): Promise<void> {
  if (state === undefined) {
    return;
  }
  const handle = await pickSaveHandle(state.fileName);
  if (handle === undefined) {
    downloadDocument(state.fileName, documentText(state.document));
    return;
  }
  await writeDocument(handle, documentText(state.document));
  state.handle = handle;
  state.fileName = handle.name;
  run(refresh());
}

openButton.addEventListener("click", () => run(openDocument()));
saveButton.addEventListener("click", () => run(saveDocument()));
saveAsButton.addEventListener("click", () => run(saveDocumentAs()));
addBlockButton.addEventListener("click", () => {
  if (state?.selected === undefined || !state.selected.inArray) {
    return;
  }
  const { selected } = state;
  try {
    const inserted = insertBlockAfter(
      state.document,
      selected.path,
      addTypeSelect.value,
      state.schemaVersion
    );
    // Select the block that was just created, so the author can type into it.
    applyDocument(inserted.document, inserted.atId);
  } catch (error) {
    setStatus(error instanceof Error ? error.message : String(error));
  }
});

fileInput.addEventListener("change", () => {
  const file = fileInput.files?.[0];
  if (file !== undefined) {
    run(file.text().then((text) => openText(file.name, text)));
  }
});

const drop = element<HTMLDivElement>("drop");
for (const type of ["dragenter", "dragover"]) {
  window.addEventListener(type, (event) => {
    event.preventDefault();
    drop.dataset.active = "true";
  });
}
for (const type of ["dragleave", "drop"]) {
  window.addEventListener(type, (event) => {
    event.preventDefault();
    if (type === "dragleave" && event.target !== drop) {
      return;
    }
    drop.dataset.active = "false";
  });
}
window.addEventListener("drop", (event) => {
  const file = event.dataTransfer?.files[0];
  if (file !== undefined) {
    run(file.text().then((text) => openText(file.name, text)));
  }
});
