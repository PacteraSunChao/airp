# `.agents/` 目录布局

`.agents/` 集中存放规范文档、skill 工作流、registry 真源与 shared 横切文档。

## 顶层结构

```text
.agents/
├── registry.yaml          # 路径真源（所有 *.md 须登记）
├── rules/                 # 规范包（README.md 入口）
│   └── <tier>/            # 用户自定义分组目录
│       └── <slug>/        # 包目录
├── skills/                # Skill 工作流包（SKILL.md 入口）
│   └── <tier>/
│       └── <slug>/
└── shared/                # 横切文档（单文件）
    └── <name>.md
```

**`AGENTS.md`** 位于仓库根，不在 `.agents/` 内，但受本规范约束。

## rules 与 skills：`<tier>/<slug>`

| 项 | 约定 |
|----|------|
| **规范包路径** | `.agents/rules/<tier>/<slug>/` |
| **Skill 路径** | `.agents/skills/<tier>/<slug>/` |
| **规范包入口** | `README.md`（registry `path` 指向此文件） |
| **Skill 入口** | `SKILL.md`（registry `path` 指向此文件） |
| **`<tier>`** | 任意合法目录名，仅用于物理分组；**不参与**文档 ID（ID 为 `rules.<slug>` / `skills.<slug>`，不含 tier） |
| **`<slug>`** | 小写与连字符（如 `rules-meta`、`code-fix`）；在 `rules` 或 `skills` section 内**全局唯一**（不可跨 tier 重名） |

### `<tier>` 语义（推荐）

| tier | 用途 | 示例 |
|------|------|------|
| **core** | 跨项目可复用的约定与交付门禁 | `code-styles`、`code-fix`、`rules-meta` |
| **project** | 本仓库领域 SSOT 及其专属 workflow | `technology-stack`、`testing`、`test-sync` |

`<tier>` 不影响文档 ID 与引用；选用时以**内容是否绑定本仓库领域**为准。

### 包的认定（入口文件）

| 类型 | 认定条件 |
|------|----------|
| **规范包** | `.agents/rules/<tier>/<slug>/` 下**存在** `README.md` |
| **Skill 包** | `.agents/skills/<tier>/<slug>/` 下**存在** `SKILL.md` |

**无入口文件则不视为包**：仅有子目录或零散 `*.md`、但没有 `README.md` / `SKILL.md` 的 `<tier>/<slug>/` 目录，**不是**规范 / skill 包，不参与 registry 包级登记与 parity 校验，也不占用 slug。

包内子目录与子文件布局**由各包自行定义**；本规范只要求**已认定包内**每个 `*.md` 在 registry 中有对应条目。

## shared

| 项 | 约定 |
|----|------|
| **路径** | `.agents/shared/<name>.md` |
| **registry** | `shared.<name>.path` 指向该文件 |
| **文档 ID** | `registry://shared.<name>` |
| **用途** | 跨多个 rule/skill 引用的横切说明 |

代表文件 `delivery-prerequisites.md` 的格式见 [`./delivery-prerequisites.md`](./delivery-prerequisites.md)。

## 校验

```bash
pnpm check-agents-registry
```

脚本会扫描 `rules/`、`skills/` 下**已认定**的包（含入口文件者），校验 slug 冲突、registry 与磁盘 parity，以及链接与文档 ID 规则。无 `README.md` / `SKILL.md` 的目录不在包扫描范围内。
