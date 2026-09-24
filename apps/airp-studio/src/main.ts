/**
 * Studio shell: open a `*.airp.json`, edit it against a canvas that shows the
 * document exactly as the renderer exports it, and write it back.
 *
 * The canvas *is* the report. Clicking a block on it selects that block — the
 * rendered element carries the block's Machine Handle, so the click resolves
 * back to a document node through `@airp/editor-core` — and the field panel is
 * the one place a value can be changed. Nothing here knows about any particular
 * block type: shapes come from the schema, names from the label tables, and
 * edits go through `studio.ts` and `editor-core`.
 *
 * Only schema 1.1.0 is supported. An older document is refused outright rather
 * than half-opened: it has localized strings and no handles, so editing it here
 * would mean inventing the missing pieces.
 */

import {
  atIdAtPath,
  createBlock,
  indexDocumentAtIds,
  insertValue,
  listBlockTypes,
  type NodePath,
  setValue,
  type ValueShape,
} from "@airp/editor-core";
import { loadDocumentJson } from "@airp/loader";
import { hasSchemaVersion, type SchemaVersion } from "@airp/protocol";
import { type AirpDocumentSnapshot, renderDocument } from "@airp/renderer";
import { validateDocument } from "@airp/validate";
import { createCanvas, type NodeBox } from "./canvas.js";
import type { FieldHost } from "./fields.js";
import {
  canWriteBack,
  downloadDocument,
  type FileHandleLike,
  openWithPicker,
  pickSaveHandle,
  writeDocument,
} from "./file-access.js";
import { openInlineEditor } from "./inline-editor.js";
import { renderInspector } from "./inspector.js";
import { renderPalette } from "./palette.js";
import { insertBlockAfter, moveBlock, removeBlock } from "./structure.js";
import {
  appendArrayItem,
  type BlockEntry,
  type DiagnosticEntry,
  diagnosticEntries,
  documentText,
  dropArrayItem,
  listBlocks,
  primaryTextField,
  readAt,
  setScalarText,
} from "./studio.js";
import "./styles/index.css";
import "./styles/app.css";

/** The one schema version this editor understands. */
const SCHEMA_VERSION: SchemaVersion = "1.1.0";
const DEFAULT_TITLE = "未命名报告";
const DEFAULT_LOCALE = "zh-CN";

/** Document-name suffixes, stripped to build an export file name. */
const AIRP_JSON_SUFFIX_RE = /\.airp\.json$/;
const JSON_SUFFIX_RE = /\.json$/;

/** How long typing may settle before the canvas and validation catch up. */
const REPAINT_DEBOUNCE_MS = 220;
const MIN_PANEL_WIDTH = 280;
const MAX_PANEL_WIDTH = 720;
const DEFAULT_PANEL_WIDTH = 380;

interface StudioState {
  blocks: BlockEntry[];
  diagnostics: DiagnosticEntry[];
  document: unknown;
  fileName: string;
  /** Present once the author picked a file to write back to. */
  handle?: FileHandleLike;
  schemaVersion: SchemaVersion;
  selectedAtId?: string;
  valid: boolean;
}

function element<T extends HTMLElement>(id: string): T {
  const found = document.querySelector<T>(`#${id}`);
  if (found === null) {
    throw new Error(`Missing element: #${id}`);
  }
  return found;
}

