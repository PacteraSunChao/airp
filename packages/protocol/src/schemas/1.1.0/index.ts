/**
 * AIRP document schema set for schemaVersion 1.1.0.
 * - Single locale via `i18n.locale`
 * - PlainString / MarkdownString for user-visible text (no LocalizedString / RichText / InlineNode)
 * - Machine handle `@id` (`^[a-z0-9]{10}$`) on blocks and structured objects
 * - meta.createdBy / meta.updatedBy (no meta.authors)
 */
import type { AnySchema } from "ajv";
import documentSchema from "./document.schema.json";

export const schemas: Record<string, AnySchema> = {
  "document.schema.json": documentSchema as AnySchema,
};

/** Document schema relative path for this version (single-file protocol). */
export const DOCUMENT_SCHEMA_REL_PATH = "document.schema.json" as const;
