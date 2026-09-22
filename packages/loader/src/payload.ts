import {
  type AirpPayload,
  getPayloadEntry,
  withPayloadEntry,
} from "@airp/utils";

export const PAYLOAD_KEY = "loader.document" as const;

export interface DocumentPayloadEntry {
  sourcePath?: string;
}

/** Attach loader metadata to the host payload bag. */
export function withDocumentPayload(
  payload: AirpPayload | undefined,
  entry: DocumentPayloadEntry
): AirpPayload {
  return withPayloadEntry(payload, PAYLOAD_KEY, entry);
}

/** Read loader metadata from the host payload bag. */
export function readDocumentPayload(
  payload: AirpPayload | undefined
): DocumentPayloadEntry | undefined {
  return getPayloadEntry<DocumentPayloadEntry>(payload, PAYLOAD_KEY);
}
