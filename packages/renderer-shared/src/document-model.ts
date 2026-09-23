/** Locale → string map (object form of LocalizedString; schema 1.0.0). */
export type LocalizedStringMap = Readonly<Record<string, string>>;

/** Plain string or locale map (1.0.0); 1.1.0 documents use plain string only. */
export type LocalizedString = string | LocalizedStringMap;

export type InlineNode =
  | { type: "text"; value: string }
  | { type: "code"; value: string }
  | { type: "strong"; children: InlineNode[] }
  | { type: "link"; href: string; children: InlineNode[] };

/** Markdown-lite string, inline node array, or locale map (schema 1.0.0). */
export type RichText = string | InlineNode[] | LocalizedStringMap;

/** schema 1.0.0: chrome strings per locale (1.1.0 forbids `i18n.ui`). */
export type I18nUiByLocale = Readonly<
  Record<string, Readonly<Record<string, string>>>
>;

export interface AirpDocumentModel {
  blocks: readonly unknown[];
  i18n: {
    /** schema 1.0.0 */
    defaultLocale?: string;
    /** schema 1.1.0 — single document locale */
    locale?: string;
    /** schema 1.0.0 */
    locales?: readonly string[];
    /** schema 1.0.0 only */
    ui?: I18nUiByLocale;
  };
  meta: {
    /** schema 1.0.0 */
    authors?: readonly string[];
    createdAt?: string;
    /** schema 1.1.0 */
    createdBy?: string;
    kind?: string;
    sourceRefs?: readonly {
      label?: LocalizedString;
      type: string;
      value: string;
    }[];
    subtitle?: LocalizedString;
    tags?: readonly string[];
    title: LocalizedString;
    updatedAt?: string;
    /** schema 1.1.0 */
    updatedBy?: string;
  };
  schemaVersion: string;
}

/** Structural block with a `type` discriminator. */
export interface BlockBase {
  type: string;
  [key: string]: unknown;
}
