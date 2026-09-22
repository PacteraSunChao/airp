# 人话输出

`formatDiagnostic` 在 `@airp/diagnostics`（跨平台）。`logDiagnostic` / `logDiagnostics` / `logInternalError` 在 `@airp/diagnostics`（`.`）。Logger core 在 `@airp/utils`（`.`）；CLI 宿主在 `@airp/utils/node`。

## format

`formatDiagnostic` 产出 body：有则带上 `stage`、`location`、`code`、`message`。`details` 不进入 body。不依赖 Logger。

## Logger

行格式：`[UTC±N] YYYY-MM-DD HH:mm:ss  TAG  body`。时间戳始终存在；本地时区偏移。`LEVEL_TAG` 由 level 固定（debug→DEBUG、info→INFO、warn→WARN、error→ERROR）；Logger 方法无 tag 参数，语义放进 body。

```ts
import type { Logger } from "@airp/utils";
import { createCliLogger } from "@airp/utils/node";

const log = createCliLogger(); // debug/info→stdout；warn/error/raw→stderr
log.info("hello");
log.raw("stack line"); // 无时间戳/tag
```

染色：CLI 按 `NO_COLOR` → `FORCE_COLOR` → stream `isTTY`。

## log*（`diagnostics` `.`）

| 情况 | 调用 |
|------|------|
| `severity: "error"` | `log.error(body)` |
| `severity: "warning"` | `log.warn(body)` |
| 成功提示 | `log.info(body)`（如 `OK  validate  ./doc.airp.json`；OK 在 body，tag 仍为 INFO） |
| 意外 | `logInternalError`：`log.error(\`internal error: ${msg}\`)`；堆栈行 `log.raw(line)` |
| CLI 用法错误 | `log.error(message)`；**禁止** `internal error:` 前缀；不走 `logInternalError` |

## CLI

| 项 | 规则 |
|------|------|
| 退出码 | 成功 `0`（可有 warning）；领域失败或用法错误 `1`；意外 `2`。 |
| 顶层 catch | `UsageError`（或等价）→ 人话 + 退出 `1`；其余 → `logInternalError` + 退出 `2`。 |
| JSON reporter | validate-cli 可选 `console.log(JSON.stringify(result))`；renderer-cli **无** JSON reporter。 |
| validate 成功 | validate-cli 输出 `log.info("OK  validate  ${label}")`。 |
| render 校验失败 | `logDiagnostics`，退出码 `1`；validate 失败不写出。 |
| render 成功 | stdout 人话（`Wrote …` / `Rendered` / `Watching …`）。 |
