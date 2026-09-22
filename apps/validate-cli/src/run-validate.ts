import { airpResultFrom, logInternalError, withStage } from "@airp/diagnostics";
import { loadDocumentFile } from "@airp/loader/node";
import type { AirpCtx } from "@airp/utils";
import { createCliLogger, UsageError } from "@airp/utils/node";
import { type ValidationResult, validateDocument } from "@airp/validate/node";
import { withCliPayload } from "./payload.js";
import { renderValidationResult } from "./render.js";

export interface ValidateRunOptions {
  input: string;
  reporter: "text" | "json";
}

export async function runValidate(
  options: ValidateRunOptions
): Promise<number> {
  const { input, reporter } = options;
  const log = createCliLogger();

  const ctx: AirpCtx = {
    payload: withCliPayload(undefined, {
      sourcePath: input,
    }),
  };

  let result: ValidationResult;
  try {
    const loadResult = await loadDocumentFile(input, ctx);
    if (loadResult.ok) {
      result = await validateDocument(loadResult.value.document);
    } else {
      result = airpResultFrom(withStage(loadResult.diagnostics, "bootstrap"));
    }
  } catch (error) {
    if (error instanceof UsageError) {
      log.error(error.message);
      return 1;
    }
    logInternalError(log, error);
    return 2;
  }

  renderValidationResult(result, { reporter, log, ctx });
  return result.ok ? 0 : 1;
}
