# AIRP — AI Report Protocol

[🇺🇸 English](./README.md) | [🇨🇳 中文](./README.cn.md) | [🇯🇵 日本語](./README.ja.md) | [🇰🇷 한국어](./README.ko.md) | [🇩🇪 Deutsch](./README.de.md) | [🇫🇷 Français](./README.fr.md) | [🇷🇺 Русский](./README.ru.md) | [🇪🇸 Español](./README.es.md) | [🇧🇷 Português (Brasil)](./README.pt-BR.md) | [🇮🇹 Italiano](./README.it.md)

![AIRP screen capture](./screen-capture.png "AIRP screen capture")

**Que los informes de la IA se lean mejor—y se puedan cambiar sin drama.**

Si le pides Markdown a la IA, suele salir plano y desordenado. El HTML se ve bien, pero es largo, gasta tokens y luego cuesta editarlo. La idea de AIRP: que la IA escriba primero un `*.airp.json`, lo abras con la extensión **AIRP Renderer** como HTML limpio, y cuando haya que compartirlo, exportes HTML o Markdown.

La fuente se organiza como **bloques (Blocks)** al estilo Notion—hay **46** por ahora (métricas hero, comparación, decisión, timeline, Mermaid, vista de arquitectura, etc.). Cada uno trae su propio diseño: planes, reviews, retros y auditorías se entienden mejor y no se convierten en un muro de texto.

## Cómo corre un informe

Escribir y leer van por separado. El `*.airp.json` del medio lo marca JSON Schema; generación y validación parten de ahí:

| Quién | Qué hace |
| --- | --- |
| **Skill `/airp`** | Que la IA cree o cambie la fuente, y la valide |
| **Extensión de VS Code** | Leer en el editor; exportar HTML / Markdown |

Qué ganas en la práctica:

- Si faltan campos o secciones, la validación falla—menos entregas a medias.
- La fuente encaja en Git y en los diffs; HTML / Markdown es solo lo que lee la gente.
- Con límites de bloque claros el modelo se comporta mejor y suele gastar menos tokens que un HTML largo a mano.

## Inicio rápido

### 1. Instalar la extensión de VS Code

Instala **AIRP Renderer** desde el [Marketplace](https://marketplace.visualstudio.com/items?itemName=airp.airp-renderer-vscode) (ID: `airp.airp-renderer-vscode`).

Abre cualquier `*.airp.json` para leerlo, o exporta HTML / Markdown. Hace falta un editor compatible con VS Code (p. ej. Cursor).

### 2. Instalar el Skill `/airp`

Si solo abres fuentes que ya escribió alguien, con la extensión basta. Instala el Skill cuando quieras que la IA escriba informes nuevos:

```bash
npx skills add maosong-ai/airp
```

En el chat escribe `/airp <tema>`. El Skill genera y valida una fuente (carpeta por defecto: `.docs/airp/`). Ábrela con la extensión para leer. Opcional: `--locale es-ES`, `--out <directorio>`.

## Idiomas

Idiomas de documento soportados: English (`en-US`), 简体中文 (`zh-CN`), 日本語 (`ja-JP`), 한국어 (`ko-KR`), Deutsch (`de-DE`), Français (`fr-FR`), Русский (`ru-RU`), Español (`es-ES`), Português Brasil (`pt-BR`), Italiano (`it-IT`). Al escribir, indica `/airp --locale …`.

## Qué viene después

Ya disponible: el Skill genera / valida fuentes; la extensión lee y exporta HTML / Markdown. En el radar:

| Dirección | Notas |
| --- | --- |
| **Edición visual** | Cambiar en la extensión sin ir al Skill por cada retoque |
| **Más formatos de exportación** | Añadir PDF (impresión, archivo) |
| **Varias páginas / hojas** | Partir informes largos por sección u hoja, no amontonarlo todo en una |

## Desarrollo local y build

Para quien toca el repo. En el día a día, extensión de VS Code + Skill alcanzan—no hace falta clonar este repositorio.

Entorno: Node.js **20.19+**, pnpm **10.17+**.

```bash
pnpm install
```

**CLI de validación** (`airp-validate`)

```bash
# probar
pnpm validate-cli:sample

# build → apps/validate-cli/dist/cli.mjs
pnpm exec turbo run build --filter=@airp/validate-cli
```

**CLI de render** (`airp-render`)

```bash
# probar
pnpm renderer-cli:sample

# build → apps/renderer-cli/dist/cli.mjs
pnpm exec turbo run build --filter=@airp/renderer-cli
```

**Extensión de VS Code**

Abre este repo en VS Code, F5 (o **Launch AIRP Renderer**) para depurar en el Extension Development Host.

```bash
# build
pnpm exec turbo run build --filter=airp-renderer-vscode

# paquete → apps/renderer-vscode/dist/airp-renderer-vscode-<version>.vsix
pnpm --filter=airp-renderer-vscode package
```

---

## Licencia

MIT

[AIRP](https://github.com/maosong-ai/airp) | Copyright (c) 2026 毛松 <maosong-life@outlook.com>
