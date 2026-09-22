import type { Stats } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import {
  type AirpFailResult,
  type AirpResult,
  airpResultFrom,
  diagnostic,
  prefixFile,
} from "@airp/diagnostics";
import type { AirpCtx } from "@airp/utils";
import { LOADER_NODE_INPUT_UNAVAILABLE } from "../diagnostic-codes.js";
import { loadDocumentJson } from "../load.js";
import { withDocumentPayload } from "../payload.js";
import type { LoadedDocument } from "../types.js";

type InputUnavailableReason = "not-file" | "not-found" | "not-readable";

function inputUnavailable(
  sourcePath: string,
  reason: InputUnavailableReason,
  message: string
): AirpFailResult {
  return airpResultFrom([
    diagnostic(LOADER_NODE_INPUT_UNAVAILABLE, message, {
      details: { reason, sourcePath },
      location: { file: sourcePath },
    }),
  ]) as AirpFailResult;
}

function errnoCode(error: unknown): string | undefined {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code: unknown }).code;
    return typeof code === "string" ? code : undefined;
  }
  return undefined;
}

/** Read a single `*.airp.json` file from disk into a loaded document. */
export async function loadDocumentFile(
  filePath: string,
  ctx?: AirpCtx
): Promise<AirpResult<LoadedDocument>> {
  const resolved = path.resolve(filePath);

  let fileStat: Stats;
  try {
    fileStat = await stat(resolved);
  } catch (error) {
    const code = errnoCode(error);
    if (code === "ENOENT") {
      return inputUnavailable(
        resolved,
        "not-found",
        `Document file not found: ${resolved}`
      );
    }
    if (code === "EACCES" || code === "EPERM") {
      return inputUnavailable(
        resolved,
        "not-readable",
        `Document file is not readable: ${resolved}`
      );
    }
    throw error;
  }

  if (!fileStat.isFile()) {
    return inputUnavailable(
      resolved,
      "not-file",
      `Document input is not a file: ${resolved}`
    );
  }

  let text: string;
  try {
    text = await readFile(resolved, "utf8");
  } catch (error) {
    const code = errnoCode(error);
    if (code === "EACCES" || code === "EPERM") {
      return inputUnavailable(
        resolved,
        "not-readable",
        `Document file is not readable: ${resolved}`
      );
    }
    throw error;
  }

  if (ctx) {
    ctx.payload = withDocumentPayload(ctx.payload, { sourcePath: resolved });
  }

  const loaded = loadDocumentJson(text);
  if (!loaded.ok) {
    return airpResultFrom(
      prefixFile(loaded.diagnostics, resolved)
    ) as AirpFailResult;
  }

  return airpResultFrom(loaded.diagnostics, {
    ...loaded.value,
    sourcePath: resolved,
  });
}
