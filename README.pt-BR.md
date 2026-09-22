# AIRP — AI Report Protocol

[🇺🇸 English](./README.md) | [🇨🇳 中文](./README.cn.md) | [🇯🇵 日本語](./README.ja.md) | [🇰🇷 한국어](./README.ko.md) | [🇩🇪 Deutsch](./README.de.md) | [🇫🇷 Français](./README.fr.md) | [🇷🇺 Русский](./README.ru.md) | [🇪🇸 Español](./README.es.md) | [🇧🇷 Português (Brasil)](./README.pt-BR.md) | [🇮🇹 Italiano](./README.it.md)

![AIRP screen capture](./screen-capture.png "AIRP screen capture")

**Deixar relatórios da IA mais fáceis de ler—e mais fáceis de mudar.**

Pedir Markdown à IA costuma sair seco e bagunçado. HTML até fica bonito, mas fica longo, gasta token e depois é chato de editar. O jeito do AIRP: a IA escreve primeiro um `*.airp.json`, você abre com a extensão **AIRP Renderer** em HTML caprichado. Quando for compartilhar, exporta HTML ou Markdown.

A fonte segue a lógica de **blocos (Blocks)** tipo Notion—hoje são **46** (métricas hero, comparação, decisão, timeline, Mermaid, visão de arquitetura etc.). Cada um tem o próprio layout: planos, reviews, retros e auditorias ficam mais claros, sem virar parede de texto.

## Como um relatório roda

Escrever e ler ficam separados. O `*.airp.json` no meio é amarrado pelo JSON Schema—geração e validação usam ele como referência:

| Quem | O que faz |
| --- | --- |
| **Skill `/airp`** | Faz a IA criar ou alterar a fonte e valida |
| **Extensão do VS Code** | Ler no editor; exportar HTML / Markdown |

O que isso muda de verdade:

- Campo ou seção faltando → validação falha; menos entrega pela metade.
- A fonte encaixa em Git e diff; HTML / Markdown é só o que pessoa lê.
- Limites de bloco claros deixam o modelo mais estável e costumam gastar menos token que um HTML longo escrito na mão.

## Começo rápido

### 1. Instalar a extensão do VS Code

Instale **AIRP Renderer** no [Marketplace](https://marketplace.visualstudio.com/items?itemName=airp.airp-renderer-vscode) (ID: `airp.airp-renderer-vscode`).

Abra qualquer `*.airp.json` para ler, ou exporte HTML / Markdown. Precisa de um editor compatível com VS Code (ex.: Cursor).

### 2. Instalar o Skill `/airp`

Só vai abrir fontes que alguém já escreveu? A extensão basta. Instale o Skill quando quiser que a IA escreva relatórios novos:

```bash
npx skills add maosong-ai/airp
```

No chat, digite `/airp <tema>`. O Skill gera e valida a fonte (pasta padrão: `.docs/airp/`). Depois abra com a extensão para ler. Opcional: `--locale pt-BR`, `--out <diretório>`.

## Idiomas

Idiomas de documento suportados: English (`en-US`), 简体中文 (`zh-CN`), 日本語 (`ja-JP`), 한국어 (`ko-KR`), Deutsch (`de-DE`), Français (`fr-FR`), Русский (`ru-RU`), Español (`es-ES`), Português Brasil (`pt-BR`), Italiano (`it-IT`). Na hora de escrever, use `/airp --locale …`.

## O que vem a seguir

Já dá para usar: Skill gera / valida fontes; extensão lê e exporta HTML / Markdown. Na fila:

| Direção | Em resumo |
| --- | --- |
| **Edição visual** | Mudar na extensão, sem correr atrás do Skill a cada ajuste |
| **Mais formatos de exportação** | Incluir PDF (impressão, arquivo) |
| **Várias páginas / planilhas** | Quebrar relatório longo por seção ou sheet, sem empilhar tudo numa página |

## Desenvolvimento local e build

Para quem mexe no repositório. No dia a dia, extensão do VS Code + Skill bastam—não precisa clonar este repo.

Ambiente: Node.js **20.19+**, pnpm **10.17+**.

```bash
pnpm install
```

**CLI de validação** (`airp-validate`)

```bash
# testar
pnpm validate-cli:sample

# build → apps/validate-cli/dist/cli.mjs
pnpm exec turbo run build --filter=@airp/validate-cli
```

**CLI de render** (`airp-render`)

```bash
# testar
pnpm renderer-cli:sample

# build → apps/renderer-cli/dist/cli.mjs
pnpm exec turbo run build --filter=@airp/renderer-cli
```

**Extensão do VS Code**

Abra este repo no VS Code, F5 (ou **Launch AIRP Renderer**) para depurar no Extension Development Host.

```bash
# build
pnpm exec turbo run build --filter=airp-renderer-vscode

# pacote → apps/renderer-vscode/dist/airp-renderer-vscode-<version>.vsix
pnpm --filter=airp-renderer-vscode package
```

---

## Licença

MIT

[AIRP](https://github.com/maosong-ai/airp) | Copyright (c) 2026 毛松 <maosong-life@outlook.com>
