import type { RenderTarget } from "@airp/renderer";
import { UsageError } from "@airp/utils/node";
import type { CommonRenderOptions } from "../command-types.js";

export const RENDER_TARGETS = ["html", "markdown"] as const;

/** Shared CLI args for export / watch / worker (kebab-case surface). */
export const commonRenderArgs = {
  target: {
    type: "enum" as const,
    options: [...RENDER_TARGETS],
    default: "html" as const,
    description: "html | markdown",
  },
  input: {
    type: "string" as const,
    description: "Path to a single *.airp.json document",
    required: true as const,
  },
};

function readOptionalString(
  args: Record<string, unknown>,
  kebab: string,
  camel: string
): string | undefined {
  const value = args[kebab] ?? args[camel];
  return typeof value === "string" ? value : undefined;
}

/** Map citty args (kebab + camel dual keys) onto typed render options. */
export function readCommonRenderArgs(
  args: Record<string, unknown>
): CommonRenderOptions {
  const input = readOptionalString(args, "input", "input");
  if (!input) {
    throw new UsageError("Missing required argument: --input");
  }
  return {
    target: args.target as RenderTarget,
    input,
  };
}

export function readOptionalOut(
  args: Record<string, unknown>
): string | undefined {
  return readOptionalString(args, "out", "out");
}
