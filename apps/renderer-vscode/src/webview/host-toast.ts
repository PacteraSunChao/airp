import type { ToastKind } from "../messages";

const DURATION_MS: Record<ToastKind, number> = {
  failed: 5000,
  succeeded: 3000,
};

/** Remove a toast node after its duration. */
export function dismissHostToast(toastEl: HTMLElement): void {
  if (toastEl.isConnected) {
    toastEl.remove();
  }
}

/** Host toast in `#toaster` / `.airp-toaster`. */
export function showHostToast(
  doc: Document,
  options: { kind: ToastKind; title: string }
): ReturnType<typeof setTimeout> | undefined {
  const title = options.title.trim();
  if (!title) {
    return undefined;
  }
  const toaster = ensureToaster(doc);
  const category = options.kind === "succeeded" ? "success" : "error";
  const durationMs = DURATION_MS[options.kind];

  const toastEl = doc.createElement("div");
  toastEl.className = "airp-toast";
  toastEl.setAttribute("role", category === "error" ? "alert" : "status");
  toastEl.setAttribute("aria-atomic", "true");
  toastEl.dataset.category = category;

  const heading = doc.createElement("h2");
  heading.textContent = title;
  toastEl.append(heading);
  toaster.append(toastEl);

  return globalThis.setTimeout(() => {
    dismissHostToast(toastEl);
  }, durationMs);
}

function ensureToaster(doc: Document): HTMLElement {
  const existing = doc.getElementById("toaster");
  if (existing) {
    return existing;
  }
  const toaster = doc.createElement("div");
  toaster.id = "toaster";
  toaster.className = "airp-toaster";
  doc.body.append(toaster);
  return toaster;
}
