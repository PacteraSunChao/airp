# Block authoring

Pick a **`type`** by content shape, then write the matching **block** (`blocks` / nested `children`). Fields, enums, and nesting follow `../schemas/document.schema.json`; on conflict, follow the schema. Before writing a block, read the matching `*Block` def in the schema.

v1.1.0 has **46** `type` values (see **Block catalog**). Choose the closest fit; do not invent a `type`. Use layout blocks to set reading order; short docs may stay flat—do not fill a fixed section template. Common order: opening (`hero`? → `lead`) → body (`section` as needed) → closing (`appendix` / `agentNote`). When to use each `type` is in the catalog below. Workflow, `@id`, locale, paths, and validation → `../SKILL.md`.

---

## Block catalog (46)

Each row: **purpose** · **prefer when**. Property shape → `$defs` in parentheses.

### 1. Layout (7)

| `type` | Purpose | Prefer when |
|--------|---------|-------------|
| `hero` | Opening metrics bar (optional badges) | **3–8** KPIs to scan side by side; 1–2 usually not worth it (`HeroBlock`) |
| `section` | Titled topic block (nestable) | Large topics that need TOC/anchors; short docs may omit (`SectionBlock`) |
| `group` | Untitled or lightly titled cluster | Related blocks grouped together, not in TOC (`GroupBlock`) |
| `appendix` | Appendix | Spec dumps, long logs, inventories off the main reading path (`AppendixBlock`) |
| `divider` | Visual/topic break (optional label) | Split sibling topics inside a section without a new `heading` (`DividerBlock`) |
| `spacer` | Vertical whitespace (`sm` / `md` / `lg`) | Density tuning (`SpacerBlock`) |
| `heading` | Standalone heading (levels 1–6) | Extra title inside a section when nesting another `section` is overkill (`HeadingBlock`) |

### 2. Narrative and emphasis (5)

| `type` | Purpose | Prefer when |
|--------|---------|-------------|
| `paragraph` | Body (markdown-lite inline) | Ordinary explanation or narrative (`ParagraphBlock`) |
| `lead` | One framing / goal sentence | Opening or section start; strongly recommended at doc start (`LeadBlock`) |
| `pullQuote` | Short highlighted quote (optional attribution) | One line worth remembering (`PullQuoteBlock`) |
| `blockquote` | Longer quotation | Source quotes longer than a pull quote (`BlockquoteBlock`) |
| `callout` | Callout box (`info` / `tip` / `success` / `warning` / `danger`) | Warnings/tips that must break out of body flow (`CalloutBlock`) |

### 3. Lists (4)

| `type` | Purpose | Prefer when |
|--------|---------|-------------|
| `bulletList` | Unordered bullets | Flat facts; no status/check semantics (`BulletListBlock`) |
| `numberedList` | Ordered steps / ranking | Order or priority matters (`NumberedListBlock`) |
| `checklist` | Checkable action items | Execution / acceptance TODOs (`ChecklistBlock`) |
| `definitionList` | Term → definition | Local terms; full-doc glossary → `glossary` (`DefinitionListBlock`) |

### 4. Structured data and comparison (5)

| `type` | Purpose | Prefer when |
|--------|---------|-------------|
| `table` | Column grid (typed cells, optional footer) | ≥ 4 rows or ≥ 3 columns needing aligned comparison; few label/value rows → `keyValueList` or a list (`TableBlock`) |
| `comparison` | Before/after nested blocks | Clear two-sided change narrative (`ComparisonBlock`) |
| `collection` | Item cards/metrics (`card` / `metric` / `stat` / `chip` / `panel` / `compact`) | Homogeneous item gallery or KPI tiles (not a full `hero`) (`CollectionBlock`) |
| `keyValueList` | Label/value metadata rows | Config, env, IDs, short metadata; prefer over `table` when rows are few (`KeyValueListBlock`) |
| `statusBoard` | Named items with status/tone | Pass/fail boards, readiness (`StatusBoardBlock`) |

### 5. Code and files (4)

