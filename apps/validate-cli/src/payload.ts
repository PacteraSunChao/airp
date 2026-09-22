import { withDocumentPayload } from "@airp/loader";
import type { AirpPayload } from "@airp/utils";

/** Seed CLI payload with the input document path. */
export function withCliPayload(
  payload: AirpPayload | undefined,
  entry: { sourcePath: string }
): AirpPayload {
  return withDocumentPayload(payload, entry);
}
