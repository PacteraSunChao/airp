# 变更同步决策表（语义）

改实现前先对照下表；一行命中即须**同轮**完成该行「必同步」与「必跑」。owner 包与 case 文件见 `pnpm list-testing-surface` 或涉及包的 `test/surface.json`。

**Owner 默认** = 改动路径所在 workspace 包。跨包 case 查 `cases[].export` 惯例（见 `registry://rules.testing.rules.case-model`）。

## 决策表

| 变更信号 | 必同步（artifact 类型） | 必跑 |
|----------|-------------------------|------|
| 新/改 originate 诊断码（码表条目） | 本包 `diagnostic-codes.ts`（`{ code, severity }`）+ Package/E2E case 或 `UNIT_COVERED_*` + Unit；结果 `severity` 对条目 | 改动所在包 `pnpm test` |
| 单文档 schema 校验逻辑（Ajv） | Package schema case + `fixtures/airp/documents/` | `cases` 登记 `schemaCases` 的 owner 包 test |
| loader 读盘 / 解析 `*.airp.json` | load case + document fixture | `cases` 登记 `loadCases` 的 owner 包 test |
| validate 门禁（i18n / id 唯一 / Mermaid parse） | pipeline/Package case + document fixture（每 code 至少一条） | `cases` 登记对应 case 的 owner 包 test |
| CLI 退出码 / stdout / stderr | E2E cli case 数组（`cases[].tier: E2E`） | `cases` 登记 E2E cli case 的 owner app test |
| CLI `parse-args` / 输出格式化 | app 内 Unit 测试 | 改动所在 app test |
| renderer target / block | 本包 `test/` + `diagnostic-codes.ts` + valid 合同 fixture（按 type） | 改动所在包 test |
| Mermaid→SVG / svg-viewer | Package/E2E（含图导出、fail-closed） | 改动所在包 / renderer-cli test |
| diagnostic 格式化 / `logDiagnostic` | 本包 `test/` | 改动所在包 test |
| 新增 workspace 包（带 `test` script） | 新建 `test/surface.json`（`tiers`；case-driven 时含 `cases`） | 根 `pnpm fix` |
| matrix 无匹配的新用户可见行为 | 按最近似行执行；必要时补本表一行 | 根 `pnpm test` |

## 示例（Package / E2E）

| case id | document | 要点 |
|---------|----------|------|
| `schema.document.valid-minimal` | `valid/minimal.airp.json` | Ajv 通过 |
| `pipeline.mermaid.parse-fail` | `invalid/mermaid-bad-syntax.airp.json` | Mermaid parse fail-closed |
| `cli.validate.ok` | `valid/minimal.airp.json` | `airp-validate` exit 0 |
| `cli.render.export-html` | `valid/minimal.airp.json` | `airp-render export` 写出 HTML |
| `cli.render.missing-input` | — | 缺 `--input` → exit 1 |

## 失败时

1. 读终端：case id、expected codes、actual 差异。
2. 若**实现故意变更**行为：更新 case `expect` 与/或 fixture，勿改断言绕过。
3. 若覆盖门禁报 gap：补 case 或 `UNIT_COVERED_*`，勿从码表删 code 逃避。
4. 修复后重跑根 `pnpm test` 直至退出码 0，再执行根 `pnpm fix`。

## 何时可跳过本 Skill

- **仅**修改 `.agents/**` 说明且未触 `packages/**/src`、`apps/**/src`、`fixtures/airp/**`。
- **仅**修改根目录 `*.md`、图片等与测试无关的纯文档。

若本次变更包含上述路径下的 `*.ts` 等源码或 fixture：**不可跳过**。
