/** Opaque cross-layer metadata bag; each package owns its namespaced entry key. */
export type AirpPayload = Readonly<Record<string, unknown>>;

export interface AirpCtx {
  payload: AirpPayload;
}

/** Return a new payload with one namespaced entry (shallow merge). */
export function withPayloadEntry<K extends string, V>(
  payload: AirpPayload | undefined,
  key: K,
  entry: V
): AirpPayload {
  return { ...payload, [key]: entry };
}

/** Read one namespaced entry from a payload bag. */
export function getPayloadEntry<V>(
  payload: AirpPayload | undefined,
  key: string
): V | undefined {
  return payload?.[key] as V | undefined;
}
