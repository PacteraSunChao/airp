import { COLOR_SCHEME_EVENT, type ColorSchemePref } from "../color-scheme";
import type {
  ExportFormat,
  HostToWebviewMessage,
  WebviewToHostMessage,
} from "../messages";
import { mountFindBar } from "./find-bar";
import { showHostToast } from "./host-toast";

interface VsCodeApi {
  postMessage(message: WebviewToHostMessage): void;
}

declare function acquireVsCodeApi(): VsCodeApi;

export interface MountReaderBridgeOptions {
  acquireApi?: () => VsCodeApi;
  postMessage?: (message: WebviewToHostMessage) => void;
}

export interface MountReaderBridgeHandle {
  dispose: () => void;
  receive: (message: HostToWebviewMessage) => void;
}

const CLOSE_DELAY_MS = 260;

function supportsHover(): boolean {
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches
  );
}

function setExportOpen(root: Element, open: boolean): void {
  const trigger = root.querySelector(
    "[data-airp-export-trigger]"
  ) as HTMLElement | null;
  const menu = root.querySelector(
    "[data-airp-export-menu]"
  ) as HTMLElement | null;
  if (open) {
    root.setAttribute("data-open", "");
  } else {
    root.removeAttribute("data-open");
  }
  if (trigger) {
    trigger.setAttribute("aria-expanded", open ? "true" : "false");
  }
  if (menu) {
    menu.setAttribute("aria-hidden", open ? "false" : "true");
  }
}

function closeAllExportMenus(doc: Document): void {
  for (const root of doc.querySelectorAll("[data-airp-export][data-open]")) {
    setExportOpen(root, false);
  }
}

function handleExportFormatClick(
  formatBtn: HTMLElement,
  post: (message: WebviewToHostMessage) => void
): boolean {
  const format = formatBtn.getAttribute(
    "data-airp-export-format"
  ) as ExportFormat | null;
  if (!(format === "html" || format === "markdown")) {
    return false;
  }
  const root = formatBtn.closest("[data-airp-export]");
  if (root) {
    setExportOpen(root, false);
  }
  post({ type: "export", format });
  return true;
}

function handleExportTriggerClick(trigger: HTMLElement, doc: Document): void {
  const root = trigger.closest("[data-airp-export]");
  if (!root) {
    return;
  }
  const nextOpen = !root.hasAttribute("data-open");
  closeAllExportMenus(doc);
  setExportOpen(root, nextOpen);
}

function dispatchColorScheme(doc: Document, value: ColorSchemePref): void {
  doc.dispatchEvent(new CustomEvent(COLOR_SCHEME_EVENT, { detail: value }));
}

interface ExportRootState {
  cancelClose: () => void;
  dispose: () => void;
}

function bindExportHover(root: HTMLElement): ExportRootState {
  let closeTimer: ReturnType<typeof setTimeout> | null = null;

  const cancelClose = (): void => {
    if (closeTimer === null) {
      return;
    }
    globalThis.clearTimeout(closeTimer);
    closeTimer = null;
  };

  const scheduleClose = (): void => {
    cancelClose();
    closeTimer = globalThis.setTimeout(() => {
      closeTimer = null;
      setExportOpen(root, false);
    }, CLOSE_DELAY_MS);
  };

  const onEnter = (event: Event): void => {
    const pointer = event as PointerEvent;
    if (!(supportsHover() && pointer.pointerType === "mouse")) {
      return;
    }
    cancelClose();
    setExportOpen(root, true);
  };

  const onLeave = (event: Event): void => {
    const pointer = event as PointerEvent;
    if (!(supportsHover() && pointer.pointerType === "mouse")) {
      return;
    }
    scheduleClose();
  };

  root.addEventListener("pointerenter", onEnter);
  root.addEventListener("pointerleave", onLeave);

  return {
    cancelClose,
    dispose: () => {
      cancelClose();
      root.removeEventListener("pointerenter", onEnter);
      root.removeEventListener("pointerleave", onLeave);
    },
  };
}

