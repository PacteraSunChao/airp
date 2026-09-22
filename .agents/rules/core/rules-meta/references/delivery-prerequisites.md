# `delivery-prerequisites.md`（shared 格式）

`.agents/shared/delivery-prerequisites.md` 是**交付前联动**的横切文档，文档 ID 为 `registry://shared.delivery-prerequisites`。`pnpm check-agents-registry` 要求该条目在 registry 中存在且路径有效。

## 用途

勾选任一 `registry://rules.*` / `registry://skills.*` 包内 checklist 之前，须已满足本文件与 frontmatter `depends_on` 所列条目。各包 checklist 通过 frontmatter 引用本文件，而非复制其内容。

## 文件结构

### 1. frontmatter（推荐）

格式见 [`./frontmatter.md`](./frontmatter.md)。列出**始终适用**的全局前置；ID 须带 `registry://` 前缀。

### 2. 标题与说明段

- 首行 `#` 标题说明文件用途（如「交付前联动（横切）」）
- 简短说明：勾选 checklist 前须满足本文件与 `depends_on`

### 3. 通用 checklist（始终）

适用于所有交付的 checkbox 列表，例如：

- 已满足 code-styles 与 code-fix 要求
- 变更范围与任务一致

### 4. 按条件追加（表格）

用 Markdown 表格列出**变更类型 → 须额外执行的 rule / skill / checklist**。

表格内容为**本仓库业务联动**，随项目演进在本文件中维护；**不**在 meta 规范正文中硬编码具体行。

### 5. 文档 ID 自引用（可选）

文末可注明他处如何引用本文件，例如：

> 他处引用：`registry://shared.delivery-prerequisites`

## registry 登记

```yaml
shared:
  delivery-prerequisites:
    path: .agents/shared/delivery-prerequisites.md
```

## 与其它 shared 文件

新增其它 shared 横切文档时：

- 路径：`.agents/shared/<name>.md`
- registry：`shared.<name>.path`
- 文档 ID：`registry://shared.<name>`
- 格式可参考本文件（frontmatter + 说明 + checklist / 表格），具体内容自定
