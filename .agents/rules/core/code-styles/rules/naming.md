# 通用命名规则

TypeScript monorepo 中源码与测试的命名约定。

## 文件 / 文件夹（基线）

- **文件夹**：**kebab-case** — ✅ `locale-pack` ❌ `LocalePack` `localePack`
- **文件**：**kebab-case.扩展名** 或 **kebab-case.固定后缀.扩展名**
  - ✅ `i18n-align.ts` `project.types.ts` `directory-structure.schema.ts`
  - ❌ `I18nAlign.ts` `i18nAlign.ts`
- **固定后缀**：`*.types.ts`（纯类型）、`*.test.ts` / `*.spec.ts`（测试）

## TypeScript 符号

| 类别 | 规则 | 示例 |
|------|------|------|
| 函数/变量/import 绑定 | camelCase | `validateProject()` |
| 类型/interface/enum | PascalCase | `ValidationResult` |
| 常量（模块级） | camelCase 或 SCREAMING_SNAKE | 与现有包内风格一致 |
| 布尔变量 | `is*`/`has*`/`can*`/`should*` | `isValid` |

## 包名

- workspace 包名遵循 `@airp/<slug>`（见 `registry://rules.technology-stack`）
- 目录名与包 slug 对齐：`packages/validate` → `@airp/validate`

## 测试

- 测试文件与源文件同目录或 `test/` 子目录，命名 `*.test.ts` 或 `*.spec.ts`
- fixture 目录使用 kebab-case：`test/fixtures/valid/minimal`
