import { assertSchemaVersion } from "@airp/protocol";
import type { AirpDocumentSnapshot } from "@airp/renderer-contract";
import {
  asDocumentModel,
  createLocaleFormatContext,
} from "@airp/renderer-shared";
import { documentMetaFor } from "./document-meta/registry.js";
import { emitBlocks } from "./emit-block.js";

/** Emit the full Markdown document body for a knocked-in locale. */
export function emitDocument(
  snapshot: AirpDocumentSnapshot,
  locale: string
): string {
  const doc = asDocumentModel(snapshot);
  const { t } = createLocaleFormatContext(doc, locale);
  const title = t(doc.meta.title as never);
  const subtitle = doc.meta.subtitle ? t(doc.meta.subtitle as never) : "";

  let out = `# ${title}\n\n`;
  if (subtitle) {
    out += `${subtitle}\n\n`;
  }

  assertSchemaVersion(doc.schemaVersion);
  const meta = documentMetaFor(doc.schemaVersion)(doc);
  if (meta.length) {
    out += `${meta.join(" · ")}\n\n`;
  }

  out += "---\n\n";
  out += emitBlocks(doc.blocks, doc, locale);
  return `${out.trimEnd()}\n`;
}