const canvasFrame = element<HTMLIFrameElement>("canvas");
const canvasWrap = canvasFrame.parentElement ?? canvasFrame;
const exportHtmlButton = element<HTMLButtonElement>("export-html");
const exportJsonButton = element<HTMLButtonElement>("export-json");
const exportMarkdownButton = element<HTMLButtonElement>("export-md");
const fileInput = element<HTMLInputElement>("file");
const fullscreenButton = element<HTMLButtonElement>("fullscreen");
const importButton = element<HTMLButtonElement>("import");
const inspector = element<HTMLElement>("inspector");
const modal = element<HTMLElement>("modal");
const newButton = element<HTMLButtonElement>("new");
const palette = element<HTMLElement>("palette");
const resizeHandle = element<HTMLButtonElement>("resize");
const reopenFieldsButton = element<HTMLButtonElement>("reopen-fields");
const saveButton = element<HTMLButtonElement>("save");
const statusNode = element<HTMLSpanElement>("status");
const toggleFieldsButton = element<HTMLButtonElement>("toggle-fields");
const validateButton = element<HTMLButtonElement>("validate");
const workspace = element<HTMLElement>("workspace");

let state: StudioState | undefined;
let paintTimer: ReturnType<typeof setTimeout> | undefined;
let fieldsVisible = true;
/** The in-place editor, while one is open. */
let inline: { close: () => void } | undefined;
/** Edits made while the in-place editor held the canvas frozen. */
let inlineDirty = false;

function setStatus(message: string): void {
  statusNode.textContent = message;
  statusNode.title = message;
}

/** Run a task and surface a failure in the status line instead of dropping it. */
function run(task: Promise<unknown>): void {
  task.catch((error: unknown) => {
    setStatus(error instanceof Error ? error.message : String(error));
  });
}

function selectedBlock(): BlockEntry | undefined {
  const atId = state?.selectedAtId;
  return atId === undefined
    ? undefined
    : state?.blocks.find((block) => block.atId === atId);
}

/** A blank 1.1.0 report, so the editor opens on something editable. */
function emptyDocument(): unknown {
  return {
    blocks: [],
    i18n: { locale: DEFAULT_LOCALE },
    meta: { title: DEFAULT_TITLE },
    schemaVersion: SCHEMA_VERSION,
  };
}

function failurePage(codes: readonly string[]): string {
  return `<body style="font:14px -apple-system,sans-serif;padding:24px;color:#b91c1c">
    <p><strong>画布渲染失败</strong>（文档内容仍然保留，可继续编辑）：</p>
    <ul>${codes.map((code) => `<li><code>${code}</code></li>`).join("")}</ul>
  </body>`;
}

/** The document as the renderer produces it, handles included. */
async function documentHtml(document_: unknown): Promise<string> {
  const rendered = await renderDocument(
    document_ as AirpDocumentSnapshot,
    "html",
    { targetOptions: { machineHandles: true } }
  );
  if (rendered.ok) {
    return String(rendered.value.files[0]?.body ?? "");
  }
  return failurePage(rendered.diagnostics.map((diagnostic) => diagnostic.code));
}

function setExportEnabled(enabled: boolean): void {
  saveButton.disabled = !enabled;
  exportJsonButton.disabled = !enabled;
  validateButton.disabled = !enabled;
  fullscreenButton.disabled = !enabled;
  exportHtmlButton.disabled = !enabled;
  exportMarkdownButton.disabled = !enabled;
}

/** Repaint the canvas and the status line, leaving the field panel alone. */
async function paintCanvas(): Promise<void> {
  if (state === undefined) {
    return;
  }
  setExportEnabled(true);
  canvas.render(await documentHtml(state.document));
  canvas.highlight(state.selectedAtId);
  const writable = state.handle === undefined ? "" : " · 可写回";
  setStatus(
    `${state.fileName} · ${state.blocks.length} 个块 · ${
      state.valid ? "校验通过" : `${state.diagnostics.length} 条校验问题`
    }${writable}`
  );
}

/** Re-read what the document now contains, then repaint everything. */
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
  if (selectedBlock() === undefined) {
    state.selectedAtId = undefined;
  }
  paintInspector();
  await paintCanvas();
}

function schedule(task: () => Promise<void>): void {
  if (paintTimer !== undefined) {
    clearTimeout(paintTimer);
  }
  paintTimer = setTimeout(() => {
    run(task());
  }, REPAINT_DEBOUNCE_MS);
}