/**
 * Bridge for Renderer view / host-shell documents: export + Edit Source + toast
 * + host-driven color scheme.
 */
export function mountReaderBridge(
  options: MountReaderBridgeOptions = {}
): MountReaderBridgeHandle {
  const doc = document;
  const api =
    options.acquireApi?.() ??
    (typeof acquireVsCodeApi === "function"
      ? acquireVsCodeApi()
      : { postMessage: () => undefined });
  const post = options.postMessage ?? ((m) => api.postMessage(m));

  const toastTimers: ReturnType<typeof setTimeout>[] = [];
  const exportBindings = new Map<HTMLElement, ExportRootState>();
  const findBar = mountFindBar(doc);
  const toastCopyEl = doc.querySelector("[data-airp-host-toast-copy]");
  const toastCopy = {
    renderSucceeded: toastCopyEl?.getAttribute("data-succeeded")?.trim() ?? "",
    renderFailed: toastCopyEl?.getAttribute("data-failed")?.trim() ?? "",
  };

  for (const node of doc.querySelectorAll("[data-airp-export]")) {
    const root = node as HTMLElement;
    exportBindings.set(root, bindExportHover(root));
  }

  const onClick = (event: Event) => {
    const target = event.target;
    if (!(target && (target as Node).nodeType === 1)) {
      return;
    }
    const el = target as Element;

    if (el.closest("[data-airp-edit-source]")) {
      event.preventDefault();
      post({ type: "editSource" });
      return;
    }

    const formatBtn = el.closest(
      "[data-airp-export-format]"
    ) as HTMLElement | null;
    if (formatBtn) {
      if (handleExportFormatClick(formatBtn, post)) {
        event.preventDefault();
      }
      return;
    }

    const trigger = el.closest(
      "[data-airp-export-trigger]"
    ) as HTMLElement | null;
    if (trigger) {
      event.preventDefault();
      const root = trigger.closest("[data-airp-export]") as HTMLElement | null;
      if (root) {
        exportBindings.get(root)?.cancelClose();
      }
      handleExportTriggerClick(trigger, doc);
      return;
    }

    if (!el.closest("[data-airp-export]")) {
      closeAllExportMenus(doc);
    }

    if (el.closest("[data-airp-open-output]")) {
      event.preventDefault();
      post({ type: "openOutput" });
    }
  };

  const onKeydown = (event: Event): void => {
    const keyEvent = event as KeyboardEvent;
    if (keyEvent.key !== "Escape") {
      return;
    }
    const open = doc.querySelector("[data-airp-export][data-open]");
    if (!open) {
      return;
    }
    keyEvent.preventDefault();
    setExportOpen(open, false);
    const trigger = open.querySelector(
      "[data-airp-export-trigger]"
    ) as HTMLElement | null;
    trigger?.focus();
  };

  doc.addEventListener("click", onClick);
  doc.addEventListener("keydown", onKeydown);
  post({ type: "ready" });

  function showToast(kind: "succeeded" | "failed"): void {
    const title =
      kind === "succeeded" ? toastCopy.renderSucceeded : toastCopy.renderFailed;
    const timer = showHostToast(doc, { kind, title });
    if (timer !== undefined) {
      toastTimers.push(timer);
    }
  }

  const hostShell = doc.querySelector(
    "[data-airp-host-shell]"
  ) as HTMLElement | null;
  if (hostShell?.dataset.mode === "error") {
    showToast("failed");
  }

  function receive(message: HostToWebviewMessage): void {
    if (message.type === "toast") {
      showToast(message.kind);
      return;
    }
    if (message.type === "colorScheme") {
      dispatchColorScheme(doc, message.value);
    }
  }

  function dispose(): void {
    for (const id of toastTimers) {
      globalThis.clearTimeout(id);
    }
    toastTimers.length = 0;
    for (const binding of exportBindings.values()) {
      binding.dispose();
    }
    exportBindings.clear();
    findBar.dispose();
    doc.removeEventListener("click", onClick);
    doc.removeEventListener("keydown", onKeydown);
  }

  return { dispose, receive };
}
