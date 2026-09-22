#!/usr/bin/env node
/**
 * Print the real current datetime for AIRP meta / filenames.
 * Default: UTC ISO 8601 with milliseconds (meta).
 * --filename: local wall clock + UTC offset YYYYMMDD-HHmmss±HHmm.
 */

/**
 * @param {number} value
 * @returns {string}
 */
function pad2(value) {
  return String(value).padStart(2, "0");
}

/**
 * Local wall clock + UTC offset: YYYYMMDD-HHmmss±HHmm
 * @param {Date} date
 * @returns {string}
 */
function formatFilenameTimestamp(date) {
  const yyyy = String(date.getFullYear());
  const mo = pad2(date.getMonth() + 1);
  const dd = pad2(date.getDate());
  const hh = pad2(date.getHours());
  const mi = pad2(date.getMinutes());
  const ss = pad2(date.getSeconds());

  // getTimezoneOffset: minutes west of UTC; invert so east is positive.
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMinutes);
  const offsetHh = pad2(Math.floor(abs / 60));
  const offsetMm = pad2(abs % 60);

  return `${yyyy}${mo}${dd}-${hh}${mi}${ss}${sign}${offsetHh}${offsetMm}`;
}

const mode = process.argv[2];

if (mode !== undefined && mode !== "--filename") {
  console.error("Usage: node scripts/get-current-datetime.mjs [--filename]");
  process.exit(1);
}

const now = new Date();

if (mode === "--filename") {
  console.log(formatFilenameTimestamp(now));
} else {
  console.log(now.toISOString());
}
