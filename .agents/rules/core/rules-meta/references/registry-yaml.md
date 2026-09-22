# `registry.yaml`（路径真源）

`.agents/registry.yaml` 登记所有 rule、skill、shared 文档的**仓库相对路径**。`pnpm check-agents-registry` 要求：**每个已认定包内**及 `shared/` 下，磁盘上每个 `*.md` 都有 registry 条目，且 registry 中每个路径在磁盘存在。

**已认定包**：规范目录含 `README.md`、skill 目录含 `SKILL.md`；无入口文件则不视为包。详见 [`./directory-layout.md`](./directory-layout.md)。

## 顶层结构

```yaml
version: 1

rules:
  <slug>:
    path: .agents/rules/<tier>/<slug>/README.md
    <nested-key>:
      <doc-key>: .agents/rules/<tier>/<slug>/.../<doc-key>.md

skills:
  <slug>:
    path: .agents/skills/<tier>/<slug>/SKILL.md
    <nested-key>:
      <doc-key>: .agents/skills/<tier>/<slug>/.../<doc-key>.md

shared:
  <name>:
    path: .agents/shared/<name>.md
```

- **`version`**：当前为 `1`
- **`path`**：包入口（规范包为 `README.md`，skill 为 `SKILL.md`）
- **嵌套 map**：组织子文档；键名组成文档 ID 后缀，**不**规定必须叫 `references` / `checklists` 等——只要路径与磁盘一致即可
- **叶子值**：自仓库根起的相对路径，使用正斜杠 `/`

示例（键名仅为说明嵌套规则，非强制目录名）：

```yaml
rules:
  code-styles:
    path: .agents/rules/core/code-styles/README.md
    rules:
      naming: .agents/rules/core/code-styles/rules/naming.md
    checklists:
      naming: .agents/rules/core/code-styles/checklists/naming.md
```

上例文档 ID：`registry://rules.code-styles`、`registry://rules.code-styles.rules.naming`、`registry://rules.code-styles.checklists.naming`。

## slug 与命名

- **slug**：registry 中 `rules` / `skills` 节的顶层键；小写与连字符；在各自 section 内唯一
- **`<tier>`**：仅出现在路径字符串中，不出现在 slug 或文档 ID 中
- **跨 tier 重名**：`rules/core/foo` 与 `rules/project/foo` 视为 slug 冲突（check-agents-registry 报错）

## 登记规则

1. **新增 Markdown 文件**：在对应 slug 下增加嵌套键与路径；路径须与实际文件一致
2. **重命名 / 移动文件**：改 registry 路径；同步修正包内相对链接
3. **删除文件**：从 registry 移除条目；确认无正文仍引用该文档 ID
4. **新增 slug（新包）**：在 `rules` 或 `skills` 下新增顶层键，并创建含入口文件（`README.md` / `SKILL.md`）的包目录；rule 还须更新 `AGENTS.md` 索引表
5. **新增 shared 文件**：在 `shared.<name>` 登记 `path`

## 文档 ID 与 registry 的对应

| 文档 ID | registry 解析 |
|---------|----------------|
| `registry://rules.code-styles` | `rules` → `code-styles` → `path` |
| `registry://rules.code-styles.checklists.naming` | `rules` → `code-styles` → `checklists.naming` 叶子路径 |
| `registry://skills.code-fix` | `skills` → `code-fix` → `path` |
| `registry://shared.delivery-prerequisites` | `shared` → `delivery-prerequisites` → `path` |

解析规则：`registry://` 后按 `.` 分段，前两段为 section + slug，其余为嵌套键路径。

## 校验

```bash
pnpm check-agents-registry
```

失败时按报错逐项修复：缺条目、多余条目、路径不存在、索引缺失、标题不一致、非法文档 ID 或跨包相对链接等。
