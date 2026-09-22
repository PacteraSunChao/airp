# AGENTS.md 与 `.agents` 结构规范（SSOT）

本文档是仓库根 **`AGENTS.md`** 与 **`.agents/`** 的结构规范与边界（SSOT）。任何对 `AGENTS.md` 或 `.agents/**` 下 Markdown 的新增或修改，必须遵循本规范与 `pnpm check-agents-registry` 的硬约束。

## 范围（Scope）

- **`AGENTS.md`**：仓库根索引入口（格式见 [`./references/agents-md.md`](./references/agents-md.md)）
- **`.agents/registry.yaml`**：路径真源（格式见 [`./references/registry-yaml.md`](./references/registry-yaml.md)）
- **`.agents/rules/<tier>/<slug>/`**：规范包（入口 `README.md`；布局见 [`./references/directory-layout.md`](./references/directory-layout.md)）
- **`.agents/skills/<tier>/<slug>/`**：skill 包（入口 `SKILL.md`；布局见 [`./references/directory-layout.md`](./references/directory-layout.md)）
- **`.agents/shared/<name>.md`**：横切文档（参考 [`./references/delivery-prerequisites.md`](./references/delivery-prerequisites.md)）
- **文档 ID 与链接**：见 [`./references/doc-ids-and-links.md`](./references/doc-ids-and-links.md)
- **frontmatter / `depends_on`**：见 [`./references/frontmatter.md`](./references/frontmatter.md)

边界：本规范不规定包内子目录命名（如 `references/`、`checklists/`），只要求**已认定包内**每个 `*.md` 都在 registry 中登记。

## 硬约束（`pnpm check-agents-registry`）

以下由 **`pnpm check-agents-registry`** 强制校验；违反即失败：

- **registry ↔ 磁盘一致**：每个已认定包内（rule/skill）以及 `shared/` 下的每个 `*.md` 必须在 `registry.yaml` 登记；registry 中每个路径必须存在
- **包认定**：规范包需 `README.md`；skill 包需 `SKILL.md`；无入口文件则不视为包（详见 [`./references/directory-layout.md`](./references/directory-layout.md)）
- **slug 唯一**：同一 section（`rules` 或 `skills`）内全局唯一（不可跨 `<tier>` 重名）
- **文档 ID**：正文与 `depends_on` 必须使用 `` `registry://...` `` 完整前缀；禁止裸 `rules.*` / `skills.*` / `shared.*`
- **跨包引用**：rule / skill / shared 之间禁止相对路径链接；必须用 `registry://` 文档 ID
- **包内链接**：相对链接目标必须存在；不得通过相对路径指向其它包
- **`AGENTS.md` 索引表**：registry `rules` 节每个 slug 在索引表有且仅有一行；索引**标题**与该规范包 `README.md` 首行 `#` 标题完全一致
- **`registry://shared.delivery-prerequisites`**：必须在 registry 中登记且路径存在

## 写作惯例（推荐，非脚本强制）

- checklist 的 frontmatter 通常声明 `depends_on: registry://shared.delivery-prerequisites`
- 包入口（`README.md` / `SKILL.md`）宜作索引，长文放在包内子文档并在 registry 登记
- 新增 rule 时，在 `AGENTS.md` 索引表 skill 列链接配套 skill，无则填 `—`

## 维护顺序

增删 `.agents/**` 下 `*.md` 时：

1. 改磁盘文件
2. 同步 `registry.yaml`
3. 若新增 rule → 更新 `AGENTS.md` 索引表
4. 运行 `pnpm check-agents-registry` 直至通过

## 参考文档

- `AGENTS.md` 格式 → [`./references/agents-md.md`](./references/agents-md.md)
- `.agents/` 目录与 `<tier>/<slug>` → [`./references/directory-layout.md`](./references/directory-layout.md)
- `registry.yaml` 格式 → [`./references/registry-yaml.md`](./references/registry-yaml.md)
- 文档 ID 与链接 → [`./references/doc-ids-and-links.md`](./references/doc-ids-and-links.md)
- frontmatter → [`./references/frontmatter.md`](./references/frontmatter.md)
- `delivery-prerequisites.md` 格式 → [`./references/delivery-prerequisites.md`](./references/delivery-prerequisites.md)

## 校验清单

- `AGENTS.md` / `.agents` 变更 — 校验清单 → [`./checklists/rules-meta.md`](./checklists/rules-meta.md)
