# AIRP — AI Report Protocol

[🇺🇸 English](./README.md) | [🇨🇳 中文](./README.cn.md) | [🇯🇵 日本語](./README.ja.md) | [🇰🇷 한국어](./README.ko.md) | [🇩🇪 Deutsch](./README.de.md) | [🇫🇷 Français](./README.fr.md) | [🇷🇺 Русский](./README.ru.md) | [🇪🇸 Español](./README.es.md) | [🇧🇷 Português (Brasil)](./README.pt-BR.md) | [🇮🇹 Italiano](./README.it.md)

![AIRP screen capture](./screen-capture.png "AIRP screen capture")

**Rendre les rapports écrits par l’IA plus lisibles—et plus faciles à modifier.**

Demander du Markdown à l’IA, c’est souvent plat et décousu. Demander du HTML, ça peut avoir une belle mise en page, mais c’est long, ça coûte des tokens, et après c’est pénible à retoucher. L’idée d’AIRP : faire écrire d’abord une source `*.airp.json`, puis l’ouvrir avec l’extension **AIRP Renderer** en HTML propre. Pour partager, on exporte en HTML ou Markdown.

La source suit la logique des **blocs (Blocks)** façon Notion—**46** pour l’instant (métriques hero, comparaison, décision, timeline, Mermaid, vue d’architecture, etc.). Chaque bloc a sa mise en page : plans, revues, rétros, audits restent clairs, sans mur de texte.

## Comment tourne un rapport

Écrire et lire restent séparés. Le `*.airp.json` au milieu est cadré par JSON Schema—génération et validation s’appuient dessus :

| Qui | Ce qu’il fait |
| --- | --- |
| **Skill `/airp`** | Faire créer ou modifier la source par l’IA, et la valider |
| **Extension VS Code** | Lire dans l’éditeur ; exporter HTML / Markdown |

Ce que ça change concrètement :

- Champs ou sections manquants → échec de validation ; moins de livrables à moitié faits.
- La source se prête à Git et aux diffs ; HTML / Markdown, c’est juste pour les humains.
- Des frontières de blocs nettes stabilisent le modèle et coûtent en général moins de tokens qu’une page HTML écrite à la main.

## Démarrage rapide

### 1. Installer l’extension VS Code

Installez **AIRP Renderer** depuis le [Marketplace](https://marketplace.visualstudio.com/items?itemName=airp.airp-renderer-vscode) (ID : `airp.airp-renderer-vscode`).

Ouvrez n’importe quel `*.airp.json` pour le lire, ou exportez en HTML / Markdown. Il faut un éditeur compatible VS Code (ex. : Cursor).

### 2. Installer le Skill `/airp`

Pour seulement ouvrir des sources déjà écrites, l’extension suffit. Installez le Skill quand vous voulez que l’IA rédige de nouveaux rapports :

```bash
npx skills add maosong-ai/airp
```

Dans le chat, tapez `/airp <sujet>`. Le Skill génère et valide une source (dossier par défaut : `.docs/airp/`). Ouvrez-la avec l’extension pour lire. Options : `--locale fr-FR`, `--out <dossier>`.

## Langues

Langues de document prises en charge : English (`en-US`), 简体中文 (`zh-CN`), 日本語 (`ja-JP`), 한국어 (`ko-KR`), Deutsch (`de-DE`), Français (`fr-FR`), Русский (`ru-RU`), Español (`es-ES`), Português Brasil (`pt-BR`), Italiano (`it-IT`). À l’écriture, précisez avec `/airp --locale …`.

## La suite

Déjà possible : générer / valider avec le Skill ; lire et exporter HTML / Markdown avec l’extension. Ensuite :

| Direction | En bref |
| --- | --- |
| **Édition visuelle** | Modifier dans l’extension, sans passer par le Skill à chaque fois |
| **Plus de formats d’export** | Ajouter le PDF (impression, archive) |
| **Multi-pages / multi-feuilles** | Découper les longs rapports par section ou feuille, pas tout sur une page |

## Développement local et build

Pour ceux qui touchent au dépôt. Au quotidien, extension VS Code + Skill suffisent—pas besoin de cloner ce repo.

Environnement : Node.js **20.19+**, pnpm **10.17+**.

```bash
pnpm install
```

**CLI de validation** (`airp-validate`)

```bash
# essayer
pnpm validate-cli:sample

# build → apps/validate-cli/dist/cli.mjs
pnpm exec turbo run build --filter=@airp/validate-cli
```

**CLI de rendu** (`airp-render`)

```bash
# essayer
pnpm renderer-cli:sample

# build → apps/renderer-cli/dist/cli.mjs
pnpm exec turbo run build --filter=@airp/renderer-cli
```

**Extension VS Code**

Ouvrez ce dépôt dans VS Code, F5 (ou **Launch AIRP Renderer**) pour déboguer dans l’Extension Development Host.

```bash
# build
pnpm exec turbo run build --filter=airp-renderer-vscode

# package → apps/renderer-vscode/dist/airp-renderer-vscode-<version>.vsix
pnpm --filter=airp-renderer-vscode package
```

---

## Licence

MIT

[AIRP](https://github.com/maosong-ai/airp) | Copyright (c) 2026 毛松 <maosong-life@outlook.com>