/**
 * Editing in place holds the canvas still.
 *
 * A repaint reloads the iframe, which would move the node out from under the
 * overlay on every keystroke — so the canvas is left as it was and brought up to
 * date once the overlay closes.
 */
function scheduleUnlessInline(task: () => Promise<void>): void {
  if (inline !== undefined) {
    inlineDirty = true;
    return;
  }
  schedule(task);
}

/**
 * Where the caret is, so repainting while typing does not lose it: every control
 * carries the JSON pointer it edits.
 */
interface CaretPlace {
  end: number | null;
  path: string;
  start: number | null;
}

function captureCaret(): CaretPlace | undefined {
  const active = document.activeElement;
  if (!(active instanceof HTMLElement)) {
    return undefined;
  }
  const path = active.dataset.fieldPath;
  if (path === undefined) {
    return undefined;
  }
  const field = active as HTMLInputElement | HTMLTextAreaElement;
  return {
    end: typeof field.selectionEnd === "number" ? field.selectionEnd : null,
    path,
    start:
      typeof field.selectionStart === "number" ? field.selectionStart : null,
  };
}

function restoreCaret(where: CaretPlace | undefined): void {
  if (where === undefined) {
    return;
  }
  const escaped = CSS.escape(where.path);
  const next = inspector.querySelector<HTMLElement>(
    `[data-field-path="${escaped}"]`
  );
  if (next === null) {
    return;
  }
  next.focus();
  if (
    where.start !== null &&
    where.end !== null &&
    (next instanceof HTMLInputElement || next instanceof HTMLTextAreaElement)
  ) {
    next.setSelectionRange(where.start, where.end);
  }
}

function paintInspector(): void {
  if (state === undefined) {
    return;
  }
  const caret = captureCaret();
  const selected = selectedBlock();
  renderInspector(
    inspector,
    {
      blocks: state.blocks,
      diagnostics: state.diagnostics,
      document: state.document,
      host: fieldHost(),
      schemaVersion: state.schemaVersion,
      ...(selected === undefined ? {} : { selected }),
    },
    {
      addColumn: (tablePath, columnShape) => addColumn(tablePath, columnShape),
      move: (delta) => moveSelected(delta),
      remove: () => removeSelected(),
      selectAtId: (atId) => selectAtId(atId),
      setMeta: (key, text) => setMeta(key, text),
    }
  );
  restoreCaret(caret);
}

/** Select the block carrying this handle and show its fields. */
function selectAtId(atId: string | undefined): void {
  if (state === undefined) {
    return;
  }
  state.selectedAtId = atId;
  canvas.highlight(atId);
  paintInspector();
}

/** Select the block sitting at a document path. */
function selectPath(path: NodePath): void {
  if (state === undefined) {
    return;
  }
  selectAtId(atIdAtPath(indexDocumentAtIds(state.document), path));
}

function setMeta(key: string, text: string): void {
  if (state === undefined) {
    return;
  }
  state.document = setValue(state.document, ["meta", key], text);
  schedule(refresh);
}

function moveSelected(delta: number): void {
  const block = selectedBlock();
  if (state === undefined || block === undefined) {
    return;
  }
  try {
    state.document = moveBlock(state.document, block.path, delta);
    schedule(refresh);
  } catch (error) {
    setStatus(error instanceof Error ? error.message : String(error));
  }
}

function removeSelected(): void {
  const block = selectedBlock();
  if (state === undefined || block === undefined) {
    return;
  }
  try {
    state.document = removeBlock(state.document, block.path);
    state.selectedAtId = undefined;
    schedule(refresh);
  } catch (error) {
    setStatus(error instanceof Error ? error.message : String(error));
  }
}

/**
 * Add a column to the table at `tablePath`.
 *
 * The new column gets a key nothing else uses: a row is an object keyed by the
 * columns, so two columns sharing the empty key would fight over one cell. The
 * label stays empty on purpose — naming the column is the author's job, and
 * `PlainString`'s content floor says so in the issues list.
 */
