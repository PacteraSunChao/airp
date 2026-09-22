# YAML frontmatter

`.agents/**` 下的 Markdown 文件可在顶部使用可选 YAML frontmatter，用于声明文档前置依赖。

## 格式

置于文件顶部：

```yaml
---
depends_on:
  - registry://shared.delivery-prerequisites
  - registry://rules.code-styles
---
```

## 字段

| 字段 | 说明 |
|------|------|
| **`depends_on`** | 须先满足的文档 ID 列表；每项**必须**带 `registry://` 前缀且 ID 须在 registry 中存在 |

## 硬约束（`pnpm check-agents-registry`）

- 若存在 `depends_on`，其中每一项须为有效的 `` `registry://...` `` ID
- 禁止裸 `rules.*` / `skills.*` / `shared.*` 形式

frontmatter 本身**不**强制；无 frontmatter 的文件不受 `depends_on` 校验。

## 写作惯例（推荐）

- checklist 通常声明 `depends_on: registry://shared.delivery-prerequisites`
- shared 横切文件（如 `delivery-prerequisites.md`）可声明全局前置（如 code-styles、code-fix）

## 常见错误

| 错误 | 正确做法 |
|------|----------|
| `depends_on` 使用裸 ID | 写 `registry://shared.delivery-prerequisites` |
| `depends_on` 引用不存在的 ID | 先在 registry 登记目标文档 |
