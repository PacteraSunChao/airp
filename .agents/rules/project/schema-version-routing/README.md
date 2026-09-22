# Schema 版本路由规范（SSOT）

全仓按 **`schemaVersion`** 分派实现的纪律。

## 规则

| 域 | 何时读 | 文档 |
|----|--------|------|
| 版本文件、registry、可 unversioned 边界 | 新增/移动按版实现、写 registry，或判断代码进 `v0-x-x` / `v1-0-0` 还是 unversioned | [`rules/routing-discipline.md`](./rules/routing-discipline.md) |

## 核心原则

1. **版本列表唯一**：`supportedSchemaVersions`、`SchemaVersion`、`VersionRegistry<T>` 仅由 `@airp/protocol` 导出；其它包不得维护平行版本表，不得用 semver 范围隐式路由。
2. **协议按目录分版**：JSON Schema 在 `packages/protocol/src/schemas/<semver>/`；目录名 = `schemaVersion`。
3. **解释文档形态按文件分版**：相对各包**版本实现根**的 `<domain>/v<major>-<minor>-<patch>.ts` + version-first registry；同版私有模块在 `shared/<domain>/v….ts`，不进 registry。
4. **跨版复用只经显式引用**：registry 新行或新入口显式引用未变导出；禁止 `common*` 中间拼表；未变则不复制实现文件。
5. **无 schema 假设者可 unversioned**：工具、UI 壳、与文档字段无关的基础设施不进版本文件；不得承载校验步骤或假定字段形态的同版共享逻辑。
6. **增版**：新目录 + 各包 VersionRegistry **整行**；无旧字段 fallback。

## 校验清单

| 场景 | 文档 |
|------|------|
| 改版本路由实现或 registry 前 | [`checklists/before-version-routing-change.md`](./checklists/before-version-routing-change.md) |

## 维护

增删 `supportedSchemaVersions` 或改分派纪律：先改本规范与 protocol，再改各包 registry / `v….ts`。禁止在索引页复制 `rules/*` 长文。
