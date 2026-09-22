export interface RendererCase {
  document: string;
  /** Which renderer entry to exercise. Default: isomorphic. */
  entry?: "isomorphic" | "node";
  expect:
    | {
        ok: true;
        format: "html" | "markdown";
        contains: string[];
        notContains?: string[];
      }
    | {
        ok: false;
        codes: string[];
      };
  id: string;
  target: string;
}
