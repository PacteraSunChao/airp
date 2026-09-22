## Mermaid authoring (AIRP)

`mermaid` and `architectureOverview.overview` must use valid Mermaid syntax. `validate-airp.mjs` runs `mermaid.parse()` (Node; no render) and fails closed on syntax errors.

### Official references

- [Syntax reference](https://mermaid.js.org/intro/syntax-reference.html)
- [Flowchart](https://mermaid.js.org/syntax/flowchart.html) — node shapes, edge labels, special characters
- [Sequence diagram](https://mermaid.js.org/syntax/sequenceDiagram.html)
- [mermaid.parse() API](https://mermaid.js.org/config/setup/modules/mermaidAPI.html#parse)

### Hard rules (flowchart)

1. **Labels with `/`, `#`, commas, or unmatched brackets** — quoted rectangle: `id["/airp Skill"]`. Do not use slash-delimited shapes such as `id[/airp Skill]` (the `/` breaks the lexer).

2. **Stadium** — always: `id@{ shape: stadium, label: "Label text" }`.

3. **Paths and file names in nodes** — always quote: `D1["path/to/schemas/"]`.

4. **Edge labels with special characters** — quoted edges: `A -->|"O(1) lookup"| B`.

5. **Subgraph titles** — avoid raw `]` / `[`; prefer simple ASCII or quoted forms where supported.

6. **Reserved words as node IDs** — do not use bare `end`, `subgraph`, `graph`; use `endNode["end"]` etc.

### Sequence diagrams

- Participant aliases with `/` or parentheses are usually fine: `participant A as Agent (/airp)`.
- Message text with colons/slashes: prefer quoted descriptions if parse fails.

### After editing

Re-run validation (see `SKILL.md`). If Mermaid parse fails, fix `source` per the rules above.

### Examples

| Bad | Good |
|-----|------|
| `SK1[/airp Skill]` | `SK1["/airp Skill"]` |
| `D1[path/to/foo]` | `D1["path/to/foo"]` |
| `id([/cmd])` | `id@{ shape: stadium, label: "/cmd" }` |
