# `AGENTS.md`（仓库根索引）

`AGENTS.md` 是 AI 与协作者进入本项目规范体系的**第一站**：它不展开各域细则，只索引 SSOT、说明横切约束，并指向 registry 真源。

## 职责边界

**应包含：**

- 说明本文档是规范索引（SSOT 入口），具体步骤由各 Skill 负责
- **`registry.yaml` 为路径真源**及 `registry://` 文档 ID 用法
- 变更后质量检查（`pnpm fix` / `pnpm check`）及 `registry://skills.code-fix` 引用
- 勾选 checklist 前须满足 `registry://shared.delivery-prerequisites`
- **规范索引表**：列出全部 `registry://rules.*` 包
- **维护须知**：增删 `.agents/**` 时同步 registry 并运行 `pnpm check-agents-registry`

**不应包含：**

- 某一 rule 域内的详细规则（应写在对应规范包内子文档）
- Skill 工作流步骤（应写在对应 `SKILL.md`）
- 与索引无关的长篇教程
- registry 结构或各 rule 细则的全文复制

## 规范索引表格式

位于 `## 规范索引（rules SSOT）` 下，Markdown 表格四列：

| 列 | 含义 | 示例 |
|----|------|------|
| **ID** | 包级文档 ID | `` `registry://rules.code-styles` `` |
| **标题** | 与规范包 `README.md` 首行 `#` **完全一致** | `通用编码规范` |
| **when** | 何时应优先遵循该 rule | `任何对本项目文件内容的新增或修改，都应优先遵循对应规范文档` |
| **skill** | 配套 skill ID，无则 `—` | `` `registry://skills.code-fix` `` 或 `—` |

**必须**：registry 中 `rules` 节的**每一个** slug 都在表中有且仅有一行；`pnpm check-agents-registry` 会校验 registry 与表的双向一致及标题匹配。

## 新增 rule 时更新步骤

1. 在 `.agents/rules/<tier>/<slug>/` 创建包（至少 `README.md`）
2. 在 `registry.yaml` 的 `rules.<slug>` 登记 `path` 及子文档
3. 在 `AGENTS.md` 索引表**追加一行**（ID / 标题 / when / skill）
4. 运行 `pnpm check-agents-registry`

## 维护 section

保留简短维护说明即可，例如：

> 增删 `.agents/**` 下 `*.md` 时：同步更新 `.agents/registry.yaml`，再运行 `pnpm check-agents-registry`。细则 → `registry://rules.rules-meta`

勿在此复制 registry 结构或各 rule 细则。
