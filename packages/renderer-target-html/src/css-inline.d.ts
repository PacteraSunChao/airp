declare module "*.css?inline" {
  const css: string;
  export default css;
}

declare module "*.json" {
  const value: {
    version: string;
    [key: string]: unknown;
  };
  export default value;
}

declare module "postcss-import" {
  import type { Plugin } from "postcss";

  function postcssImport(options?: Record<string, unknown>): Plugin;
  export default postcssImport;
}
