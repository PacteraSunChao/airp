# 诊断码登记

originate 包在 `src/diagnostic-codes.ts` 登记本包诊断码。词根一律 `diagnostic`。实现包名 `@airp/diagnostics` 不变。

## 条目

每个常量是一条 **码表条目** `{ code, severity }`，用 `@airp/diagnostics` 的登记助手生成：

```ts
export const RENDERER_PIPELINE_TARGET_SKELETON = defineDiagnosticCode(
  "renderer.pipeline.target-skeleton",
  "warning",
);

export const RENDERER_DIAGNOSTIC_ENTRIES = [
  RENDERER_PIPELINE_TARGET_SKELETON,
] as const;

export const RENDERER_DIAGNOSTIC_CODES = [
  RENDERER_PIPELINE_TARGET_SKELETON.code,
] as const;
```

| 规则 | 说明 |
|------|------|
| 一对一 | 同一时刻，一个 `code` 只对应一种 `severity` |
| 改严重级别 | 只改条目的 `severity`；`code` 字符串可不变 |
| 字符串 | `code` 不含严重级别段 |
| 常量名 | 不强制加 `ERROR` / `WARNING` |
| 业务引用 | 禁止裸 `code` 字符串；须 import 本包条目常量 |
| 通道 | 经 `diagnostic()` 进入 `AirpResult` 的条目：码表旁注释 `/** return: <path> */`。仅作 throw `Error.message` 锚点的条目：`/** throw 锚点: <path> */`，且不得经 `diagnostic()` 进 Result。同一码若公开路径走诊断、内部断言走 throw，两条注释并列。 |


## 命名

| 项 | 形式 |
|----|------|
| 文件 | `src/diagnostic-codes.ts` |
| 包导出 | `./diagnostic-codes` |
| 条目常量 | 路径派生大写蛇形 |
| 条目列表 | `*_DIAGNOSTIC_ENTRIES`（码表条目常量数组） |
| 覆盖列表 | `*_DIAGNOSTIC_CODES`：条目的 `.code`（含 `DIAGNOSTICS_DIAGNOSTIC_CODES`） |
| 类型 | `*DiagnosticCode`（`code` 字符串联合） |
| 覆盖测试 | `diagnostic-code-coverage.test.ts` + `assertDiagnosticCodeCoverage` |
| Unit 白名单 | `UNIT_COVERED_*_DIAGNOSTIC_CODES`（`.code` 列表） |
| 严重级别核对 | `assertDiagnosticsMatchCatalog(diagnostics, entries)` |

## 覆盖与严重级别核对

见 `registry://rules.testing.rules.case-model`。
