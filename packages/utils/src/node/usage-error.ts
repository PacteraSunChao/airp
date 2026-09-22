/** Thrown for CLI flag / argument mistakes that the user can fix. */
export class UsageError extends Error {
  override name = "UsageError";
}
