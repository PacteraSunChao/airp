---
depends_on:
  - registry://shared.delivery-prerequisites
---

# AGENTS.md / `.agents` 变更 — 校验清单

**对应规则**：[`AGENTS.md 与 .agents 结构规范（SSOT）`](../README.md)（交付前联动：`registry://shared.delivery-prerequisites`）

## 适用范围

- [ ] 本次变更涉及 `AGENTS.md`、`.agents/registry.yaml`，或 `.agents/**` 下任意 `*.md`

## 结构与 registry

- [ ] 新增/移动/删除的 Markdown 文件已在 `registry.yaml` 中同步登记或移除
- [ ] registry 中无指向不存在文件的路径
- [ ] 新规范包目录含 `README.md`；新 skill 包目录含 `SKILL.md`（无入口文件则不视为包）
- [ ] 新规范包已在 `AGENTS.md` 规范索引表增加一行（ID / 标题 / when / skill）
- [ ] 索引表中的**标题**与该规范包 `README.md` 首行 `#` 标题一致
- [ ] 新 skill 包已在 registry `skills` 节登记（若需被引用）
- [ ] slug 未与已有包跨 `<tier>` 冲突

## 文档 ID 与链接

- [ ] 正文中的跨包引用使用 `` `registry://...` ``，无裸 `rules.*` / `skills.*` / `shared.*`
- [ ] 无跨 rule/skill/shared 包的相对路径链接
- [ ] 包内相对链接目标文件存在
- [ ] checklist 的 `depends_on`（若有）使用 `registry://` 且 ID 有效

## 校验命令

- [ ] 已运行 `pnpm check-agents-registry` 并通过
