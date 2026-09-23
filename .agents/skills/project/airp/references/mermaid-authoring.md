# Mermaid authoring (AIRP)

Source for `mermaid` and `architectureOverview.overview` must be valid Mermaid so readers see a diagram. `validate-airp.mjs` / `airp-validate` do **not** parse Mermaid—invalid source may still print `OK  validate`; HTML export (`airp-render`) shows an in-page error block at that diagram.

## Official references

- [Syntax reference](https://mermaid.js.org/intro/syntax-reference.html)
- [Flowchart](https://mermaid.js.org/syntax/flowchart.html) — node shapes, edge labels, special characters
- [Sequence diagram](https://mermaid.js.org/syntax/sequenceDiagram.html)

## Flowchart hard rules

1. **Labels with `/`, `#`, commas, or unpaired parentheses** — use a quoted rectangle: `id["/airp Skill"]`. Do not use slash shape `id[/airp Skill]` (`/` splits the lexer).
2. **Stadium** — always: `id@{ shape: stadium, label: "Label text" }`.
3. **Paths/filenames inside nodes** — always quote: `D1["path/to/schemas/"]`.
4. **Edge labels with special characters** — quoted edges: `A -->|"O(1) lookup"| B`.
5. **Subgraph titles** — avoid bare `]` / `[`; prefer plain ASCII or quoted forms where supported.
6. **Reserved words as node IDs** — do not use bare `end` / `subgraph` / `graph`; use `endNode["end"]` etc.

## Sequence diagram

- Participant aliases with `/` or parentheses are usually fine: `participant A as Agent (/airp)`.
- Message text with colons/slashes: switch to a quoted description if special characters break the diagram.

## Contrast

| Bad | Good |
|-----|------|
| `SK1[/airp Skill]` | `SK1["/airp Skill"]` |
| `D1[path/to/foo]` | `D1["path/to/foo"]` |
| `id([/cmd])` | `id@{ shape: stadium, label: "/cmd" }` |
