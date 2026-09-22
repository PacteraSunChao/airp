import { diffLines } from "diff";
import { htmlLocaleMessage } from "../i18n/html-locale.js";
import { escapeHtml } from "./escape-html.js";

/** Count +/- lines in a unified diff (ignore --- / +++ file headers). */
export function countUnifiedDiffStats(unified: string): {
  added: number;
  deleted: number;
} {
  let added = 0;
  let deleted = 0;
  for (const line of unified.split("\n")) {
    if (line.startsWith("+") && !line.startsWith("+++")) {
      added += 1;
    } else if (line.startsWith("-") && !line.startsWith("---")) {
      deleted += 1;
    }
  }
  return { added, deleted };
}

function filenameChrome(filename: string | undefined): string {
  if (typeof filename === "string" && filename.length > 0) {
    return `<span class="text-xs font-mono font-medium truncate" data-code-filename="true" style="color: var(--text-main)">${escapeHtml(filename)}</span>`;
  }
  return `<span data-code-filename="true"></span>`;
}

function languageChrome(language: string | undefined): string {
  if (typeof language === "string" && language.length > 0) {
    return `<span class="px-2 py-0.5 rounded text-[10px] font-mono border shrink-0" data-code-lang="true" style="color: var(--text-secondary); background-color: var(--bg-subtle); border-color: var(--border-color)">${escapeHtml(language)}</span>`;
  }
  return "";
}

/** Chrome for unified codeDiff: filename + language + +/- stats. */
export function renderCodeDiffUnifiedChrome(options: {
  added: number;
  deleted: number;
  filename?: string;
  language?: string;
}): string {
  const stats = `<div class="flex items-center gap-2 shrink-0" data-code-diff-stats="true"><span class="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">+${options.added}</span><span class="text-[11px] text-rose-600 dark:text-rose-400 font-semibold">-${options.deleted}</span></div>`;
  return `<div class="flex items-center justify-between px-4 py-2 border-b" style="border-color: var(--border-color); background-color: var(--bg-surface)"><div class="flex items-center gap-2 min-w-0">${filenameChrome(options.filename)}${languageChrome(options.language)}</div>${stats}</div>`;
}

/** Chrome for split codeDiff: filename + language. */
export function renderCodeDiffSplitChrome(options: {
  filename?: string;
  language?: string;
}): string {
  return `<div class="flex items-center justify-between px-4 py-2 border-b" style="border-color: var(--border-color); background-color: var(--bg-surface)"><div class="flex items-center gap-2 min-w-0">${filenameChrome(options.filename)}${languageChrome(options.language)}</div></div>`;
}

export type SplitDiffKind = "equal" | "add" | "del";

export interface SplitDiffLine {
  kind: SplitDiffKind;
  lineNo: number;
  text: string;
}

function splitPartLines(value: string): string[] {
  const lines = value.split("\n");
  if (lines.length > 0 && lines.at(-1) === "") {
    lines.pop();
  }
  return lines;
}

/** Line-level before/after panes via jsdiff `diffLines`. */
export function buildSplitDiffLines(
  before: string,
  after: string
): { after: SplitDiffLine[]; before: SplitDiffLine[] } {
  const beforeLines: SplitDiffLine[] = [];
  const afterLines: SplitDiffLine[] = [];
  let beforeNo = 1;
  let afterNo = 1;

  for (const part of diffLines(before, after)) {
    const lines = splitPartLines(part.value);
    if (part.added) {
      for (const text of lines) {
        afterLines.push({ kind: "add", lineNo: afterNo, text });
        afterNo += 1;
      }
      continue;
    }
    if (part.removed) {
      for (const text of lines) {
        beforeLines.push({ kind: "del", lineNo: beforeNo, text });
        beforeNo += 1;
      }
      continue;
    }
    for (const text of lines) {
      beforeLines.push({ kind: "equal", lineNo: beforeNo, text });
      afterLines.push({ kind: "equal", lineNo: afterNo, text });
      beforeNo += 1;
      afterNo += 1;
    }
  }

  return { before: beforeLines, after: afterLines };
}

function renderSplitLineRow(line: SplitDiffLine): string {
  if (line.kind === "del") {
    return `<div class="bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 px-1 rounded whitespace-pre" data-code-diff-line="del">${line.lineNo} - ${escapeHtml(line.text)}</div>`;
  }
  if (line.kind === "add") {
    return `<div class="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 px-1 rounded whitespace-pre" data-code-diff-line="add">${line.lineNo} + ${escapeHtml(line.text)}</div>`;
  }
  return `<div class="whitespace-pre" data-code-diff-line="equal">${line.lineNo}  ${escapeHtml(line.text)}</div>`;
}

function renderSplitPaneLines(lines: SplitDiffLine[]): string {
  return `<div class="space-y-1 overflow-x-auto" style="color: var(--text-secondary)">${lines.map(renderSplitLineRow).join("")}</div>`;
}

/** Before / After panes for split codeDiff (line diff + +/- markers). */
export function renderCodeDiffSplitBody(options: {
  after: string;
  before: string;
  locale: string;
}): string {
  const panes = buildSplitDiffLines(options.before, options.after);
  const beforeLabel = htmlLocaleMessage(
    "emit.code-diff-before",
    options.locale
  );
  const afterLabel = htmlLocaleMessage("emit.code-diff-after", options.locale);
  const beforePane = `<div class="p-3 text-[11px] leading-5" data-code-diff-side="before" style="background-color: var(--bg-surface)"><div class="font-semibold text-rose-600 dark:text-rose-400 mb-2">${escapeHtml(beforeLabel)}</div>${renderSplitPaneLines(panes.before)}</div>`;
  const afterPane = `<div class="p-3 text-[11px] leading-5" data-code-diff-side="after" style="background-color: var(--bg-surface)"><div class="font-semibold text-emerald-600 dark:text-emerald-400 mb-2">${escapeHtml(afterLabel)}</div>${renderSplitPaneLines(panes.after)}</div>`;
  return `<div class="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-700">${beforePane}${afterPane}</div>`;
}
