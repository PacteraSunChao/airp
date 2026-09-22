import { isRecord } from "@airp/utils";

export interface CodeSourceRef {
  code: string;
  diff: boolean;
  language?: string;
  path: string;
}

function pushCodeDiffSources(
  block: Record<string, unknown>,
  path: string,
  found: CodeSourceRef[]
): void {
  if (typeof block.unified === "string") {
    found.push({
      path: `${path}/codeDiff/unified`,
      code: block.unified,
      language: "diff",
      diff: true,
    });
  }
  // before/after split is rendered via jsdiff in emit (no Shiki queue entry).
}

function shouldSkipChild(type: unknown, key: string): boolean {
  if (type === "code" && key === "code") {
    return true;
  }
  return (
    type === "codeDiff" &&
    (key === "unified" || key === "before" || key === "after")
  );
}

function walk(value: unknown, path: string, found: CodeSourceRef[]): void {
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i += 1) {
      walk(value[i], `${path}/${i}`, found);
    }
    return;
  }

  if (!isRecord(value)) {
    return;
  }

  if (value.type === "code" && typeof value.code === "string") {
    found.push({
      path: `${path}/code`,
      code: value.code,
      language: typeof value.language === "string" ? value.language : undefined,
      diff: false,
    });
  } else if (value.type === "codeDiff") {
    pushCodeDiffSources(value, path, found);
  }

  for (const [key, child] of Object.entries(value)) {
    if (shouldSkipChild(value.type, key)) {
      continue;
    }
    walk(child, `${path}/${key}`, found);
  }
}

/** Collect code / codeDiff payloads in document order for Shiki SSR. */
export function collectCodeSources(value: unknown, path = ""): CodeSourceRef[] {
  const found: CodeSourceRef[] = [];
  walk(value, path, found);
  return found;
}
