# 诊断与 Result 类型

包：`@airp/diagnostics`。

## `AirpDiagnostic`

```ts
type AirpDiagnostic = {
  severity: "error" | "warning"
  code: string
  message: string
  location?: { file?: string; path?: string }
  stage?: string
  details?: Record<string, unknown>
}
```

| 字段 | 规则 |
|------|------|
| `code` / `severity` | 来自码表条目；业务经 `diagnostic(entry, message, extra?)` 产出，禁止手填 `severity` |
| `message` | 必填人话 |
| `location` | 可选；仅 `file`、`path`。有则进入人话 body |
| `stage` | 可选；管道阶段。有则进入人话 body |
| `details` | 可选；人话以外的消费者。JSON reporter 原样序列化 |

`extra` 仅可含 `location` / `details` / `stage`。

码表形状见 `registry://rules.failure-channels.rules.codes`。

## `AirpResult`

```ts
type AirpResult<T> =
  | { ok: true; value: T; diagnostics: AirpDiagnostic[] }
  | { ok: false; diagnostics: AirpDiagnostic[] }
```

- `diagnostics` 始终存在；无诊断时为 `[]`。
- 无业务产物时，成功态可为 `{ ok: true; diagnostics }`（无 `value`）。
- 失败态只有 `diagnostics`。
- `ok === false` ⇔ 至少一条 `severity: "error"`；否则 `ok === true`（可有 `warning`）。
- 用 `airpResultFrom`（或同名 helper）从诊断列表构造结果。

可能领域失败的公开 API 返回 `*Result`。

回调式 I/O（如 `getSourceFile`）可 throw `AirpDiagnosticError`，由公开边界转发进 `AirpResult`。

## validate

`{ ok: true; diagnostics }` 或 `{ ok: false; diagnostics }`。

断言失败时用 `failedStage` 与 `codes`，对应含 `error` 的诊断的 `stage` 与 `code`。
