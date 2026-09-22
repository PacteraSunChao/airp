import { escapeHtml } from "./escape-html.js";

function attr(value: string): string {
  return escapeHtml(value);
}

/** Schema Status enum values (visual coloring keys). */
export type StatusValue =
  | "pass"
  | "fail"
  | "partial"
  | "warning"
  | "neutral"
  | "pending"
  | "in_progress"
  | "done"
  | "blocked"
  | "skipped";

const STATUS_SET = new Set<string>([
  "pass",
  "fail",
  "partial",
  "warning",
  "neutral",
  "pending",
  "in_progress",
  "done",
  "blocked",
  "skipped",
]);

export function isStatusValue(value: string): value is StatusValue {
  return STATUS_SET.has(value);
}

/** Map decision.status → nearest Status visual. */
export const DECISION_STATUS_VISUAL: Readonly<Record<string, StatusValue>> = {
  accepted: "pass",
  proposed: "in_progress",
  rejected: "fail",
  deferred: "pending",
  superseded: "neutral",
};

/** Map risk.status → nearest Status visual. */
export const RISK_STATUS_VISUAL: Readonly<Record<string, StatusValue>> = {
  open: "fail",
  mitigated: "pass",
  accepted: "warning",
  closed: "done",
};

const ACCENT_BADGE_CLASS =
  "status-badge bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800";

export interface StatusBadgeOptions {
  /** Extra utility classes appended to the root. */
  className?: string;
  label?: string;
  /** Visual scale utilities (transform only; margin via className). */
  scale?: "75" | "90";
}

function scaleClass(scale: StatusBadgeOptions["scale"]): string {
  if (scale === "75") {
    return "scale-75";
  }
  if (scale === "90") {
    return "scale-90";
  }
  return "";
}

function badgeClassList(
  base: string,
  options?: Pick<StatusBadgeOptions, "scale" | "className">
): string {
  const parts = [base, scaleClass(options?.scale), options?.className?.trim()]
    .filter(
      (part): part is string => typeof part === "string" && part.length > 0
    )
    .join(" ");
  return parts;
}

/**
 * Unified status badge. Root carries `data-status` (Status enum) for CSS coloring;
 * label is reader-facing copy.
 */
export function renderStatusBadge(
  status: string,
  options?: StatusBadgeOptions
): string {
  const visual = isStatusValue(status) ? status : "neutral";
  const label =
    typeof options?.label === "string" && options.label.length > 0
      ? options.label
      : status;
  return `<span class="${badgeClassList("status-badge", options)}" data-status="${attr(visual)}">${escapeHtml(label)}</span>`;
}

/**
 * Decorative accent chip (no Status enum). Uses `data-tone`; not for status coloring.
 */
export function renderAccentBadge(
  label: string,
  options?: { tone?: string; scale?: "75" | "90"; className?: string }
): string {
  const tone = typeof options?.tone === "string" ? options.tone : "accent";
  return `<span class="${badgeClassList(ACCENT_BADGE_CLASS, options)}" data-tone="${attr(tone)}">${escapeHtml(label)}</span>`;
}
