# Fixture 目录与命名

`surface.usesFixtures: true` 的包（见 `pnpm list-testing-surface`）通过 `@airp/test-kit` 的路径 helper 加载。消费方需 devDep `test-kit`。

## 布局

```
fixtures/airp/
└── documents/
    ├── valid/      # 合法 *.airp.json 合同输入
    └── invalid/    # 非法文档（每文件一个缺陷）
```

| 用途 | 路径 |
|------|------|
| 有效单文档 | `documents/valid/<name>.airp.json` |
| 无效单文档 | `documents/invalid/<name>.airp.json` |

每个 Block `type` 至少一份 valid 合同 fixture（渲染相关阶段按已实现块齐备）。

## 协议字段

- 根：`schemaVersion`、`meta`、`i18n`、`blocks`（见 `registry://rules.protocol`）
- 单文件；无项目树 fixture

字段细节见 `registry://rules.protocol.rules.document-field-naming`。

## 加载 API

| 函数 | 返回 |
|------|------|
| `documentPath("valid/minimal.airp.json")` | 单文档绝对路径 |
| `testingRelPath("e2e", "renderer-cli", "out.html")` | 仓库相对 `.tmp/testing/...` 路径（CLI `--out`） |

## 禁止

- 包内 `test/fixtures/` 私有根
- 测试中硬编码 `../../fixtures` 相对路径
- 把 `.docs/samples/` 当作自动化合同输入
- 多文件 `projects/` 树（AIRP 无项目树）
