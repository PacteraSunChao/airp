## AIRP Block selection

Maps **content shape** → `blocks`. Schema remains SSOT: `../schemas/document.schema.json`. If names here diverge from the schema, follow the schema.

### Inputs

- **Locale**: chat language or `--locale` → `i18n.locale` (see `SKILL.md`)
- **Evidence**: optional paths/files/diff summaries → `meta.sourceRefs` when needed
- **Meta attribution / timestamps**: `current-datetime.md`

### Hard defaults

- **Independence**: design from this request’s content shape and the rules below. Do **not** treat existing `*.airp.json` under the output directory as a template unless the user **explicitly** names documents to follow. Named references guide intent/structure only; still satisfy the schema and these rules.
- **`@id`**: every Block and structured object needs a unique `@id` (`^[a-z0-9]{10}$`); batch-generate with `scripts/gen-airp-ids.mjs`. String-only list items do not get `@id`.
- Prefer `table` when rows ≥ 4 or columns ≥ 3 and alignment/comparison matters.
- Wrap `code` / `codeDiff` in `collapsible` when the body exceeds **40 lines** (summary explains why).
- Mermaid density:
  - ≤10 nodes: one `mermaid`
  - Medium: split into multiple `mermaid` under `section`
  - Complex topology: `architectureOverview` (overview + module cards)

### Block routing

#### 1) Document top

- `hero`: only the 3–8 most critical metrics (optional)
- `lead`: one-sentence context/goal (strongly recommended)

#### 2) Sections

Wrap each major topic in `section` with a stable `@id` (TOC/anchors; generate via `scripts/gen-airp-ids.mjs`):

- `section` (Diagnosis / Findings / Plan / Risks / Appendix …)
  - `lead` (optional): one-sentence purpose
  - children: per rules below

#### 3) Structured content

- Strong alignment / comparison / matrix: `table`
- Before/After two-column: `comparison`
- Status board (pass/fail/partial, …): `statusBoard`
- Execution checklist: `checklist`
- Definitions / terms: `definitionList` or `glossary`
- Key-value metadata: `keyValueList`

#### 4) Code

- Short snippet: `code`
- Clear diff: `codeDiff`
- Beyond 40 lines: outer `collapsible`, inner `code` or `codeDiff`

#### 5) Diagrams

- Flow / sequence / ER / state / class: `mermaid`
- Complex system overview + modules: `architectureOverview`
  - `overview`: simplified relationship diagram (mermaid source)
  - `modules`: one card per module (`collectionItem`)
- Authoring: `mermaid-authoring.md`

#### 6) Governance

- Decisions: `decision`
- Risks: `risk`
- Assumptions: `assumption`
- Constraints: `constraint` (emphasize when `nonNegotiable`)
- Open questions: `openQuestion`

#### 7) Density

- Secondary / long: `collapsible`
- Multiple perspectives: `tabs`
- Citations / external links: `citation` / `linkList`

#### 8) Agent-only notes

- `agentNote`: machine/agent remarks; `visible: true` only when humans must see it in render output
