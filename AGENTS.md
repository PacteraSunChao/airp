# AGENTS

本文档用于索引本项目的各类规范与边界（SSOT）；代码、文件等具体的生成步骤由各 Skill 负责（本文档不重复阐述）。

**路径真源**：`.agents/registry.yaml`。正文中的文档 ID **必须**以 `registry://` 开头（如 `` `registry://rules.code-styles` ``、 `` `registry://shared.delivery-prerequisites` ``）；`registry://` 之后为 `rules.*` / `skills.*` / `shared.*` 点分路径，在 registry 中解析为 `path` 后打开文件（包入口为 `path` 字段，子文档为嵌套 map 叶子）。

## 变更后的质量检查

根目录 `pnpm check` / `pnpm fix` 均先跑 `check-agents-registry`、`check-testing-surface` 与 `check-runtime-entries`，再 `turbo run check` / `fix`。

| 场景 | 须执行 | 细则 |
|------|--------|------|
| 受约束源码（`*.ts`、`*.tsx`、`*.mjs` 等）交付前 | 根目录 `pnpm fix`；本地可按包收窄，如 `pnpm --filter @airp/validate fix` | `registry://skills.code-fix` |
| 改 `packages/**/src`、`apps/**/src` 或 `fixtures/airp/**` | 同步 Unit/Package/E2E 测试与 case，并跑 `pnpm test` | `registry://skills.test-sync` |
| 更新 `CHANGELOG.md`、整理发版说明 / Unreleased | 按最新 `vX.Y.Z` tag 与工作区净效果写用户可见条目 | `registry://skills.changelog` |
| 勾选任一 rule / skill checklist 前 | 先满足交付前联动 | `registry://shared.delivery-prerequisites` |
| 用户可见文案、协议概念命名或术语表相关标识符 | 按术语表选词 | `registry://shared.terminology` |

**测试结构事实**（各包 Tier、case 注册）：`<workspace>/test/surface.json`（类型见 `@airp/test-kit` 的 `PackageTestSurface`）；全仓一览：`pnpm list-testing-surface`。

## 规范索引（rules SSOT）

| ID | 标题 | when | skill |
|----|------|------|-------|
| `registry://rules.technology-stack` | 项目技术栈规范（SSOT） | 任何涉及框架、依赖与常用脚本的约定，都应优先遵循对应规范文档 | — |
| `registry://rules.package-boundaries` | 包边界规范（SSOT） | 新增/移动包内符号、调整 workspace 依赖、判定 platform / 同构与 Node 入口、判定代码应落在哪一包、或收敛跨包近重复实现时，应优先遵循对应规范文档 | — |
| `registry://rules.failure-channels` | 失败通道规范（SSOT） | 改失败通道判定、`AirpDiagnostic` / `AirpResult`、Ctx/Payload、或 CLI 人话 / 退出码 / Logger 约定时，应优先遵循对应规范文档 | — |
| `registry://rules.protocol` | AIRP 协议文档命名规范（SSOT） | 新增或修改 `*.airp.json`、schema 字段或协议 fixture 时，应优先遵循对应规范文档 | — |
| `registry://rules.schema-version-routing` | Schema 版本路由规范（SSOT） | 新增/修改按 `schemaVersion` 分派的实现与 registry、判断代码应进版本文件还是 unversioned、或改协议形状 / 已有 schema 目录时，应优先遵循对应规范文档 | — |
| `registry://rules.renderer` | Renderer 规范（SSOT） | 改 `packages/renderer*`、HTML/Markdown target、locale 敲定、Mermaid→SVG、缺物件硬失败或阅读器壳样式时，应优先遵循对应规范文档 | — |
| `registry://rules.rules-meta` | AGENTS.md 与 `.agents` 结构规范（SSOT） | 任何对 `AGENTS.md` 或 `.agents/**` 文件内容的新增或修改，都应优先遵循对应规范文档 | — |
| `registry://rules.code-styles` | 通用编码规范 | 任何对本项目文件内容的新增或修改，都应优先遵循对应规范文档 | `registry://skills.code-fix` |
| `registry://rules.testing` | 测试分层与同步规范 | 改 packages/apps 源码、fixtures、校验或 CLI 行为时，应同步 Unit/Package/E2E 测试与 case | `registry://skills.test-sync` |

## 维护

增删 `.agents/**` 下 `*.md` 时：同步更新 `.agents/registry.yaml`，再运行 `pnpm check-agents-registry`。细则 → `registry://rules.rules-meta`
