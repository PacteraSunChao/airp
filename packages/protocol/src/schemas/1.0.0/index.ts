/**
 * Relative to domain reference (`/Users/maosong/工作/AI/airp/airp-document.schema.json`):
 * - `$id` → `https://airp.local/1.0.0/document.schema.json`
 * - file path → `schemas/1.0.0/document.schema.json` (was `airp-document.schema.json`)
 * - body otherwise unchanged at migrate time (Ajv structural contract only;
 *   LocalizedString defaultLocale / block id uniqueness remain validate-stage gates)
 */
import type { AnySchema } from "ajv";
import documentSchema from "./document.schema.json";

export const schemas: Record<string, AnySchema> = {
  "document.schema.json": documentSchema as AnySchema,
};

/** Document schema relative path for this version (single-file protocol). */
export const DOCUMENT_SCHEMA_REL_PATH = "document.schema.json" as const;
