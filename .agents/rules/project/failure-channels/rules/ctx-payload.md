# Ctx 与 Payload

`AirpPayload` 是宿主跨层元数据袋。真源是调用链上的 `ctx.payload`。

```ts
type AirpCtx = { payload: AirpPayload }

const ctx = { payload: seed }
const r = await loadProject(dir, options, ctx)
ctx.payload = withPayloadEntry(ctx.payload, key, entry)
```

- `options` 与 `ctx` 分开。
- 自身或子孙会写袋的 API 接收 `ctx`，且为最后一参；中间层原样下传。
- `AirpPayload` / `AirpCtx` / `withPayloadEntry` / `getPayloadEntry` 在 `@airp/utils`；各包 namespaced entry 在各自包。
- 每次命令或请求使用独立的 `ctx` 实例。
