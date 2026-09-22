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

/** HTML-recognized keys from `targetOptions` (internal; not a contract type). */
export interface HtmlTargetOptionsResolved {
  extraAppHeader?: string;
  extraBody?: string;
  extraHead?: string;
  /** Inserted in `<head>` before the color-scheme apply script. */
  extraHeadPre?: string;
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
  };
}
