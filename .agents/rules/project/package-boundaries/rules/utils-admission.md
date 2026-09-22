# utils 准入

`@airp/utils` 收无 AIRP 业务语义、且应跨包共享的工具。按运行时分入口（与 `loader` / `validate` / `renderer` 等 dual 包的 `.` 与 `./node` 一致）。诊断 format 与 log* 在 `diagnostics`（`.`）；`registry://rules.failure-channels`。运行时与入口禁令见 [dependency-dag](./dependency-dag.md)。

## 入口

| 入口 | 运行时 | 内容 |
|------|--------|------|
| `@airp/utils`（`.`） | 跨平台 | `isRecord`、`toPosixPath`、`AirpPayload` / `AirpCtx` / payload helpers；Logger core（`Logger`、`createLogger` 等）；`createBrowserLogger`（若需要） |
| `@airp/utils/node` | Node / CLI | `pathExists`、workspace-root、`createCliLogger`、`UsageError` 及 Node logger 类型 |

## 硬条件（须全部满足）

1. 不引用 document 模型、schema、diagnostic code、诊断组装、渲染 AST。
2. 不负责读整份文档、写产物目录、跑校验管线；可为纯计算，或对调用方传入路径 / 字节 / 字符串 / stream 的薄封装。
3. 只依赖第三方库；不依赖 `diagnostics` / `protocol` / `loader` / `validate` / `renderer`。

## 复用面（满足其一）

| 条款 | 何时成立 |
|------|----------|
| **A. 多宿主** | ≥2 个业务包（或库包 + app）直接使用同一契约 |
| **B. 跨层词汇** | 多包必须一致的表示；放在单一宿主会迫使他包依赖该宿主或复制 |
| **C. 原子族** | 与已满足 A/B 的符号构成封闭变换族 |

## 典型归属

| 例子 | 归属 | 依据 |
|------|------|------|
| `toPosixPath`、`isRecord` | `utils`（`.`） | A |
| `AirpPayload` / `AirpCtx` / payload helpers | `utils`（`.`） | B |
| `Logger` / `createLogger` | `utils`（`.`） | A |
| `createCliLogger`、`UsageError` | `utils/node` | A |
| `formatDiagnostic` / `logDiagnostic` | `diagnostics`（`.`） | 诊断语义 |
| `validateDocument`、`getSchemaSet` | `validate` / `protocol` | 业务语义 |