function addColumn(tablePath: NodePath, columnShape: ValueShape): void {
  if (state === undefined) {
    return;
  }
  const columnsPath = [...tablePath, "columns"];
  const appended = appendArrayItem(
    state.document,
    columnsPath,
    columnShape,
    state.schemaVersion
  );
  const columns = readAt(appended.document, columnsPath);
  const used = new Set(
    (Array.isArray(columns) ? columns : []).map((column) =>
      typeof (column as { key?: unknown })?.key === "string"
        ? (column as { key: string }).key
        : ""
    )
  );
  let key = "";
  for (let index = 1; key.length === 0; index += 1) {
    const candidate = `col${index}`;
    if (!used.has(candidate)) {
      key = candidate;
    }
  }
  const addedIndex = Array.isArray(columns) ? columns.length - 1 : 0;
  state.document = setValue(
    appended.document,
    [...columnsPath, addedIndex, "key"],
    key
  );
  run(refresh());
}

/** Where a new block should go: after the selection, else at the end. */
function insertAfterPath(): NodePath | undefined {
  const block = selectedBlock();
  return block?.inArray === true ? block.path : undefined;
}

/** Add a block: after `after` when given, else appended to the report. */
function addBlock(type: string, after?: NodePath): void {
  if (state === undefined) {
    return;
  }
  try {
    if (after === undefined) {
      const blocks = (state.document as { blocks?: unknown[] }).blocks ?? [];
      state.document = insertValue(
        state.document,
        ["blocks"],
        blocks.length,
        createBlock(type, state.schemaVersion, state.document)
      );
      state.selectedAtId = undefined;
    } else {
      const inserted = insertBlockAfter(
        state.document,
        after,
        type,
        state.schemaVersion
      );
      state.document = inserted.document;
      state.selectedAtId = inserted.atId;
    }
    run(refresh());
  } catch (error) {
    setStatus(error instanceof Error ? error.message : String(error));
  }
}

/** Add a block right after the block carrying this handle. */
function addBlockAfterAtId(atId: string | undefined, type: string): void {
  if (atId === undefined) {
    addBlock(type);
    return;
  }
  const block = state?.blocks.find((entry) => entry.atId === atId);
  addBlock(type, block?.inArray === true ? block.path : undefined);
}

/** The field panel's way back into the document. */
function fieldHost(): FieldHost {
  return {
    addItem: (arrayPath, itemShape) => {
      if (state === undefined) {
        return;
      }
      state.document = appendArrayItem(
        state.document,
        arrayPath,
        itemShape,
        state.schemaVersion
      ).document;
      run(refresh());
    },
    blockType: selectedBlock()?.type ?? "",
    document: state?.document,
    dropItem: (arrayPath, index) => {
      if (state === undefined) {
        return;
      }
      state.document = dropArrayItem(state.document, arrayPath, index);
      run(refresh());
    },
    selectPath: (path) => selectPath(path),
    setText: (path, shape, text) => {
      if (state === undefined) {
        return;
      }
      try {
        state.document = setScalarText(state.document, path, shape, text);
      } catch (error) {
        setStatus(error instanceof Error ? error.message : String(error));
        return;
      }
      // Re-validate and repaint: the status line has to follow what was typed.
      // The caret survives because every control is tagged with its path.
      scheduleUnlessInline(refresh);
    },
    setValueAt: (path, value) => {
      if (state === undefined) {
        return;
      }
      state.document = setValue(state.document, path, value);
      run(refresh());
    },
  };
}

/**
 * Double clicking a node edits its text on the canvas itself.
 *
 * Only a text field the author typed can be edited this way; a block whose first
 * string is a label, or one with no text at all, is selected and left to the
 * panel, which knows what kind of control the value needs.
 */
