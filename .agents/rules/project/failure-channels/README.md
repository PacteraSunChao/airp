# 失败通道规范（SSOT）

领域失败、意外、`AirpResult`、宿主 Ctx、CLI 人话与退出码的 SSOT。实现包仍为 `@airp/diagnostics`。包边界见 `registry://rules.package-boundaries`；术语见 `registry://shared.terminology`。

## 规则

| 域 | 何时读 | 文档 |
|----|--------|------|
| 通道判定 | 选返回值、throw 或 CLI 退出码时 | [`rules/channels.md`](./rules/channels.md) |
| `AirpDiagnostic` / `AirpResult` | 定诊断形状、用 `diagnostic` 报问题、或定公开 API 返回值时 | [`rules/types.md`](./rules/types.md) |
| 诊断码表条目 | 新/改诊断码、码表文件、throw 文案锚点或导出时 | [`rules/codes.md`](./rules/codes.md) |
| `AirpCtx` / `AirpPayload` | 跨层元数据、写袋、签名加 ctx 时 | [`rules/ctx-payload.md`](./rules/ctx-payload.md) |
| format / Logger / Progress / 退出码 | CLI 人话、JSON、进度、用法错误时 | [`rules/human-output.md`](./rules/human-output.md) |

## 校验清单

| 场景 | 文档 |
|------|------|
| 改失败通道、诊断模型、Result、Ctx、CLI 人话前 | [`checklists/before-failure-channels-change.md`](./checklists/before-failure-channels-change.md) |
