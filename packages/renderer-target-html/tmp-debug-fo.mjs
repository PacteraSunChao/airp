import { renderMermaidSvg } from "./src/node/render-mermaid-svg.ts";

const src = `flowchart LR
  S["Skill Engine<br/>LLM Output<br/>仅生成 + 校验"] -->|"*.airp.json"| V["@airp/validate<br/>Ajv 2020-12 Core<br/>Schema 封闭类型<br/>i18n 与唯一 ID 门禁<br/>Mermaid parse 守卫"]
  V -->|"Validated"| R["@airp/renderer<br/>Compiler Kernel<br/>封闭 46 Block Catalog<br/>RichText 语义转译<br/>静态 AST 缓存加速"]
  R --> H["HTML5<br/>Interactive"]
  R --> M["Markdown<br/>CommonMark"]`;

const svg = await renderMermaidSvg(src, "dbg");
for (const fo of svg.matchAll(/<foreignObject[^>]*>/g)) {
  console.log(fo[0]);
}
console.log("---label-container rects---");
for (const r of svg.matchAll(/<rect[^>]*>/g)) {
  const s = r[0];
  if (s.includes("label-container") || s.includes('class="basic"')) {
    console.log(s);
  }
}
