# Schema 版本路由规范（SSOT）

全仓按 **`schemaVersion`** 分派实现的纪律。

## 规则

| 域 | 何时读 | 文档 |
|----|--------|------|
| 版本文件、registry、可 unversioned 边界、已发布 schema | 新增/移动按版实现、写 registry、判断代码进版本文件还是 unversioned，或判断协议形状是否新开 `schemaVersion` | [`rules/routing-discipline.md`](./rules/routing-discipline.md) |

## 核心原则

1. **版本列表唯一**：`supportedSchemaVersions`、`SchemaVersion`、`VersionRegistry<T>` 仅由 `@airp/protocol` 导出；其它包不得维护平行版本表，不得用 semver 范围隐式路由。
2. **协议按目录分版**：JSON Schema 在 `packages/protocol/src/schemas/<semver>/`；目录名 = `schemaVersion`。
3. **已发布版本冻结**：`supportedSchemaVersions` 中的版本，schema 目录与该版校验结果不改；协议形状变化只走增版。
4. **解释文档形态按文件分版**：相对各包**版本实现根**的 `<domain>/v<major>-<minor>-<patch>.ts` + version-first registry；同版私有模块在 `shared/<domain>/v….ts`，不进 registry。
5. **跨版复用只经显式引用**：registry 新行或新入口显式引用未变导出；禁止 `common*` 中间拼表；未变则不复制实现文件。
6. **无 schema 假设者可 unversioned**：工具、UI 壳、与文档字段无关的基础设施不进版本文件；不得承载校验步骤或假定字段形态的同版共享逻辑。
7. **增版**：新目录 + 各包 VersionRegistry **整行**；无旧字段 fallback。

## 校验清单

| 场景 | 文档 |
|------|------|
| 改版本路由、registry 或 `schemas/<semver>/` 前 | [`checklists/before-version-routing-change.md`](./checklists/before-version-routing-change.md) |

## 维护

追加 `supportedSchemaVersions` 或改分派纪律：先改本规范与 protocol，再改各包 registry / `v….ts`。禁止在索引页复制 `rules/*` 长文。
