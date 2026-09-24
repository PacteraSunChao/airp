/** Read a string targetOption; non-string / missing → undefined (skip). */
export function readTargetOptionString(
  targetOptions: Readonly<Record<string, unknown>> | undefined,
  key: string
): string | undefined {
  if (!targetOptions) {
    return undefined;
  }
  const value = targetOptions[key];
  return typeof value === "string" ? value : undefined;
}

/** Read a boolean targetOption; non-boolean / missing → undefined (skip). */
export function readTargetOptionBoolean(
  targetOptions: Readonly<Record<string, unknown>> | undefined,
  key: string
): boolean | undefined {
  if (!targetOptions) {
    return undefined;
  }
  const value = targetOptions[key];
  return typeof value === "boolean" ? value : undefined;
}

/** HTML-recognized keys from `targetOptions` (internal; not a contract type). */
export interface HtmlTargetOptionsResolved {
  extraAppHeader?: string;
  extraBody?: string;
  extraHead?: string;
  /** Inserted in `<head>` before the color-scheme apply script. */
  extraHeadPre?: string;
  /**
   * Emit each block's Machine Handle as `data-airp-id` so a host can map
   * rendered DOM back to document nodes. Off by default: a render that does not
   * ask for handles stays byte-identical.
   */
  machineHandles?: boolean;
}

/** Resolve HTML keys; unknown keys and wrong types are ignored. */
export function resolveHtmlTargetOptions(
  targetOptions: Readonly<Record<string, unknown>> | undefined
): HtmlTargetOptionsResolved {
  return {
    extraHeadPre: readTargetOptionString(targetOptions, "extraHeadPre"),
    extraHead: readTargetOptionString(targetOptions, "extraHead"),
    extraBody: readTargetOptionString(targetOptions, "extraBody"),
    extraAppHeader: readTargetOptionString(targetOptions, "extraAppHeader"),
    machineHandles: readTargetOptionBoolean(targetOptions, "machineHandles"),
  };
}
