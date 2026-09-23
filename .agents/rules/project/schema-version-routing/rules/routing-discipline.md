# 版本路由纪律

## 结论

凡按 **`schemaVersion`** 选择行为的代码，必须满足：

| 内容 | 落点 | 跨版复用 |
|------|------|----------|
| 支持的版本集合 | `@airp/protocol` 的 `supportedSchemaVersions` | 每个消费包 registry 对集合内**每个**键有条目 |
| 协议 schema | `packages/protocol/src/schemas/<semver>/` | `supportedSchemaVersions` 中的目录不改，该版校验结果不改；新形状新建目录 |
| 校验 step、块渲染 builder | `<版本实现根>/<domain>/v<major>-<minor>-<patch>.ts` + 包内唯一 version-first registry | 新版本行显式写旧导出名 |
| 多个 registry 入口共用、且假定 schema 字段形态的逻辑 | `<版本实现根>/shared/<domain>/v….ts` 同版私有模块（**不**写入 VersionRegistry） | 新版本入口显式引用旧导出；有 diff 则新建版本文件 |
| 无 schema 字段假设的工具与 UI | unversioned 模块 | 任意版本入口可调用；不得充当跨版业务真相源 |

**版本实现根**（导出名与 `v….ts` 路径均相对此目录）：

| 包 / 域 | 版本实现根 |
|---------|------------|
| validate | `packages/validate/src/validators/` |
| renderer HTML | `packages/renderer-target-html/src/` |
| renderer Markdown | `packages/renderer-target-markdown/src/` |

其它包新增按版实现时，先在本表登记根目录，再落文件。

## 理由

多版本并存时，可审查的 diff 是「两版 registry 行哪些函数指针变了」。VersionRegistry 只回答分派入口指谁；同版去重用 `shared/<domain>/v…`，不另建表。

## 硬规则

1. 消费方**禁止**平行 `supportedVersions`（或等价）数组。
2. registry 外层键必须是精确 `SchemaVersion` 字符串；**禁止** `1.*` 一类范围映射。
3. 每个路由域**恰好一个** version-first 大表（`satisfies VersionRegistry<T>` 或同等穷尽映射）；**禁止** `commonGates` 等中间分组变量。
4. 按版语义文件路径为 `<版本实现根>/…/v<major>-<minor>-<patch>.ts`（例首版 `v1-0-0.ts`）。
5. **导出名** = 相对版本实现根的目录段转 camelCase + 版本三位编码（`v1-0-0` → `100`）。
6. **同版私有模块**：路径为 `<版本实现根>/shared/<domain>/v….ts`；**不**进 VersionRegistry。
7. **已发布版本冻结**：`supportedSchemaVersions` 中的版本，`schemas/<semver>/` 不改，该版文档校验通过或失败的结果不改。判定该结果的 schema 约束与校验步骤不改。不改变该结果的同版渲染修复仍改该版 `v….ts`。协议形状变化新开 `schemaVersion`。
8. **无兼容层**：不为旧 schema 形态写 fallback，不引入旧版 JSON 双读或 deprecated 字段别名。
9. 散落的 `switch (schemaVersion)` / 按版 `if` 业务分支应收敛为 registry + 版本文件。

## 分类细则

### 必须版本化

- validate 的 gates / semantics 与包根 registry 行
- renderer 登记的 block 的 build 与 render
- 其它包中按 `schemaVersion` 解释 AIRP 文档字段的逻辑

### 可 unversioned

- 与文档字段无关的字符串/路径/转义、通用 UI 零件、CSS、shell chrome、图标、`svg-viewer`
- `diagnostics` / `utils` 中与 `schemaVersion` 无关的基础设施

### protocol

- 唯一定义 `supportedSchemaVersions`、`SchemaVersion`、`VersionRegistry<T>`
- Schema 树在 `schemas/<semver>/`；经 `getSchemaSet` 按版本取用

## 增加 `schemaVersion` 时

协议形状变化只走本节。

1. 在 `supportedSchemaVersions` 追加精确版本，并增加 `schemas/<semver>/`。
2. 每个消费包 registry **增加完整一行**；入口与同版私有模块未变则显式引用旧导出，有 diff 则新建 `v….ts`。
3. 同步该版本所需的测试与 fixture。
4. 不引入旧版 JSON 双读或 deprecated 字段别名。
