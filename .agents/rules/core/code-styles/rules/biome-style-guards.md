# Biome 风格守卫（ultracite）

TypeScript / JavaScript 中下列约束与 **ultracite（Biome）** 对齐；配置 SSOT 为根目录 `biome.jsonc`（extends `ultracite/core`）。变更源码后对涉及包执行 `pnpm fix`。升级 `package.json` 中 ultracite 后须复查阈值与规则 ID。

## 规则一览

| Biome 规则 | 约束 | 阈值 / 例外 | 推荐写法 |
|------------|------|-------------|----------|
| `lint/style/useBlockStatements` | `if`/`else`/`for`/`while`/`do-while` 必须块语句 `{}` | 含 safe fix | 即使单行也加 `{}` |
| `lint/style/noNestedTernary` | 禁止嵌套三元 | 单层 `a ? b : c` 允许 | 多分支用 `if/else` + 块 |
| `lint/complexity/noExcessiveCognitiveComplexity` | 控制认知复杂度 | 单函数 **≤ 20**；`**/*.{test,spec}.*`、`**/__tests__/**` 豁免 | 早返回、拆小函数 |
| `lint/performance/useTopLevelRegex` | 正则字面量须在模块顶层 | `g`/`y` 标志可留局部 | 顶层 `const RE_... = /.../` |

## 块语句（useBlockStatements）

```ts
// ❌
if (ready) init();

// ✅
if (ready) {
  init();
}
```

## 嵌套三元（noNestedTernary）

```ts
// ❌
const v = foo ? bar : baz ? qux : null;

// ✅ 单层允许
const v = enabled ? label : fallback;

// ✅ 多分支
let v: string;
if (foo) {
  v = bar;
} else if (baz) {
  v = qux;
} else {
  v = fallback;
}
```

## 交付

对变更涉及的 workspace 包运行 `pnpm --filter <package-name> fix`，或仓库根 `pnpm fix`（全量）。详见 `registry://skills.code-fix`。
