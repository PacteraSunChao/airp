import { toPosixPath } from "@airp/utils";

/**
 * Normalize an output-tree relative path to POSIX form.
 * Rejects empty, absolute, trailing-slash, and `..` / `.` segments.
 */
export function normalizeRelPath(relPath: string): string {
  const posix = toPosixPath(relPath, { stripLeadingDotSlash: true });
  if (!posix || posix.startsWith("/") || posix.endsWith("/")) {
    throw new Error(`Invalid output relative path: ${relPath}`);
  }
  const segments = posix.split("/");
  if (
    segments.some(
      (segment) => segment === "" || segment === "." || segment === ".."
    )
  ) {
    throw new Error(`Invalid output relative path: ${relPath}`);
  }
  return posix;
}
