# Case 模型与注册位置

共享类型由 `@airp/test-kit` 导出。**完整字段**见 `packages/test-kit/src/types.ts` 与 `testing-surface.ts`（`PackageTestSurface`）。Package / E2E case **数组**登记在**各 owner 包** `test/surface.json` → `cases`。

## 注册位置

case 数组文件与 export 名登记在 owner 包 `test/surface.json` → `cases[]`（`{ tier, file, export }`，`file` 相对 `test/`）。全仓一览：根 `pnpm list-testing-surface`。

| Case 类型 | `cases[].export` 惯例 | Tier |
|-----------|----------------------|------|
| `SchemaCase` | `schemaCases` | Package |
| `LoadCase` | `loadCases` | Package |
| `PipelineCase` | `pipelineCases` | Package |
| `CliCase` | `cliCases` / `renderCliCases` 等 | E2E |

owner 默认由改动路径判定；跨包 case 查 `list-testing-surface` 中 `cases[]` 登记（见 `registry://rules.testing.rules.layers`）。

Package case 须 `import type { …Case } from "@airp/test-kit"`。

## 测试文件模式

Package / E2E case 驱动：

```typescript
describe.each(cliCases)("$id", (case_) => {
  it("matches CLI expectation", () => {
    runCliCase(case_, { cliEntryPath: defaultCliPath() });
  });
});
```

**禁止**在 case 驱动测试里复制 runner 逻辑；新增场景 = 新增 case 条目 + fixture。

**允许**（Unit 补充）：同包内 mock / 契约 / validator 单测，与 Package case 互补。

## Case ID 命名

- 格式：`<suite>.<domain>.<scenario>`。`suite` 为 `schema` | `load` | `pipeline` | `cli` | `render`。
- 示例：`schema.document.valid-minimal`、`pipeline.mermaid.parse-fail`、`cli.render.export-html`。
- `document` 路径与 `fixtures/airp/documents/` 一一对应（见 `registry://rules.testing.rules.fixtures`）。

## 诊断码覆盖与严重级别核对

凡在包内 **originate** 的诊断码，须以码表条目写入本包 `src/diagnostic-codes.ts`；`*_DIAGNOSTIC_CODES` 收集各条目的 `.code`（见 `registry://rules.failure-channels.rules.codes`）。

### 覆盖

登记后**必须**满足其一（否则本包 `diagnostic-code-coverage.test.ts` 失败）：

1. Package case 的 `expect.code` / `expect.codes` / `code`
2. E2E `cliCases` 的 `bootstrapCode`（code 仍归属 originate 包）
3. E2E stderr/stdout 断言
4. `UNIT_COVERED_*_DIAGNOSTIC_CODES` + Unit 单测（**禁止**对 pipeline / 集成路径 code 仅用此项）

各包自跑 `assertDiagnosticCodeCoverage(本包 *_DIAGNOSTIC_CODES, …)`；**禁止**单点聚合全仓 code 清单。

### 严重级别

跑出诊断结果后：每条记录的 `severity` 必须等于码表中该 `code` 的条目。`severity` 不一致或野编号 → 失败。

case 的期望只写诊断码（及 `failedStage` 等既有字段），**不**重复写期望 `severity`。

## Schema 覆盖

由 directory structure 派生 schemaRef 列表；`assertSchemaCoverage`（`cases` 登记 `schemaCases` 的 owner 包内 `schema-coverage.test.ts`）要求每个 ref 至少有 1 valid + 1 invalid `SchemaCase`。
