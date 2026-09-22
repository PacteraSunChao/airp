# 通用编码规范

本项目**通用编码约定**索引：命名、注释语言、模块放置、Biome 风格守卫。**细则在** [`rules/`](./rules/) 与 [`checklists/`](./checklists/)，本文档不重复展开。

Ultracite（Biome）对齐项以根目录 `biome.jsonc` 为 SSOT；`rules/biome-style-guards.md` 记录阈值、例外与编写习惯。

## 按需阅读（从哪里开始）

| 变更类型 | 先读 rule | 再跑 checklist |
|----------|-----------|----------------|
| 命名、路径、导出符号 | [naming](./rules/naming.md) | [naming](./checklists/naming.md) |
| 源码注释 / JSDoc | [comments-language](./rules/comments-language.md) | [comments-language](./checklists/comments-language.md) |
| 包与源码放置 | [module-placement](./rules/module-placement.md) | [module-placement](./checklists/module-placement.md) |
| 控制流、三元、复杂度、正则 | [biome-style-guards](./rules/biome-style-guards.md) | [biome-style-guards](./checklists/biome-style-guards.md) |

## 适用范围与优先级

- **通用规则**：命名、注释、控制流、复杂度、模块放置等。
- **专项文档优先**：校验器、schema 等专项范围先满足专项；本规范补齐未覆盖部分。

## 规则

| 域 | 文档 |
|----|------|
| 命名 | [`rules/naming.md`](./rules/naming.md) |
| 注释语言 | [`rules/comments-language.md`](./rules/comments-language.md) |
| 模块放置 | [`rules/module-placement.md`](./rules/module-placement.md) |
| Biome 风格守卫 | [`rules/biome-style-guards.md`](./rules/biome-style-guards.md) |

## 校验清单

| 域 | 文档 |
|----|------|
| 命名 | [`checklists/naming.md`](./checklists/naming.md) |
| 注释语言 | [`checklists/comments-language.md`](./checklists/comments-language.md) |
| 模块放置 | [`checklists/module-placement.md`](./checklists/module-placement.md) |
| Biome 风格守卫 | [`checklists/biome-style-guards.md`](./checklists/biome-style-guards.md) |

## 交付前

- 命中规则域须打开对应 rule 并完成 checklist；专项变更须同时满足专项清单。
- **命名、注释**不能被 `pnpm fix` 替代，须人工核对。
- **Biome 守卫**应在编写时预防，并对变更包执行 `pnpm fix`。
- 不得仅凭记忆复述规范而不查阅 SSOT。

## 维护

- **禁止**在索引页复制 `rules/*` 长文；改规则只改 `rules/*`，同步 `checklists/*`。
- 新增规则域：在 `rules/`、`checklists/` 各增一篇并登记本文档与 `registry.yaml`。
- 升级 ultracite 后复查 `rules/biome-style-guards.md` 阈值与规则 ID。
