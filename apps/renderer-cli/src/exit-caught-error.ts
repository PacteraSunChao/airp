import { logInternalError } from "@airp/diagnostics";
import type { Logger } from "@airp/utils";
import { UsageError } from "@airp/utils/node";

/** Map caught errors to CLI exit codes (1 = usage/domain, 2 = unexpected). */
export function exitCaughtError(log: Logger, error: unknown): never {
  if (error instanceof UsageError) {
    log.error(error.message);
    process.exit(1);
  }
  logInternalError(log, error);
  process.exit(2);
}
