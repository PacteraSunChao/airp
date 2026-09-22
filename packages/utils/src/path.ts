const BACKSLASH = /\\/g;
const LEADING_DOT_SLASH = /^\.\//;

export interface ToPosixPathOptions {
  /** Strip a single leading `./`. */
  stripLeadingDotSlash?: boolean;
}

/** Normalize separators to `/`; optionally strip a leading `./`. */
export function toPosixPath(
  value: string,
  options: ToPosixPathOptions = {}
): string {
  let out = value.replace(BACKSLASH, "/");
  if (options.stripLeadingDotSlash) {
    out = out.replace(LEADING_DOT_SLASH, "");
  }
  return out;
}

/** Last segment of a POSIX path (or URI path). */
export function posixBasename(posixPath: string): string {
  const slash = posixPath.lastIndexOf("/");
  return slash === -1 ? posixPath : posixPath.slice(slash + 1);
}
