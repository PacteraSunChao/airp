---
depends_on:
  - registry://shared.delivery-prerequisites
---

# 版本路由变更 — 校验清单

**对应规则**：本包 [`routing-discipline`](../rules/routing-discipline.md)

## 适用范围

- [ ] 本次变更涉及 `supportedSchemaVersions`、`schemas/<semver>/`、某包 version-first registry / manifest、`v….ts`、同版私有模块，或「按 schema 解释 AIRP」的模块放置

## 纪律

- [ ] 未修改已列入 `supportedSchemaVersions` 的 `schemas/<semver>/`，也未改变该版文档校验通过或失败的结果；协议形状变化已新开 `schemaVersion`
- [ ] 未新增平行版本数组或 semver 范围路由
- [ ] 按版语义实现落在版本实现根下的 `v<major>-<minor>-<patch>.ts`（或 protocol 的 `schemas/<semver>/`）；导出名 = 相对该根的路径段 camelCase + 三位版本码
- [ ] 该 `schemaVersion` 的 registry 行完整列出指针；未变项显式引用旧导出；无 `common*` 中间拼表
- [ ] 假定 schema 字段形态的同版共享逻辑在 `<版本实现根>/shared/<domain>/v….ts`；未进 VersionRegistry
- [ ] 未把校验步骤 / 块配方 builder 放进无版本后缀 `shared/*.ts`
- [ ] 无 schema 假设的工具未被误加上版本后缀

## 交付

- [ ] 已满足 `registry://shared.delivery-prerequisites`