function editInPlace(atId: string, box: NodeBox): void {
  if (state === undefined) {
    return;
  }
  selectAtId(atId);
  const block = state.blocks.find((entry) => entry.atId === atId);
  if (block === undefined) {
    return;
  }
  const field = primaryTextField(
    state.document,
    block.path,
    state.schemaVersion
  );
  if (field === undefined) {
    return;
  }
  inline?.close();
  inlineDirty = false;
  const path = [...block.path, field.key];
  const handle = openInlineEditor(
    canvasWrap,
    {
      box,
      multiline: field.shape.kind === "markdown",
      value: String(readAt(state.document, path) ?? ""),
    },
    {
      onClose: () => {
        inline = undefined;
        if (inlineDirty) {
          inlineDirty = false;
          run(refresh());
        }
      },
      onInput: (text) => {
        if (state === undefined) {
          return;
        }
        try {
          state.document = setScalarText(
            state.document,
            path,
            field.shape,
            text
          );
        } catch (error) {
          setStatus(error instanceof Error ? error.message : String(error));
        }
        // The canvas is held still while the overlay is open, so this only marks
        // it as needing a repaint the moment the overlay closes.
        scheduleUnlessInline(refresh);
      },
    }
  );
  inline = handle;
}

const canvas = createCanvas(canvasFrame, {
  onClear: () => selectAtId(undefined),
  onDrop: (atId, type) => addBlockAfterAtId(atId, type),
  onEdit: (atId, box) => editInPlace(atId, box),
  onSelect: (atId) => selectAtId(atId),
});

