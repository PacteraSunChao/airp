export interface HtmlRenderCase {
  document: string;
  /** Which package entry to exercise. Default: isomorphic. */
  entry?: "isomorphic" | "node";
  expect:
    | {
        ok: true;
        contains: string[];
        notContains?: string[];
        /** Assert Mermaid figures embed SVG via svg-viewer shell attributes. */
        hasSvgViewer?: boolean;
        /** Assert multi-diagram SVG root ids do not collide. */
        distinctMermaidSvgIds?: boolean;
        /** Assert host slot markup appears in the assembled document. */
        hasExtraAppHeader?: boolean;
        /** Assert extraHeadPre precedes the color-scheme apply script. */
        hasExtraHeadPre?: boolean;
        /** Assert section blocks carry anchor ids. */
        hasSectionAnchors?: boolean;
        /** Assert floating page TOC lists every section 1:1. */
        hasPageToc?: boolean;
        /** Assert hero metric values retain their semantic tones. */
        hasHeroMetricTones?: boolean;
        /** Assert tabs expose accessible tabs and panels. */
        hasInteractiveTabs?: boolean;
        /** Assert visible agent notes expose human-facing chrome. */
        hasAgentNoteChrome?: boolean;
        /** Assert appendix chrome contains only its title. */
        hasAppendixTitleOnly?: boolean;
      }
    | { ok: false; code: string };
  id: string;
  targetOptions?: Readonly<Record<string, unknown>>;
}
