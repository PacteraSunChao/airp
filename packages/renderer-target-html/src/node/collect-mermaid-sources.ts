import { isRecord } from "@airp/utils";

export interface MermaidSourceRef {
  path: string;
  source: string;
}

function walk(value: unknown, path: string, found: MermaidSourceRef[]): void {
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i += 1) {
      walk(value[i], `${path}/${i}`, found);
    }
    return;
  }

  if (!isRecord(value)) {
    return;
  }

  if (value.type === "mermaid" && typeof value.source === "string") {
    found.push({ path: `${path}/source`, source: value.source });
  }

  for (const [key, child] of Object.entries(value)) {
    if (value.type === "mermaid" && key === "source") {
      continue;
    }
    walk(child, `${path}/${key}`, found);
  }
}

/**
 * Collect Mermaid source strings from mermaid / architectureOverview blocks.
 * Same walk contract as validate's collector (intentional fork; DAG forbids import).
 */
export function collectMermaidSources(
  value: unknown,
  path = ""
): MermaidSourceRef[] {
  const found: MermaidSourceRef[] = [];
  walk(value, path, found);
  return found;
}