| `type` | Purpose | Prefer when |
|--------|---------|-------------|
| `code` | Single code snippet (language / filename / highlight) | Short examples; wrap in `collapsible` when body > **40** lines (summary explains why) (`CodeBlock`) |
| `codeDiff` | Unified or before/after diff | Clear patch / code before-after; same `collapsible` rule above **40** lines (`CodeDiffBlock`) |
| `fileTree` | Nested path tree (optional change markers) | Show layout or tree-shaped changes (`FileTreeBlock`) |
| `fileChangeList` | Flat path change list | Add/remove/modify summary without tree depth (`FileChangeListBlock`) |

### 6. Diagrams and flows (3)

| `type` | Purpose | Prefer when |
|--------|---------|-------------|
| `mermaid` | Mermaid source | Flow/sequence/ER/state etc.; ≤10 nodes per diagram; medium → multiple diagrams in a `section`; authoring → `mermaid-authoring.md` (`MermaidBlock`) |
| `architectureOverview` | Overview mermaid + module cards | Complex topology needing both a map and per-module notes (`ArchitectureOverviewBlock`) |
| `flowSteps` | Linear numbered steps | Human procedure / pipeline stages without a diagram (`FlowStepsBlock`) |

### 7. Governance (5)

| `type` | Purpose | Prefer when |
|--------|---------|-------------|
| `decision` | Decision record (options, chosen, status) | ADR-style: proposed / accepted / rejected / … (`DecisionBlock`) |
| `risk` | Risk (severity + optional likelihood / mitigation) | Threats to track (`RiskBlock`) |
| `assumption` | Assumption (+ whether validated) | Dependencies that may be wrong if unconfirmed (`AssumptionBlock`) |
| `constraint` | Hard rule (+ scope / `nonNegotiable`) | Limits that must not be broken or must be followed (`ConstraintBlock`) |
| `openQuestion` | Open question (+ `blocking`) | Unknowns that block or affect next steps (`OpenQuestionBlock`) |

### 8. Time and plans (2)

| `type` | Purpose | Prefer when |
|--------|---------|-------------|
| `timeline` | Chronological events | Incident history, release chronology, audit trail (`TimelineBlock`) |
| `roadmap` | Phased plan + goals | Forward-looking milestones / phases (`RoadmapBlock`) |

### 9. Engineering inventories (3)

| `type` | Purpose | Prefer when |
|--------|---------|-------------|
| `requirementTrace` | Requirement ID → coverage / notes | Requirements-to-work traceability matrix (`RequirementTraceBlock`) |
| `testResult` | Suite / case results | Automated or manual test results (`TestResultBlock`) |
| `apiInventory` | Endpoint catalog | HTTP/RPC inventory (method, path, notes) (`ApiInventoryBlock`) |

### 10. References and media (5)

| `type` | Purpose | Prefer when |
|--------|---------|-------------|
| `linkList` | Grouped links | Related URLs / doc indexes (`LinkListBlock`) |
| `glossary` | Full-document glossary | Shared vocabulary for the whole doc (`GlossaryBlock`) |
| `citation` | Literature / source citation | Formal sources backing claims (`CitationBlock`) |
| `image` | Image (required `alt`) | Screenshots, image files (`ImageBlock`) |
| `embed` | External embed | Figma / video / boards etc. (`EmbedBlock`) |

### 11. Density and multi-view (2)

| `type` | Purpose | Prefer when |
|--------|---------|-------------|
| `collapsible` | Collapsible child blocks | Secondary / long material; required for `code` / `codeDiff` > 40 lines (`CollapsibleBlock`) |
| `tabs` | Side-by-side panels (≥ 2) | Same topic, multiple views (locale samples, env variants, alternate designs) (`TabsBlock`) |

### 12. Agent-only (1)

| `type` | Purpose | Prefer when |
|--------|---------|-------------|
| `agentNote` | Agent note (`visible` defaults to false) | Internal notes, prefer end of doc; set `visible: true` only when humans must see it in the render (`AgentNoteBlock`) |
