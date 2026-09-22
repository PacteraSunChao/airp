# 包边界规范（SSOT）

本仓库 **packages / apps 职责、platform、依赖方向与符号归属** 的 SSOT。细则在 [`rules/`](./rules/)；工具链与脚本见 `registry://rules.technology-stack`；通用放置见 `registry://rules.code-styles` → module-placement。

## 规则

| 域 | 何时读 | 文档 |
|----|--------|------|
| 包清单、platform、数据流、Ctx / Payload | 不确定某包职责、platform 或调用链 | [`rules/workspace-layout.md`](./rules/workspace-layout.md) |
| 允许的依赖方向、同构 / Node 入口 | 改 `package.json` 依赖、跨包 import，或使用 Node / `/node` 入口 | [`rules/dependency-dag.md`](./rules/dependency-dag.md) |
| 各包准入 / 禁入 | 新增模块、犹豫放哪一包 | [`rules/package-roles.md`](./rules/package-roles.md) |
| utils 准入 | 想把符号放进 `@airp/utils` | [`rules/utils-admission.md`](./rules/utils-admission.md) |
| 跨包近重复 | 多包存在几乎相同或微差实现 | [`rules/near-duplicate-convergence.md`](./rules/near-duplicate-convergence.md) |

## 核心原则

1. **一包一职**：每包只承担 `package-roles` 中的职责；禁止把协议、校验、渲染、读盘挤进同一包。
2. **依赖只向下**：只允许 `dependency-dag` 中的边；禁止循环与逆层。
3. **platform 三类**：`isomorphic` / `node` / `dual`；同构入口只能依赖同构入口；能在浏览器实现的能力放同构面。
4. **封闭 catalog**：渲染 target 固定键名单内建于 `renderer`（`html` \| `markdown`）；无独立组装包、无 Registry 注入；宿主不注入名单。
5. **utils 是例外通道**：进 utils 必须满足 `utils-admission`；默认放职责归属包。跨平台与 `/node` 入口规则见 `dependency-dag`。
6. **近重复先定性再落点**：跨包同契约 / 无意漂移须收敛；有意分叉须标清；见 `near-duplicate-convergence`。
7. **宿主只编排**：`apps/*` 串联 loader / validate / renderer / writer；传路径、target 与 `putOutputFile`；不实现协议或校验核心，不注入名单。

## 校验清单

| 场景 | 文档 |
|------|------|
| 新增导出符号或跨包搬迁前 | [`checklists/before-new-symbol.md`](./checklists/before-new-symbol.md) |
| 发现或处理跨包近重复时 | [`checklists/near-duplicate-convergence.md`](./checklists/near-duplicate-convergence.md) |

## 维护

- **禁止**在索引页复制 `rules/*` 长文；改规则只改 `rules/*`，同步 checklist。
- 增删包、调整职责或 platform 时：先改本规范，再改代码与 `package.json`。
