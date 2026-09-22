#!/usr/bin/env node
/**
 * Generate AIRP 1.1.0 machine handles (`@id`): exactly 10 chars of [a-z0-9].
 *
 * Usage:
 *   node scripts/gen-airp-ids.mjs           # one id
 *   node scripts/gen-airp-ids.mjs 5         # five ids, one per line
 *   node scripts/gen-airp-ids.mjs --count 5
 */
import { randomInt } from "node:crypto";
import { fileURLToPath } from "node:url";

const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
const ID_LENGTH = 10;

/**
 * @returns {string}
 */
export function generateAirpId() {
  let out = "";
  for (let i = 0; i < ID_LENGTH; i += 1) {
    out += ALPHABET[randomInt(ALPHABET.length)];
  }
  return out;
}

/**
 * @param {number} count
 * @param {Set<string>} [avoid]
 * @returns {string[]}
 */
export function generateAirpIds(count, avoid = new Set()) {
  if (!Number.isInteger(count) || count < 1) {
    throw new Error("count must be a positive integer");
  }
  const used = new Set(avoid);
  const ids = [];
  while (ids.length < count) {
    const id = generateAirpId();
    if (used.has(id)) {
      continue;
    }
    used.add(id);
    ids.push(id);
  }
  return ids;
}

/**
 * @param {string[]} argv
 * @returns {number | null}
 */
function parseCount(argv) {
  if (argv.length === 0) {
    return 1;
  }
  if (argv[0] === "--help" || argv[0] === "-h") {
    return null;
  }
  if (argv[0] === "--count") {
    const n = Number(argv[1]);
    if (!Number.isInteger(n) || n < 1) {
      throw new Error("Usage: node scripts/gen-airp-ids.mjs [--count] <n>");
    }
    return n;
  }
  const n = Number(argv[0]);
  if (!Number.isInteger(n) || n < 1 || argv.length > 1) {
    throw new Error("Usage: node scripts/gen-airp-ids.mjs [--count] <n>");
  }
  return n;
}

const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url);

if (isDirectRun) {
  try {
    const count = parseCount(process.argv.slice(2));
    if (count === null) {
      console.log("Usage: node scripts/gen-airp-ids.mjs [--count] <n>");
      process.exit(0);
    }
    for (const id of generateAirpIds(count)) {
      console.log(id);
    }
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }
}
