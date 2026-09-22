# 失败通道判定

## 判定

用户改输入即可修复 → **诊断线**：返回 `AirpResult`（或包内别名），问题全部在 `diagnostics`；CLI `logDiagnostics`，退出码 `1`。

公开契约或发版假设被打破 → **throw 线**：抛普通 `Error`，立即中断；CLI `printInternalError`，退出码 `2`。

CLI 用法错误（旗标、互斥、路径规则等）→ **UsageError**（或等价）：顶层 `log.error(message)`（禁止 `internal error:` 前缀），退出码 `1`；不经 `AirpDiagnostic`、不新增 CLI 旗标诊断码。

## `ok` 与 severity

某次 `AirpResult.diagnostics` 含 `severity: "error"` ⇒ 该 Result `ok: false`；仅有 `warning`（或空）⇒ 可 `ok: true`。调用方按 `ok` 决定是否继续管线。

`severity` 写在码表条目上，经 `diagnostic(entry, …)` 带进记录。上层只按记录的 `severity` 展示，不改判。

## 边界与不变量

- 内部 helper 可 throw；对外公开边界须 catch 并收成诊断，或文档化为契约违规即崩（调用方须先满足前置条件）。
- 下层已构造领域诊断时可 throw `AirpDiagnosticError`；边界 **原样转发** `diagnostics`，不改判 severity。
- 渲染缺物件 → **诊断线**：深部 `AirpDiagnosticError`，公开 render 边界收成 `ok: false`；细则见 `registry://rules.renderer.rules.missing-object-hard-fail`。
- 内置 html-locale 缺 key → **throw** 普通 `Error`（发版假设）；与工程缺物件诊断线分离。
- 仅服务 throw 文案的码表条目须在码表侧标明（见 `registry://rules.failure-channels.rules.codes`）。

## 例子

| 场景 | 通道 |
|------|------|
| 未知 `schemaVersion` | 诊断 `error` → `ok: false` |
| Ajv 结构失败 | 诊断 `error` → `ok: false` |
| i18n / block id 门禁失败 | 诊断 `error` → `ok: false` |
| Mermaid `parse` 失败 | 诊断 `error` → `ok: false` |
| 文档无法敲定 locale | 诊断 `error` → `ok: false` |
| Mermaid 导出期 `render` 失败 | 诊断 `error` → `ok: false` |
| 内置 html-locale 缺 key | throw 普通 `Error` |
| CLI 非法 `--out` / 互斥旗标 | `UsageError` → 退出 `1` |
