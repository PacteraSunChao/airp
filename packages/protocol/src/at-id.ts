/**
 * Machine handle (`@id`) — protocol-level SSOT.
 *
 * Schema Version `1.1.0` requires a document-unique handle on every Block and on
 * every structured object (`schemas/1.1.0/document.schema.json` `$defs/AtId`).
 * Producers — the `/airp` Skill, the editor — and validators must agree with the
 * constants below; do not re-declare the alphabet, length, or pattern.
 */

/** Characters allowed in a machine handle: lowercase latin letters and digits. */
export const AT_ID_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

/** Exact machine-handle length. */
export const AT_ID_LENGTH = 10;

/** Machine-handle shape; mirrors `$defs/AtId` in the `1.1.0` document schema. */
export const AT_ID_PATTERN = /^[a-z0-9]{10}$/;

/**
 * Largest multiple of the alphabet size that fits in a byte: bytes at or above
 * it are dropped so every character keeps the same probability (a plain
 * `byte % 36` would favor the first four characters).
 */
const UNBIASED_BYTE_LIMIT =
  Math.floor(256 / AT_ID_ALPHABET.length) * AT_ID_ALPHABET.length;

/** Narrow an unknown value to a well-formed machine handle. */
export function isAtId(value: unknown): value is string {
  return typeof value === "string" && AT_ID_PATTERN.test(value);
}

function randomBytes(length: number): Uint8Array {
  const { crypto } = globalThis;
  if (!crypto || typeof crypto.getRandomValues !== "function") {
    throw new Error(
      "AIRP machine handles require Web Crypto (crypto.getRandomValues)"
    );
  }
  return crypto.getRandomValues(new Uint8Array(length));
}

/**
 * Generate one well-formed machine handle.
 *
 * Document-level uniqueness is the caller's concern: `@id` must be unique across
 * the whole `*.airp.json`, so a caller generating several handles has to avoid
 * the ones the document already carries.
 */
export function generateAtId(): string {
  const chars: string[] = [];
  while (chars.length < AT_ID_LENGTH) {
    for (const byte of randomBytes(AT_ID_LENGTH)) {
      if (byte < UNBIASED_BYTE_LIMIT) {
        chars.push(AT_ID_ALPHABET.charAt(byte % AT_ID_ALPHABET.length));
        if (chars.length === AT_ID_LENGTH) {
          break;
        }
      }
    }
  }
  return chars.join("");
}
