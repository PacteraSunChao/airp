# 包职责（准入 / 禁入）

按职责判定符号归属。布局与 platform 见 [workspace-layout](./workspace-layout.md)；utils 见 [utils-admission](./utils-admission.md)；失败通道见 `registry://rules.failure-channels`。

## 原则表

| 包 | 准入 | 禁入 |
|----|------|------|
| `diagnostics` | `AirpDiagnostic`、`AirpResult`、`airpResultFrom`、`defineDiagnosticCode` / `diagnostic`、`AirpDiagnosticError`、`formatDiagnostic`、`logDiagnostic` / `logDiagnostics` / `logInternalError` | 协议模型、读盘、渲染 |
| `utils` | 满足 [utils-admission](./utils-admission.md)：`.` 跨平台契约与工具（`AirpPayload` / `AirpCtx`、Logger core 等）；`./node`：CLI logger 宿主、FS helpers、`UsageError` | 业务校验、协议模型、读盘编排、诊断 format/log* |
| `protocol` | `document.schema.json`、`supportedSchemaVersions`、`getSchemaSet`、schema URI helpers | 读盘、语义校验、渲染、第二套完整 schema |
| `loader` | 读单个 `*.airp.json` → `{ document, schemaVersion, … }` | 校验规则、渲染、写输出 |
| `writer` | `createDiskWriter` / `createMemoryWriter` / `createNoopWriter`；统一 `putOutputFile` | 读源、校验、渲染 |
| `validate` | Ajv + i18n + block id 唯一；`./node`：Mermaid `parse`（不 `render`） | 真渲染 SVG、读盘编排、写产物 |
| `renderer-contract` | `RenderTarget` 字面量联合、`RenderTargetModule`、上下文/产物类型 | Registry、diagnostic code 登记、target 实现、流水线编排 |
| `renderer-shared` | 跨 target 领域逻辑（locale 敲定、块遍历等）；无 markup | HTML/MD markup、client scripts、CSS、编排入口 |
| `renderer-target-html` | AIRP 积木块 HTML、阅读器壳、html-locale/icons/styles；`./node`：Mermaid→SVG→`svg-viewer` | 其它 target；浏览器内 Mermaid 运行时；物化/apidoc |
| `renderer-target-markdown` | 按 Markdown 输出约定渲染积木块 | HTML 视觉对等；画 SVG |
| `renderer` | 封闭 `rendererTargetCatalog`、`render` 编排 | 独立组装包；Registry 注入；在同构入口依赖 `renderer/node` |
| `apps/validate-cli` | CLI 参数、进程编排、人话/JSON 出口；bin `airp-validate` | 协议 / 校验核心实现 |
| `apps/renderer-cli` | `export` / `watch` / `worker`；bin `airp-render` | 协议 / 校验 / 渲染核心 |
| `apps/renderer-vscode` | Custom Editor 默认渲染视图；Open Renderer / Edit Source；fork worker；顶栏导出 | config 首页、locale 切换、zip / materialize |

## 判定顺序

1. 诊断原子 / Result / format·print → `diagnostics`
2. 协议标准形态 → `protocol`
3. 渲染 target 公共契约 → `renderer-contract`
4. 跨 target 渲染领域逻辑 → `renderer-shared`
5. 单一 target 实现 → `renderer-target-*`
6. 读盘 → `loader`
7. 写输出 → `writer`
8. 语义门禁 → `validate`
9. 渲染编排（含封闭 target catalog）→ `renderer`
10. CLI / 扩展宿主编排 → 对应 `apps/*`
11. 满足 utils 准入 → `utils`
12. 否则留在唯一消费者所在包

## 提供商 / target 诊断

- `renderer-target-*` 拥有本实现码表条目，经 `diagnostic(entry, …)` 返回 `AirpDiagnostic`。
- `validate` / `renderer` 拥有编排码表条目。
- `renderer-contract` 用 `AirpDiagnostic` 约束返回值，不登记诊断码。
- 核心包合并与透传诊断；不按 target code 分支，不 import 实现码表入口。

## 本设计不含

- `packages/renderer-targets` 组装包 / `RenderTargetRegistry` 注入
- `renderer-web`
- materialize / apidoc / Excel target
- 浏览器内 Mermaid 引擎 / CDN
