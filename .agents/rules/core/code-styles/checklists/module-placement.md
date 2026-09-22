---
depends_on:
  - registry://shared.delivery-prerequisites
---

# 模块放置 — 校验清单

**对应规则**：[`rules/module-placement.md`](../rules/module-placement.md)

- [ ] 新代码放在正确的 `packages/` 或 `apps/` 包内
- [ ] 包间依赖通过 `package.json` workspace 声明，无跨包相对路径 hack
- [ ] 依赖方向符合低层 → 高层约定
