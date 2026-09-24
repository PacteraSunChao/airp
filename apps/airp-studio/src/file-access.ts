/**
 * File open/save adapters.
 *
 * Chromium's File System Access API lets the studio write a document back to the
 * file the author opened, which is what makes "open, change, save" a real loop
 * for someone who does not use git. Everywhere else — and for the first save of
 * an unnamed document — it falls back to a download.
 *
 * The pickers are not part of the DOM type library, so they are declared here and
 * looked up on `window` instead of being assumed to exist.
 */

export interface WritableFile {
  close(): Promise<void>;
  write(text: string): Promise<void>;
}

export interface FileHandleLike {
  createWritable(): Promise<WritableFile>;
  getFile(): Promise<{ text(): Promise<string> }>;
  name: string;
}

interface FilePickerWindow {
  showOpenFilePicker?: (options?: unknown) => Promise<FileHandleLike[]>;
  showSaveFilePicker?: (options?: unknown) => Promise<FileHandleLike>;
}

const PICKER_TYPES = [
  {
    accept: { "application/json": [".airp.json", ".json"] },
    description: "AIRP document",
  },
];

function pickerWindow(): FilePickerWindow {
  return window as unknown as FilePickerWindow;
}

/** Whether this browser can write back to a file the author picked. */
export function canWriteBack(): boolean {
  return typeof pickerWindow().showOpenFilePicker === "function";
}

/** Write `text` through a handle the author already chose. */
export async function writeDocument(
  handle: FileHandleLike,
  text: string
): Promise<void> {
  const writable = await handle.createWritable();
  try {
    await writable.write(text);
  } finally {
    // Leaving a writable open would keep the file locked for other programs.
    await writable.close();
  }
}

/** Pick a document to open, when the browser offers a picker. */
export async function openWithPicker(): Promise<
  { handle: FileHandleLike; text: string } | undefined
> {
  const picker = pickerWindow().showOpenFilePicker;
  if (picker === undefined) {
    return undefined;
  }
  const [handle] = await picker({ types: PICKER_TYPES });
  if (handle === undefined) {
    return undefined;
  }
  const file = await handle.getFile();
  return { handle, text: await file.text() };
}

/** Ask where a new document should live, when the browser offers a picker. */
export async function pickSaveHandle(
  suggestedName: string
): Promise<FileHandleLike | undefined> {
  const picker = pickerWindow().showSaveFilePicker;
  if (picker === undefined) {
    return undefined;
  }
  return await picker({ suggestedName, types: PICKER_TYPES });
}

/** Fallback save: hand the document to the browser as a download. */
export function downloadDocument(fileName: string, text: string): void {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}
