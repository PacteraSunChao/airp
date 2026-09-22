export interface MarkdownRenderCase {
  document: string;
  expect:
    | {
        ok: true;
        contains: string[];
        notContains?: string[];
      }
    | {
        ok: false;
        code: string;
      };
  id: string;
}