/** Refuse anything this editor cannot honestly edit. */
function versionProblem(document_: unknown): string | undefined {
  const { schemaVersion } = document_ as { schemaVersion?: unknown };
  if (schemaVersion === SCHEMA_VERSION) {
    return undefined;
  }
  if (typeof schemaVersion !== "string" || !hasSchemaVersion(schemaVersion)) {
    return `不支持的 schemaVersion：${String(schemaVersion)}`;
  }
  return `只支持 schema ${SCHEMA_VERSION}，这份文档是 ${String(schemaVersion)}`;
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
  const problem = versionProblem(loaded.value.document);
  if (problem !== undefined) {
    setStatus(problem);
    return;
  }
  state = {
    blocks: [],
    diagnostics: [],
    document: loaded.value.document,
    fileName,
    schemaVersion: SCHEMA_VERSION,
    valid: true,
    ...(handle === undefined ? {} : { handle }),
  };
  state.blocks = listBlocks(state.document, SCHEMA_VERSION);
  state.selectedAtId = state.blocks[0]?.atId;
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

async function writeBack(text: string): Promise<void> {
  if (state === undefined) {
    return;
  }
  if (state.handle !== undefined) {
    await writeDocument(state.handle, text);
    setStatus(`已保存 ${state.fileName}`);
    return;
  }
  const handle = canWriteBack()
    ? await pickSaveHandle(state.fileName)
    : undefined;
  if (handle === undefined) {
    downloadDocument(state.fileName, text);
    setStatus("已下载 .airp.json");
    return;
  }
  state.handle = handle;
  await writeDocument(handle, text);
  setStatus(`已保存 ${handle.name}`);
  await paintCanvas();
}

async function exportAs(kind: "html" | "markdown"): Promise<void> {
  if (state === undefined) {
    return;
  }
  const rendered = await renderDocument(
    state.document as AirpDocumentSnapshot,
    kind === "html" ? "html" : "markdown",
    {}
  );
  if (!rendered.ok) {
    setStatus(
      `导出失败：${rendered.diagnostics.map((d) => d.code).join("、")}`
    );
    return;
  }
  const name = state.fileName
    .replace(AIRP_JSON_SUFFIX_RE, "")
    .replace(JSON_SUFFIX_RE, "");
  const isHtml = kind === "html";
  downloadDocument(
    `${name}.${isHtml ? "html" : "md"}`,
    String(rendered.value.files[0]?.body ?? ""),
    isHtml ? "text/html" : "text/markdown"
  );
  setStatus(isHtml ? "已导出 HTML" : "已导出 Markdown");
}

function setFieldsVisible(visible: boolean): void {
  fieldsVisible = visible;
  inspector.hidden = !visible;
  resizeHandle.hidden = !visible;
  reopenFieldsButton.hidden = visible;
  toggleFieldsButton.classList.toggle("active", visible);
  toggleFieldsButton.title = visible ? "隐藏字段面板" : "显示字段面板";
}

function openFullscreen(): void {
  if (state === undefined) {
    return;
  }
  run(
    documentHtml(state.document).then((html) => {
      modal.replaceChildren();
      const frame = document.createElement("iframe");
      frame.className = "modal-frame";
      frame.title = "文档预览";
      frame.srcdoc = html;
      const close = document.createElement("button");
      close.type = "button";
      close.className = "btn btn-ghost modal-close";
      close.textContent = "关闭";
      close.addEventListener("click", () => {
        modal.hidden = true;
        modal.replaceChildren();
      });
      modal.append(frame, close);
      modal.hidden = false;
    })
  );
}

/** Drag the divider to give the field panel more or less room. */
function wireResize(): void {
  let startWidth = DEFAULT_PANEL_WIDTH;
  let startX = 0;
  const onMove = (event: PointerEvent): void => {
    const next = Math.min(
      MAX_PANEL_WIDTH,
      Math.max(MIN_PANEL_WIDTH, startWidth - (event.clientX - startX))
    );
    inspector.style.flexBasis = `${next}px`;
    inspector.style.width = `${next}px`;
  };
  const onUp = (): void => {
    workspace.classList.remove("is-resizing");
    document.removeEventListener("pointermove", onMove);
    document.removeEventListener("pointerup", onUp);
  };
  resizeHandle.addEventListener("pointerdown", (event) => {
    startWidth = inspector.getBoundingClientRect().width;
    startX = event.clientX;
    workspace.classList.add("is-resizing");
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  });
}

function wireToolbar(): void {
  newButton.addEventListener("click", () => {
    openText(
      `${DEFAULT_TITLE}.airp.json`,
      `${JSON.stringify(emptyDocument(), null, 2)}\n`
    );
    setStatus("已新建空白报告");
  });
  importButton.addEventListener("click", () => run(openDocument()));
  saveButton.addEventListener("click", () =>
    run(writeBack(documentText(state?.document)))
  );
  exportJsonButton.addEventListener("click", () => {
    if (state === undefined) {
      return;
    }
    downloadDocument(state.fileName, documentText(state.document));
    setStatus("已下载 .airp.json");
  });
  validateButton.addEventListener("click", () => run(refresh()));
  fullscreenButton.addEventListener("click", () => openFullscreen());
  exportHtmlButton.addEventListener("click", () => run(exportAs("html")));
  exportMarkdownButton.addEventListener("click", () =>
    run(exportAs("markdown"))
  );
  toggleFieldsButton.addEventListener("click", () =>
    setFieldsVisible(!fieldsVisible)
  );
  reopenFieldsButton.addEventListener("click", () => setFieldsVisible(true));
  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (file === undefined) {
      return;
    }
    run(file.text().then((text) => openText(file.name, text)));
    fileInput.value = "";
  });
  document.addEventListener("dragover", (event) => event.preventDefault());
}

renderPalette(palette, {
  availableTypes: listBlockTypes(SCHEMA_VERSION),
  onPick: (type) => addBlock(type, insertAfterPath()),
});
wireResize();
wireToolbar();
setFieldsVisible(true);
setExportEnabled(false);
openText(
  `${DEFAULT_TITLE}.airp.json`,
  `${JSON.stringify(emptyDocument(), null, 2)}\n`
);
